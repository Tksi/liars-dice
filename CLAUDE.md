# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

このプロジェクトはライアーズダイス（嘘つきサイコロ）をWebアプリケーションとして実装するためのNuxt 3プロジェクトです。

## 開発コマンド

### 基本的な開発コマンド

- `npm run dev` - 開発サーバーを起動
- `npm run build` - プロダクション用ビルド
- `npm run preview` - ビルド結果をプレビュー
- `npm run generate` - 静的サイト生成

### コード品質チェック

- `npm run format:check` - Prettierによるフォーマットチェック
- `npm run lint:check` - ESLintによるコードチェック
- `npm run type:check` - TypeScriptの型チェック
- `npm run checkall` - 上記3つを順次実行
- `npm run fix` - フォーマット修正、リント修正、型チェックを実行

## アーキテクチャ

### フレームワーク構成

- **Nuxt 3**: メインフレームワーク（SPA モード: ssr: false）
- **Vue 3**: UIライブラリ（Composition API重視）
- **TypeScript**: 型安全性（strict設定有効）

### 主要ライブラリ

- **zod**: スキーマバリデーション（APIリクエスト、ローカルストレージ）
- **nanoid**: 短縮ID生成（4文字、ユーザーID生成に使用）
- **unique-names-generator**: ランダムなルーム名生成
- **lodash-es**: debounce機能（ブロードキャスト制御）
- **@formkit/auto-animate**: UIアニメーション
- **@nuxtjs/tailwindcss**: スタイリング

### ディレクトリ構造

- `pages/` - ページコンポーネント
  - `pages/index.vue` - ルーム一覧ページ
  - `pages/[roomId]/index.vue` - ルーム詳細ページ（SSE接続デバッグ用）
- `server/` - サーバーサイド関連
  - `server/api/` - APIエンドポイント
  - `server/state/` - インメモリ状態管理
  - `server/lib/` - サーバーサイドユーティリティ
- `public/` - 静的ファイル
- `components/` - 再利用可能なVueコンポーネント
- `types/` - TypeScript型定義

### TypeScript設定

厳格な型チェックが有効化されている：

- `noImplicitAny: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `noUncheckedIndexedAccess: true`

### ESLint設定

高度なルールセットが適用されている：

- TypeScript推奨ルール + 型チェック
- Vue固有のルール（Composition API重視）
- Unicorn plugin（モダンJavaScript慣行）
- JSDoc必須（パブリック関数）
- Stylistic formatting rules

## 重要な開発方針

- JSDocドキュメントはパブリック関数に必須
- TypeScript型定義は`type`キーワードを使用（`interface`ではなく）
- Vue Composition APIの使用を推奨
- console.logは制限されているが、info/warn/error/debugは許可
- default exportは設定ファイル、middleware、plugins、server、pagesでのみ許可
- classは使用しない
- バリデーションが必要な場合はzodを使用
- idやUUIDの生成にはnanoid(4)を使用
- スタイルにはTailwind CSSを使用
- lodash-esのdebounce機能を使用（ブロードキャスト制御）

## 現在の実装状況

### ✅ 実装済み機能

#### フロントエンド

- ユーザー名登録・保存（localStorage）
- ルーム一覧表示・自動更新（1秒間隔）
- ルーム作成機能
- **ルームページ**: SSE接続によるリアルタイム通信（デバッグ用UI付き）
- レスポンシブデザイン（Tailwind CSS）

#### コンポーネント

- `AppBar` - アプリケーションヘッダー
- `EmptyState` - 空状態表示
- `IconButton` - アイコンボタン
- `RoomCard` - ルーム情報カード
- `UserCard` - ユーザー情報カード

#### サーバーサイド

- **インメモリ状態管理**: Proxy化によるリアルタイム変更検知・ブロードキャスト
- **SSEによるリアルタイム通信**: ハートビート、自動切断、重複接続処理
- **APIエンドポイント**:
  - `GET /api/rooms` - ルーム一覧取得
  - `POST /api/rooms` - 新規ルーム作成（unique-names-generatorでランダム名生成）
  - `GET /api/rooms/[roomId]/[userId]` - SSE接続によるルーム参加
  - `POST /api/rooms/[roomId]/start` - ゲーム開始（プレイヤー順序シャッフル、サイコロ配布）
  - `POST /api/rooms/[roomId]/[userId]/bet` - ベット実行（ベット有効性チェック付き）
  - `POST /api/rooms/[roomId]/[userId]/challenge` - チャレンジ実行（結果計算、サイコロ再配布）
- **エラーハンドリング**: Zodバリデーションエラー統一処理

### 🎯 新規実装機能

- **ゲームロジック**: 完全なライアーズダイスルール実装
- **ゲーム状態管理**: サイコロ配布、ベット、チャレンジ機能
- **プレイヤー管理**: ターン制御、プレイヤー順序管理、脱落処理
- **ゲーム進行**: ラウンド管理、勝敗判定、ゲーム終了処理

### ❌ 未実装機能

- **ゲームUI**: 実際のゲームプレイ画面（フロントエンド）
- **ゲーム開始UI**: ゲーム開始ボタンの実装
- **ベット・チャレンジUI**: プレイヤーアクション入力画面

### ⚠️ 技術的課題

#### 型定義の不整合と詳細

**サーバーサイド型（`/types/index.ts`）:**

```typescript
// ゲーム関連の型
type GameBet = {
  count: number;
  face: number;
  userId: string;
};

type GameStatus = 'waiting' | 'playing' | 'finished';

type ChallengeResult = {
  success: boolean;
  actualCount: number;
  expectedCount: number;
  face: number;
  allUsersDice: Record<string, { name: string; dice: number[] }>;
};

// サーバーサイドで使用される型
type ServerUser = {
  id: string;
  stream: EventStream; // SSE接続オブジェクト
  name: string;
  isMyTurn: boolean;
  dice: number[];
  isConnected: boolean;
};

type ServerRoom = {
  id: string;
  name: string;
  createdAt: number;
  users: Map<string, ServerUser>; // Map構造
  gameStatus: GameStatus;
  currentBet: GameBet | null;
  lastChallengeResult: ChallengeResult | null;
};
```

**フロントエンド型（同じファイル内で変換）:**

```typescript
// フロントエンドに送信される型
type User = Omit<ServerUser, 'stream'>; // streamプロパティを除去

type Room = Omit<ServerRoom, 'users'> & {
  users: Record<string, User>; // MapをRecord型に変換
};
```

**型変換の課題:**

- サーバーサイドのMap構造をフロントエンドのRecord型に変換が必要
- `replacer.ts` でMapのシリアライゼーション処理
- SSE経由で送信時に型の自動変換が行われる

## サーバーサイドアーキテクチャ

### 状態管理

**Proxy化によるリアルタイム変更検知:**

- `createMapProxy()` - Map操作（set/delete/clear）を監視
- `createRoomProxy()` - Roomオブジェクトのプロパティ変更を監視
- 変更検知時に自動的にブロードキャストを実行

**デバウンス機能（10ms間隔）:**

- 同じルームで連続する変更を1回のブロードキャストにまとめる
- 主に重複接続時の削除→追加処理での二重発火を防止
- `lodash-es` の `debounce` を使用

**ブロードキャスト処理:**

- `broadcastToRoom()` - ルーム内全ユーザーにSSEで状態送信
- `JSON.stringify(room, replacer)` でMapを含む状態をシリアライズ
- 各ユーザーの `stream.push()` で並列送信

**状態の型定義:**

- `ServerUser` - ストリーム接続を含むサーバーサイドユーザー情報
- `ServerRoom` - ユーザーMap、ステータス、メタデータを管理
- メモリ内の `rooms` Map でグローバル状態を保持

### APIエンドポイント

**基本機能:**

- `GET /api/rooms` - ルーム一覧取得
- `POST /api/rooms` - 新規ルーム作成（unique-names-generatorでランダム名生成）
- `GET /api/rooms/[roomId]/[userId]` - SSE接続によるルーム参加

**ゲーム機能:**

- `POST /api/rooms/[roomId]/start` - ゲーム開始（2人以上必要、プレイヤー順序ランダム化）
- `POST /api/rooms/[roomId]/[userId]/bet` - ベット実行（ターンチェック、ベット有効性検証）
- `POST /api/rooms/[roomId]/[userId]/challenge` - チャレンジ実行（結果計算、負けプレイヤー処理）

### SSE（Server-Sent Events）実装詳細

**接続管理:**

- `createEventStream(event)` でSSE接続を確立
- 重複接続時は古い接続を自動切断（同じuserIdの場合）
- `stream.onClosed()` で接続切断時の自動クリーンアップ

**イベント種別:**

- `heartbeat` - 10秒間隔でクライアント生存確認
- `update` - ルーム状態変更時のブロードキャスト
- `close` - 重複接続による強制切断通知
- `404` - 存在しないルームへの接続エラー

**ユーザー情報の管理:**

- userIdは `{name}@{nanoid(4)}` 形式
- 接続時に `ServerUser` オブジェクトを作成
- `stream` プロパティでSSE接続を保持

### エラーハンドリング

**Zodバリデーション:**

- `zodErrorHandler()` で統一されたエラー処理
- ステータスコード422でバリデーションエラーを返却
- `server/lib/zodErrorHandler.ts` に実装

**APIエラー処理:**

- `createError()` でH3標準のエラーレスポンス生成
- console.errorでサーバーログに記録
- フロントエンドにはエラーメッセージを含むレスポンスを送信

**SSEエラー処理:**

- 存在しないルームへの接続時は404イベントを送信
- 重複接続時は既存接続にclose イベントで通知後切断
- 接続切断時は自動的にユーザーをルームから削除

### ゲームロジック詳細

**ライアーズダイスルール:**

- 各プレイヤーは5個のサイコロでゲーム開始
- 1の目はワイルドカード（任意の数字として扱う）
- ベットは「場にある特定の出目の個数」を予想
- 次のベットは前のベットより高い値である必要がある
- チャレンジで実際の個数を確認、負けた方がサイコロを1個失う
- サイコロがなくなったプレイヤーは脱落
- 最後まで残ったプレイヤーが勝利

**実装されたロジック:**

- `server/lib/util.ts` - サイコロ振り、配列シャッフル
- `server/lib/nextPlayerTurn.ts` - ターン制御、ゲーム終了判定
- ベット有効性チェック（同じ出目なら個数増加、大きい出目なら同数以上）
- チャレンジ結果計算（ワイルドカード含む）
- ラウンド終了後の自動サイコロ再配布

### 制限事項

- メモリ内状態のため、サーバー再起動で状態が消失
- 単一プロセスでの動作（水平スケールに制限）
- 永続化機能なし

## 開発時の重要な注意点

### ローカルストレージの使用

- ユーザー情報は `liars-dice-user` キーでlocalStorageに保存
- 初回アクセス時に `globalThis.prompt()` でユーザー名を入力
- ユーザーIDは `${userName}@${nanoid(4)}` 形式で自動生成
- `useLocalUser()` composableで統一管理

### SSE接続のデバッグ

- ルーム詳細ページ（`/[roomId]`）にSSE接続のデバッグUI実装済み
- Network タブで EventSource の接続状態を確認可能
- ハートビート、update、close イベントの受信をリアルタイム表示
- 接続エラー時は404イベントがコンソールに表示される

### 型安全性の確保

- 厳格なTypeScript設定（`noUncheckedIndexedAccess: true`）
- 配列アクセス時は必ず `array[index]` の undefined チェックが必要
- Map/Record変換時は `replacer.ts` の使用が必須
- Zodスキーマでランタイム型チェックを実装

### メモリ管理の注意点

- サーバー再起動で全状態が消失するため開発時は注意
- 長時間動作させる場合はメモリリークの監視が必要
- SSE接続は適切にクリーンアップされるが、エラー時の処理を確認

### パフォーマンス考慮事項

- デバウンス機能により短時間での重複ブロードキャストを防止
- 大量のユーザー接続時は `Promise.all()` による並列処理でスループット向上
- フロントエンドの1秒間隔での自動更新は本番環境では調整が必要
