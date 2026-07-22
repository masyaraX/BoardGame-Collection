import { oppositePlayer, type GameAdapter, type Player, type Result } from "../../common/types";

export type PieceKind = "K" | "R" | "B" | "G" | "S" | "N" | "L" | "P";
export type PromotedKind = "PR" | "PB" | "PS" | "PN" | "PL" | "PP";
export type ShogiKind = PieceKind | PromotedKind;

export interface ShogiPiece {
  owner: Player;
  kind: ShogiKind;
}

export interface ShogiMove {
  from?: { row: number; col: number };
  to: { row: number; col: number };
  drop?: PieceKind;
  promote?: boolean;
  resign?: boolean;
}

export interface ShogiState {
  board: (ShogiPiece | null)[][];
  hands: Record<Player, Partial<Record<PieceKind, number>>>;
  currentPlayer: Player;
  history: string[];
  resignedBy: Player | null;
}

const size = 9;
const promotable: PieceKind[] = ["R", "B", "S", "N", "L", "P"];
const goldLike: ShogiKind[] = ["G", "PS", "PN", "PL", "PP"];

const cloneBoard = (board: (ShogiPiece | null)[][]): (ShogiPiece | null)[][] =>
  board.map((row) => row.map((piece) => (piece === null ? null : { ...piece })));

const inBounds = (row: number, col: number): boolean =>
  row >= 0 && row < size && col >= 0 && col < size;

const forward = (owner: Player): number => (owner === "black" ? -1 : 1);
const promotionZone = (owner: Player, row: number): boolean =>
  owner === "black" ? row <= 2 : row >= 6;

const promoteKind = (kind: ShogiKind): ShogiKind => {
  if (kind === "R") return "PR";
  if (kind === "B") return "PB";
  if (kind === "S") return "PS";
  if (kind === "N") return "PN";
  if (kind === "L") return "PL";
  if (kind === "P") return "PP";
  return kind;
};

const demoteKind = (kind: ShogiKind): PieceKind => {
  if (kind === "PR") return "R";
  if (kind === "PB") return "B";
  if (kind === "PS") return "S";
  if (kind === "PN") return "N";
  if (kind === "PL") return "L";
  if (kind === "PP") return "P";
  return kind;
};

const initialRow = (owner: Player): (ShogiPiece | null)[] => [
  { owner, kind: "L" },
  { owner, kind: "N" },
  { owner, kind: "S" },
  { owner, kind: "G" },
  { owner, kind: "K" },
  { owner, kind: "G" },
  { owner, kind: "S" },
  { owner, kind: "N" },
  { owner, kind: "L" }
];

export const createInitialShogiState = (): ShogiState => {
  const board: (ShogiPiece | null)[][] = Array.from({ length: size }, () =>
    Array.from<ShogiPiece | null>({ length: size }).fill(null)
  );
  board[0] = initialRow("white");
  board[1][1] = { owner: "white", kind: "R" };
  board[1][7] = { owner: "white", kind: "B" };
  board[2] = Array.from({ length: size }, () => ({ owner: "white", kind: "P" }));
  board[6] = Array.from({ length: size }, () => ({ owner: "black", kind: "P" }));
  board[7][1] = { owner: "black", kind: "B" };
  board[7][7] = { owner: "black", kind: "R" };
  board[8] = initialRow("black");
  return { board, hands: { black: {}, white: {} }, currentPlayer: "black", history: [], resignedBy: null };
};

const pushStep = (
  moves: ShogiMove[],
  board: (ShogiPiece | null)[][],
  owner: Player,
  from: { row: number; col: number },
  dr: number,
  dc: number
): void => {
  const row = from.row + dr;
  const col = from.col + dc;
  if (!inBounds(row, col) || board[row][col]?.owner === owner) {
    return;
  }
  moves.push({ from, to: { row, col } });
};

const pushSlide = (
  moves: ShogiMove[],
  board: (ShogiPiece | null)[][],
  owner: Player,
  from: { row: number; col: number },
  dr: number,
  dc: number
): void => {
  let row = from.row + dr;
  let col = from.col + dc;
  while (inBounds(row, col)) {
    if (board[row][col]?.owner === owner) break;
    moves.push({ from, to: { row, col } });
    if (board[row][col] !== null) break;
    row += dr;
    col += dc;
  }
};

const rawPieceMoves = (state: ShogiState, row: number, col: number): ShogiMove[] => {
  const piece = state.board[row][col];
  if (piece === null) return [];
  const moves: ShogiMove[] = [];
  const from = { row, col };
  const f = forward(piece.owner);
  const add = (dr: number, dc: number): void => pushStep(moves, state.board, piece.owner, from, dr, dc);
  const slide = (dr: number, dc: number): void => pushSlide(moves, state.board, piece.owner, from, dr, dc);
  if (piece.kind === "K") [-1, 0, 1].forEach((dr) => [-1, 0, 1].forEach((dc) => (dr || dc ? add(dr, dc) : undefined)));
  if (piece.kind === "R" || piece.kind === "PR") [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => slide(dr, dc));
  if (piece.kind === "B" || piece.kind === "PB") [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dr, dc]) => slide(dr, dc));
  if (piece.kind === "PR") [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dr, dc]) => add(dr, dc));
  if (piece.kind === "PB") [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => add(dr, dc));
  if (goldLike.includes(piece.kind)) [[f, 0], [f, 1], [f, -1], [0, 1], [0, -1], [-f, 0]].forEach(([dr, dc]) => add(dr, dc));
  if (piece.kind === "S") [[f, 0], [f, 1], [f, -1], [-f, 1], [-f, -1]].forEach(([dr, dc]) => add(dr, dc));
  if (piece.kind === "N") [[f * 2, 1], [f * 2, -1]].forEach(([dr, dc]) => add(dr, dc));
  if (piece.kind === "L") slide(f, 0);
  if (piece.kind === "P") add(f, 0);
  return moves.flatMap((move) => withPromotionOptions(state, move, piece));
};

const withPromotionOptions = (state: ShogiState, move: ShogiMove, piece: ShogiPiece): ShogiMove[] => {
  const base = demoteKind(piece.kind);
  if (!promotable.includes(base) || piece.kind !== base) return [move];
  const canPromote = promotionZone(piece.owner, move.from!.row) || promotionZone(piece.owner, move.to.row);
  if (!canPromote) return [move];
  const mustPromote = (base === "P" || base === "L") && (piece.owner === "black" ? move.to.row === 0 : move.to.row === 8);
  if (base === "N" && (piece.owner === "black" ? move.to.row <= 1 : move.to.row >= 7)) return [{ ...move, promote: true }];
  return mustPromote ? [{ ...move, promote: true }] : [move, { ...move, promote: true }];
};

const applyUnchecked = (state: ShogiState, move: ShogiMove): ShogiState => {
  if (move.resign === true) return { ...state, resignedBy: state.currentPlayer };
  const board = cloneBoard(state.board);
  const hands = { black: { ...state.hands.black }, white: { ...state.hands.white } };
  if (move.drop !== undefined) {
    board[move.to.row][move.to.col] = { owner: state.currentPlayer, kind: move.drop };
    hands[state.currentPlayer][move.drop] = (hands[state.currentPlayer][move.drop] ?? 1) - 1;
  } else if (move.from !== undefined) {
    const piece = board[move.from.row][move.from.col]!;
    const captured = board[move.to.row][move.to.col];
    if (captured !== null) {
      const kind = demoteKind(captured.kind);
      hands[state.currentPlayer][kind] = (hands[state.currentPlayer][kind] ?? 0) + 1;
    }
    board[move.from.row][move.from.col] = null;
    board[move.to.row][move.to.col] = { owner: piece.owner, kind: move.promote === true ? promoteKind(piece.kind) : piece.kind };
  }
  const next = { ...state, board, hands, currentPlayer: oppositePlayer(state.currentPlayer) };
  return { ...next, history: [...state.history, boardKey(next)] };
};

const findKing = (state: ShogiState, player: Player): { row: number; col: number } | null => {
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const piece = state.board[row][col];
      if (piece?.owner === player && piece.kind === "K") return { row, col };
    }
  }
  return null;
};

export const isShogiInCheck = (state: ShogiState, player: Player): boolean => {
  const king = findKing(state, player);
  if (king === null) return true;
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (state.board[row][col]?.owner === oppositePlayer(player)) {
        if (rawPieceMoves(state, row, col).some((move) => move.to.row === king.row && move.to.col === king.col)) return true;
      }
    }
  }
  return false;
};

const dropMoves = (state: ShogiState): ShogiMove[] => {
  const moves: ShogiMove[] = [];
  const hand = state.hands[state.currentPlayer];
  for (const [kind, count] of Object.entries(hand) as [PieceKind, number | undefined][]) {
    if ((count ?? 0) <= 0) continue;
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (state.board[row][col] !== null || isIllegalDrop(state, kind, row, col)) continue;
        moves.push({ drop: kind, to: { row, col } });
      }
    }
  }
  return moves;
};

const isIllegalDrop = (state: ShogiState, kind: PieceKind, row: number, col: number): boolean => {
  if ((kind === "P" || kind === "L") && (state.currentPlayer === "black" ? row === 0 : row === 8)) return true;
  if (kind === "N" && (state.currentPlayer === "black" ? row <= 1 : row >= 7)) return true;
  if (kind !== "P") return false;
  return state.board.some((line) => line[col]?.owner === state.currentPlayer && line[col]?.kind === "P");
};

export const getShogiLegalMoves = (state: ShogiState): ShogiMove[] => {
  if (state.resignedBy !== null) return [];
  const moves: ShogiMove[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (state.board[row][col]?.owner === state.currentPlayer) moves.push(...rawPieceMoves(state, row, col));
    }
  }
  moves.push(...dropMoves(state), { to: { row: -1, col: -1 }, resign: true });
  return moves.filter((move) => move.resign === true || !isShogiInCheck(applyUnchecked(state, move), state.currentPlayer));
};

export const applyShogiMove = (state: ShogiState, move: ShogiMove): ShogiState => {
  const legal = getShogiLegalMoves(state).some((candidate) => serializeShogiMove(candidate) === serializeShogiMove(move));
  return legal ? applyUnchecked(state, move) : state;
};

const boardKey = (state: ShogiState): string =>
  `${state.currentPlayer}:${state.board.map((row) => row.map((piece) => (piece === null ? "__" : `${piece.owner[0]}${piece.kind}`)).join(",")).join("/")}:${JSON.stringify(state.hands)}`;

const isFourfold = (state: ShogiState): boolean => {
  const key = boardKey(state);
  return state.history.filter((item) => item === key).length >= 4;
};

export const getShogiResult = (state: ShogiState): Result => {
  if (state.resignedBy !== null) return { winner: oppositePlayer(state.resignedBy), reason: "投了" };
  if (isFourfold(state)) return { winner: "draw", reason: "千日手" };
  const legal = getShogiLegalMoves(state).filter((move) => move.resign !== true);
  if (legal.length === 0 && isShogiInCheck(state, state.currentPlayer)) return { winner: oppositePlayer(state.currentPlayer), reason: "詰み" };
  return { winner: null, reason: isShogiInCheck(state, state.currentPlayer) ? "王手" : "対局中" };
};

export const serializeShogiMove = (move: ShogiMove): string => {
  if (move.resign === true) return "resign";
  const head = move.drop !== undefined ? `D${move.drop}` : `${move.from!.row},${move.from!.col}`;
  return `${head}-${move.to.row},${move.to.col}${move.promote === true ? "+" : ""}`;
};

export const shogiAdapter: GameAdapter<ShogiState, ShogiMove> = {
  id: "shogi",
  name: "将棋",
  createInitialState: createInitialShogiState,
  getCurrentPlayer: (state) => state.currentPlayer,
  getLegalMoves: getShogiLegalMoves,
  applyMove: applyShogiMove,
  getResult: getShogiResult,
  serializeMove: serializeShogiMove
};
