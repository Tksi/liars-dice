import type { ServerUser } from '~/types';
import { processCpuTurn } from '~/server/lib/nextPlayerTurn';
import { rollDice, shuffleArray } from '~/server/lib/util';
import { rooms } from '~/server/state/rooms';

/**
 * ゲーム開始処理
 */
export default defineEventHandler((event) => {
  const roomId = decodeURIComponent(event.context.params!.roomId!);
  const room = rooms.get(roomId);

  if (!room) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Room not found',
    });
  }

  const userIds = [...room.users.keys()];

  // 参加人数チェック
  if (userIds.length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'At least 2 players are required to start the game',
    });
  }

  // プレイヤー順序をランダムに決定してusersマップを再構築
  const shuffledUserIds = shuffleArray(userIds);
  const shuffledUsers = new Map<string, ServerUser>();

  for (const userId of shuffledUserIds) {
    const user = room.users.get(userId);

    if (user) {
      shuffledUsers.set(userId, user);
    }
  }

  // ゲーム状態を初期化
  room.gameStatus = 'playing';
  room.users = shuffledUsers;
  room.currentBet = null;

  // 各プレイヤーにサイコロを配布し、ゲーム情報を設定
  let isFirstPlayer = true;
  let firstPlayer: ServerUser | null = null;

  for (const [, user] of room.users) {
    user.dice = rollDice(5);
    user.isMyTurn = isFirstPlayer;

    if (isFirstPlayer) {
      firstPlayer = user;
    }

    isFirstPlayer = false;
  }

  room.lastChallengeResult = null;

  // 最初のプレイヤーがCPUの場合、自動的に行動を開始
  if (firstPlayer?.isCpu === true) {
    void processCpuTurn(room, firstPlayer);
  }

  // レスポンスは空（SSEで状態更新される）
  return;
});
