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
- **Vue 3**: UIライブラリ
- **TypeScript**: 型安全性（strict設定有効）

### ディレクトリ構造

- `pages/` - ページコンポーネント（現在はindex.vueのみ）
- `server/` - サーバーサイド関連
  - `server/api/` - APIエンドポイント
  - `server/state/` - インメモリ状態管理
- `public/` - 静的ファイル

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
- idやUUIDの生成にはnanoid(8)を使用
- スタイルにはTailwind CSSを使用

## 現在の実装状況

### ✅ 実装済み機能

#### フロントエンド
- ユーザー名登録・保存（localStorage）
- ルーム一覧表示・自動更新（1秒間隔）
- ルーム作成機能
- レスポンシブデザイン（Tailwind CSS）

#### コンポーネント
- `AppBar` - アプリケーションヘッダー
- `EmptyState` - 空状態表示
- `IconButton` - アイコンボタン
- `RoomCard` - ルーム情報カード
- `UserCard` - ユーザー情報カード

#### サーバーサイド
- インメモリ状態管理（`server/state/rooms.ts`）
- `GET /api/rooms` - ルーム一覧取得
- `POST /api/rooms` - 新規ルーム作成（unique-names-generatorでランダム名生成）

### ❌ 未実装機能

- **ルーム参加**: `joinRoom`関数はTODOコメントのみ
- **SSE実装**: `GET /api/rooms/[roomId]`は基本的なストリーム作成のみ
- **ゲームロジック**: ライアーズダイスのルール実装なし
- **リアルタイム通信**: プレイヤー間の実際の通信機能なし

### ⚠️ 技術的課題

#### 依存関係の不足
ESLint設定で使用しているが、package.jsonに含まれていない依存関係：
- `@stylistic/eslint-plugin`
- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`
- `eslint-plugin-unicorn`

#### 型定義の不整合
- `/types/index.ts`の`Room`型とサーバーサイドの`Room`型が異なる
- フロントエンドとサーバーサイドで共通の型定義が必要

## サーバーサイドアーキテクチャ

### 状態管理

- **インメモリ状態**: `server/state/rooms.ts`でMap構造を使用
- **リアルタイム通信**: Server-Sent Events (SSE) 準備済み（未完成）
- **状態の型定義**: User、Room型でルーム・ユーザー情報を管理

### APIエンドポイント

- `GET /api/rooms` - ルーム一覧取得
- `POST /api/rooms` - 新規ルーム作成（unique-names-generatorでランダム名生成）
- `GET /api/rooms/[roomId]` - SSE接続準備（実装途中）

### 制限事項

- メモリ内状態のため、サーバー再起動で状態が消失
- 単一プロセスでの動作（水平スケールに制限）
- 永続化機能なし
