import type { EventStream } from 'h3';

/**
 * ゲームベット情報
 */
export type GameBet = {
  count: number;
  face: number;
  userId: string;
};

/**
 * ゲーム状態
 */
export type GameStatus = 'finished' | 'playing' | 'waiting';

/**
 * チャレンジ結果詳細
 */
export type ChallengeResult = {
  success: boolean;
  actualCount: number;
  expectedCount: number;
  face: number;
  allUsersDice: Record<string, { name: string; dice: number[] }>;
};

/**
 * サーバーサイドユーザー情報
 */
export type ServerUser = {
  id: string;
  stream: EventStream;
  name: string;
  isMyTurn: boolean;
  dice: number[];
  isConnected: boolean;
};

/**
 * サーバーサイドルーム情報
 */
export type ServerRoom = {
  id: string;
  name: string;
  createdAt: number;
  users: Map<string, ServerUser>;
  gameStatus: GameStatus;
  currentBet: GameBet | null;
  lastChallengeResult: ChallengeResult | null;
};

/**
 * フロントエンドユーザー情報
 */
export type User = Omit<ServerUser, 'stream'>;

/**
 * フロントエンドルーム情報
 */
export type Room = Omit<ServerRoom, 'users'> & {
  users: Record<string, User>;
};
