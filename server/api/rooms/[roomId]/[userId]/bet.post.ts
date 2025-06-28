import { z } from 'zod';
import type { GameBet } from '~/types';
import { nextPlayerTurn } from '~/server/lib/nextPlayerTurn';
import { zodErrorHandler } from '~/server/lib/zodErrorHandler';
import { rooms } from '~/server/state/rooms';

/**
 * ベットリクエストのスキーマ
 */
const betSchema = z.object({
  count: z.number().min(1),
  face: z.number().min(1).max(6),
});

/**
 * ベットが有効かチェック
 * @param currentBet 現在のベット
 * @param newCount 新しいベットの個数
 * @param newFace 新しいベットの出目
 */
const isValidBet = (
  currentBet: GameBet | null,
  newCount: number,
  newFace: number,
): boolean => {
  if (!currentBet) return true;

  // 同じ出目でより多い個数、または大きい出目で同じ以上の個数
  if (newFace === currentBet.face) {
    return newCount > currentBet.count;
  }

  return newFace > currentBet.face && newCount >= currentBet.count;
};

/**
 * ベット処理
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

  // プレイヤーの存在チェック
  const player = room.users.get(userId);

  if (!player) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Player not found',
    });
  }

  if (player.dice.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Player not alive',
    });
  }

  // ターンチェック
  if (!player.isMyTurn) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Not your turn',
    });
  }

  const { count, face } = await betSchema
    .parseAsync(await readBody(event))
    .catch(zodErrorHandler);

  // ベットの有効性チェック
  if (!isValidBet(room.currentBet, count, face)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid bet',
    });
  }

  // ベットを設定
  room.currentBet = { count, face, userId: userId };
  // チャレンジ結果を非表示
  room.lastChallengeResult = null;

  // 次のプレイヤーのターンに移す
  await nextPlayerTurn(room);

  // レスポンスは空（SSEで状態更新される）
  return;
});
