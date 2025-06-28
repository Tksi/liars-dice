import type { ChallengeResult, ServerRoom, ServerUser } from '@/types';

/**
 * チャレンジ結果を計算
 * @param room ルーム情報
 * @param challenger チャレンジャー情報
 */
export const resolveChallenge = (
  room: ServerRoom,
  challenger: ServerUser,
): ChallengeResult => {
  if (!room.currentBet) {
    return {
      raisedUserId: '',
      challengedUserId: '',
      challengedUserName: '',
      success: false,
      actualCount: 0,
      expectedCount: 0,
      face: 0,
      allUsersDice: {},
    };
  }

  const { face, count } = room.currentBet;
  let actualCount = 0;
  const allUsersDice: Record<string, { name: string; dice: number[] }> = {};

  // 全プレイヤーのサイコロを確認し、チャレンジ時の状態を保存
  for (const [userId, user] of room.users) {
    if (user !== undefined && user.dice.length > 0) {
      // チャレンジ時のサイコロ状態を保存
      allUsersDice[userId] = {
        name: user.name,
        dice: [...user.dice],
      };

      for (const die of user.dice) {
        if (die === face || die === 1) {
          // 1はワイルドカード
          actualCount++;
        }
      }
    }
  }

  return {
    raisedUserId: room.currentBet.userId,
    challengedUserId: challenger.id,
    challengedUserName: challenger.name,
    success: actualCount < count,
    actualCount,
    expectedCount: count,
    face,
    allUsersDice,
  };
};

/**
 * 生きているプレイヤーを取得
 * @param room ルーム情報
 */
export const getAlivePlayers = (room: ServerRoom): ServerUser[] => {
  return [...room.users.values()].filter((user) => user.dice.length > 0);
};

/**
 * 生きているプレイヤーのIDリストを取得
 * @param room ルーム情報
 */
export const getAlivePlayerIds = (room: ServerRoom): string[] => {
  const userIds = [...room.users.keys()];

  return userIds.filter((playerId) => {
    const player = room.users.get(playerId);

    return Boolean(player && player.dice.length > 0);
  });
};

/**
 * 全プレイヤーのisMyTurnをfalseにリセット
 * @param room ルーム情報
 */
export const resetPlayerTurns = (room: ServerRoom): void => {
  for (const [, player] of room.users) {
    player.isMyTurn = false;
  }
};

/**
 * ゲーム状態を検証
 * @param room ルーム情報
 * @param player プレイヤー情報
 */
export const validateGameState = (
  room: ServerRoom,
  player: ServerUser,
): boolean => {
  return (
    room.gameStatus === 'playing' && player.isMyTurn && player.dice.length > 0
  );
};
