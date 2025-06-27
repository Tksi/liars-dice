<script setup lang="ts">
import type { Room } from '~/types';

/**
 * Props
 */
type Props = {
  room: Room;
};

/**
 * Events
 */
type Emits = {
  join: [roomId: string];
};

const { room } = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * ルーム表示カード
 */
defineOptions({
  name: 'RoomCard',
});

/**
 * ルームに参加
 */
const handleJoin = (): void => {
  emit('join', room.id);
};

/**
 * 日時をフォーマット
 * @param timestamp - タイムスタンプ
 */
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<template>
  <div
    class="cursor-pointer duration-200 focus-within:bg-gray-700 group hover:bg-gray-700 p-4 transition-colors"
    tabindex="0"
    @click="() => handleJoin()"
    @keydown.enter="() => handleJoin()"
  >
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <div class="flex items-center mb-1 space-x-2">
          <h4
            class="font-medium group-hover:text-indigo-400 text-gray-100 text-lg transition-colors"
          >
            {{ room.name }}
          </h4>
        </div>
        <p class="flex items-center space-x-1 text-gray-400 text-sm">
          <svg
            class="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
            />
          </svg>
          <span>{{ formatDate(room.createdAt) }}</span>
        </p>
      </div>
      <div class="flex items-center space-x-3">
        <div class="text-right">
          <div class="flex items-center space-x-1">
            <svg
              class="h-3 text-indigo-400 w-3"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span class="font-medium text-base text-gray-100">{{
              Object.keys(room.users).length
            }}</span>
          </div>
        </div>
        <div
          class="bg-gray-700 flex group-hover:bg-indigo-600 h-6 items-center justify-center rounded-full transition-colors w-6"
        >
          <svg
            class="group-hover:text-white h-3 text-gray-300 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M9 5l7 7-7 7"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
            />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>
