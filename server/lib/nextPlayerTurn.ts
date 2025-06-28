import { decideCpuAction } from './cpuPlayer';
import {
  getAlivePlayerIds,
  resetPlayerTurns,
  resolveChallenge,
  validateGameState,
} from './gameUtils';
import { rollDice, sleep } from './util';
import type { ServerRoom, ServerUser } from '@/types';

const runtimeConfig = useRuntimeConfig();

/**
 * 次のプレイヤーのターンに移す
 * @param room ルーム情報
 */
export const nextPlayerTurn = (room: ServerRoom): void => {
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
        void processCpuTurn(room, nextPlayer);
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
    // チャレンジ処理
    if (!room.currentBet) {
      return;
    }

    const currentBet = room.currentBet;
    const challengeResult = resolveChallenge(room, cpuPlayer);

    // eslint-disable-next-line no-param-reassign
    room.lastChallengeResult = challengeResult;

    if (challengeResult.success) {
      // チャレンジ成功: ベットしたプレイヤーがサイコロを失う
      const bettor = room.users.get(currentBet.userId);

      if (bettor) {
        bettor.dice.pop();
      }
    } else {
      // チャレンジ失敗: チャレンジしたプレイヤーがサイコロを失う
      cpuPlayer.dice.pop();
    }

    // 新しいラウンドを開始
    // eslint-disable-next-line no-param-reassign
    room.currentBet = null;

    // 全プレイヤーのサイコロを再振り
    for (const [, user] of room.users) {
      if (user !== undefined && user.dice.length > 0) {
        user.dice = rollDice(user.dice.length);
      }
    }

    // 負けたプレイヤーから次のラウンドを開始
    const loserId = challengeResult.success ? currentBet.userId : cpuPlayer.id;
    const loser = room.users.get(loserId);

    if (loser !== undefined && loser.dice.length > 0) {
      // 全プレイヤーのisMyTurnをリセット
      resetPlayerTurns(room);

      // 負けたプレイヤーから開始
      loser.isMyTurn = true;

      // 負けたプレイヤーがCPUの場合、再度自動実行
      if (loser.isCpu === true) {
        await sleep(runtimeConfig.public.challengeResultWaitTime);
        void processCpuTurn(room, loser);
      }
    } else {
      // 負けたプレイヤーが脱落した場合、次のプレイヤーから開始
      nextPlayerTurn(room);
    }
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
    nextPlayerTurn(room);
  }
};
