import type { ServerRoom } from '@/types';

/**
 * 次のプレイヤーのターンに移す
 * @param room ルーム情報
 */
export const nextPlayerTurn = (room: ServerRoom): void => {
  const userIds = [...room.users.keys()];
  const aliveUserIds = userIds.filter((playerId) => {
    const player = room.users.get(playerId);

    return Boolean(player && player.dice.length > 0);
  });

  // 生きているプレイヤーが1人以下の場合、ゲームを終了
  if (aliveUserIds.length <= 1) {
    // eslint-disable-next-line no-param-reassign
    room.gameStatus = 'finished';

    return;
  }

  // 現在のターンのプレイヤーを見つける
  const currentPlayerId = room.users
    .values()
    .find((player) => player.isMyTurn)?.id;

  // 現在のプレイヤーのインデックスを取得
  const currentIndex =
    currentPlayerId === undefined ? -1 : userIds.indexOf(currentPlayerId);

  // 全プレイヤーのisMyTurnをfalseに
  for (const [, player] of room.users) {
    player.isMyTurn = false;
  }

  // 次の生きているプレイヤーを見つける
  let nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % userIds.length;
  let attempts = 0;

  while (attempts < userIds.length) {
    const nextPlayerId = userIds[nextIndex];
    const nextPlayer =
      nextPlayerId === undefined ? undefined : room.users.get(nextPlayerId);

    if (nextPlayer && nextPlayer.dice.length > 0) {
      nextPlayer.isMyTurn = true;

      break;
    }

    nextIndex = (nextIndex + 1) % userIds.length;
    attempts++;
  }
};
