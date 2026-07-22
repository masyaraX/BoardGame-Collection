import type { OthelloMove, OthelloState } from "../../games/othello/othello";

interface OthelloBoardProps {
  state: OthelloState;
  legalMoves: OthelloMove[];
  lastMove: OthelloMove | null;
  onMove: (move: OthelloMove) => void;
}

export function OthelloBoard({ state, legalMoves, lastMove, onMove }: OthelloBoardProps) {
  const legal = new Set(legalMoves.filter((move) => move.pass !== true).map((move) => `${move.row}:${move.col}`));
  return (
    <div className="board othello-board" role="grid" aria-label="オセロ盤">
      {state.board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const key = `${rowIndex}:${colIndex}`;
          const isLast = lastMove?.row === rowIndex && lastMove.col === colIndex;
          return (
            <button
              aria-label={`${rowIndex + 1}行 ${colIndex + 1}列`}
              className={[legal.has(key) ? "cell legal" : "cell", isLast ? "last-move" : ""].join(" ")}
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
