import { createEventStream } from 'h3';
import { rooms } from '~/server/state/rooms';

/**
 * join room
 */
export default defineEventHandler(async (event) => {
  const stream = createEventStream(event);
  const roomId = event.context.params!.roomId!;
  const userId = event.context.params!.userId!;
  const room = rooms.get(roomId);

  if (room) {
    // 既存の同じuserIdのコネクションがある場合、古いコネクションを切断
    const existingUser = room.users.get(userId);

    if (existingUser) {
      await existingUser.stream.push({
        event: 'close',
        data: 'You have been disconnected due to a new connection by same userId.',
      });
      // onClosedイベントも待ってるっぽい？ので、後ろで追加されるuserが消される心配はなさそう
      await existingUser.stream.close();
    }

    const heartbeat = setInterval(() => {
      void stream.push({ event: 'heartbeat', data: '' });
    }, 10_000);

    room.users.set(userId, {
      id: userId,
      stream,
      isMyTurn: false,
      dice: [],
    });

    stream.onClosed(() => {
      clearInterval(heartbeat);
      room.users.delete(userId);
    });
  } else {
    void stream.push({
      event: '404',
      data: `Room with ID ${roomId} does not exist.`,
    });
  }

  return stream.send();
});
