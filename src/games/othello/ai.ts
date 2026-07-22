import type { Difficulty, Player } from "../../common/types";
import { applyOthelloMove, getOthelloLegalMoves, type OthelloMove, type OthelloState } from "./othello";

const weights = [
  [120, -20, 20, 5, 5, 20, -20, 120],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [120, -20, 20, 5, 5, 20, -20, 120]
];

const evaluate = (state: OthelloState, player: Player): number => {
  let score = 0;
  for (let row = 0; row < state.board.length; row += 1) {
    for (let col = 0; col < state.board[row].length; col += 1) {
      const cell = state.board[row][col];
      if (cell === player) {
        score += weights[row][col];
      } else if (cell !== null) {
        score -= weights[row][col];
      }
    }
  }
  return score + getOthelloLegalMoves(state).length * 2;
};

const scoreMove = (state: OthelloState, move: OthelloMove, player: Player): number => {
  if (move.pass === true) {
    return -10_000;
  }
  const next = applyOthelloMove(state, move);
  return evaluate(next, player);
};

export const chooseOthelloMove = (state: OthelloState, level: Difficulty): OthelloMove | null => {
  const moves = getOthelloLegalMoves(state);
  if (moves.length === 0) {
    return null;
  }
  if (level === "beginner") {
    return moves[0];
  }
  return [...moves].sort(
    (a, b) => scoreMove(state, b, state.currentPlayer) - scoreMove(state, a, state.currentPlayer)
  )[0];
};
