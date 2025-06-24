<script setup lang="ts">
import type { Room } from '~/types';

const { user } = useUser();
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
    const { id: roomId } = await $fetch('/api/rooms', { method: 'POST' });
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
    <AppBar />

    <div class="container mx-auto px-4 py-8">
      <!-- Hero Section -->
      <div class="bg-gray-800 mb-8 p-8 rounded-lg shadow-lg text-center">
        <div class="mb-6">
          <div
            class="bg-indigo-900 flex h-16 items-center justify-center mb-4 mx-auto rounded-full w-16"
          >
            <svg
              class="h-8 text-indigo-300 w-8"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"
              />
            </svg>
          </div>
          <h2 class="font-medium mb-2 text-3xl text-gray-100">
            心理戦が熱い、究極のブラフゲーム
          </h2>
          <p class="text-gray-300">プレイヤー同士の駆け引きを楽しもう</p>
        </div>
      </div>

      <UserCard v-if="user" :user="user" />

      <div class="max-w-4xl mb-8 mx-auto">
        <IconButton
          class="block mx-auto sm:w-auto w-full"
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

      <!-- Room List -->
      <div class="max-w-4xl mx-auto">
        <div class="bg-gray-800 overflow-hidden rounded-lg shadow-lg">
          <div class="bg-gray-700 border-b border-gray-600 px-6 py-4">
            <div class="flex items-center space-x-3">
              <div
                class="bg-indigo-600 flex h-8 items-center justify-center rounded-lg w-8"
              >
                <svg
                  class="h-4 text-white w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  />
                </svg>
              </div>
              <h3 class="font-medium text-gray-100 text-lg">ルーム一覧</h3>
            </div>
          </div>

          <EmptyState
            v-if="rooms.length === 0"
            description="新しいルームを作成してゲームを始めましょう！"
            title="まだルームがありません"
          />

          <div v-if="rooms.length > 0" class="divide-gray-600 divide-y">
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
