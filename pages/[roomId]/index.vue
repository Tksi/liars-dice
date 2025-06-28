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
      betForm.value = {
        count: data.currentBet?.count ?? 1,
        face: data.currentBet?.face ?? 2,
      };
      showBetForm.value = false;
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
 * ダウト処理
 */
const makeChallenge = async (): Promise<void> => {
  if (localUser.value === null) return;

  try {
    await $fetch(`/api/rooms/${roomId}/${localUser.value.id}/challenge`, {
      method: 'POST',
    });
  } catch (err) {
    console.error('ダウトに失敗しました:', err);
  }
};

/**
 * ベット入力用の状態
 */
const betForm = ref({ count: 1, face: 2 });
const showBetForm = ref(false);

/**
 * ベットが有効かどうかをチェック
 */
const isBetValid = computed(() => {
  if (!room.value?.currentBet) {
    return betForm.value.count >= 1 && betForm.value.face >= 2;
  }

  const currentBet = room.value.currentBet;
  const bet = betForm.value;

  // 同じ出目の場合は個数を増やす必要がある
  if (bet.face === currentBet.face) {
    return bet.count > currentBet.count;
  }

  // より大きい出目の場合は同じ個数以上
  if (bet.face > currentBet.face) {
    return bet.count >= currentBet.count;
  }

  // より小さい出目は無効
  return false;
});

/**
 * 全プレイヤーのサイコロ表示状態管理
 */
const showAllDice = ref(false);
const maskTimer = ref<NodeJS.Timeout | null>(null);

/**
 * 全プレイヤーのサイコロマスクを一時的に解除
 */
const showAllDiceTemporarily = (): void => {
  showAllDice.value = true;

  // 既存のタイマーをクリア
  if (maskTimer.value) {
    clearTimeout(maskTimer.value);
  }

  // 5秒後にマスク復帰
  maskTimer.value = setTimeout(() => {
    showAllDice.value = false;
    maskTimer.value = null;
  }, 7500);
};

/**
 * ダウト結果の変更を監視
 */
watch(
  () => room.value?.lastChallengeResult,
  (newResult) => {
    if (newResult) {
      showAllDiceTemporarily();
    }
  },
);

onMounted(() => {
  connectToRoom();
});

onUnmounted(() => {
  disconnect();

  // タイマーのクリーンアップ
  if (maskTimer.value) {
    clearTimeout(maskTimer.value);
  }
});
</script>

<template>
  <div class="bg-gray-900 min-h-screen">
    <div v-auto-animate class="max-w-7xl mx-auto px-4 py-6">
      <!-- Header with Room Name and Back Button -->
      <div class="flex h-8 items-center justify-between mb-4">
        <button
          v-if="room && room.gameStatus !== 'playing' && !showAllDice"
          class="bg-gray-700 font-bold hover:bg-gray-600 px-3 py-2 rounded-lg text-gray-200 text-sm transition-colors w-10"
          @click="() => navigateTo('/')"
        >
          ◀
        </button>
        <div v-else class="w-10"></div>
        <!-- Spacer when back button is hidden -->
        <h1 v-if="room" class="font-bold text-gray-100 text-xl">
          {{ room.name }}
        </h1>
        <div class="w-10"></div>
        <!-- Spacer for centering -->
      </div>
      <!-- Waiting State - Participants List -->
      <div
        v-if="room && room.gameStatus === 'waiting'"
        v-auto-animate
        class="bg-gray-800 mb-4 p-4 rounded-lg"
      >
        <div class="gap-3 grid lg:grid-cols-3 md:grid-cols-2">
          <div
            v-for="user in Object.values(room.users)"
            :key="user.id"
            class="bg-gray-700 border border-gray-600 p-3 rounded-lg"
            :class="{ 'opacity-75': !user.isConnected }"
          >
            <div class="flex items-center space-x-2">
              <div>
                <p class="font-medium text-gray-100 text-lg">
                  {{ user.name }}
                  <span
                    v-if="user.id === localUser.id"
                    class="text-base text-gray-400"
                    >(あなた)</span
                  >
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Game Start Button -->
        <div v-if="canStartGame" class="mt-4 text-center">
          <button
            class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-lg text-white transition-colors"
            @click="() => startGame()"
          >
            開始
          </button>
        </div>
      </div>

      <!-- All Players' Dice (only when game is playing) -->
      <div v-if="room && room.gameStatus !== 'waiting'" class="mb-4">
        <div class="gap-3 grid md:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="user in Object.values(room.users)"
            :key="user.id"
            class="bg-gray-700 border-2 p-2 rounded-lg"
            :class="{
              'opacity-50': !user.isConnected,
              'border-green-400': !showAllDice && user.isMyTurn,
              'border-gray-600': !showAllDice && !user.isMyTurn,
              'border-blue-500':
                showAllDice &&
                room.lastChallengeResult?.challengedUserId === user.id,
            }"
          >
            <div class="flex h-8 justify-between mb-2 px-1">
              <p class="font-medium text-base text-gray-100">
                {{ user.name }}
                <span
                  v-if="user.id === localUser.id"
                  class="text-gray-400 text-sm"
                  >(あなた)</span
                >
              </p>

              <!-- Current Bet Display for the user who made the bet -->
              <div
                v-if="room.currentBet?.userId === user.id"
                class="bg-blue-600 font-bold px-2 py-1 rounded text-base text-white"
              >
                {{ room.currentBet.face }}が{{ room.currentBet.count }}個以上
              </div>

              <div
                v-else-if="
                  showAllDice === true &&
                  room.lastChallengeResult?.raisedUserId === user.id
                "
                class="bg-blue-600 font-bold px-2 py-1 rounded text-base text-white"
              >
                {{ room.lastChallengeResult.face }}が{{
                  room.lastChallengeResult.expectedCount
                }}個以上({{ room.lastChallengeResult.actualCount }})
              </div>
            </div>

            <!-- Dice Display -->
            <div
              v-if="
                ((showAllDice &&
                room?.lastChallengeResult?.allUsersDice?.[user.id]
                  ? room?.lastChallengeResult.allUsersDice[user.id]?.dice
                  : user.dice
                )?.length ?? 0) > 0
              "
              class="text-center"
            >
              <div
                v-auto-animate
                class="flex flex-wrap font-mono gap-1 justify-center mb-2 text-2xl"
              >
                <span
                  v-for="(die, index) in showAllDice &&
                  room?.lastChallengeResult?.allUsersDice?.[user.id]
                    ? room?.lastChallengeResult.allUsersDice[user.id]?.dice
                    : user.dice"
                  :key="index"
                  class="border-2 flex font-bold h-12 items-center justify-center rounded text-3xl w-12"
                  :class="
                    user.id === localUser.id || showAllDice
                      ? [
                          'text-black',
                          showAllDice &&
                          room?.lastChallengeResult &&
                          (die === room?.lastChallengeResult?.face || die === 1)
                            ? 'bg-yellow-300 border-yellow-500 font-bold'
                            : 'bg-white border-gray-400',
                        ]
                      : 'bg-gray-500 border-gray-600 text-gray-300'
                  "
                >
                  {{
                    user.id === localUser.id || showAllDice
                      ? die === 1
                        ? '*'
                        : die
                      : '?'
                  }}
                </span>
              </div>
            </div>

            <!-- No Dice (Eliminated) -->
            <div v-else class="text-center">
              <div class="bg-red-500 font-bold px-4 py-2 rounded text-white">
                脱落
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Challenge Result Summary -->
      <div
        v-if="showAllDice && room?.lastChallengeResult"
        class="bg-gray-800 mb-4 p-3 rounded-lg"
      >
        <div
          class="font-bold text-center text-xl"
          :class="
            room?.lastChallengeResult?.success
              ? room.lastChallengeResult.raisedUserId === localUser.id
                ? 'text-red-400'
                : 'text-green-400'
              : room.lastChallengeResult.raisedUserId === localUser.id
                ? 'text-green-400'
                : 'text-red-400'
          "
        >
          {{
            `${room.lastChallengeResult.challengedUserId === localUser.id ? '' : room.lastChallengeResult.challengedUserName + 'の'}ダウト${room.lastChallengeResult.success ? '成功！' : '失敗！'}`
          }}
        </div>
      </div>

      <!-- Game Actions (when it's player's turn) -->
      <div
        v-if="
          room &&
          room.gameStatus === 'playing' &&
          currentUser &&
          currentUser.isMyTurn &&
          !showAllDice
        "
        class="bg-gray-800 flex justify-center mb-4 p-4 rounded-lg"
      >
        <!-- Action Buttons -->
        <div v-if="!showBetForm" class="flex gap-4">
          <button
            class="bg-blue-600 font-bold hover:bg-blue-700 px-4 py-2 rounded-lg text-lg text-white transition-colors"
            @click="() => (showBetForm = true)"
          >
            レイズ
          </button>
          <button
            v-if="room.currentBet"
            class="bg-red-600 font-bold hover:bg-red-700 px-4 py-2 rounded-lg text-lg text-white transition-colors"
            @click="() => makeChallenge()"
          >
            ダウト
          </button>
        </div>

        <!-- Bet Form -->
        <div v-if="showBetForm">
          <div class="flex gap-2 items-center">
            <select
              v-model="betForm.face"
              class="bg-gray-600 border border-gray-500 px-3 py-2 rounded text-base text-white"
            >
              <template v-for="face in 6">
                <option
                  v-if="face >= (room.currentBet?.face ?? 2)"
                  :key="face"
                  :value="face"
                >
                  {{ face }}
                </option>
              </template>
            </select>

            <span class="text-gray-200 text-lg">が</span>
            <div class="flex items-center">
              <button
                class="bg-gray-600 border border-gray-500 font-bold hover:bg-gray-500 px-3 py-2 rounded-l text-white"
                :disabled="betForm.count <= 1"
                @click="() => (betForm.count = Math.max(1, betForm.count - 1))"
              >
                -
              </button>
              <p
                class="bg-gray-600 border-gray-500 border-y px-2 py-2 text-base text-center text-white w-10"
              >
                {{ betForm.count }}
              </p>
              <button
                class="bg-gray-600 border border-gray-500 font-bold hover:bg-gray-500 px-2 py-2 rounded-r text-white"
                @click="() => (betForm.count = betForm.count + 1)"
              >
                +
              </button>
            </div>
            <span class="text-gray-200 text-lg">個以上</span>
          </div>

          <div class="flex gap-3 justify-center mt-3">
            <button
              class="font-bold px-4 py-2 rounded text-lg text-white transition-colors"
              :class="{
                'bg-blue-600 hover:bg-blue-700': isBetValid,
                'bg-gray-500 cursor-not-allowed': !isBetValid,
              }"
              :disabled="!isBetValid"
              @click="
                () => {
                  makeBet(betForm.count, betForm.face);
                }
              "
            >
              ベット
            </button>
            <button
              class="bg-gray-600 font-bold hover:bg-gray-700 px-4 py-2 rounded text-lg text-white transition-colors"
              @click="() => (showBetForm = false)"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>

      <!-- Game Finished State -->
      <div
        v-if="!showAllDice && room && room.gameStatus === 'finished'"
        class="bg-gray-800 mb-4 p-4 rounded-lg"
      >
        <div class="text-center">
          <button
            v-if="canStartGame"
            class="bg-green-600 font-bold hover:bg-green-700 px-4 py-2 rounded-lg text-lg text-white transition-colors"
            @click="() => startGame()"
          >
            再戦
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="room && Object.keys(room.users).length === 0"
        class="bg-gray-800 p-4 rounded-lg"
      >
        <div class="text-center">
          <p class="text-gray-300 text-lg">まだ参加者がいません</p>
          <p class="text-base text-gray-500">
            他のプレイヤーが参加するまでお待ちください
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
