# BoardGame Collection

将棋・五目並べ・オセロを 1 つのアプリで遊ぶための React / TypeScript / Vite 製ゲームコレクションです。

## 実装内容

- React + TypeScript Strict + Vite
- Zustand による設定・戦績状態管理
- MIT ライセンスの tsshogi による将棋局面/SFEN/合法手検証
- LocalStorage による設定、戦績、対局中データ保存
- 将棋、五目並べ、オセロのゲームロジックと UI 分離
- AI 対戦、2 人対戦、AI VS AI 観戦モード
- Vitest による主要ルールのユニットテスト
- ESLint / Prettier 設定

## コマンド

```bash
pnpm install
pnpm dev
pnpm test
pnpm lint
pnpm build
```

## ディレクトリ

```text
src/
  ai/
  assets/
  common/
  games/
    shogi/
    gomoku/
    othello/
  save/
  ui/
tests/
```

## 現在の対応範囲

- 将棋: 駒移動、成り、持ち駒、王手判定、詰み判定、千日手、投了
- 五目並べ: 15x15、黒先手、5 連勝利、AI
- オセロ: 8x8、石反転、パス、終局、勝敗判定、AI

## TODO

- YaneuraOu / GPSFish などの GPL 系 USI エンジンを使う場合のライセンス方針決定
- 将棋エンジンを WASM またはサーバー USI 連携で差し替える
- 将棋の打ち歩詰め、連珠の禁じ手詳細判定を厳密化
- AI の探索深さ、キャッシュ、時間制限を共通エンジン化
- E2E テスト追加
- BGM / SE アセット追加
