import { describe, expect, it } from "vitest";
import {
  applyShogiMove,
  createInitialShogiState,
  getShogiLegalMoves,
  isShogiInCheck,
  applyShogiMoveUnchecked,
  type ShogiPiece
} from "../src/games/shogi/shogi";
import { chooseShogiMove } from "../src/games/shogi/ai";
import { findShogiMateMove } from "../src/games/shogi/checkmate";

describe("shogi", () => {
  it("generates initial moves", () => {
    expect(getShogiLegalMoves(createInitialShogiState()).length).toBeGreaterThan(0);
  });

  it("moves a pawn forward", () => {
    const state = applyShogiMove(createInitialShogiState(), {
      from: { row: 6, col: 4 },
      to: { row: 5, col: 4 }
    });
    expect(state.board[5][4]?.kind).toBe("P");
    expect(state.currentPlayer).toBe("white");
  });

  it("detects direct rook check", () => {
    const state = createInitialShogiState();
    const board: (ShogiPiece | null)[][] = state.board.map((row) => row.map(() => null));
    board[0][4] = { owner: "white", kind: "K" };
    board[8][4] = { owner: "black", kind: "R" };
    expect(isShogiInCheck({ ...state, board }, "white")).toBe(true);
  });

  it("does not allow capturing the king as a legal move", () => {
    const state = createInitialShogiState();
    const board: (ShogiPiece | null)[][] = state.board.map((row) => row.map(() => null));
    board[8][4] = { owner: "black", kind: "K" };
    board[0][4] = { owner: "white", kind: "K" };
    board[1][4] = { owner: "black", kind: "R" };
    const moves = getShogiLegalMoves({ ...state, board, currentPlayer: "black" });
    expect(moves.some((move) => move.to.row === 0 && move.to.col === 4)).toBe(false);
  });

  it("prefers winning material with the shogi AI", () => {
    const state = createInitialShogiState();
    const board: (ShogiPiece | null)[][] = state.board.map((row) => row.map(() => null));
    board[8][4] = { owner: "black", kind: "K" };
    board[0][0] = { owner: "white", kind: "K" };
    board[4][4] = { owner: "black", kind: "R" };
    board[4][5] = { owner: "white", kind: "B" };
    const move = chooseShogiMove({ ...state, board, currentPlayer: "black" }, "intermediate");
    expect(move?.to).toEqual({ row: 4, col: 5 });
  });

  it("finds a simple one-move mate", () => {
    const state = createInitialShogiState();
    const board: (ShogiPiece | null)[][] = state.board.map((row) => row.map(() => null));
    board[8][8] = { owner: "black", kind: "K" };
    board[0][0] = { owner: "white", kind: "K" };
    board[2][0] = { owner: "black", kind: "R" };
    board[2][1] = { owner: "black", kind: "G" };
    board[1][2] = { owner: "black", kind: "G" };
    const move = findShogiMateMove({ ...state, board, currentPlayer: "black" }, 1);
    expect(move).not.toBeNull();
    const next = applyShogiMoveUnchecked({ ...state, board, currentPlayer: "black" }, move!);
    expect(isShogiInCheck(next, "white")).toBe(true);
    expect(getShogiLegalMoves(next).filter((reply) => reply.resign !== true)).toHaveLength(0);
  });
});
