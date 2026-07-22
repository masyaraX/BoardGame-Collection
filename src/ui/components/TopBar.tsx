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

export function TopBar({ selectedGame, mode, onGameChange, onModeChange }: TopBarProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">BoardGame Collection</p>
        <h1>{gameLabels[selectedGame]}</h1>
      </div>
      <nav className="segmented" aria-label="ゲーム選択">
        {(Object.keys(gameLabels) as GameId[]).map((game) => (
          <button className={game === selectedGame ? "active" : ""} key={game} onClick={() => onGameChange(game)}>
            {gameLabels[game]}
          </button>
        ))}
      </nav>
      <nav className="segmented" aria-label="モード選択">
        {(Object.keys(modeLabels) as PlayMode[]).map((item) => (
          <button className={item === mode ? "active" : ""} key={item} onClick={() => onModeChange(item)}>
            {modeLabels[item]}
          </button>
        ))}
      </nav>
    </header>
  );
}
