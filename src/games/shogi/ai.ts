import type { Difficulty } from "../../common/types";
import { applyShogiMove, getShogiLegalMoves, type ShogiMove, type ShogiState } from "./shogi";

const values = { K: 10000, R: 900, B: 800, G: 600, S: 500, N: 300, L: 300, P: 100, PR: 1100, PB: 1000, PS: 600, PN: 600, PL: 600, PP: 600 };

const evaluate = (state: ShogiState): number => {
  let score = 0;
  for (const row of state.board) {
    for (const piece of row) {
      if (piece !== null) {
        score += (piece.owner === state.currentPlayer ? 1 : -1) * values[piece.kind];
      }
    }
  }
  return score;
};

export const chooseShogiMove = (state: ShogiState, level: Difficulty): ShogiMove | null => {
  const legal = getShogiLegalMoves(state).filter((move) => move.resign !== true);
  if (legal.length === 0) return null;
  if (level === "beginner") return legal[0];
  return [...legal].sort((a, b) => evaluate(applyShogiMove(state, b)) - evaluate(applyShogiMove(state, a)))[0];
};
