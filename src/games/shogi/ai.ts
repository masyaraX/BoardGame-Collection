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

const maxReplySamples: Record<Difficulty, number> = {
  beginner: 0,
  intermediate: 8,
  advanced: 14
};

const handValueFactor = 0.82;

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

const isPromotion = (move: ShogiMove): boolean => move.promote === true;

const stageBonus = (state: ShogiState, move: ShogiMove): number => {
  let score = 0;
  const capture = capturedValue(state, move);
  if (capture > 0) score += capture * 14 - movingValue(state, move) * 0.3;
  if (isPromotion(move)) score += 260;
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
  const replies = getShogiLegalMoves(state)
    .filter((move) => move.resign !== true)
    .map((move) => ({ move, score: stageBonus(state, move) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, samples);
  if (replies.length === 0) return 0;
  const worst = Math.min(...replies.map(({ move }) => evaluatePosition(applyShogiMoveUnchecked(state, move), perspective)));
  return Math.max(0, current - worst);
};

const scoreMove = (state: ShogiState, move: ShogiMove, level: Difficulty): ScoredMove => {
  const perspective = state.currentPlayer;
  const next = applyShogiMoveUnchecked(state, move);
  const staticScore = evaluatePosition(next, perspective);
  const risk = replyRisk(next, perspective, maxReplySamples[level]);
  const beginnerNoise = level === "beginner" ? stableNoise(move) * 22 : 0;
  return {
    move,
    score: staticScore + stageBonus(state, move) + centerBonus(move) - risk * 0.55 + beginnerNoise
  };
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
  const mateMove = findShogiMateMove(state, level === "advanced" ? 3 : 1);
  if (mateMove !== null) return mateMove;
  return legal.map((move) => scoreMove(state, move, level)).sort((a, b) => b.score - a.score)[0].move;
};
