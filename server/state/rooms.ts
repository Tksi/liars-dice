import { debounce } from 'lodash-es';
import type { EventStream } from 'h3';

type User = {
  id: string;
  stream: EventStream;
};

type Room = {
  id: string;
  name: string;
  createdAt: number;
  status: 'playing' | 'waiting';
  users: Map<string, User>;
};

// ブロードキャストのデバウンス設定
const BROADCAST_DEBOUNCE_MS = 10;

/**
 * Mapオブジェクトを変更検知できるProxyでラップする
 * @param map ラップするMapオブジェクト
 * @param onChange 変更時のコールバック関数
 * @returns Proxy化されたMapオブジェクト
 */
const createMapProxy = <K, V>(
  map: Map<K, V>,
  onChange: () => void,
): Map<K, V> => {
  return new Proxy(map, {
    get(target, property) {
      const originalMethod = target[property as keyof Map<K, V>];

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
const createRoomProxy = (room: Room, roomId: string): Room => {
  // ルーム毎にdebounce関数を作成(主に、同じuserIdが接続したときの削除、追加処理で2回発火するのを防ぐため)
  const debouncedBroadcast = debounce(() => {
    void broadcastToRoom(roomId);
  }, BROADCAST_DEBOUNCE_MS);

  // usersMapをProxy化して変更を検知
  const proxiedUsers = createMapProxy(room.users, debouncedBroadcast);

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

export const rooms = new Map<string, Room>();

/**
 * ルームに参加している全ユーザーにブロードキャストする
 * @param roomId ルームID
 */
export const broadcastToRoom = (roomId: string) => {
  const room = rooms.get(roomId);
  if (!room) return;

  return Promise.all(
    room.users
      .values()
      .toArray()
      .map((user) => {
        return user.stream.push({
          event: 'update',
          data: JSON.stringify(room, (_, value: unknown): unknown => {
            if (value instanceof Map) return Object.fromEntries(value);

            return value;
          }),
        });
      }),
  );
};

/**
 * 新しいルームを作成してmapに追加する
 * @param room 作成するRoomオブジェクト
 * @returns Proxy化されたRoomオブジェクト
 */
export const addRoom = (room: Room): Room => {
  const proxiedRoom = createRoomProxy(room, room.id);

  rooms.set(room.id, proxiedRoom);

  return proxiedRoom;
};
