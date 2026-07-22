import { oppositePlayer } from "../../common/types";
import { applyShogiMoveUnchecked, getShogiLegalMoves, isShogiInCheck, type ShogiMove, type ShogiState } from "./shogi";

const nonResignMoves = (state: ShogiState): ShogiMove[] => getShogiLegalMoves(state).filter((move) => move.resign !== true);

const isMatePosition = (state: ShogiState): boolean =>
  isShogiInCheck(state, state.currentPlayer) && nonResignMoves(state).length === 0;

const attackerHasForcedMate = (state: ShogiState, depth: number): boolean => {
  if (isMatePosition(state)) return true;
  if (depth <= 0 || !isShogiInCheck(state, state.currentPlayer)) return false;
  const defenderMoves = nonResignMoves(state);
  if (defenderMoves.length === 0) return true;
  return defenderMoves.every((reply) => {
    const afterReply = applyShogiMoveUnchecked(state, reply);
    return findShogiMateMove(afterReply, depth - 1) !== null;
  });
};

export const findShogiMateMove = (state: ShogiState, depth: number): ShogiMove | null => {
  if (depth <= 0) return null;
  const attacker = state.currentPlayer;
  const checkingMoves = nonResignMoves(state).filter((move) => {
    const next = applyShogiMoveUnchecked(state, move);
    return isShogiInCheck(next, oppositePlayer(attacker));
  });
  for (const move of checkingMoves) {
    const next = applyShogiMoveUnchecked(state, move);
    if (isMatePosition(next) || attackerHasForcedMate(next, depth - 1)) {
      return move;
    }
  }
  return null;
};
