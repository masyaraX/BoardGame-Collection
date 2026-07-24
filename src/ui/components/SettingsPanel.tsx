import { Gauge, MonitorCog, Music2, SlidersHorizontal, Sparkles, Volume2 } from "lucide-react";
import type { Settings } from "../../common/types";

interface SettingsPanelProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
}

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  return (
    <section className="control-panel settings">
      <h2><SlidersHorizontal aria-hidden="true" size={18} />対局設定</h2>
      <label className="field">
        <span><Gauge aria-hidden="true" size={15} />AIレベル</span>
        <select value={settings.difficulty} onChange={(event) => onChange({ ...settings, difficulty: event.target.value as Settings["difficulty"] })}>
          <option value="beginner">初級</option>
          <option value="intermediate">中級</option>
          <option value="advanced">上級</option>
        </select>
      </label>
      <label className="field">
        <span><MonitorCog aria-hidden="true" size={15} />盤面テーマ</span>
        <select value={settings.theme} onChange={(event) => onChange({ ...settings, theme: event.target.value as Settings["theme"] })}>
          <option value="light">ライト</option>
          <option value="dark">ダーク</option>
          <option value="wood">木目</option>
        </select>
      </label>
      <label className="field">
        <span><Sparkles aria-hidden="true" size={15} />アニメーション</span>
        <select value={settings.animationSpeed} onChange={(event) => onChange({ ...settings, animationSpeed: event.target.value as Settings["animationSpeed"] })}>
          <option value="off">OFF</option>
          <option value="normal">普通</option>
          <option value="fast">高速</option>
        </select>
      </label>
      <label className="range-field">
        <span><Music2 aria-hidden="true" size={15} />BGM <output>{settings.bgmVolume}</output></span>
        <input aria-label="BGM音量" type="range" min="0" max="100" value={settings.bgmVolume} onChange={(event) => onChange({ ...settings, bgmVolume: Number(event.target.value) })} />
      </label>
      <label className="range-field">
        <span><Volume2 aria-hidden="true" size={15} />効果音 <output>{settings.seVolume}</output></span>
        <input aria-label="効果音量" type="range" min="0" max="100" value={settings.seVolume} onChange={(event) => onChange({ ...settings, seVolume: Number(event.target.value) })} />
      </label>
    </section>
  );
}
