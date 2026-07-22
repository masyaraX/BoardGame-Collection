import { describe, expect, it } from "vitest";
import { applyGomokuMove, createInitialGomokuState, getGomokuResult } from "../src/games/gomoku/gomoku";

describe("gomoku", () => {
  it("detects five stones in a row", () => {
    let state = createInitialGomokuState();
    for (let col = 0; col < 5; col += 1) {
      state = { ...state, currentPlayer: "black" };
      state = applyGomokuMove(state, { row: 7, col });
    }
    expect(getGomokuResult(state).winner).toBe("black");
  });
});
