import type { Difficulty, Player } from "../../common/types";
import { oppositePlayer } from "../../common/types";
import {
  applyShogiMove,
  getShogiLegalMoves,
  getShogiResult,
  isShogiInCheck,
  type ShogiMove,
  type ShogiState
} from "./shogi";

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

const searchWidth = 24;

const evaluate = (state: ShogiState, player: Player): number => {
  let score = 0;
  for (let row = 0; row < state.board.length; row += 1) {
    for (let col = 0; col < state.board[row].length; col += 1) {
      const piece = state.board[row][col];
      if (piece !== null) {
        const ownerFactor = piece.owner === player ? 1 : -1;
        const advancement = piece.owner === "black" ? 8 - row : row;
        const center = 4 - Math.abs(4 - col);
        score += ownerFactor * (values[piece.kind] + advancement * 3 + center * 2);
      }
    }
  }
  for (const owner of ["black", "white"] as const) {
    const factor = owner === player ? 1 : -1;
    for (const [kind, count] of Object.entries(state.hands[owner])) {
      score += factor * values[kind as keyof typeof values] * (count ?? 0) * 0.85;
    }
  }
  if (isShogiInCheck(state, oppositePlayer(player))) score += 120;
  if (isShogiInCheck(state, player)) score -= 160;
  return score;
};

const movePriority = (state: ShogiState, move: ShogiMove, player: Player): number => {
  if (move.resign === true) return -Infinity;
  let score = move.promote === true ? 180 : 0;
  if (move.from !== undefined) {
    const captured = state.board[move.to.row][move.to.col];
    const mover = state.board[move.from.row][move.from.col];
    if (captured !== null && mover !== null) {
      score += values[captured.kind] * 10 - values[mover.kind];
    }
  }
  const next = applyShogiMove(state, move);
  if (isShogiInCheck(next, oppositePlayer(player))) score += 300;
  return score;
};

const terminalScore = (state: ShogiState, player: Player): number | null => {
  const result = getShogiResult(state);
  if (result.winner === null) return null;
  if (result.winner === "draw") return 0;
  return result.winner === player ? 1_000_000 : -1_000_000;
};

const orderedMoves = (state: ShogiState, player: Player): ShogiMove[] =>
  getShogiLegalMoves(state)
    .filter((move) => move.resign !== true)
    .sort((a, b) => movePriority(state, b, player) - movePriority(state, a, player))
    .slice(0, searchWidth);

const negamax = (state: ShogiState, depth: number, player: Player, alpha: number, beta: number): number => {
  const terminal = terminalScore(state, player);
  if (terminal !== null) return terminal;
  if (depth === 0) return evaluate(state, player);
  const moves = orderedMoves(state, state.currentPlayer);
  if (moves.length === 0) return evaluate(state, player);
  let best = -Infinity;
  let localAlpha = alpha;
  for (const move of moves) {
    const score = -negamax(applyShogiMove(state, move), depth - 1, oppositePlayer(player), -beta, -localAlpha);
    best = Math.max(best, score);
    localAlpha = Math.max(localAlpha, score);
    if (localAlpha >= beta) break;
  }
  return best;
};

const depthFor = (level: Difficulty): number => {
  if (level === "advanced") return 3;
  if (level === "intermediate") return 2;
  return 1;
};

export const chooseShogiMove = (state: ShogiState, level: Difficulty): ShogiMove | null => {
  const legal = orderedMoves(state, state.currentPlayer);
  if (legal.length === 0) return null;
  const depth = depthFor(level);
  return legal
    .map((move) => ({
      move,
      score: -negamax(applyShogiMove(state, move), depth - 1, oppositePlayer(state.currentPlayer), -Infinity, Infinity)
    }))
    .sort((a, b) => b.score - a.score)[0].move;
};
