import { rooms } from '../state/rooms';

export default defineEventHandler(() => {
  return rooms
    .values()
    .toArray()
    .toSorted((a, b) => b.createdAt - a.createdAt)
    .map((room) => ({
      id: room.id,
      name: room.name,
      createdAt: room.createdAt,
      userCount: room.users.size,
    }));
});
