import { Bot, CircleDot, Crown, Grid3X3, MonitorPlay, Users } from "lucide-react";
import type { GameId, PlayMode } from "../../common/types";

interface TopBarProps {
  selectedGame: GameId;
  mode: PlayMode;
  onGameChange: (game: GameId) => void;
  onModeChange: (mode: PlayMode) => void;
}

const gameLabels: Record<GameId, string> = { shogi: "将棋", gomoku: "五目", othello: "オセロ" };
const modeLabels: Record<PlayMode, string> = {
  "human-vs-human": "2人",
  "human-vs-ai": "AI",
  "ai-vs-ai": "観戦"
};

const gameIcons = {
  shogi: Crown,
  gomoku: Grid3X3,
  othello: CircleDot
} satisfies Record<GameId, typeof Crown>;

const modeIcons = {
  "human-vs-human": Users,
  "human-vs-ai": Bot,
  "ai-vs-ai": MonitorPlay
} satisfies Record<PlayMode, typeof Users>;

export function TopBar({ selectedGame, mode, onGameChange, onModeChange }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="wordmark">
        <span className="wordmark-mark" aria-hidden="true">盤</span>
        <div>
          <h1>盤上遊戯</h1>
          <p>将棋・五目並べ・オセロ</p>
        </div>
      </div>
      <nav className="game-switch" aria-label="ゲーム選択">
        {(Object.keys(gameLabels) as GameId[]).map((game) => (
          (() => {
            const Icon = gameIcons[game];
            return (
              <button
                aria-pressed={game === selectedGame}
                className={game === selectedGame ? "active" : ""}
                key={game}
                onClick={() => onGameChange(game)}
              >
                <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
                <span>{gameLabels[game]}</span>
              </button>
            );
          })()
        ))}
      </nav>
      <nav className="mode-switch" aria-label="対局モード選択">
        {(Object.keys(modeLabels) as PlayMode[]).map((item) => (
          (() => {
            const Icon = modeIcons[item];
            return (
              <button
                aria-pressed={item === mode}
                className={item === mode ? "active" : ""}
                key={item}
                onClick={() => onModeChange(item)}
              >
                <Icon aria-hidden="true" size={16} strokeWidth={1.8} />
                <span>{modeLabels[item]}</span>
              </button>
            );
          })()
        ))}
      </nav>
    </header>
  );
}
