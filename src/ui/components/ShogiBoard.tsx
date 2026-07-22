import { useState } from "react";
import { type PieceKind, type ShogiMove, type ShogiState } from "../../games/shogi/shogi";

interface ShogiBoardProps {
  state: ShogiState;
  legalMoves: ShogiMove[];
  lastMove: ShogiMove | null;
  onMove: (move: ShogiMove) => void;
}

type Selection = { row: number; col: number } | { drop: PieceKind } | null;

const labels: Record<string, string> = {
  K: "玉",
  R: "飛",
  B: "角",
  G: "金",
  S: "銀",
  N: "桂",
  L: "香",
  P: "歩",
  PR: "龍",
  PB: "馬",
  PS: "成銀",
  PN: "成桂",
  PL: "成香",
  PP: "と"
};

export function ShogiBoard({ state, legalMoves, lastMove, onMove }: ShogiBoardProps) {
  const [selected, setSelected] = useState<Selection>(null);
  const dropMoves = legalMoves.filter((move) => move.drop !== undefined);
  const destinations = legalMoves.filter((move) => isSelectedMove(move, selected));
  const destinationMap = new Map(destinations.map((move) => [`${move.to.row}:${move.to.col}`, move]));
  const selectable = new Set(
    legalMoves.filter((move) => move.from !== undefined).map((move) => `${move.from!.row}:${move.from!.col}`)
  );

  const clickCell = (row: number, col: number): void => {
    const destination = destinationMap.get(`${row}:${col}`);
    if (destination !== undefined) {
      onMove(destination);
      setSelected(null);
      return;
    }
    if (selectable.has(`${row}:${col}`)) {
      setSelected({ row, col });
    }
  };

  return (
    <div className="shogi-area">
      <Hand owner="white" hand={state.hands.white} drops={dropMoves} selected={selected} onSelect={setSelected} />
      <div className="board shogi-board" role="grid" aria-label="将棋盤">
        {state.board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const key = `${rowIndex}:${colIndex}`;
            const canSelect = selectable.has(key);
            const canMove = destinationMap.has(key);
            const isSelected = selected !== null && "row" in selected && selected.row === rowIndex && selected.col === colIndex;
            const isLastFrom = lastMove?.from?.row === rowIndex && lastMove.from.col === colIndex;
            const isLastTo = lastMove?.to.row === rowIndex && lastMove.to.col === colIndex;
            return (
              <button
                aria-label={`${rowIndex + 1}行 ${colIndex + 1}列`}
                className={[
                  "cell",
                  canMove ? "legal" : "",
                  isSelected ? "selected" : "",
                  isLastFrom || isLastTo ? "last-move" : "",
                  isLastTo ? "last-to" : ""
                ].join(" ")}
                disabled={!canSelect && !canMove}
                key={key}
                onClick={() => clickCell(rowIndex, colIndex)}
              >
                {piece !== null && <span className={`piece ${piece.owner}`}>{labels[piece.kind]}</span>}
              </button>
            );
          })
        )}
      </div>
      <Hand owner="black" hand={state.hands.black} drops={dropMoves} selected={selected} onSelect={setSelected} />
    </div>
  );
}

const isSelectedMove = (move: ShogiMove, selected: Selection): boolean => {
  if (selected === null) return false;
  if ("drop" in selected) return move.drop === selected.drop;
  return move.from?.row === selected.row && move.from.col === selected.col;
};

function Hand({
  owner,
  hand,
  drops,
  selected,
  onSelect
}: {
  owner: string;
  hand: Partial<Record<PieceKind, number>>;
  drops: ShogiMove[];
  selected: Selection;
  onSelect: (selected: Selection) => void;
}) {
  const pieces = (Object.entries(hand) as [PieceKind, number | undefined][]).filter(([, count]) => (count ?? 0) > 0);
  return (
    <div className="hand" aria-label={`${owner} 持ち駒`}>
      {pieces.map(([kind, count]) => {
        const active = selected !== null && "drop" in selected && selected.drop === kind;
        const canDrop = drops.some((move) => move.drop === kind);
        return (
          <button className={active ? "active" : ""} disabled={!canDrop} key={kind} onClick={() => onSelect({ drop: kind })}>
            {labels[kind]} x {count}
          </button>
        );
      })}
    </div>
  );
}
