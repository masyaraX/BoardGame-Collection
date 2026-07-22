import { oppositePlayer, type Difficulty, type Player } from "../../common/types";
import {
  applyShogiMoveUnchecked,
  findShogiKing,
  getShogiLegalMoves,
  isShogiInCheck,
  shogiPieceValues,
  type ShogiKind,
  type ShogiMove,
  type ShogiPiece,
  type ShogiState
} from "./shogi";
import { findShogiMateMove } from "./checkmate";

interface ScoredMove {
  move: ShogiMove;
  score: number;
}

type RandomSource = () => number;

const difficultyConfig: Record<
  Difficulty,
  { width: number; depth: number; replySamples: number; noise: number; varietyMargin: number; varietyPool: number }
> = {
  beginner: { width: 8, depth: 1, replySamples: 0, noise: 180, varietyMargin: 420, varietyPool: 4 },
  intermediate: { width: 12, depth: 1, replySamples: 8, noise: 0, varietyMargin: 120, varietyPool: 3 },
  advanced: { width: 14, depth: 2, replySamples: 10, noise: 0, varietyMargin: 90, varietyPool: 3 }
};

const handValueFactor = 0.82;
const mateScore = 1_000_000;

const pieceValue = (kind: ShogiKind): number => shogiPieceValues[kind];

const ownerFactor = (owner: Player, perspective: Player): number => (owner === perspective ? 1 : -1);

const kingDistancePenalty = (piece: ShogiPiece, row: number, col: number, enemyKing: { row: number; col: number } | null): number => {
  if (enemyKing === null || piece.kind === "K") return 0;
  const distance = Math.abs(enemyKing.row - row) + Math.abs(enemyKing.col - col);
  return Math.max(0, 10 - distance) * 3;
};

const evaluatePosition = (state: ShogiState, perspective: Player): number => {
  let score = 0;
  const enemyKing = findShogiKing(state, oppositePlayer(perspective));
  for (let row = 0; row < state.board.length; row += 1) {
    for (let col = 0; col < state.board[row].length; col += 1) {
      const piece = state.board[row][col];
      if (piece === null) continue;
      const advancement = piece.owner === "black" ? 8 - row : row;
      const center = 4 - Math.abs(4 - col);
      const pressure = piece.owner === perspective ? kingDistancePenalty(piece, row, col, enemyKing) : 0;
      score += ownerFactor(piece.owner, perspective) * (pieceValue(piece.kind) + advancement * 4 + center * 5 + pressure);
    }
  }
  for (const owner of ["black", "white"] as const) {
    for (const [kind, count] of Object.entries(state.hands[owner])) {
      score += ownerFactor(owner, perspective) * pieceValue(kind as ShogiKind) * (count ?? 0) * handValueFactor;
    }
  }
  if (isShogiInCheck(state, perspective)) score -= 260;
  if (isShogiInCheck(state, oppositePlayer(perspective))) score += 220;
  return score;
};

const capturedValue = (state: ShogiState, move: ShogiMove): number => {
  const captured = state.board[move.to.row]?.[move.to.col] ?? null;
  return captured === null ? 0 : pieceValue(captured.kind);
};

const movingValue = (state: ShogiState, move: ShogiMove): number => {
  if (move.from === undefined) return move.drop === undefined ? 0 : pieceValue(move.drop);
  const moving = state.board[move.from.row][move.from.col];
  return moving === null ? 0 : pieceValue(moving.kind);
};

const stageBonus = (state: ShogiState, move: ShogiMove): number => {
  let score = 0;
  const capture = capturedValue(state, move);
  if (capture > 0) score += capture * 14 - movingValue(state, move) * 0.3;
  if (move.promote === true) score += 260;
  if (move.drop !== undefined) score += pieceValue(move.drop) * 0.18;
  const next = applyShogiMoveUnchecked(state, move);
  if (isShogiInCheck(next, next.currentPlayer)) score += 340;
  return score;
};

const centerBonus = (move: ShogiMove): number => {
  if (move.to.row < 0) return 0;
  return (4 - Math.abs(4 - move.to.row) + 4 - Math.abs(4 - move.to.col)) * 7;
};

const replyRisk = (state: ShogiState, perspective: Player, samples: number): number => {
  if (samples === 0) return 0;
  const current = evaluatePosition(state, perspective);
  const replies = orderMovesByTactics(state).slice(0, samples);
  if (replies.length === 0) return 0;
  const worst = Math.min(...replies.map(({ move }) => evaluatePosition(applyShogiMoveUnchecked(state, move), perspective)));
  return Math.max(0, current - worst);
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

const scoreMoveOnePly = (state: ShogiState, move: ShogiMove, level: Difficulty): number => {
  const perspective = state.currentPlayer;
  const next = applyShogiMoveUnchecked(state, move);
  const config = difficultyConfig[level];
  const staticScore = evaluatePosition(next, perspective);
  const risk = replyRisk(next, perspective, config.replySamples);
  return staticScore + stageBonus(state, move) + centerBonus(move) - risk * 0.55 + stableNoise(move) * config.noise;
};

const orderMovesByTactics = (state: ShogiState): ScoredMove[] =>
  getShogiLegalMoves(state)
    .filter((move) => move.resign !== true)
    .map((move) => ({ move, score: stageBonus(state, move) + centerBonus(move) + capturedValue(state, move) * 10 }))
    .sort((a, b) => b.score - a.score);

const orderMoves = (state: ShogiState, level: Difficulty): ScoredMove[] =>
  getShogiLegalMoves(state)
    .filter((move) => move.resign !== true)
    .map((move) => ({ move, score: scoreMoveOnePly(state, move, level) }))
    .sort((a, b) => b.score - a.score);

const terminalScore = (state: ShogiState, perspective: Player, ply: number): number | null => {
  const legal = getShogiLegalMoves(state).filter((move) => move.resign !== true);
  if (legal.length > 0) return null;
  if (isShogiInCheck(state, state.currentPlayer)) {
    return state.currentPlayer === perspective ? -mateScore + ply : mateScore - ply;
  }
  return 0;
};

const minimax = (state: ShogiState, depth: number, perspective: Player, alpha: number, beta: number, ply: number): number => {
  const terminal = terminalScore(state, perspective, ply);
  if (terminal !== null) return terminal;
  if (depth === 0) return evaluatePosition(state, perspective);

  const maximizing = state.currentPlayer === perspective;
  let localAlpha = alpha;
  let localBeta = beta;
  const moves = orderMoves(state, "advanced").slice(0, difficultyConfig.advanced.width);

  if (maximizing) {
    let best = -Infinity;
    for (const { move } of moves) {
      best = Math.max(best, minimax(applyShogiMoveUnchecked(state, move), depth - 1, perspective, localAlpha, localBeta, ply + 1));
      localAlpha = Math.max(localAlpha, best);
      if (localAlpha >= localBeta) break;
    }
    return best;
  }

  let best = Infinity;
  for (const { move } of moves) {
    best = Math.min(best, minimax(applyShogiMoveUnchecked(state, move), depth - 1, perspective, localAlpha, localBeta, ply + 1));
    localBeta = Math.min(localBeta, best);
    if (localAlpha >= localBeta) break;
  }
  return best;
};

const selectVariedMove = (moves: ScoredMove[], level: Difficulty, random: RandomSource): ShogiMove | null => {
  if (moves.length === 0) return null;
  const config = difficultyConfig[level];
  const topScore = moves[0].score;
  if (Math.abs(topScore) > mateScore / 2) return moves[0].move;
  const candidates = moves
    .filter(({ score }) => topScore - score <= config.varietyMargin)
    .slice(0, config.varietyPool);
  return candidates[Math.floor(random() * candidates.length)]?.move ?? moves[0].move;
};

const chooseBeginnerMove = (state: ShogiState, random: RandomSource): ShogiMove | null => {
  const ordered = orderMoves(state, "beginner").slice(0, 5);
  return selectVariedMove(ordered, "beginner", random);
};

const chooseSearchedMove = (state: ShogiState, level: Difficulty, random: RandomSource): ShogiMove | null => {
  const config = difficultyConfig[level];
  const ordered = orderMoves(state, level).slice(0, config.width);
  if (ordered.length === 0) return null;
  if (config.depth <= 1) return selectVariedMove(ordered, level, random);
  const searched = ordered
    .map(({ move }) => ({
      move,
      score: minimax(applyShogiMoveUnchecked(state, move), config.depth - 1, state.currentPlayer, -Infinity, Infinity, 1)
    }))
    .sort((a, b) => b.score - a.score);
  return selectVariedMove(searched, level, random);
};

export const chooseShogiMove = (state: ShogiState, level: Difficulty, random: RandomSource = Math.random): ShogiMove | null => {
  const mateMove = findShogiMateMove(state, level === "advanced" ? 3 : 1);
  if (mateMove !== null) return mateMove;
  if (level === "beginner") return chooseBeginnerMove(state, random);
  return chooseSearchedMove(state, level, random);
};
