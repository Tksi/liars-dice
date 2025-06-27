import { replacer } from '../lib/replacer';
import type { Room } from '~/types';
import { rooms } from '~/server/state/rooms';

export default defineEventHandler(() => {
  return rooms
    .values()
    .toArray()
    .filter((room) => room.gameStatus === 'waiting')
    .toReversed()
    .map((room) => {
      return JSON.parse(JSON.stringify(room, replacer)) as Room;
    });
});
