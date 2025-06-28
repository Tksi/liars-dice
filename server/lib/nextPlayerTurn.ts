import { decideCpuAction } from './cpuPlayer';
import {
  getAlivePlayerIds,
  processPostChallengeLogic,
  resetPlayerTurns,
  validateGameState,
} from './gameUtils';
import { sleep } from './util';
import type { ServerRoom, ServerUser } from '@/types';

const runtimeConfig = useRuntimeConfig();

/**
 * 次のプレイヤーのターンに移す
 * @param room ルーム情報
 */
export const nextPlayerTurn = async (room: ServerRoom) => {
  const userIds = [...room.users.keys()];
  const aliveUserIds = getAlivePlayerIds(room);

  // 生きているプレイヤーが1人以下の場合、ゲームを終了
  if (aliveUserIds.length <= 1) {
    // eslint-disable-next-line no-param-reassign
    room.gameStatus = 'finished';

    resetPlayerTurns(room);

    return;
  }

  // 現在のターンのプレイヤーを見つける
  const currentPlayerId = room.users
    .values()
    .find((player) => player.isMyTurn)?.id;

  // 現在のプレイヤーのインデックスを取得
  const currentIndex =
    currentPlayerId === undefined ? -1 : userIds.indexOf(currentPlayerId);

  resetPlayerTurns(room);

  // 次の生きているプレイヤーを見つける
  let nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % userIds.length;
  let attempts = 0;

  while (attempts < userIds.length) {
    const nextPlayerId = userIds[nextIndex];
    const nextPlayer =
      nextPlayerId === undefined ? undefined : room.users.get(nextPlayerId);

    if (nextPlayer && nextPlayer.dice.length > 0) {
      nextPlayer.isMyTurn = true;

      // CPUプレイヤーの場合、自動的に行動を実行
      if (nextPlayer.isCpu) {
        await processCpuTurn(room, nextPlayer);
      }

      break;
    }

    nextIndex = (nextIndex + 1) % userIds.length;
    attempts++;
  }
};

/**
 * CPUプレイヤーのターンを処理
 * @param room ルーム情報
 * @param cpuPlayer CPUプレイヤー情報
 */
export const processCpuTurn = async (
  room: ServerRoom,
  cpuPlayer: ServerUser,
): Promise<void> => {
  await sleep(runtimeConfig.public.cpuWaitTime);

  // ゲーム状態チェック
  if (!validateGameState(room, cpuPlayer)) {
    return;
  }

  const decision = decideCpuAction(room, cpuPlayer);

  if (decision.action === 'challenge') {
    // チャレンジ後の共通処理を実行
    await processPostChallengeLogic(room, cpuPlayer);
  } else if (decision.bet) {
    // ベット処理
    // eslint-disable-next-line no-param-reassign
    room.currentBet = {
      count: decision.bet.count,
      face: decision.bet.face,
      userId: cpuPlayer.id,
    };
    // eslint-disable-next-line no-param-reassign
    room.lastChallengeResult = null;

    // 次のプレイヤーのターンに移す
    await nextPlayerTurn(room);
  }
};
