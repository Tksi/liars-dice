import { resetPlayerTurns, resolveChallenge } from '~/server/lib/gameUtils';
import { nextPlayerTurn, processCpuTurn } from '~/server/lib/nextPlayerTurn';
import { rollDice, sleep } from '~/server/lib/util';
import { rooms } from '~/server/state/rooms';

const runtimeConfig = useRuntimeConfig();

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
  // 最初のターン（currentBetがnull）ではチャレンジできない
  if (!room.currentBet) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No bet to challenge - must bet first on initial turn',
    });
  }

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
  const bettor = room.users.get(room.currentBet.userId)!;

  // チャレンジ結果をルームに保存（フロントエンドで表示するため）
  room.lastChallengeResult = challengeResult;
  room.currentBet = null;
  await sleep(runtimeConfig.public.challengeResultWaitTime);
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
  const loser = room.users.get(loserId);

  if (loser === undefined) {
    throw new Error('Loser not found in room users');
  }

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

  // レスポンスは空（SSEで状態更新される）
  return;
});
