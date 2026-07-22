import { type Difficulty, oppositePlayer, type Player } from "../../common/types";
import { getGomokuCandidateMoves } from "./candidates";
import { getGomokuLegalMoves, type GomokuMove, type GomokuState } from "./gomoku";
import { analyzeGomokuMove, isForbiddenGomokuMove } from "./rules";

const center = 7;

const levelLimit: Record<Difficulty, number> = {
  beginner: 18,
  intermediate: 28,
  advanced: 42
};

const patternScore = (state: GomokuState, move: GomokuMove, player: Player): number => {
  const pattern = analyzeGomokuMove(state.board, move, player);
  if (pattern.win) return 1_000_000;
  let score = 0;
  score += pattern.openFour * 120_000;
  score += pattern.four * 30_000;
  score += pattern.openThree * 7_000;
  score += pattern.maxLine ** 3 * 120;
  score -= Math.abs(center - move.row) * 8 + Math.abs(center - move.col) * 8;
  return score;
};

const isForbiddenForCurrentRule = (state: GomokuState, move: GomokuMove, player: Player): boolean =>
  state.rule === "renju" && state.forbiddenEnabled && isForbiddenGomokuMove(state.board, move, player);

const scoreMove = (state: GomokuState, move: GomokuMove, player: Player, level: Difficulty): number => {
  if (isForbiddenForCurrentRule(state, move, player)) return -Infinity;
  const opponent = oppositePlayer(player);
  const attack = patternScore(state, move, player);
  const defense = patternScore(state, move, opponent);
  const defenseWeight = level === "beginner" ? 0.76 : level === "intermediate" ? 0.92 : 1.02;
  const noise = level === "beginner" ? stableNoise(move) * 220 : 0;
  return attack + defense * defenseWeight + noise;
};

const stableNoise = (move: GomokuMove): number => ((move.row * 19 + move.col * 23) % 7) - 3;

const orderedCandidates = (state: GomokuState, level: Difficulty): GomokuMove[] => {
  const legal = new Set(getGomokuLegalMoves(state).map((move) => `${move.row}:${move.col}`));
  return getGomokuCandidateMoves(state.board, level === "advanced" ? 2 : 1)
    .filter((move) => legal.has(`${move.row}:${move.col}`))
    .sort((a, b) => scoreMove(state, b, state.currentPlayer, level) - scoreMove(state, a, state.currentPlayer, level))
    .slice(0, levelLimit[level]);
};

export const chooseGomokuMove = (state: GomokuState, level: Difficulty): GomokuMove | null => {
  const legal = getGomokuLegalMoves(state);
  if (legal.length === 0) return null;
  const candidates = orderedCandidates(state, level);
  const moves = candidates.length > 0 ? candidates : legal;
  return moves
    .map((move) => ({ move, score: scoreMove(state, move, state.currentPlayer, level) }))
    .sort((a, b) => b.score - a.score)[0].move;
};
