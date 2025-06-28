import { processPostChallengeLogic } from '~/server/lib/gameUtils';
import { rooms } from '~/server/state/rooms';

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

  await processPostChallengeLogic(room, challenger);

  // レスポンスは空（SSEで状態更新される）
  return;
});
