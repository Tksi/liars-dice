import { nanoid } from 'nanoid';
import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
import { addRoom } from '~/server/state/rooms';

export default defineEventHandler(() => {
  const roomName = uniqueNamesGenerator({
    dictionaries: [colors, animals],
    separator: '-',
    style: 'capital',
  });

  const room = {
    id: `${roomName}@${nanoid(4)}`,
    name: roomName,
    createdAt: Date.now(),
    status: 'waiting' as const,
    users: new Map(),
  };

  addRoom(room);

  return {
    id: room.id,
    name: room.name,
    createdAt: room.createdAt,
    userCount: 0,
  };
});
