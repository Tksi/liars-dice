import type { ZodError } from 'zod';

/**
 * zodエラーハンドラ
 * @param err Zodエラーオブジェクト
 */
export const zodErrorHandler = (err: ZodError) => {
  console.error(err);

  throw createError({
    statusCode: 422,
    message: err.message,
  });
};
