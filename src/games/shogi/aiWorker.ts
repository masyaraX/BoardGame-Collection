import { chooseShogiMove } from "./ai";
import type { Difficulty } from "../../common/types";
import type { ShogiMove, ShogiState } from "./shogi";

interface ShogiAiRequest {
  id: number;
  state: ShogiState;
  difficulty: Difficulty;
}

interface ShogiAiResponse {
  id: number;
  move: ShogiMove | null;
}

self.onmessage = (event: MessageEvent<ShogiAiRequest>): void => {
  const { id, state, difficulty } = event.data;
  const move = chooseShogiMove(state, difficulty);
  self.postMessage({ id, move } satisfies ShogiAiResponse);
};
