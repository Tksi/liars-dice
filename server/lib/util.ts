/**
 * プレイヤー順序をシャッフルする関数
 * @param array プレイヤー配列
 * @returns シャッフルされたユーザーIDの配列
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }

  return result;
};

/**
 * サイコロを振る関数
 * @param count サイコロの個数
 * @returns サイコロの配列
 */
export const rollDice = (count: number): number[] => {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
};

/**
 * 指定したミリ秒だけ待機する関数
 * @param ms 待機時間（ミリ秒）
 * @returns 待機後に解決されるPromise
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
