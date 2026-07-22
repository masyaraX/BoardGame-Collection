import { create } from "zustand";
import {
  createEmptyStats,
  defaultSettings,
  type GameId,
  type PlayMode,
  type Settings,
  type StatsByGame
} from "../common/types";
import { loadSettings, loadStats, saveSettings, saveStats } from "../save/storage";

interface AppStore {
  selectedGame: GameId;
  mode: PlayMode;
  settings: Settings;
  stats: StatsByGame;
  setGame: (game: GameId) => void;
  setMode: (mode: PlayMode) => void;
  updateSettings: (settings: Settings) => void;
  recordResult: (game: GameId, result: "win" | "loss" | "draw") => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  selectedGame: "shogi",
  mode: "human-vs-ai",
  settings: typeof localStorage === "undefined" ? defaultSettings : loadSettings(),
  stats: typeof localStorage === "undefined" ? createEmptyStats() : loadStats(),
  setGame: (selectedGame) => set({ selectedGame }),
  setMode: (mode) => set({ mode }),
  updateSettings: (settings) => {
    saveSettings(settings);
    set({ settings });
  },
  recordResult: (game, result) => {
    const stats = { ...get().stats, [game]: { ...get().stats[game] } };
    if (result === "win") stats[game].wins += 1;
    if (result === "loss") stats[game].losses += 1;
    if (result === "draw") stats[game].draws += 1;
    saveStats(stats);
    set({ stats });
  }
}));
