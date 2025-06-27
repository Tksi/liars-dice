import { debounce } from 'lodash-es';
import { replacer } from '../lib/replacer';
import type { ServerRoom, ServerUser } from '~/types';
// ブロードキャストのデバウンス設定
const BROADCAST_DEBOUNCE_MS = 10;

/**
 * ServerUserオブジェクトを変更検知できるProxyでラップする
 * @param user ラップするServerUserオブジェクト
 * @param onChange 変更時のコールバック関数
 * @returns Proxy化されたServerUserオブジェクト
 */
const createUserProxy = (
  user: ServerUser,
  onChange: () => void,
): ServerUser => {
  return new Proxy(user, {
    set(target, property, value) {
      const result = Reflect.set(target, property, value);

      // プロパティが正常に設定された場合のみデバウンスされたブロードキャスト
      if (result) {
        onChange();
      }

      return result;
    },
  });
};

/**
 * ユーザーMapを変更検知できるProxyでラップする
 * @param map ラップするMap<string, ServerUser>オブジェクト
 * @param onChange 変更時のコールバック関数
 * @returns Proxy化されたMap<string, ServerUser>オブジェクト
 */
const createUserMapProxy = (
  map: Map<string, ServerUser>,
  onChange: () => void,
): Map<string, ServerUser> => {
  return new Proxy(map, {
    get(target, property) {
      const originalMethod = target[property as keyof Map<string, ServerUser>];

      // 関数の場合はbindでthisコンテキストを修正
      if (typeof originalMethod === 'function') {
        // 変更系のメソッドにonChangeを追加
        if (
          property === 'set' ||
          property === 'delete' ||
          property === 'clear'
        ) {
          return (...args: unknown[]) => {
            const result = (
              originalMethod as (...args: unknown[]) => unknown
            ).apply(target, args);

            // setメソッドの場合、値もプロキシ化する
            if (property === 'set' && args.length >= 2) {
              const userId = args[0] as string;
              const user = args[1] as ServerUser;
              const proxiedUser = createUserProxy(user, onChange);
              target.set(userId, proxiedUser);
            }

            onChange();

            return result;
          };
        }

        // その他のメソッドはbindでthisを修正
        return (originalMethod as (...args: unknown[]) => unknown).bind(target);
      }

      return originalMethod;
    },
  });
};

/**
 * Roomオブジェクトを自動ブロードキャスト機能付きProxyでラップする
 * @param room ラップするRoomオブジェクト
 * @param roomId ルームID
 * @returns Proxy化されたRoomオブジェクト
 */
const createRoomProxy = (room: ServerRoom, roomId: string): ServerRoom => {
  // ルーム毎にdebounce関数を作成
  const debouncedBroadcast = debounce(() => {
    void broadcastToRoom(roomId);
  }, BROADCAST_DEBOUNCE_MS);

  // 既存のユーザーをプロキシ化
  for (const [userId, user] of room.users) {
    const proxiedUser = createUserProxy(user, debouncedBroadcast);
    room.users.set(userId, proxiedUser);
  }

  // usersMapをProxy化して変更を検知
  const proxiedUsers = createUserMapProxy(room.users, debouncedBroadcast);

  return new Proxy(
    { ...room, users: proxiedUsers },
    {
      set(target, property, value) {
        const result = Reflect.set(target, property, value);

        // プロパティが正常に設定された場合のみデバウンスされたブロードキャスト
        if (result) {
          debouncedBroadcast();
        }

        return result;
      },
    },
  );
};

export const rooms = new Map<string, ServerRoom>();

/**
 * ルームに参加している全ユーザーにブロードキャストする
 * @param roomId ルームID
 */
const broadcastToRoom = (roomId: string) => {
  const room = rooms.get(roomId);
  if (!room) return;

  return Promise.all(
    room.users
      .values()
      .toArray()
      .map((user) => {
        return user.stream.push({
          event: 'update',
          data: JSON.stringify(room, replacer),
        });
      }),
  );
};

/**
 * 新しいルームを作成してmapに追加する
 * @param room 作成するRoomオブジェクト
 * @returns Proxy化されたRoomオブジェクト
 */
export const addRoom = (room: ServerRoom): ServerRoom => {
  const proxiedRoom = createRoomProxy(room, room.id);

  rooms.set(room.id, proxiedRoom);

  return proxiedRoom;
};
