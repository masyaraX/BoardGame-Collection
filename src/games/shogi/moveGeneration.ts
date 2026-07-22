import type { Player } from "../../common/types";
import type { PieceKind, ShogiKind, ShogiMove, ShogiPiece, ShogiState } from "./shogi";

const size = 9;
const promotable: PieceKind[] = ["R", "B", "S", "N", "L", "P"];
const goldLike: ShogiKind[] = ["G", "PS", "PN", "PL", "PP"];

const inBounds = (row: number, col: number): boolean => row >= 0 && row < size && col >= 0 && col < size;

const forward = (owner: Player): number => (owner === "black" ? -1 : 1);
const promotionZone = (owner: Player, row: number): boolean => (owner === "black" ? row <= 2 : row >= 6);

const demoteKind = (kind: ShogiKind): PieceKind => {
  if (kind === "PR") return "R";
  if (kind === "PB") return "B";
  if (kind === "PS") return "S";
  if (kind === "PN") return "N";
  if (kind === "PL") return "L";
  if (kind === "PP") return "P";
  return kind;
};

const pushStep = (
  moves: ShogiMove[],
  board: (ShogiPiece | null)[][],
  owner: Player,
  from: { row: number; col: number },
  dr: number,
  dc: number
): void => {
  const row = from.row + dr;
  const col = from.col + dc;
  if (!inBounds(row, col) || board[row][col]?.owner === owner) return;
  moves.push({ from, to: { row, col } });
};

const pushSlide = (
  moves: ShogiMove[],
  board: (ShogiPiece | null)[][],
  owner: Player,
  from: { row: number; col: number },
  dr: number,
  dc: number
): void => {
  let row = from.row + dr;
  let col = from.col + dc;
  while (inBounds(row, col)) {
    if (board[row][col]?.owner === owner) break;
    moves.push({ from, to: { row, col } });
    if (board[row][col] !== null) break;
    row += dr;
    col += dc;
  }
};

const withPromotionOptions = (move: ShogiMove, piece: ShogiPiece): ShogiMove[] => {
  const base = demoteKind(piece.kind);
  if (!promotable.includes(base) || piece.kind !== base) return [move];
  const canPromote = promotionZone(piece.owner, move.from!.row) || promotionZone(piece.owner, move.to.row);
  if (!canPromote) return [move];
  const mustPromote = (base === "P" || base === "L") && (piece.owner === "black" ? move.to.row === 0 : move.to.row === 8);
  if (base === "N" && (piece.owner === "black" ? move.to.row <= 1 : move.to.row >= 7)) return [{ ...move, promote: true }];
  return mustPromote ? [{ ...move, promote: true }] : [move, { ...move, promote: true }];
};

export const generateRawShogiPieceMoves = (state: ShogiState, row: number, col: number): ShogiMove[] => {
  const piece = state.board[row][col];
  if (piece === null) return [];
  const moves: ShogiMove[] = [];
  const from = { row, col };
  const f = forward(piece.owner);
  const add = (dr: number, dc: number): void => pushStep(moves, state.board, piece.owner, from, dr, dc);
  const slide = (dr: number, dc: number): void => pushSlide(moves, state.board, piece.owner, from, dr, dc);
  if (piece.kind === "K") [-1, 0, 1].forEach((dr) => [-1, 0, 1].forEach((dc) => (dr || dc ? add(dr, dc) : undefined)));
  if (piece.kind === "R" || piece.kind === "PR") [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => slide(dr, dc));
  if (piece.kind === "B" || piece.kind === "PB") [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dr, dc]) => slide(dr, dc));
  if (piece.kind === "PR") [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dr, dc]) => add(dr, dc));
  if (piece.kind === "PB") [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => add(dr, dc));
  if (goldLike.includes(piece.kind)) [[f, 0], [f, 1], [f, -1], [0, 1], [0, -1], [-f, 0]].forEach(([dr, dc]) => add(dr, dc));
  if (piece.kind === "S") [[f, 0], [f, 1], [f, -1], [-f, 1], [-f, -1]].forEach(([dr, dc]) => add(dr, dc));
  if (piece.kind === "N") [[f * 2, 1], [f * 2, -1]].forEach(([dr, dc]) => add(dr, dc));
  if (piece.kind === "L") slide(f, 0);
  if (piece.kind === "P") add(f, 0);
  return moves.flatMap((move) => withPromotionOptions(move, piece));
};

const isIllegalDrop = (state: ShogiState, kind: PieceKind, row: number, col: number): boolean => {
  if ((kind === "P" || kind === "L") && (state.currentPlayer === "black" ? row === 0 : row === 8)) return true;
  if (kind === "N" && (state.currentPlayer === "black" ? row <= 1 : row >= 7)) return true;
  if (kind !== "P") return false;
  return state.board.some((line) => line[col]?.owner === state.currentPlayer && line[col]?.kind === "P");
};

const generateDropMoves = (state: ShogiState): ShogiMove[] => {
  const moves: ShogiMove[] = [];
  const hand = state.hands[state.currentPlayer];
  for (const [kind, count] of Object.entries(hand) as [PieceKind, number | undefined][]) {
    if ((count ?? 0) <= 0) continue;
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (state.board[row][col] !== null || isIllegalDrop(state, kind, row, col)) continue;
        moves.push({ drop: kind, to: { row, col } });
      }
    }
  }
  return moves;
};

export const generateShogiPseudoLegalMoves = (state: ShogiState): ShogiMove[] => {
  const moves: ShogiMove[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (state.board[row][col]?.owner === state.currentPlayer) moves.push(...generateRawShogiPieceMoves(state, row, col));
    }
  }
  return [...moves, ...generateDropMoves(state)];
};
