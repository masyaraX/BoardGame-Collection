import { oppositePlayer, type GameAdapter, type Player, type Result } from "../../common/types";
import { generateRawShogiPieceMoves, generateShogiPseudoLegalMoves } from "./moveGeneration";
import { generateTsshogiLegalMoves } from "./tsshogiBridge";

export type PieceKind = "K" | "R" | "B" | "G" | "S" | "N" | "L" | "P";
export type PromotedKind = "PR" | "PB" | "PS" | "PN" | "PL" | "PP";
export type ShogiKind = PieceKind | PromotedKind;

export interface ShogiPiece {
  owner: Player;
  kind: ShogiKind;
}

export interface ShogiMove {
  from?: { row: number; col: number };
  to: { row: number; col: number };
  drop?: PieceKind;
  promote?: boolean;
  resign?: boolean;
}

export interface ShogiState {
  board: (ShogiPiece | null)[][];
  hands: Record<Player, Partial<Record<PieceKind, number>>>;
  currentPlayer: Player;
  history: string[];
  resignedBy: Player | null;
}

const size = 9;
export const shogiPieceValues: Record<ShogiKind, number> = {
  K: 10000,
  R: 900,
  B: 800,
  G: 600,
  S: 500,
  N: 300,
  L: 300,
  P: 100,
  PR: 1150,
  PB: 1050,
  PS: 620,
  PN: 620,
  PL: 620,
  PP: 620
};

export const cloneShogiBoard = (board: (ShogiPiece | null)[][]): (ShogiPiece | null)[][] =>
  board.map((row) => row.map((piece) => (piece === null ? null : { ...piece })));

const promoteKind = (kind: ShogiKind): ShogiKind => {
  if (kind === "R") return "PR";
  if (kind === "B") return "PB";
  if (kind === "S") return "PS";
  if (kind === "N") return "PN";
  if (kind === "L") return "PL";
  if (kind === "P") return "PP";
  return kind;
};

export const demoteShogiKind = (kind: ShogiKind): PieceKind => {
  if (kind === "PR") return "R";
  if (kind === "PB") return "B";
  if (kind === "PS") return "S";
  if (kind === "PN") return "N";
  if (kind === "PL") return "L";
  if (kind === "PP") return "P";
  return kind;
};

const initialRow = (owner: Player): (ShogiPiece | null)[] => [
  { owner, kind: "L" },
  { owner, kind: "N" },
  { owner, kind: "S" },
  { owner, kind: "G" },
  { owner, kind: "K" },
  { owner, kind: "G" },
  { owner, kind: "S" },
  { owner, kind: "N" },
  { owner, kind: "L" }
];

export const createInitialShogiState = (): ShogiState => {
  const board: (ShogiPiece | null)[][] = Array.from({ length: size }, () =>
    Array.from<ShogiPiece | null>({ length: size }).fill(null)
  );
  board[0] = initialRow("white");
  board[1][1] = { owner: "white", kind: "R" };
  board[1][7] = { owner: "white", kind: "B" };
  board[2] = Array.from({ length: size }, () => ({ owner: "white", kind: "P" }));
  board[6] = Array.from({ length: size }, () => ({ owner: "black", kind: "P" }));
  board[7][1] = { owner: "black", kind: "B" };
  board[7][7] = { owner: "black", kind: "R" };
  board[8] = initialRow("black");
  return { board, hands: { black: {}, white: {} }, currentPlayer: "black", history: [], resignedBy: null };
};

export const applyShogiMoveUnchecked = (state: ShogiState, move: ShogiMove): ShogiState => {
  if (move.resign === true) return { ...state, resignedBy: state.currentPlayer };
  const board = cloneShogiBoard(state.board);
  const hands = { black: { ...state.hands.black }, white: { ...state.hands.white } };
  if (move.drop !== undefined) {
    board[move.to.row][move.to.col] = { owner: state.currentPlayer, kind: move.drop };
    hands[state.currentPlayer][move.drop] = (hands[state.currentPlayer][move.drop] ?? 1) - 1;
  } else if (move.from !== undefined) {
    const piece = board[move.from.row][move.from.col]!;
    const captured = board[move.to.row][move.to.col];
    if (captured !== null) {
      const kind = demoteShogiKind(captured.kind);
      hands[state.currentPlayer][kind] = (hands[state.currentPlayer][kind] ?? 0) + 1;
    }
    board[move.from.row][move.from.col] = null;
    board[move.to.row][move.to.col] = { owner: piece.owner, kind: move.promote === true ? promoteKind(piece.kind) : piece.kind };
  }
  const next = { ...state, board, hands, currentPlayer: oppositePlayer(state.currentPlayer) };
  return { ...next, history: [...state.history, boardKey(next)] };
};

export const findShogiKing = (state: ShogiState, player: Player): { row: number; col: number } | null => {
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const piece = state.board[row][col];
      if (piece?.owner === player && piece.kind === "K") return { row, col };
    }
  }
  return null;
};

export const isShogiInCheck = (state: ShogiState, player: Player): boolean => {
  const king = findShogiKing(state, player);
  if (king === null) return true;
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (state.board[row][col]?.owner === oppositePlayer(player)) {
        if (generateRawShogiPieceMoves(state, row, col).some((move) => move.to.row === king.row && move.to.col === king.col)) return true;
      }
    }
  }
  return false;
};

const capturesKing = (state: ShogiState, move: ShogiMove): boolean =>
  move.resign !== true && state.board[move.to.row]?.[move.to.col]?.kind === "K";

const isPawnDropMate = (state: ShogiState, move: ShogiMove): boolean => {
  if (move.drop !== "P") return false;
  const next = applyShogiMoveUnchecked(state, move);
  const defender = next.currentPlayer;
  return isShogiInCheck(next, defender) && getShogiLegalMoves(next, false).filter((candidate) => candidate.resign !== true).length === 0;
};

export const getShogiLegalMoves = (state: ShogiState, enforcePawnDropMate = true): ShogiMove[] => {
  if (state.resignedBy !== null) return [];
  if (enforcePawnDropMate) {
    const externalMoves = generateTsshogiLegalMoves(state);
    if (externalMoves !== null) {
      return [...externalMoves.filter((move) => !capturesKing(state, move)), { to: { row: -1, col: -1 }, resign: true }];
    }
  }
  const moves = [...generateShogiPseudoLegalMoves(state), { to: { row: -1, col: -1 }, resign: true }];
  return moves.filter((move) => {
    if (move.resign === true) return true;
    if (capturesKing(state, move) || (enforcePawnDropMate && isPawnDropMate(state, move))) return false;
    return !isShogiInCheck(applyShogiMoveUnchecked(state, move), state.currentPlayer);
  });
};

export const applyShogiMove = (state: ShogiState, move: ShogiMove): ShogiState => {
  const legal = getShogiLegalMoves(state).some((candidate) => serializeShogiMove(candidate) === serializeShogiMove(move));
  return legal ? applyShogiMoveUnchecked(state, move) : state;
};

const boardKey = (state: ShogiState): string =>
  `${state.currentPlayer}:${state.board.map((row) => row.map((piece) => (piece === null ? "__" : `${piece.owner[0]}${piece.kind}`)).join(",")).join("/")}:${JSON.stringify(state.hands)}`;

const isFourfold = (state: ShogiState): boolean => {
  const key = boardKey(state);
  return state.history.filter((item) => item === key).length >= 4;
};

export const getShogiResult = (state: ShogiState): Result => {
  if (state.resignedBy !== null) return { winner: oppositePlayer(state.resignedBy), reason: "投了" };
  if (isFourfold(state)) return { winner: "draw", reason: "千日手" };
  const inCheck = isShogiInCheck(state, state.currentPlayer);
  if (!inCheck) return { winner: null, reason: "対局中" };
  const legal = getShogiLegalMoves(state).filter((move) => move.resign !== true);
  if (legal.length === 0) return { winner: oppositePlayer(state.currentPlayer), reason: "詰み" };
  return { winner: null, reason: "王手" };
};

export const serializeShogiMove = (move: ShogiMove): string => {
  if (move.resign === true) return "resign";
  const head = move.drop !== undefined ? `D${move.drop}` : `${move.from!.row},${move.from!.col}`;
  return `${head}-${move.to.row},${move.to.col}${move.promote === true ? "+" : ""}`;
};

export const shogiAdapter: GameAdapter<ShogiState, ShogiMove> = {
  id: "shogi",
  name: "将棋",
  createInitialState: createInitialShogiState,
  getCurrentPlayer: (state) => state.currentPlayer,
  getLegalMoves: getShogiLegalMoves,
  applyMove: applyShogiMove,
  getResult: getShogiResult,
  serializeMove: serializeShogiMove
};
