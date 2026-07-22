import type { GomokuMove, GomokuState } from "../../games/gomoku/gomoku";

interface GomokuBoardProps {
  state: GomokuState;
  legalMoves: GomokuMove[];
  lastMove: GomokuMove | null;
  onMove: (move: GomokuMove) => void;
}

export function GomokuBoard({ state, legalMoves, lastMove, onMove }: GomokuBoardProps) {
  const legal = new Set(legalMoves.map((move) => `${move.row}:${move.col}`));
  return (
    <div className="board gomoku-board" role="grid" aria-label="五目盤">
      {state.board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const key = `${rowIndex}:${colIndex}`;
          const isLast = lastMove?.row === rowIndex && lastMove.col === colIndex;
          return (
            <button
              aria-label={`${rowIndex + 1}行 ${colIndex + 1}列`}
              className={isLast ? "cell last-move" : "cell"}
              disabled={!legal.has(key)}
              key={key}
              onClick={() => onMove({ row: rowIndex, col: colIndex })}
            >
              {cell !== null && <span className={`stone ${cell}`} />}
            </button>
          );
        })
      )}
    </div>
  );
}
