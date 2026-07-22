import { describe, expect, it } from "vitest";
import { chooseGomokuMove } from "../src/games/gomoku/ai";
import { getGomokuCandidateMoves } from "../src/games/gomoku/candidates";
import {
  applyGomokuMove,
  createInitialGomokuState,
  getGomokuLegalMoves,
  getGomokuResult,
  type GomokuState
} from "../src/games/gomoku/gomoku";
import { isForbiddenGomokuMove } from "../src/games/gomoku/rules";

describe("gomoku", () => {
  it("detects five stones in a row", () => {
    let state = createInitialGomokuState();
    for (let col = 0; col < 5; col += 1) {
      state = { ...state, currentPlayer: "black" };
      state = applyGomokuMove(state, { row: 7, col });
    }
    expect(getGomokuResult(state).winner).toBe("black");
  });

  it("starts candidate search from the center", () => {
    expect(getGomokuCandidateMoves(createInitialGomokuState().board)).toEqual([{ row: 7, col: 7 }]);
  });

  it("chooses an immediate winning move", () => {
    let state = createInitialGomokuState();
    for (let col = 3; col < 7; col += 1) {
      state = { ...state, currentPlayer: "black" };
      state = applyGomokuMove(state, { row: 7, col });
    }
    expect([{ row: 7, col: 2 }, { row: 7, col: 7 }]).toContainEqual(
      chooseGomokuMove({ ...state, currentPlayer: "black" }, "advanced")
    );
  });

  it("blocks an immediate opponent win", () => {
    let state = createInitialGomokuState();
    for (let col = 3; col < 7; col += 1) {
      state = { ...state, currentPlayer: "white" };
      state = applyGomokuMove(state, { row: 7, col });
    }
    expect([{ row: 7, col: 2 }, { row: 7, col: 7 }]).toContainEqual(
      chooseGomokuMove({ ...state, currentPlayer: "black" }, "intermediate")
    );
  });

  it("filters forbidden overline moves in renju mode", () => {
    let state: GomokuState = { ...createInitialGomokuState(), rule: "renju", forbiddenEnabled: true };
    for (let col = 2; col < 7; col += 1) {
      state = { ...state, currentPlayer: "black" };
      state = applyGomokuMove(state, { row: 7, col });
    }
    const forbidden = { row: 7, col: 7 };
    expect(isForbiddenGomokuMove(state.board, forbidden, "black")).toBe(true);
    expect(getGomokuLegalMoves({ ...state, currentPlayer: "black" })).not.toContainEqual(forbidden);
  });
});
