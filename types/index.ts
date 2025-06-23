/**
 * ユーザー情報の型定義
 */
export type User = {
  id: string;
  name: string;
};

/**
 * ルーム情報の型定義
 */
export type Room = {
  id: string;
  name: string;
  createdAt: number;
  userCount: number;
};
