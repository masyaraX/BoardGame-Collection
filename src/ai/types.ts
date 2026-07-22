import type { Difficulty } from "../common/types";

export interface GameAi<TState, TMove> {
  chooseMove: (state: TState, level: Difficulty) => TMove | null;
}

export const difficultyDepth = (level: Difficulty): number => {
  if (level === "advanced") {
    return 3;
  }
  if (level === "intermediate") {
    return 2;
  }
  return 1;
};
