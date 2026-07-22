export type GameId = "shogi" | "gomoku" | "othello";
export type PlayMode = "human-vs-human" | "human-vs-ai" | "ai-vs-ai";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type ThemeName = "light" | "dark" | "wood";
export type AnimationSpeed = "off" | "normal" | "fast";
export type Player = "black" | "white";

export interface Settings {
  difficulty: Difficulty;
  bgmVolume: number;
  seVolume: number;
  theme: ThemeName;
  animationSpeed: AnimationSpeed;
}

export interface GameStats {
  wins: number;
  losses: number;
  draws: number;
}

export type StatsByGame = Record<GameId, GameStats>;

export interface MoveRecord<TMove> {
  move: TMove;
  label: string;
}

export interface Result {
  winner: Player | "draw" | null;
  reason: string;
}

export interface GameAdapter<TState, TMove> {
  id: GameId;
  name: string;
  createInitialState: () => TState;
  getCurrentPlayer: (state: TState) => Player;
  getLegalMoves: (state: TState) => TMove[];
  applyMove: (state: TState, move: TMove) => TState;
  getResult: (state: TState) => Result;
  serializeMove: (move: TMove) => string;
}

export const oppositePlayer = (player: Player): Player => (player === "black" ? "white" : "black");

export const defaultSettings: Settings = {
  difficulty: "beginner",
  bgmVolume: 40,
  seVolume: 60,
  theme: "wood",
  animationSpeed: "normal"
};

export const createEmptyStats = (): StatsByGame => ({
  shogi: { wins: 0, losses: 0, draws: 0 },
  gomoku: { wins: 0, losses: 0, draws: 0 },
  othello: { wins: 0, losses: 0, draws: 0 }
});
