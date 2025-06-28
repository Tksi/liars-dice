import { decideCpuAction } from './cpuPlayer';
import { rollDice, sleep } from './util';
import type { ChallengeResult, ServerRoom, ServerUser } from '@/types';

const runtimeConfig = useRuntimeConfig();

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

    // 全プレイヤーのisMyTurnをfalseに
    for (const [, player] of room.users) {
      player.isMyTurn = false;
    }

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
  if (
    room.gameStatus !== 'playing' ||
    !cpuPlayer.isMyTurn ||
    cpuPlayer.dice.length === 0
  ) {
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
      for (const [, user] of room.users) {
        user.isMyTurn = false;
      }

      // 負けたプレイヤーから開始
      loser.isMyTurn = true;

      // 負けたプレイヤーがCPUの場合、再度自動実行
      if (loser.isCpu === true) {
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
