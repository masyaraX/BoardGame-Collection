import {
  createEmptyStats,
  defaultSettings,
  type GameId,
  type Settings,
  type StatsByGame
} from "../common/types";

const settingsKey = "boardgame-collection:settings";
const statsKey = "boardgame-collection:stats";
const saveKey = (gameId: GameId): string => `boardgame-collection:save:${gameId}`;

const parseStored = <T>(raw: string | null, fallback: T): T => {
  if (raw === null) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const loadSettings = (): Settings =>
  parseStored<Settings>(localStorage.getItem(settingsKey), defaultSettings);

export const saveSettings = (settings: Settings): void => {
  localStorage.setItem(settingsKey, JSON.stringify(settings));
};

export const loadStats = (): StatsByGame =>
  parseStored<StatsByGame>(localStorage.getItem(statsKey), createEmptyStats());

export const saveStats = (stats: StatsByGame): void => {
  localStorage.setItem(statsKey, JSON.stringify(stats));
};

export const saveGameState = <TState>(gameId: GameId, state: TState): void => {
  localStorage.setItem(saveKey(gameId), JSON.stringify(state));
};

export const loadGameState = <TState>(gameId: GameId): TState | null =>
  parseStored<TState | null>(localStorage.getItem(saveKey(gameId)), null);

export const clearGameState = (gameId: GameId): void => {
  localStorage.removeItem(saveKey(gameId));
};
