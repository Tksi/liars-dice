import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
import { rooms } from '../state/rooms';

export default defineEventHandler(() => {
  const roomName = uniqueNamesGenerator({
    dictionaries: [colors, animals],
    separator: ' ',
    style: 'capital',
  });

  const roomId = crypto.randomUUID();
  const room = {
    id: roomId,
    name: roomName,
    createdAt: Date.now(),
    users: new Map(),
  };

  rooms.set(roomId, room);

  return {
    id: roomId,
    name: room.name,
    createdAt: room.createdAt,
    userCount: 0,
  };
});
