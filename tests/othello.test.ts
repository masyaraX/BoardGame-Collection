import { describe, expect, it } from "vitest";
import {
  applyOthelloMove,
  countOthelloDiscs,
  createInitialOthelloState,
  getOthelloLegalMoves
} from "../src/games/othello/othello";

describe("othello", () => {
  it("generates initial legal moves", () => {
    const state = createInitialOthelloState();
    expect(getOthelloLegalMoves(state)).toHaveLength(4);
  });

  it("flips captured discs", () => {
    const state = applyOthelloMove(createInitialOthelloState(), { row: 2, col: 3 });
    expect(countOthelloDiscs(state.board)).toEqual({ black: 4, white: 1 });
  });
});
