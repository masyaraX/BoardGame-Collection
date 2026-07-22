import { type Difficulty, oppositePlayer, type Player } from "../../common/types";
import { applyGomokuMove, findGomokuWinner, getGomokuLegalMoves, type GomokuMove, type GomokuState } from "./gomoku";

const center = 7;

const scoreMove = (state: GomokuState, move: GomokuMove, player: Player): number => {
  const next = applyGomokuMove({ ...state, currentPlayer: player }, move);
  if (findGomokuWinner(next.board) === player) {
    return 1_000_000;
  }
  const distance = Math.abs(center - move.row) + Math.abs(center - move.col);
  return 100 - distance;
};

export const chooseGomokuMove = (state: GomokuState, level: Difficulty): GomokuMove | null => {
  const moves = getGomokuLegalMoves(state);
  if (moves.length === 0) {
    return null;
  }
  const player = state.currentPlayer;
  const opponent = oppositePlayer(player);
  const immediateWin = moves.find((move) => scoreMove(state, move, player) >= 1_000_000);
  if (immediateWin !== undefined) {
    return immediateWin;
  }
  if (level !== "beginner") {
    const block = moves.find((move) => scoreMove(state, move, opponent) >= 1_000_000);
    if (block !== undefined) {
      return block;
    }
  }
  return [...moves].sort((a, b) => scoreMove(state, b, player) - scoreMove(state, a, player))[0];
};
