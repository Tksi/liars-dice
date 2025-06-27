import { createEventStream } from 'h3';
import { rooms } from '~/server/state/rooms';

/**
 * join room
 */
export default defineEventHandler(async (event) => {
  const stream = createEventStream(event);

  const roomId = decodeURIComponent(event.context.params!.roomId!);
  const userId = decodeURIComponent(event.context.params!.userId!);
  const room = rooms.get(roomId);

  if (room == null) {
    void stream.push({
      event: '404',
      data: `Room with ID ${roomId} does not exist.`,
    });

    return stream.send();
  }

  const existingUser = room.users.get(userId);

  if (existingUser) {
    // 古いコネクションはを切断
    await existingUser.stream.push({
      event: 'close',
      data: 'You have been disconnected due to a new connection by same userId.',
    });
    // onClosedイベントの終了を待つ
    await existingUser.stream.close();

    // 新規ストリームを登録
    if (room.gameStatus !== 'waiting') {
      existingUser.stream = stream;
      existingUser.isConnected = true;
    }
  }

  if (room.gameStatus === 'waiting') {
    // 新規ユーザーとして追加
    room.users.set(userId, {
      id: decodeURIComponent(userId),
      name: userId.slice(0, userId.lastIndexOf('@')),
      stream,
      isMyTurn: false,
      dice: [],
      isConnected: true,
    });
  } else {
    if (existingUser == null) {
      // ゲーム中に参加する場合は、ユーザーを登録しない
      void stream.push({
        event: 'close',
        data: 'You cannot join a game in progress with a new connection.',
      });
    }
  }

  const heartbeat = setInterval(() => {
    void stream.push({ event: 'heartbeat', data: '' });
  }, 10_000);

  stream.onClosed(() => {
    clearInterval(heartbeat);
    const user = room.users.get(userId);

    if (user) {
      if (room.gameStatus === 'waiting') {
        // 待機中の場合は削除
        room.users.delete(userId);
      } else {
        // ゲーム中の場合は切断状態にマークするだけ
        user.isConnected = false;
      }
    }
  });

  return stream.send();
});
