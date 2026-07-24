import { useCallback } from "react";
import { GameView } from "./components/GameView";
import { SettingsPanel } from "./components/SettingsPanel";
import { StatsPanel } from "./components/StatsPanel";
import { TopBar } from "./components/TopBar";
import { useAppStore } from "./store";

export function App() {
  const selectedGame = useAppStore((state) => state.selectedGame);
  const mode = useAppStore((state) => state.mode);
  const settings = useAppStore((state) => state.settings);
  const stats = useAppStore((state) => state.stats);
  const setGame = useAppStore((state) => state.setGame);
  const setMode = useAppStore((state) => state.setMode);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const recordResult = useAppStore((state) => state.recordResult);
  const handleResult = useCallback(
    (result: "win" | "loss" | "draw") => recordResult(selectedGame, result),
    [recordResult, selectedGame]
  );

  return (
    <main className={`app theme-${settings.theme}`}>
      <div className="app-frame">
        <TopBar selectedGame={selectedGame} mode={mode} onGameChange={setGame} onModeChange={setMode} />
        <div className="layout">
          <GameView key={selectedGame} gameId={selectedGame} mode={mode} settings={settings} onResult={handleResult} />
          <aside className="control-rail" aria-label="対局情報">
            <SettingsPanel settings={settings} onChange={updateSettings} />
            <StatsPanel game={selectedGame} stats={stats} />
          </aside>
        </div>
      </div>
    </main>
  );
}
