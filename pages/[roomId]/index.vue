<script setup lang="ts">
import type { Room } from '~/types';

const route = useRoute('roomId');
const roomId = route.params.roomId;
const room = ref<Room | null>(null);

const { localUser } = useLocalUser();
const connectionStatus = ref<
  'connected' | 'connecting' | 'disconnected' | 'error'
>('connecting');
const eventSource = ref<EventSource | null>(null);

/**
 * EventSourceでSSE接続を開始
 */
const connectToRoom = (): void => {
  const url = `/api/rooms/${roomId}/${localUser.value.id}`;

  eventSource.value = new EventSource(url);

  eventSource.value.addEventListener('open', () => {
    connectionStatus.value = 'connected';
    console.info(`[${new Date().toLocaleTimeString()}] 接続が確立されました`);
  });

  eventSource.value.addEventListener('error', () => {
    connectionStatus.value = 'error';
    console.error(
      `[${new Date().toLocaleTimeString()}] 接続エラーが発生しました`,
    );
  });

  eventSource.value.addEventListener('close', () => {
    connectionStatus.value = 'disconnected';
    console.info(`[${new Date().toLocaleTimeString()}] 接続が切断されました`);
    disconnect();
    void navigateTo('/');
  });

  eventSource.value.addEventListener('heartbeat', () => {
    console.debug(
      `[${new Date().toLocaleTimeString()}] ハートビートを受信しました`,
    );
  });

  eventSource.value.addEventListener('404', () => {
    void navigateTo('/');
  });

  eventSource.value.addEventListener('update', (event: { data: string }) => {
    const timestamp = new Date().toLocaleTimeString();
    console.info(`[${timestamp}] メッセージを受信: ${event.data}`);

    try {
      const data = JSON.parse(event.data) as Room;
      room.value = data;
      console.info(`[${timestamp}] パース済みデータ:`, data);
    } catch {
      console.error(`[${timestamp}] JSON パースに失敗しました`);
    }
  });
};

/**
 * SSE接続を切断
 */
const disconnect = (): void => {
  if (eventSource.value) {
    eventSource.value.close();
    eventSource.value = null;
    connectionStatus.value = 'disconnected';
    console.info(`[${new Date().toLocaleTimeString()}] 接続を切断しました`);
  }
};

onMounted(() => {
  connectToRoom();
});

onUnmounted(() => {
  disconnect();
});
</script>

<template>
  <div class="bg-gray-900 min-h-screen">
    <AppBar />

    <div class="container mx-auto px-4 py-8">
      <!-- Room Header -->
      <div class="bg-gray-800 mb-8 p-6 rounded-lg shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <h1 class="font-bold text-2xl text-gray-100">
            ルーム: {{ room?.name }}
          </h1>
          <NuxtLink
            class="bg-gray-700 hover:bg-gray-600 hover:text-white px-4 py-2 rounded-lg text-gray-300 transition-colors"
            to="/"
          >
            ← ルーム一覧に戻る
          </NuxtLink>
        </div>

        <div class="flex items-center space-x-4 text-sm">
          <div class="flex items-center space-x-2">
            <div
              class="h-3 rounded-full w-3"
              :class="{
                'bg-yellow-500': connectionStatus === 'connecting',
                'bg-green-500': connectionStatus === 'connected',
                'bg-red-500':
                  connectionStatus === 'error' ||
                  connectionStatus === 'disconnected',
              }"
            />
            <span class="text-gray-300">
              {{
                connectionStatus === 'connecting'
                  ? '接続中...'
                  : connectionStatus === 'connected'
                    ? '接続済み'
                    : connectionStatus === 'error'
                      ? 'エラー'
                      : '切断済み'
              }}
            </span>
          </div>

          <div v-if="localUser" class="text-gray-400">
            プレイヤー: {{ localUser.name }}
          </div>
        </div>
      </div>

      <!-- Users List -->
      <div
        v-if="room && Object.keys(room.users).length > 0"
        class="bg-gray-800 p-6 rounded-lg shadow-lg"
      >
        <h2 class="font-bold mb-4 text-gray-100 text-xl">
          参加者 ({{ Object.keys(room.users).length }}人)
        </h2>
        <div v-auto-animate class="gap-4 grid lg:grid-cols-3 md:grid-cols-2">
          <div
            v-for="user in Object.values(room.users)"
            :key="user.id"
            class="bg-gray-700 p-4 rounded-lg"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div
                  class="bg-blue-500 flex h-10 items-center justify-center rounded-full text-white w-10"
                >
                  {{ user.name.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <p class="font-medium text-gray-100">{{ user.name }}</p>
                  <p class="text-gray-400 text-sm">
                    {{ user.id === localUser.id ? 'あなた' : 'プレイヤー' }}
                  </p>
                </div>
              </div>
              <div
                v-if="user.isMyTurn"
                class="bg-green-500 px-2 py-1 rounded text-sm text-white"
              >
                手番
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="room && Object.keys(room.users).length === 0"
        class="bg-gray-800 p-6 rounded-lg shadow-lg"
      >
        <div class="text-center">
          <p class="text-gray-300">まだ参加者がいません</p>
          <p class="text-gray-500 text-sm">
            他のプレイヤーが参加するまでお待ちください
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
