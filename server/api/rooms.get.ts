import { replacer } from '../lib/replacer';
import type { Room } from '~/types';
import { rooms } from '~/server/state/rooms';

export default defineEventHandler(() => {
  return rooms
    .values()
    .toArray()
    .toSorted((a, b) => b.createdAt - a.createdAt)
    .map((room) => {
      return JSON.parse(JSON.stringify(room, replacer)) as Room;
    });
});
