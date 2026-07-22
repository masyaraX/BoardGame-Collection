import type { Difficulty } from "../../common/types";
import { getShogiLegalMoves, type ShogiMove, type ShogiState } from "./shogi";

const values = {
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

const centerBonus = (row: number, col: number): number => {
  const rowScore = 4 - Math.abs(4 - row);
  const colScore = 4 - Math.abs(4 - col);
  return rowScore + colScore;
};

const rankProgress = (state: ShogiState, move: ShogiMove): number => {
  if (move.from === undefined) return 0;
  const piece = state.board[move.from.row][move.from.col];
  if (piece === null) return 0;
  return piece.owner === "black" ? move.from.row - move.to.row : move.to.row - move.from.row;
};

const scoreMove = (state: ShogiState, move: ShogiMove, level: Difficulty): number => {
  if (move.resign === true) return -Infinity;
  const captured = state.board[move.to.row]?.[move.to.col] ?? null;
  const moving = move.from === undefined ? null : state.board[move.from.row][move.from.col];
  let score = centerBonus(move.to.row, move.to.col) * 6 + rankProgress(state, move) * 10;

  if (captured !== null) {
    score += values[captured.kind] * 12;
    if (moving !== null) score -= values[moving.kind] * 0.35;
  }
  if (move.promote === true) score += 240;
  if (move.drop !== undefined) score += values[move.drop] * 0.18;
  if (level === "advanced" && moving?.kind === "K") score -= 80;
  if (level === "beginner") score += stableNoise(move) * 18;
  return score;
};

const stableNoise = (move: ShogiMove): number => {
  const seed =
    move.to.row * 31 +
    move.to.col * 17 +
    (move.from?.row ?? 3) * 13 +
    (move.from?.col ?? 5) * 7 +
    (move.promote === true ? 11 : 0);
  return (seed % 9) - 4;
};

export const chooseShogiMove = (state: ShogiState, level: Difficulty): ShogiMove | null => {
  const legal = getShogiLegalMoves(state).filter((move) => move.resign !== true);
  if (legal.length === 0) return null;
  return legal
    .map((move) => ({ move, score: scoreMove(state, move, level) }))
    .sort((a, b) => b.score - a.score)[0].move;
};
