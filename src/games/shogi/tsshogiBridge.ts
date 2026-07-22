import { Color, PieceType, Position, Square } from "tsshogi";
import type { Player } from "../../common/types";
import type { PieceKind, ShogiKind, ShogiMove, ShogiPiece, ShogiState } from "./shogi";

const pieceToSFEN: Record<ShogiKind, string> = {
  K: "K",
  R: "R",
  B: "B",
  G: "G",
  S: "S",
  N: "N",
  L: "L",
  P: "P",
  PR: "+R",
  PB: "+B",
  PS: "+S",
  PN: "+N",
  PL: "+L",
  PP: "+P"
};

const pieceTypeToKind = new Map<PieceType, PieceKind>([
  [PieceType.KING, "K"],
  [PieceType.ROOK, "R"],
  [PieceType.BISHOP, "B"],
  [PieceType.GOLD, "G"],
  [PieceType.SILVER, "S"],
  [PieceType.KNIGHT, "N"],
  [PieceType.LANCE, "L"],
  [PieceType.PAWN, "P"]
]);

const kindToPieceType: Record<PieceKind, PieceType> = {
  K: PieceType.KING,
  R: PieceType.ROOK,
  B: PieceType.BISHOP,
  G: PieceType.GOLD,
  S: PieceType.SILVER,
  N: PieceType.KNIGHT,
  L: PieceType.LANCE,
  P: PieceType.PAWN
};

const colorToSFEN = (player: Player): string => (player === "black" ? "b" : "w");

const pieceSFEN = (piece: ShogiPiece): string => {
  const text = pieceToSFEN[piece.kind];
  return piece.owner === "black" ? text : text.toLowerCase();
};

const boardToSFEN = (board: (ShogiPiece | null)[][]): string =>
  board
    .map((row) => {
      let empty = 0;
      let text = "";
      for (const cell of row) {
        if (cell === null) {
          empty += 1;
          continue;
        }
        if (empty > 0) {
          text += String(empty);
          empty = 0;
        }
        text += pieceSFEN(cell);
      }
      return text + (empty > 0 ? String(empty) : "");
    })
    .join("/");

const handToSFEN = (state: ShogiState): string => {
  const order: PieceKind[] = ["R", "B", "G", "S", "N", "L", "P"];
  let text = "";
  for (const owner of ["black", "white"] as const) {
    for (const kind of order) {
      const count = state.hands[owner][kind] ?? 0;
      if (count <= 0) continue;
      const label = owner === "black" ? kind : kind.toLowerCase();
      text += `${count > 1 ? count : ""}${label}`;
    }
  }
  return text === "" ? "-" : text;
};

export const shogiStateToSFEN = (state: ShogiState): string =>
  `${boardToSFEN(state.board)} ${colorToSFEN(state.currentPlayer)} ${handToSFEN(state)} ${Math.max(1, state.history.length + 1)}`;

export const shogiStateToTsshogiPosition = (state: ShogiState): Position | null => Position.newBySFEN(shogiStateToSFEN(state));

const squareToMovePoint = (square: Square): { row: number; col: number } => ({ row: square.y, col: square.x });

const tsshogiMoveToShogiMove = (move: import("tsshogi").Move): ShogiMove | null => {
  const to = squareToMovePoint(move.to);
  if (move.from instanceof Square) {
    return {
      from: squareToMovePoint(move.from),
      to,
      promote: move.promote === true || undefined
    };
  }
  const drop = pieceTypeToKind.get(move.from);
  return drop === undefined ? null : { drop, to };
};

const addIfValid = (position: Position, moves: ShogiMove[], from: Square | PieceType, to: Square): void => {
  const move = position.createMove(from, to);
  if (move === null || !position.isValidMove(move) || position.isPawnDropMate(move)) return;
  const converted = tsshogiMoveToShogiMove(move);
  if (converted !== null) moves.push(converted);
  const promoted = move.withPromote();
  if (promoted.promote && position.isValidMove(promoted)) {
    const promotedConverted = tsshogiMoveToShogiMove(promoted);
    if (promotedConverted !== null && !moves.some((candidate) => candidate.from?.row === promotedConverted.from?.row && candidate.from?.col === promotedConverted.from?.col && candidate.to.row === promotedConverted.to.row && candidate.to.col === promotedConverted.to.col && candidate.promote === promotedConverted.promote)) {
      moves.push(promotedConverted);
    }
  }
};

export const generateTsshogiLegalMoves = (state: ShogiState): ShogiMove[] | null => {
  const position = shogiStateToTsshogiPosition(state);
  if (position === null) return null;
  const color = state.currentPlayer === "black" ? Color.BLACK : Color.WHITE;
  const moves: ShogiMove[] = [];
  for (const from of position.board.listSquaresByColor(color)) {
    for (const to of Square.all) {
      addIfValid(position, moves, from, to);
    }
  }
  for (const [kind, pieceType] of Object.entries(kindToPieceType) as [PieceKind, PieceType][]) {
    if (kind === "K" || (state.hands[state.currentPlayer][kind] ?? 0) <= 0) continue;
    for (const to of Square.all) {
      addIfValid(position, moves, pieceType, to);
    }
  }
  return moves;
};
