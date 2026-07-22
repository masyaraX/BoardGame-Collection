import { oppositePlayer, type GameAdapter, type Player, type Result } from "../../common/types";
import {
  createGomokuBoard,
  findGomokuWinnerFromBoard,
  hasAnyEmptyGomokuCell,
  isForbiddenGomokuMove,
  isOnGomokuBoard,
  cloneGomokuBoard,
  gomokuSize
} from "./rules";

export type GomokuCell = Player | null;
export type GomokuRule = "free" | "renju";

export interface GomokuMove {
  row: number;
  col: number;
}

export interface GomokuState {
  board: GomokuCell[][];
  currentPlayer: Player;
  rule: GomokuRule;
  forbiddenEnabled: boolean;
  history: GomokuMove[];
}

export const findGomokuWinner = findGomokuWinnerFromBoard;

export const createInitialGomokuState = (): GomokuState => ({
  board: createGomokuBoard(),
  currentPlayer: "black",
  rule: "free",
  forbiddenEnabled: false,
  history: []
});

export const getGomokuLegalMoves = (state: GomokuState): GomokuMove[] => {
  if (findGomokuWinner(state.board) !== null) {
    return [];
  }
  const moves: GomokuMove[] = [];
  for (let row = 0; row < gomokuSize; row += 1) {
    for (let col = 0; col < gomokuSize; col += 1) {
      const move = { row, col };
      if (
        state.board[row][col] === null &&
        !(state.rule === "renju" && state.forbiddenEnabled && isForbiddenGomokuMove(state.board, move, state.currentPlayer))
      ) {
        moves.push({ row, col });
      }
    }
  }
  return moves;
};

export const applyGomokuMove = (state: GomokuState, move: GomokuMove): GomokuState => {
  if (
    !isOnGomokuBoard(move.row, move.col) ||
    state.board[move.row][move.col] !== null ||
    (state.rule === "renju" && state.forbiddenEnabled && isForbiddenGomokuMove(state.board, move, state.currentPlayer))
  ) {
    return state;
  }
  const board = cloneGomokuBoard(state.board);
  board[move.row][move.col] = state.currentPlayer;
  return {
    ...state,
    board,
    currentPlayer: oppositePlayer(state.currentPlayer),
    history: [...state.history, move]
  };
};

export const getGomokuResult = (state: GomokuState): Result => {
  const winner = findGomokuWinner(state.board);
  if (winner !== null) {
    return { winner, reason: "5つ並びました" };
  }
  if (!hasAnyEmptyGomokuCell(state.board)) {
    return { winner: "draw", reason: "盤面が埋まりました" };
  }
  return { winner: null, reason: "対局中" };
};

export const gomokuAdapter: GameAdapter<GomokuState, GomokuMove> = {
  id: "gomoku",
  name: "五目並べ",
  createInitialState: createInitialGomokuState,
  getCurrentPlayer: (state) => state.currentPlayer,
  getLegalMoves: getGomokuLegalMoves,
  applyMove: applyGomokuMove,
  getResult: getGomokuResult,
  serializeMove: (move) => `${move.row + 1}-${move.col + 1}`
};
