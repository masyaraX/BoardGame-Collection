import { useCallback, useEffect, useMemo, useState } from "react";
import { Flag, LoaderCircle, RotateCcw, Undo2 } from "lucide-react";
import type { GameId, PlayMode, Player, Settings } from "../../common/types";
import { saveGameState } from "../../save/storage";
import { games, type AnyGameState, type AnyMove } from "../gameRegistry";
import { GomokuBoard } from "./GomokuBoard";
import { OthelloBoard } from "./OthelloBoard";
import { ShogiBoard } from "./ShogiBoard";

interface GameViewProps {
  gameId: GameId;
  mode: PlayMode;
  settings: Settings;
  onResult: (result: "win" | "loss" | "draw") => void;
}

const playerLabel: Record<Player, string> = { black: "黒", white: "白" };
const gameLabel: Record<GameId, string> = { shogi: "将棋", gomoku: "五目並べ", othello: "オセロ" };

const moveNumberLabel = (state: AnyGameState): string => {
  const history = "history" in state ? state.history : [];
  return `第${history.length + 1}手`;
};

export function GameView({ gameId, mode, settings, onResult }: GameViewProps) {
  const registered = games[gameId];
  const [state, setState] = useState<AnyGameState>(() => registered.adapter.createInitialState());
  const [past, setPast] = useState<AnyGameState[]>([]);
  const [lastMove, setLastMove] = useState<AnyMove | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const result = registered.adapter.getResult(state);
  const legalMoves = useMemo(() => registered.adapter.getLegalMoves(state), [registered, state]);
  const passMove = legalMoves.find((move) => "pass" in move && move.pass === true);
  const resignMove = legalMoves.find((move) => "resign" in move && move.resign === true);
  const currentPlayer = registered.adapter.getCurrentPlayer(state);

  useEffect(() => {
    setState(registered.adapter.createInitialState());
    setPast([]);
    setLastMove(null);
    setIsAiThinking(false);
  }, [gameId, registered]);

  useEffect(() => {
    saveGameState(gameId, state);
  }, [gameId, state]);

  useEffect(() => {
    if (result.winner === null) return;
    if (result.winner === "draw") onResult("draw");
    if (result.winner === "black") onResult("win");
    if (result.winner === "white") onResult("loss");
  }, [onResult, result.winner]);

  const applyMove = useCallback((move: AnyMove): void => {
    if (result.winner !== null) return;
    setPast((items: AnyGameState[]) => [...items, state]);
    setState(registered.adapter.applyMove(state, move));
    setLastMove(move);
  }, [registered.adapter, result.winner, state]);

  useEffect(() => {
    if (result.winner !== null) return;
    const current = registered.adapter.getCurrentPlayer(state);
    const aiTurn = mode === "ai-vs-ai" || (mode === "human-vs-ai" && current === "white");
    if (!aiTurn) return;
    setIsAiThinking(true);
    const timer = window.setTimeout(() => {
      void registered.ai(state, settings.difficulty).then((move) => {
        if (move !== null) applyMove(move);
        setIsAiThinking(false);
      });
    }, settings.animationSpeed === "fast" ? 80 : 250);
    return () => {
      window.clearTimeout(timer);
      setIsAiThinking(false);
    };
  }, [applyMove, mode, registered, result.winner, settings.animationSpeed, settings.difficulty, state]);

  const reset = (): void => {
    setPast([]);
    setState(registered.adapter.createInitialState());
    setLastMove(null);
    setIsAiThinking(false);
  };

  const undo = (): void => {
    const previous = past.at(-1);
    if (previous === undefined) return;
    setPast((items: AnyGameState[]) => items.slice(0, -1));
    setState(previous);
    setLastMove(null);
    setIsAiThinking(false);
  };

  return (
    <section className="game-shell" aria-label={`${gameLabel[gameId]}の対局`}>
      <header className="match-strip">
        <div className="turn-status" aria-live="polite">
          <span className={`turn-marker ${result.winner === null ? currentPlayer : "finished"}`} aria-hidden="true" />
          <div>
            <span className="status-label">{result.winner === null ? "手番" : "対局結果"}</span>
            <strong>{result.winner === null ? `${playerLabel[currentPlayer]}番` : "終局"}</strong>
          </div>
        </div>
        <div className="move-status">
          <span>{result.winner === null ? moveNumberLabel(state) : result.reason}</span>
          <span className={isAiThinking ? "thinking" : ""}>
            {isAiThinking && <LoaderCircle aria-hidden="true" className="spin" size={15} />}
            {isAiThinking ? "AI思考中" : result.winner === null ? "対局中" : ""}
          </span>
        </div>
        <div className="match-actions">
          {passMove !== undefined && <button className="text-action" onClick={() => applyMove(passMove)}>パス</button>}
          {resignMove !== undefined && (
            <button aria-label="投了" className="text-action danger-action" onClick={() => applyMove(resignMove)} title="投了">
              <Flag aria-hidden="true" size={16} />
              <span>投了</span>
            </button>
          )}
          <button aria-label="一手戻す" className="icon-action" onClick={undo} disabled={past.length === 0} title="一手戻す">
            <Undo2 aria-hidden="true" size={18} />
          </button>
          <button aria-label="最初からやり直す" className="icon-action" onClick={reset} title="最初からやり直す">
            <RotateCcw aria-hidden="true" size={18} />
          </button>
        </div>
      </header>
      <div className="board-stage">
        {gameId === "shogi" && (
          <ShogiBoard state={state as never} legalMoves={legalMoves as never} lastMove={lastMove as never} onMove={applyMove} />
        )}
        {gameId === "gomoku" && (
          <GomokuBoard state={state as never} legalMoves={legalMoves as never} lastMove={lastMove as never} onMove={applyMove} />
        )}
        {gameId === "othello" && (
          <OthelloBoard state={state as never} legalMoves={legalMoves as never} lastMove={lastMove as never} onMove={applyMove} />
        )}
      </div>
    </section>
  );
}
