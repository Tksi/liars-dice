import type { EventStream } from 'h3';

export type ServerUser = {
  id: string;
  stream: EventStream;
  name: string;
  isMyTurn: boolean;
  dice: number[];
};

export type ServerRoom = {
  id: string;
  name: string;
  createdAt: number;
  users: Map<string, ServerUser>;
};

export type User = Omit<ServerUser, 'stream'>;

export type Room = Omit<ServerRoom, 'users'> & {
  users: Record<string, User>;
};
