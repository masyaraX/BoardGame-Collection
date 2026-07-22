import type { GameId, StatsByGame } from "../../common/types";

interface StatsPanelProps {
  game: GameId;
  stats: StatsByGame;
}

const labels: Record<GameId, string> = { shogi: "将棋", gomoku: "五目", othello: "オセロ" };

export function StatsPanel({ game, stats }: StatsPanelProps) {
  const current = stats[game];
  const total = current.wins + current.losses + current.draws;
  const rate = total === 0 ? 0 : Math.round((current.wins / total) * 100);
  return (
    <aside className="stats">
      <h2>{labels[game]} 戦績</h2>
      <dl>
        <div><dt>勝</dt><dd>{current.wins}</dd></div>
        <div><dt>負</dt><dd>{current.losses}</dd></div>
        <div><dt>引分</dt><dd>{current.draws}</dd></div>
        <div><dt>勝率</dt><dd>{rate}%</dd></div>
      </dl>
    </aside>
  );
}
