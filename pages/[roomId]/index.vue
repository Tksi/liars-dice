<script setup lang="ts">
const route = useRoute('roomId');
const roomId = route.params.roomId;

const { user } = useUser();
const connectionStatus = ref<
  'connected' | 'connecting' | 'disconnected' | 'error'
>('connecting');
const eventSource = ref<EventSource | null>(null);
const messages = ref<string[]>([]);

/**
 * EventSourceでSSE接続を開始
 */
const connectToRoom = (): void => {
  if (!user.value) return;

  const url = `/api/rooms/${roomId}/${user.value.id}`;

  eventSource.value = new EventSource(url);

  eventSource.value.addEventListener('open', () => {
    connectionStatus.value = 'connected';
    messages.value.push(
      `[${new Date().toLocaleTimeString()}] 接続が確立されました`,
    );
  });

  eventSource.value.addEventListener('error', () => {
    connectionStatus.value = 'error';
    messages.value.push(
      `[${new Date().toLocaleTimeString()}] 接続エラーが発生しました`,
    );
  });

  eventSource.value.addEventListener('close', () => {
    connectionStatus.value = 'disconnected';
    messages.value.push(
      `[${new Date().toLocaleTimeString()}] 接続が切断されました`,
    );
    disconnect();
  });

  eventSource.value.addEventListener('heartbeat', () => {
    messages.value.push(
      `[${new Date().toLocaleTimeString()}] ハートビートを受信しました`,
    );
  });

  eventSource.value.addEventListener('update', (event: { data: string }) => {
    const timestamp = new Date().toLocaleTimeString();
    messages.value.push(`[${timestamp}] メッセージを受信: ${event.data}`);

    try {
      const data = JSON.parse(event.data) as Record<string, unknown>;
      messages.value.push(
        `[${timestamp}] パース済みデータ: ${JSON.stringify(data, null, 2)}`,
      );
    } catch {
      messages.value.push(`[${timestamp}] JSON パースに失敗しました`);
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
    messages.value.push(
      `[${new Date().toLocaleTimeString()}] 接続を切断しました`,
    );
  }
};

/**
 * メッセージをクリア
 */
const clearMessages = (): void => {
  messages.value = [];
};

onMounted(() => {
  if (user.value) {
    connectToRoom();
  }
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
          <h1 class="font-bold text-2xl text-gray-100">ルーム: {{ roomId }}</h1>
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

          <div v-if="user" class="text-gray-400">
            プレイヤー: {{ user.name }}
          </div>
        </div>
      </div>

      <!-- Debug Panel -->
      <div class="bg-gray-800 overflow-hidden rounded-lg shadow-lg">
        <div class="bg-gray-700 border-b border-gray-600 px-6 py-4">
          <div class="flex items-center justify-between">
            <h2 class="font-medium text-gray-100 text-lg">
              デバッグコンソール
            </h2>
            <div class="flex space-x-2">
              <button
                class="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm text-white transition-colors"
                @click="() => clearMessages()"
              >
                クリア
              </button>
              <button
                v-if="
                  connectionStatus === 'disconnected' ||
                  connectionStatus === 'error'
                "
                class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm text-white transition-colors"
                @click="() => connectToRoom()"
              >
                再接続
              </button>
              <button
                v-if="connectionStatus === 'connected'"
                class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm text-white transition-colors"
                @click="() => disconnect()"
              >
                切断
              </button>
            </div>
          </div>
        </div>

        <div class="p-6">
          <div
            v-if="messages.length === 0"
            class="py-8 text-center text-gray-500"
          >
            まだメッセージがありません
          </div>

          <div
            v-else
            class="bg-gray-900 font-mono max-h-96 overflow-y-auto p-4 rounded-lg text-sm"
          >
            <div
              v-for="(message, index) in messages"
              :key="index"
              class="mb-2 text-gray-300 whitespace-pre-wrap"
            >
              {{ message }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
