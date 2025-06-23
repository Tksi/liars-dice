import type { EventStream } from 'h3';

type User = {
  id: string;
  stream: EventStream;
  name: string;
};

type Room = {
  id: string;
  name: string;
  createdAt: number;
  users: Map<string, User>;
};

export const rooms = new Map<string, Room>();
