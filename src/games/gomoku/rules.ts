import type { Player } from "../../common/types";
import type { GomokuCell, GomokuMove } from "./gomoku";

export const gomokuSize = 15;

export const gomokuDirections = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1]
] as const;

export interface LineAnalysis {
  stones: number;
  openEnds: number;
}

export interface MovePattern {
  win: boolean;
  overline: boolean;
  openFour: number;
  four: number;
  openThree: number;
  maxLine: number;
}

export const createGomokuBoard = (): GomokuCell[][] =>
  Array.from({ length: gomokuSize }, () => Array.from<GomokuCell>({ length: gomokuSize }).fill(null));

export const isOnGomokuBoard = (row: number, col: number): boolean =>
  row >= 0 && row < gomokuSize && col >= 0 && col < gomokuSize;

export const cloneGomokuBoard = (board: GomokuCell[][]): GomokuCell[][] => board.map((row) => [...row]);

export const placeTemporaryStone = (board: GomokuCell[][], move: GomokuMove, player: Player): GomokuCell[][] => {
  const next = cloneGomokuBoard(board);
  next[move.row][move.col] = player;
  return next;
};

export const analyzeGomokuLine = (
  board: GomokuCell[][],
  move: GomokuMove,
  player: Player,
  dr: number,
  dc: number
): LineAnalysis => {
  let stones = 1;
  let openEnds = 0;
  for (const sign of [-1, 1]) {
    let row = move.row + dr * sign;
    let col = move.col + dc * sign;
    while (isOnGomokuBoard(row, col) && board[row][col] === player) {
      stones += 1;
      row += dr * sign;
      col += dc * sign;
    }
    if (isOnGomokuBoard(row, col) && board[row][col] === null) {
      openEnds += 1;
    }
  }
  return { stones, openEnds };
};

export const analyzeGomokuMove = (board: GomokuCell[][], move: GomokuMove, player: Player): MovePattern => {
  const next = board[move.row][move.col] === player ? board : placeTemporaryStone(board, move, player);
  let openFour = 0;
  let four = 0;
  let openThree = 0;
  let maxLine = 0;
  let overline = false;
  for (const [dr, dc] of gomokuDirections) {
    const line = analyzeGomokuLine(next, move, player, dr, dc);
    maxLine = Math.max(maxLine, line.stones);
    if (line.stones > 5) overline = true;
    if (line.stones === 4 && line.openEnds === 2) openFour += 1;
    if (line.stones === 4 && line.openEnds >= 1) four += 1;
    if (line.stones === 3 && line.openEnds === 2) openThree += 1;
  }
  return {
    win: maxLine >= 5,
    overline,
    openFour,
    four,
    openThree,
    maxLine
  };
};

export const findGomokuWinnerFromBoard = (board: GomokuCell[][]): Player | null => {
  for (let row = 0; row < gomokuSize; row += 1) {
    for (let col = 0; col < gomokuSize; col += 1) {
      const player = board[row][col];
      if (player === null) continue;
      const pattern = analyzeGomokuMove(board, { row, col }, player);
      if (pattern.win) return player;
    }
  }
  return null;
};

export const isForbiddenGomokuMove = (board: GomokuCell[][], move: GomokuMove, player: Player): boolean => {
  if (player !== "black") return false;
  if (!isOnGomokuBoard(move.row, move.col) || board[move.row][move.col] !== null) return true;
  const pattern = analyzeGomokuMove(board, move, player);
  if (pattern.overline) return true;
  if (pattern.openThree >= 2) return true;
  return pattern.four >= 2;
};

export const hasAnyEmptyGomokuCell = (board: GomokuCell[][]): boolean =>
  board.some((row) => row.some((cell) => cell === null));

export const hasAnyGomokuStone = (board: GomokuCell[][]): boolean =>
  board.some((row) => row.some((cell) => cell !== null));
