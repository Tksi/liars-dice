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

/**
 * ゲーム開始処理
 */
const startGame = async (): Promise<void> => {
  try {
    await $fetch(`/api/rooms/${roomId}/start`, {
      method: 'POST',
      body: {},
    });
  } catch (err) {
    console.error('ゲーム開始に失敗しました:', err);
  }
};

/**
 * 参加者数が2人以上かチェック
 */
const canStartGame = computed(() => {
  return room.value && Object.keys(room.value.users).length >= 2;
});

/**
 * 現在のユーザーの情報を取得
 */
const currentUser = computed(() => {
  if (
    room.value === null ||
    room.value === undefined ||
    localUser.value === null ||
    localUser.value === undefined
  )
    return null;

  return room.value.users[localUser.value.id] ?? null;
});

/**
 * ハイライト付きサイコロ表示用の関数
 * @param dice サイコロの配列
 * @param highlightFace ハイライトする出目
 */
const getDiceWithHighlight = (
  dice: number[],
  highlightFace: number,
): { value: number; isHighlighted: boolean }[] => {
  return dice.map((d) => ({
    value: d,
    isHighlighted: d === highlightFace || d === 1, // 指定の出目か1（ワイルド）をハイライト
  }));
};

/**
 * ベット処理
 * @param count ベット数
 * @param face サイコロの出目
 */
const makeBet = async (count: number, face: number): Promise<void> => {
  if (localUser.value === null) return;

  try {
    await $fetch(`/api/rooms/${roomId}/${localUser.value.id}/bet`, {
      method: 'POST',
      body: {
        count,
        face,
      },
    });
  } catch (err) {
    console.error('ベットに失敗しました:', err);
  }
};

/**
 * チャレンジ処理
 */
const makeChallenge = async (): Promise<void> => {
  if (localUser.value === null) return;

  try {
    await $fetch(`/api/rooms/${roomId}/${localUser.value.id}/challenge`, {
      method: 'POST',
    });
  } catch (err) {
    console.error('チャレンジに失敗しました:', err);
  }
};

/**
 * ベット入力用の状態
 */
const betForm = ref({ count: 1, face: 2 });
const showBetForm = ref(false);

/**
 * 有効なベットの最小値を計算
 */
const getMinBet = computed(() => {
  if (!room.value?.currentBet) {
    return { count: 1, face: 2 };
  }

  const currentBet = room.value.currentBet;

  return {
    count: currentBet.count + 1,
    face: currentBet.face,
  };
});

/**
 * チャレンジ結果モーダルの表示状態
 */
const showChallengeResult = ref(false);

/**
 * チャレンジ結果を表示
 */
const displayChallengeResult = (): void => {
  if (room.value?.lastChallengeResult) {
    showChallengeResult.value = true;
  }
};

/**
 * チャレンジ結果モーダルを閉じる
 */
const closeChallengeResult = (): void => {
  showChallengeResult.value = false;
};

/**
 * チャレンジ結果の変更を監視
 */
watch(
  () => room.value?.lastChallengeResult,
  (newResult) => {
    if (newResult) {
      displayChallengeResult();
    }
  },
);

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
      <div
        class="bg-gray-800 mb-8 p-6 rounded-lg shadow-lg"
        :style="{ viewTransitionName: 'room-name' }"
      >
        <div class="flex items-center justify-between mb-4">
          <h1 class="font-bold text-2xl text-gray-100">
            {{ room?.name }}
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

      <!-- Game Start Button -->
      <div
        v-if="room && room.gameStatus === 'waiting' && canStartGame"
        class="bg-gray-800 mb-6 p-6 rounded-lg shadow-lg text-center"
      >
        <button
          class="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-white transition-colors"
          @click="() => startGame()"
        >
          ゲーム開始
        </button>
      </div>

      <!-- Game Status -->
      <div
        v-if="room && room.gameStatus === 'playing'"
        class="bg-gray-800 mb-6 p-6 rounded-lg shadow-lg"
      >
        <!-- Current Bet Display -->
        <div v-if="room.currentBet" class="bg-gray-700 mb-4 p-4 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-200">現在の宣言</h3>
          <p class="text-gray-300">
            {{ room.currentBet.face }}の目が{{ room.currentBet.count }}個以上
          </p>
        </div>
      </div>

      <!-- Player's Dice (only when game is playing) -->
      <div
        v-if="
          room &&
          room.gameStatus === 'playing' &&
          currentUser &&
          currentUser.dice.length > 0
        "
        class="bg-gray-800 mb-6 p-6 rounded-lg shadow-lg"
      >
        <h3 class="font-bold mb-4 text-gray-100 text-lg">あなたのサイコロ</h3>
        <div class="bg-gray-700 p-4 rounded-lg text-center">
          <div class="flex font-mono gap-2 justify-center text-2xl">
            <span
              v-for="(die, index) in currentUser.dice"
              :key="index"
              class="bg-white border-2 border-gray-400 flex h-10 items-center justify-center rounded text-black w-10"
            >
              {{ die }}
            </span>
          </div>
          <p class="mt-2 text-gray-400 text-sm">
            {{ currentUser.dice.length }}個のサイコロ
          </p>
        </div>
      </div>

      <!-- Game Actions (when it's player's turn) -->
      <div
        v-if="
          room &&
          room.gameStatus === 'playing' &&
          currentUser &&
          currentUser.isMyTurn
        "
        class="bg-gray-800 mb-6 p-6 rounded-lg shadow-lg"
      >
        <h3 class="font-bold mb-4 text-gray-100 text-lg">あなたの番です</h3>

        <!-- Action Buttons -->
        <div v-if="!showBetForm" class="flex gap-4 mb-4">
          <button
            class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white transition-colors"
            @click="() => (showBetForm = true)"
          >
            レイズ
          </button>
          <button
            v-if="room.currentBet"
            class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white transition-colors"
            @click="() => makeChallenge()"
          >
            チャレンジ
          </button>
        </div>

        <!-- Bet Form -->
        <div v-if="showBetForm" class="bg-gray-700 p-4 rounded-lg">
          <h4 class="font-semibold mb-3 text-gray-200">ベットを入力</h4>

          <div class="flex gap-4 items-center mb-4">
            <div>
              <label class="block mb-1 text-gray-300 text-sm">出目</label>
              <select
                v-model="betForm.face"
                class="bg-gray-600 border border-gray-500 px-3 py-2 rounded text-white"
              >
                <option :value="2">2</option>
                <option :value="3">3</option>
                <option :value="4">4</option>
                <option :value="5">5</option>
                <option :value="6">6</option>
              </select>
            </div>

            <div>
              <label class="block mb-1 text-gray-300 text-sm">個数</label>
              <input
                v-model.number="betForm.count"
                class="bg-gray-600 border border-gray-500 px-3 py-2 rounded text-white w-20"
                :min="getMinBet.count"
                type="number"
              />
            </div>
          </div>

          <div class="flex gap-2">
            <button
              class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white transition-colors"
              @click="
                () => {
                  makeBet(betForm.count, betForm.face);
                  showBetForm = false;
                }
              "
            >
              ベット
            </button>
            <button
              class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white transition-colors"
              @click="() => (showBetForm = false)"
            >
              キャンセル
            </button>
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
            class="p-4 rounded-lg"
            :class="
              room?.gameStatus === 'playing' && !user.isConnected
                ? 'bg-gray-600 opacity-75'
                : 'bg-gray-700'
            "
            :style="{
              viewTransitionName:
                user.id === localUser.id ? 'user-name' : undefined,
            }"
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
                  <p
                    v-if="room?.gameStatus === 'playing'"
                    class="text-gray-500 text-xs"
                  >
                    サイコロ: {{ user.dice.length }}個
                  </p>
                </div>
              </div>
              <div class="flex flex-col items-end space-y-1">
                <div
                  v-if="user.isMyTurn"
                  class="bg-green-500 px-2 py-1 rounded text-sm text-white"
                >
                  手番
                </div>
                <div
                  v-if="room?.gameStatus === 'playing' && !user.isConnected"
                  class="bg-yellow-500 px-2 py-1 rounded text-black text-sm"
                >
                  接続中...
                </div>
                <div
                  v-if="
                    room?.gameStatus === 'playing' && user.dice.length === 0
                  "
                  class="bg-red-500 px-2 py-1 rounded text-sm text-white"
                >
                  脱落
                </div>
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

      <!-- Challenge Result Modal -->
      <div
        v-if="showChallengeResult && room?.lastChallengeResult"
        class="bg-black bg-opacity-50 fixed flex inset-0 items-center justify-center p-4 z-50"
        @click="() => closeChallengeResult()"
      >
        <div
          class="bg-gray-800 max-h-[90vh] max-w-4xl overflow-y-auto p-6 rounded-lg shadow-xl w-full"
          @click.stop
        >
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-bold text-2xl text-gray-100">チャレンジ結果</h2>
            <button
              class="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-white transition-colors"
              @click="() => closeChallengeResult()"
            >
              ✕
            </button>
          </div>

          <!-- Challenge Summary -->
          <div class="bg-gray-700 mb-6 p-4 rounded-lg">
            <div class="gap-4 grid grid-cols-2 mb-4">
              <div>
                <h3 class="font-semibold mb-2 text-gray-200">宣言された内容</h3>
                <p class="text-gray-300">
                  {{ room.lastChallengeResult.face }}の目が{{
                    room.lastChallengeResult.expectedCount
                  }}個以上
                </p>
              </div>
              <div>
                <h3 class="font-semibold mb-2 text-gray-200">実際の結果</h3>
                <p class="text-gray-300">
                  実際は{{ room.lastChallengeResult.actualCount }}個でした
                </p>
              </div>
            </div>
            <div
              class="font-bold text-center text-lg"
              :class="
                room.lastChallengeResult.success
                  ? 'text-green-400'
                  : 'text-red-400'
              "
            >
              {{
                room.lastChallengeResult.success
                  ? 'チャレンジ成功！'
                  : 'チャレンジ失敗！'
              }}
            </div>
          </div>

          <!-- All Players' Dice -->
          <div class="bg-gray-700 p-4 rounded-lg">
            <h3 class="font-semibold mb-4 text-gray-200">
              全プレイヤーのサイコロ
            </h3>
            <div class="gap-4 grid lg:grid-cols-3 md:grid-cols-2">
              <div
                v-for="(playerData, playerId) in room.lastChallengeResult
                  .allUsersDice"
                :key="playerId"
                class="bg-gray-600 p-3 rounded"
              >
                <h4 class="font-medium mb-2 text-gray-100">
                  {{ playerData.name }}
                </h4>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="(die, index) in getDiceWithHighlight(
                      playerData.dice,
                      room.lastChallengeResult.face,
                    )"
                    :key="index"
                    class="border flex h-8 items-center justify-center rounded text-sm w-8"
                    :class="
                      die.isHighlighted
                        ? 'bg-yellow-300 border-yellow-500 text-black font-bold'
                        : 'bg-white border-gray-400 text-black'
                    "
                  >
                    {{ die.value }}
                  </span>
                </div>
                <p class="mt-1 text-gray-400 text-xs">
                  対象:
                  {{
                    getDiceWithHighlight(
                      playerData.dice,
                      room.lastChallengeResult.face,
                    ).filter((d) => d.isHighlighted).length
                  }}個
                </p>
              </div>
            </div>
          </div>

          <div class="mt-6 text-center">
            <button
              class="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-white transition-colors"
              @click="() => closeChallengeResult()"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
