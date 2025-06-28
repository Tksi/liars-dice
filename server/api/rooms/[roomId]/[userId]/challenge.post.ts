import type { ChallengeResult, ServerRoom, ServerUser } from '~/types';
import { nextPlayerTurn, processCpuTurn } from '~/server/lib/nextPlayerTurn';
import { rollDice, sleep } from '~/server/lib/util';
import { rooms } from '~/server/state/rooms';

const runtimeConfig = useRuntimeConfig();

/**
 * チャレンジ結果を計算
 * @param room ルーム情報
 * @param challenger チャレンジャー情報
 */
const resolveChallenge = (
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
 * チャレンジ処理
 */
export default defineEventHandler(async (event) => {
  const roomId = decodeURIComponent(event.context.params!.roomId!);
  const userId = decodeURIComponent(event.context.params!.userId!);
  const room = rooms.get(roomId);

  if (!room) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Room not found',
    });
  }

  // ゲーム状態チェック
  if (room.gameStatus !== 'playing') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Game is not in playing state',
    });
  }

  // チャレンジできるベットがあるかチェック
  if (!room.currentBet) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No bet to challenge',
    });
  }

  // この時点でroom.currentBetはノンヌルが保証される
  const currentBet = room.currentBet;

  // プレイヤーの存在チェック
  const challenger = room.users.get(userId);

  if (!challenger) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Player not found',
    });
  }

  if (challenger.dice.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Player not alive',
    });
  }

  // ターンチェック
  if (!challenger.isMyTurn) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Not your turn',
    });
  }

  // チャレンジ結果を計算（サイコロ再振り前に実行）
  const challengeResult = resolveChallenge(room, challenger);
  // チャレンジ結果をルームに保存（フロントエンドで表示するため）
  room.lastChallengeResult = challengeResult;

  if (challengeResult.success) {
    // チャレンジ成功: ベットしたプレイヤーがサイコロを失う
    const bettor = room.users.get(currentBet.userId);

    if (bettor) {
      bettor.dice.pop();
    }
  } else {
    // チャレンジ失敗: チャレンジしたプレイヤーがサイコロを失う
    challenger.dice.pop();
  }

  // 新しいラウンドを開始
  room.currentBet = null;

  // 全プレイヤーのサイコロを再振り
  for (const [, user] of room.users) {
    if (user !== undefined && user.dice.length > 0) {
      user.dice = rollDice(user.dice.length);
    }
  }

  // 負けたプレイヤーから次のラウンドを開始
  const loserId = challengeResult.success ? currentBet.userId : userId;
  const loser = room.users.get(loserId);

  if (loser !== undefined && loser.dice.length > 0) {
    // 全プレイヤーのisMyTurnをリセット
    for (const [, user] of room.users) {
      user.isMyTurn = false;
    }

    // 負けたプレイヤーから開始
    loser.isMyTurn = true;

    if (loser.isCpu === true) {
      await sleep(runtimeConfig.public.challengeResultWaitTime);
      void processCpuTurn(room, loser);
    }
  } else {
    // 負けたプレイヤーが脱落した場合、次のプレイヤーから開始
    nextPlayerTurn(room);
  }

  // レスポンスは空（SSEで状態更新される）
  return;
});
