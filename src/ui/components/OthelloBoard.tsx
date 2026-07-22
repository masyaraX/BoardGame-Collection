import type { OthelloMove, OthelloState } from "../../games/othello/othello";

interface OthelloBoardProps {
  state: OthelloState;
  legalMoves: OthelloMove[];
  onMove: (move: OthelloMove) => void;
}

export function OthelloBoard({ state, legalMoves, onMove }: OthelloBoardProps) {
  const legal = new Set(legalMoves.filter((move) => move.pass !== true).map((move) => `${move.row}:${move.col}`));
  return (
    <div className="board othello-board" role="grid" aria-label="オセロ盤">
      {state.board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const key = `${rowIndex}:${colIndex}`;
          return (
            <button
              aria-label={`${rowIndex + 1}行 ${colIndex + 1}列`}
              className={legal.has(key) ? "cell legal" : "cell"}
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
