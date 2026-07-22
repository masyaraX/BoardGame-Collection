import type { Settings } from "../../common/types";

interface SettingsPanelProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
}

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  return (
    <aside className="settings">
      <h2>設定</h2>
      <label>
        AIレベル
        <select value={settings.difficulty} onChange={(event) => onChange({ ...settings, difficulty: event.target.value as Settings["difficulty"] })}>
          <option value="beginner">初級</option>
          <option value="intermediate">中級</option>
          <option value="advanced">上級</option>
        </select>
      </label>
      <label>
        テーマ
        <select value={settings.theme} onChange={(event) => onChange({ ...settings, theme: event.target.value as Settings["theme"] })}>
          <option value="light">ライト</option>
          <option value="dark">ダーク</option>
          <option value="wood">木目</option>
        </select>
      </label>
      <label>
        アニメーション
        <select value={settings.animationSpeed} onChange={(event) => onChange({ ...settings, animationSpeed: event.target.value as Settings["animationSpeed"] })}>
          <option value="off">OFF</option>
          <option value="normal">普通</option>
          <option value="fast">高速</option>
        </select>
      </label>
      <label>
        BGM
        <input type="range" min="0" max="100" value={settings.bgmVolume} onChange={(event) => onChange({ ...settings, bgmVolume: Number(event.target.value) })} />
      </label>
      <label>
        SE
        <input type="range" min="0" max="100" value={settings.seVolume} onChange={(event) => onChange({ ...settings, seVolume: Number(event.target.value) })} />
      </label>
    </aside>
  );
}
