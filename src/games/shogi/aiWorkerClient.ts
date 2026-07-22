import type { Difficulty } from "../../common/types";
import { chooseShogiMove } from "./ai";
import type { ShogiMove, ShogiState } from "./shogi";

interface PendingRequest {
  resolve: (move: ShogiMove | null) => void;
  timeout: number;
}

interface ShogiAiResponse {
  id: number;
  move: ShogiMove | null;
}

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, PendingRequest>();

const getWorker = (): Worker | null => {
  if (typeof Worker === "undefined") return null;
  worker ??= new Worker(new URL("./aiWorker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (event: MessageEvent<ShogiAiResponse>) => {
    const request = pending.get(event.data.id);
    if (request === undefined) return;
    window.clearTimeout(request.timeout);
    pending.delete(event.data.id);
    request.resolve(event.data.move);
  };
  worker.onerror = () => {
    for (const request of pending.values()) {
      window.clearTimeout(request.timeout);
      request.resolve(null);
    }
    pending.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
};

export const chooseShogiMoveAsync = (state: ShogiState, difficulty: Difficulty): Promise<ShogiMove | null> => {
  const aiWorker = getWorker();
  if (aiWorker === null) return Promise.resolve(chooseShogiMove(state, difficulty));
  const id = nextId;
  nextId += 1;
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      pending.delete(id);
      resolve(chooseShogiMove(state, difficulty));
    }, 1200);
    pending.set(id, { resolve, timeout });
    aiWorker.postMessage({ id, state, difficulty });
  });
};
