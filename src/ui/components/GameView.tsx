import { useCallback, useEffect, useMemo, useState } from "react";
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
    <section className="game-shell">
      <div className="toolbar">
        <div>
          <strong>{result.winner === null ? `${playerLabel[registered.adapter.getCurrentPlayer(state)]}番` : "終局"}</strong>
          <span>{isAiThinking ? "AI思考中" : result.reason}</span>
        </div>
        {passMove !== undefined && <button onClick={() => applyMove(passMove)}>パス</button>}
        {resignMove !== undefined && <button onClick={() => applyMove(resignMove)}>投了</button>}
        <button onClick={undo} disabled={past.length === 0}>一手戻す</button>
        <button onClick={reset}>リセット</button>
      </div>
      {gameId === "shogi" && (
        <ShogiBoard state={state as never} legalMoves={legalMoves as never} lastMove={lastMove as never} onMove={applyMove} />
      )}
      {gameId === "gomoku" && (
        <GomokuBoard state={state as never} legalMoves={legalMoves as never} lastMove={lastMove as never} onMove={applyMove} />
      )}
      {gameId === "othello" && (
        <OthelloBoard state={state as never} legalMoves={legalMoves as never} lastMove={lastMove as never} onMove={applyMove} />
      )}
    </section>
  );
}
