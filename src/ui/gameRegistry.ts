import type { Difficulty, GameId, GameAdapter } from "../common/types";
import { chooseGomokuMove } from "../games/gomoku/ai";
import { gomokuAdapter, type GomokuMove, type GomokuState } from "../games/gomoku/gomoku";
import { chooseOthelloMove } from "../games/othello/ai";
import { othelloAdapter, type OthelloMove, type OthelloState } from "../games/othello/othello";
import { chooseShogiMoveAsync } from "../games/shogi/aiWorkerClient";
import { shogiAdapter, type ShogiMove, type ShogiState } from "../games/shogi/shogi";

export type AnyGameState = ShogiState | GomokuState | OthelloState;
export type AnyMove = ShogiMove | GomokuMove | OthelloMove;

interface RuntimeGame {
  adapter: GameAdapter<AnyGameState, AnyMove>;
  ai: (state: AnyGameState, difficulty: Difficulty) => Promise<AnyMove | null>;
}

const widen = <TState extends AnyGameState, TMove extends AnyMove>(
  adapter: GameAdapter<TState, TMove>,
  ai: (state: TState, difficulty: Difficulty) => TMove | null
): RuntimeGame => ({
  adapter: {
    id: adapter.id,
    name: adapter.name,
    createInitialState: adapter.createInitialState,
    getCurrentPlayer: (state) => adapter.getCurrentPlayer(state as TState),
    getLegalMoves: (state) => adapter.getLegalMoves(state as TState),
    applyMove: (state, move) => adapter.applyMove(state as TState, move as TMove),
    getResult: (state) => adapter.getResult(state as TState),
    serializeMove: (move) => adapter.serializeMove(move as TMove)
  },
  ai: (state, difficulty) => Promise.resolve(ai(state as TState, difficulty))
});

export const games: Record<GameId, RuntimeGame> = {
  shogi: {
    ...widen(shogiAdapter, () => null),
    ai: (state, difficulty) => chooseShogiMoveAsync(state as ShogiState, difficulty)
  },
  gomoku: widen(gomokuAdapter, chooseGomokuMove),
  othello: widen(othelloAdapter, chooseOthelloMove)
};
