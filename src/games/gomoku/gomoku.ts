import { oppositePlayer, type GameAdapter, type Player, type Result } from "../../common/types";

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

const size = 15;
const directions = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1]
] as const;

const createBoard = (): GomokuCell[][] =>
  Array.from({ length: size }, () => Array.from<GomokuCell>({ length: size }).fill(null));

const inBounds = (row: number, col: number): boolean =>
  row >= 0 && row < size && col >= 0 && col < size;

const countLine = (board: GomokuCell[][], row: number, col: number, dr: number, dc: number): number => {
  const player = board[row][col];
  if (player === null) {
    return 0;
  }
  let total = 1;
  for (const sign of [-1, 1]) {
    let nextRow = row + dr * sign;
    let nextCol = col + dc * sign;
    while (inBounds(nextRow, nextCol) && board[nextRow][nextCol] === player) {
      total += 1;
      nextRow += dr * sign;
      nextCol += dc * sign;
    }
  }
  return total;
};

export const findGomokuWinner = (board: GomokuCell[][]): Player | null => {
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (board[row][col] === null) {
        continue;
      }
      if (directions.some(([dr, dc]) => countLine(board, row, col, dr, dc) >= 5)) {
        return board[row][col];
      }
    }
  }
  return null;
};

const hasEmptyCell = (board: GomokuCell[][]): boolean => board.some((row) => row.some((cell) => cell === null));

export const createInitialGomokuState = (): GomokuState => ({
  board: createBoard(),
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
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (state.board[row][col] === null) {
        moves.push({ row, col });
      }
    }
  }
  return moves;
};

export const applyGomokuMove = (state: GomokuState, move: GomokuMove): GomokuState => {
  if (!inBounds(move.row, move.col) || state.board[move.row][move.col] !== null) {
    return state;
  }
  const board = state.board.map((row) => [...row]);
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
  if (!hasEmptyCell(state.board)) {
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
