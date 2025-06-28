import { nanoid } from 'nanoid';
import { z } from 'zod';
import { createCpuPlayer } from '~/server/lib/cpuPlayer';
import { zodErrorHandler } from '~/server/lib/zodErrorHandler';
import { rooms } from '~/server/state/rooms';

const addCpuSchema = z.object({
  count: z.number().min(1).max(3).optional().default(1),
});

/**
 * ルームにCPUプレイヤーを追加
 */
export default defineEventHandler(async (event) => {
  const roomId = decodeURIComponent(event.context.params!.roomId!);
  const room = rooms.get(roomId);

  if (!room) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Room not found',
    });
  }

  // ゲーム状態チェック
  if (room.gameStatus !== 'waiting') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot add CPU players after game has started',
    });
  }

  const { count } = await addCpuSchema
    .parseAsync(await readBody(event))
    .catch(zodErrorHandler);

  // 現在のプレイヤー数をチェック
  const currentPlayerCount = room.users.size;
  const maxPlayers = 6; // 最大プレイヤー数

  if (currentPlayerCount + count > maxPlayers) {
    throw createError({
      statusCode: 400,
      statusMessage: `Cannot add ${count} CPU players. Maximum ${maxPlayers} players allowed.`,
    });
  }

  // CPUプレイヤーを追加
  const cpuNames = ['CPU Alice', 'CPU Bob', 'CPU Charlie'];
  const existingCpuCount = [...room.users.values()].filter(
    (user) => user.isCpu,
  ).length;

  for (let i = 0; i < count; i++) {
    const cpuIndex = existingCpuCount + i;
    const cpuName = cpuNames[cpuIndex] ?? `CPU ${cpuIndex + 1}`;
    const cpuId = `${cpuName}@cpu${nanoid(4)}`;
    const cpuPlayer = createCpuPlayer(cpuName, cpuId);
    room.users.set(cpuId, cpuPlayer);
  }

  return {
    success: true,
    addedCount: count,
    totalPlayers: room.users.size,
  };
});
