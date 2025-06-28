<script setup lang="ts">
import type { Room } from '~/types';

useLocalUser();
const rooms = ref<Room[]>([]);
const isCreatingRoom = ref(false);

/**
 * ルーム一覧を取得
 */
const loadRooms = async (): Promise<void> => {
  try {
    rooms.value = await $fetch<Room[]>('/api/rooms');
  } catch (err) {
    console.error('ルーム一覧の取得に失敗しました:', err);
  }
};

/**
 * 新しいルームを作成
 */
const createRoom = async (): Promise<void> => {
  isCreatingRoom.value = true;

  try {
    const { id: roomId } = await $fetch('/api/rooms', {
      method: 'POST',
    });
    await joinRoom(roomId);
  } catch (err) {
    console.error('ルームの作成に失敗しました:', err);
  } finally {
    isCreatingRoom.value = false;
  }
};

/**
 * ルームに参加
 * @param roomId - ルームID
 */
const joinRoom = (roomId: string) => {
  console.info('ルーム参加:', roomId);

  return navigateTo(`/${roomId}`);
};

// コンポーネントマウント時の処理
onMounted(() => {
  void loadRooms();

  // 1秒ごとにルーム一覧を更新
  const interval = setInterval(() => {
    void loadRooms();
  }, 1000);

  onUnmounted(() => {
    clearInterval(interval);
  });
});
</script>

<template>
  <div class="bg-gray-900 min-h-screen">
    <div class="max-w-4xl mx-auto px-4 py-4">
      <!-- Header -->
      <div class="mb-5 text-center">
        <h1 class="font-bold text-4xl text-white">Liar's Dice</h1>
      </div>
      <div class="mb-6 space-y-3">
        <div class="flex gap-3 justify-center">
          <IconButton
            class="sm:w-auto w-full"
            :disabled="isCreatingRoom"
            @click="() => createRoom()"
          >
            <template #icon>
              <svg
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                />
              </svg>
            </template>
            新しいルームを作成
          </IconButton>
        </div>
      </div>

      <!-- Room List -->
      <div>
        <div class="bg-gray-800 overflow-hidden rounded-lg shadow-lg">
          <div class="bg-gray-700 border-b border-gray-600 px-4 py-3">
            <div class="flex items-center space-x-3">
              <div
                class="bg-indigo-600 flex h-6 items-center justify-center rounded-lg w-6"
              >
                <svg
                  class="h-3 text-white w-3"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  />
                </svg>
              </div>
              <h3 class="font-medium text-gray-100 text-xl">ルーム一覧</h3>
            </div>
          </div>

          <EmptyState v-if="rooms.length === 0" />

          <div
            v-if="rooms.length > 0"
            v-auto-animate
            class="divide-gray-600 divide-y"
          >
            <RoomCard
              v-for="room in rooms"
              :key="room.id"
              :room="room"
              @join="(roomId: string) => joinRoom(roomId)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
