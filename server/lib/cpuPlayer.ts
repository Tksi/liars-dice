import { getAlivePlayers, validateGameState } from './gameUtils';
import type { GameBet, ServerRoom, ServerUser } from '~/types';

/**
 * CPUプレイヤーの思考レベル設定
 */
type CpuDifficulty = 'easy' | 'hard' | 'medium';

/**
 * CPUプレイヤーの判断結果
 */
type CpuDecision = {
  action: 'bet' | 'challenge';
  bet?: { count: number; face: number };
};

/**
 * サイコロの特定の出目（1をワイルドカードとして含む）の個数を数える
 * @param dice サイコロの配列
 * @param face 対象の出目（1-6）
 */
const countDiceWithWild = (dice: number[], face: number): number => {
  return dice.filter((die) => die === face || die === 1).length;
};

/**
 * 現在のベットが実際にあるかどうかの確率を計算
 * @param currentBet 現在のベット
 * @param ownDice 自分のサイコロ
 * @param totalPlayersAlive 生きているプレイヤー数
 * @param avgDicePerPlayer プレイヤー当たりの平均サイコロ数
 */
const calculateBetProbability = (
  currentBet: GameBet,
  ownDice: number[],
  totalPlayersAlive: number,
  avgDicePerPlayer: number,
): number => {
  const ownCount = countDiceWithWild(ownDice, currentBet.face);
  const remainingNeeded = Math.max(0, currentBet.count - ownCount);

  // 他プレイヤーのサイコロ数
  const otherTotalDice = (totalPlayersAlive - 1) * avgDicePerPlayer;

  // 各サイコロが対象の出目またはワイルドカードである確率（1/3）
  const probPerDie = 1 / 3;

  // 期待値での計算（簡易版）
  const expectedOtherCount = otherTotalDice * probPerDie;

  return expectedOtherCount >= remainingNeeded ? 0.7 : 0.3;
};

/**
 * 有効な次のベットを生成
 * @param currentBet 現在のベット
 * @param ownDice 自分のサイコロ
 * @param difficulty 難易度
 */
const generateBet = (
  currentBet: GameBet | null,
  ownDice: number[],
  difficulty: CpuDifficulty,
): { count: number; face: number } => {
  // 自分のサイコロ分析
  const diceCounts = new Array(7).fill(0) as number[];

  for (const die of ownDice) {
    if (diceCounts[die] !== undefined) {
      diceCounts[die]++;
    }
  }

  // 最も多い出目を探す（ワイルドカード含む）
  let bestFace = 2;
  let bestCount = 0;

  for (let face = 2; face <= 6; face++) {
    const count = countDiceWithWild(ownDice, face);

    if (count > bestCount) {
      bestCount = count;
      bestFace = face;
    }
  }

  if (!currentBet) {
    // 最初のベット
    const conservativeCount =
      difficulty === 'easy'
        ? Math.max(1, bestCount)
        : difficulty === 'medium'
          ? Math.max(1, bestCount + 1)
          : Math.max(2, bestCount + 2);

    return { count: conservativeCount, face: bestFace };
  }

  // 現在のベットより高いベットを生成
  const options: { count: number; face: number }[] = [];

  // 同じ出目でより多い個数
  if (currentBet.face <= 6) {
    for (
      let count = currentBet.count + 1;
      count <= currentBet.count + 3;
      count++
    ) {
      options.push({ count, face: currentBet.face });
    }
  }

  // より大きい出目で同じ以上の個数
  for (let face = currentBet.face + 1; face <= 6; face++) {
    for (let count = currentBet.count; count <= currentBet.count + 2; count++) {
      options.push({ count, face });
    }
  }

  if (options.length === 0) {
    // フォールバック
    return { count: currentBet.count + 1, face: currentBet.face };
  }

  // 難易度に応じて選択
  if (difficulty === 'easy') {
    // 最も控えめなベット
    return options[0]!;
  } else if (difficulty === 'medium') {
    // 中間のベット
    const midIndex = Math.floor(options.length / 2);

    return options[midIndex]!;
  } else {
    // より攻撃的なベット
    const randomIndex = Math.floor(Math.random() * Math.min(3, options.length));

    return options[randomIndex]!;
  }
};

/**
 * CPUプレイヤーの行動を決定
 * @param room ルーム情報
 * @param cpuPlayer CPUプレイヤー情報
 * @param difficulty 難易度（デフォルト: medium）
 */
export const decideCpuAction = (
  room: ServerRoom,
  cpuPlayer: ServerUser,
  difficulty: CpuDifficulty = 'medium',
): CpuDecision => {
  // ゲーム状態チェック
  if (!validateGameState(room, cpuPlayer)) {
    return { action: 'bet', bet: { count: 1, face: 2 } };
  }

  // 最初のベットの場合（currentBetがnull、またはundefined）
  // この場合は必ずベットしなければならない
  if (!room.currentBet) {
    const bet = generateBet(null, cpuPlayer.dice, difficulty);

    return { action: 'bet', bet };
  }

  // 生きているプレイヤー数と平均サイコロ数を計算
  const alivePlayers = getAlivePlayers(room);
  const totalDice = alivePlayers.reduce(
    (sum, user) => sum + user.dice.length,
    0,
  );
  const avgDicePerPlayer = totalDice / alivePlayers.length;

  // 現在のベットの確率を計算
  const probability = calculateBetProbability(
    room.currentBet,
    cpuPlayer.dice,
    alivePlayers.length,
    avgDicePerPlayer,
  );

  // 難易度に応じたチャレンジ閾値
  const challengeThreshold =
    difficulty === 'easy' ? 0.2 : difficulty === 'medium' ? 0.4 : 0.6;

  // ランダム要素を追加
  const randomFactor = Math.random();
  const adjustedProbability = probability + (randomFactor - 0.5) * 0.2;

  if (adjustedProbability < challengeThreshold) {
    return { action: 'challenge' };
  } else {
    const bet = generateBet(room.currentBet, cpuPlayer.dice, difficulty);

    return { action: 'bet', bet };
  }
};

/**
 * CPUプレイヤーを作成
 * @param name CPUプレイヤーの名前
 * @param id CPUプレイヤーのID
 */
export const createCpuPlayer = (name: string, id: string): ServerUser => {
  // CPUプレイヤー用のダミーストリーム
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const dummyStream = {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    push: () => {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    close: () => {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onClosed: () => {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  return {
    id,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    stream: dummyStream,
    name,
    isMyTurn: false,
    dice: [],
    isConnected: true,
    isCpu: true,
  };
};
