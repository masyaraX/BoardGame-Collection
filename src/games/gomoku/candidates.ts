import type { GomokuCell, GomokuMove } from "./gomoku";
import { gomokuSize, hasAnyGomokuStone, isOnGomokuBoard } from "./rules";

export const getGomokuCandidateMoves = (board: GomokuCell[][], radius = 2): GomokuMove[] => {
  if (!hasAnyGomokuStone(board)) {
    return [{ row: Math.floor(gomokuSize / 2), col: Math.floor(gomokuSize / 2) }];
  }
  const keys = new Set<string>();
  for (let row = 0; row < gomokuSize; row += 1) {
    for (let col = 0; col < gomokuSize; col += 1) {
      if (board[row][col] === null) continue;
      for (let dr = -radius; dr <= radius; dr += 1) {
        for (let dc = -radius; dc <= radius; dc += 1) {
          const nextRow = row + dr;
          const nextCol = col + dc;
          if (isOnGomokuBoard(nextRow, nextCol) && board[nextRow][nextCol] === null) {
            keys.add(`${nextRow}:${nextCol}`);
          }
        }
      }
    }
  }
  return [...keys].map((key) => {
    const [row, col] = key.split(":").map(Number);
    return { row, col };
  });
};
