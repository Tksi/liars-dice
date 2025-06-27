import { replacer } from '../lib/replacer';
import type { Room } from '~/types';
import { rooms } from '~/server/state/rooms';

export default defineEventHandler(() => {
  // 1日以上経ったルームを削除
  const now = Date.now();

  for (const [roomId, room] of rooms.entries()) {
    if (now - room.createdAt > 24 * 60 * 60 * 1000) {
      rooms.delete(roomId);
    }
  }

  return rooms
    .values()
    .toArray()
    .filter((room) => room.gameStatus === 'waiting')
    .toReversed()
    .map((room) => {
      return JSON.parse(JSON.stringify(room, replacer)) as Room;
    });
});
