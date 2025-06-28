import { nextPlayerTurn, processCpuTurn } from './nextPlayerTurn';
import { rollDice, sleep } from './util';
import type { ChallengeResult, ServerRoom, ServerUser } from '@/types';

const runtimeConfig = useRuntimeConfig();

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

/**
 * チャレンジ後の共通処理
 * @param room ルーム情報
 * @param challenger チャレンジャー情報
 */
export const processPostChallengeLogic = async (
  room: ServerRoom,
  challenger: ServerUser,
): Promise<void> => {
  const challengeResult = resolveChallenge(room, challenger);
  const bettor = room.users.get(challengeResult.raisedUserId)!;

  // チャレンジ結果をルームに保存（フロントエンドで表示するため）
  // eslint-disable-next-line no-param-reassign
  room.lastChallengeResult = challengeResult;
  // eslint-disable-next-line no-param-reassign
  room.currentBet = null;
  await sleep(runtimeConfig.public.challengeResultWaitTime);
  // eslint-disable-next-line no-param-reassign
  room.lastChallengeResult = null; // 次のターンのためにリセット

  // 新しいラウンドを開始
  if (challengeResult.success) {
    // チャレンジ成功: ベットしたプレイヤーがサイコロを失う
    bettor.dice.pop();
  } else {
    // チャレンジ失敗: チャレンジしたプレイヤーがサイコロを失う
    challenger.dice.pop();
  }

  // 全プレイヤーのサイコロを再振り
  for (const [, user] of room.users) {
    if (user !== undefined && user.dice.length > 0) {
      user.dice = rollDice(user.dice.length);
    }
  }

  // 全プレイヤーのisMyTurnをリセット
  resetPlayerTurns(room);

  // 負けたプレイヤーから次のラウンドを開始
  const loserId = challengeResult.success ? bettor.id : challenger.id;
  const loser = room.users.get(loserId)!;

  // 負けたプレイヤーから開始
  loser.isMyTurn = true;

  if (loser.dice.length > 0) {
    if (loser.isCpu === true) {
      await processCpuTurn(room, loser);
    }
  } else {
    // 負けたプレイヤーが脱落した場合、次のプレイヤーから開始
    await nextPlayerTurn(room);
  }
};
