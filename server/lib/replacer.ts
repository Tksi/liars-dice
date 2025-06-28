/**
 * Map対応JSON.stringifyのreplacer関数
 * @param _ キー
 * @param value 値
 * @returns 値をMapからオブジェクトに変換したもの
 */
export const replacer = (_: unknown, value: unknown): unknown => {
  if (value instanceof Map) return Object.fromEntries(value);

  return value;
};
