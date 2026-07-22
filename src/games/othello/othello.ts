import { oppositePlayer, type GameAdapter, type Player, type Result } from "../../common/types";

export type OthelloCell = Player | null;

export interface OthelloMove {
  row: number;
  col: number;
  pass?: boolean;
}

export interface OthelloState {
  board: OthelloCell[][];
  currentPlayer: Player;
  consecutivePasses: number;
  history: OthelloMove[];
}

const size = 8;
const vectors = [-1, 0, 1]
  .flatMap((row) => [-1, 0, 1].map((col) => [row, col] as const))
  .filter(([row, col]) => row !== 0 || col !== 0);

const createBoard = (): OthelloCell[][] => {
  const board = Array.from({ length: size }, () => Array.from<OthelloCell>({ length: size }).fill(null));
  board[3][3] = "white";
  board[3][4] = "black";
  board[4][3] = "black";
  board[4][4] = "white";
  return board;
};

const inBounds = (row: number, col: number): boolean =>
  row >= 0 && row < size && col >= 0 && col < size;

export const createInitialOthelloState = (): OthelloState => ({
  board: createBoard(),
  currentPlayer: "black",
  consecutivePasses: 0,
  history: []
});

const collectFlips = (board: OthelloCell[][], player: Player, row: number, col: number): OthelloMove[] => {
  if (!inBounds(row, col) || board[row][col] !== null) {
    return [];
  }
  const opponent = oppositePlayer(player);
  const flips: OthelloMove[] = [];
  for (const [dr, dc] of vectors) {
    const line: OthelloMove[] = [];
    let nextRow = row + dr;
    let nextCol = col + dc;
    while (inBounds(nextRow, nextCol) && board[nextRow][nextCol] === opponent) {
      line.push({ row: nextRow, col: nextCol });
      nextRow += dr;
      nextCol += dc;
    }
    if (line.length > 0 && inBounds(nextRow, nextCol) && board[nextRow][nextCol] === player) {
      flips.push(...line);
    }
  }
  return flips;
};

const boardHasEmpty = (board: OthelloCell[][]): boolean => board.some((row) => row.includes(null));

export const getOthelloLegalMovesFor = (state: OthelloState, player: Player): OthelloMove[] => {
  const moves: OthelloMove[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (collectFlips(state.board, player, row, col).length > 0) {
        moves.push({ row, col });
      }
    }
  }
  return moves;
};

export const getOthelloLegalMoves = (state: OthelloState): OthelloMove[] => {
  const moves = getOthelloLegalMovesFor(state, state.currentPlayer);
  if (moves.length > 0) {
    return moves;
  }
  return boardHasEmpty(state.board) ? [{ row: -1, col: -1, pass: true }] : [];
};

export const applyOthelloMove = (state: OthelloState, move: OthelloMove): OthelloState => {
  if (move.pass === true) {
    return {
      ...state,
      currentPlayer: oppositePlayer(state.currentPlayer),
      consecutivePasses: state.consecutivePasses + 1,
      history: [...state.history, move]
    };
  }
  const flips = collectFlips(state.board, state.currentPlayer, move.row, move.col);
  if (flips.length === 0) {
    return state;
  }
  const board = state.board.map((row) => [...row]);
  board[move.row][move.col] = state.currentPlayer;
  for (const flip of flips) {
    board[flip.row][flip.col] = state.currentPlayer;
  }
  return {
    ...state,
    board,
    currentPlayer: oppositePlayer(state.currentPlayer),
    consecutivePasses: 0,
    history: [...state.history, move]
  };
};

export const countOthelloDiscs = (board: OthelloCell[][]): Record<Player, number> =>
  board.flat().reduce(
    (total, cell) => {
      if (cell !== null) {
        total[cell] += 1;
      }
      return total;
    },
    { black: 0, white: 0 }
  );

export const getOthelloResult = (state: OthelloState): Result => {
  const blackMoves = getOthelloLegalMovesFor(state, "black").length;
  const whiteMoves = getOthelloLegalMovesFor(state, "white").length;
  if (boardHasEmpty(state.board) && state.consecutivePasses < 2 && (blackMoves > 0 || whiteMoves > 0)) {
    return { winner: null, reason: "対局中" };
  }
  const discs = countOthelloDiscs(state.board);
  if (discs.black === discs.white) {
    return { winner: "draw", reason: "同数です" };
  }
  return {
    winner: discs.black > discs.white ? "black" : "white",
    reason: `黒 ${discs.black} - 白 ${discs.white}`
  };
};

export const othelloAdapter: GameAdapter<OthelloState, OthelloMove> = {
  id: "othello",
  name: "オセロ",
  createInitialState: createInitialOthelloState,
  getCurrentPlayer: (state) => state.currentPlayer,
  getLegalMoves: getOthelloLegalMoves,
  applyMove: applyOthelloMove,
  getResult: getOthelloResult,
  serializeMove: (move) => (move.pass === true ? "pass" : `${move.row + 1}-${move.col + 1}`)
};
