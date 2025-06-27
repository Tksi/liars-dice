<script setup lang="ts">
/**
 * Props
 */
type Props = {
  localUser: LocalUser;
};

defineProps<Props>();

/**
 * ユーザー情報表示カード
 */
defineOptions({
  name: 'UserCard',
});
</script>

<template>
  <div class="max-w-md mb-6 mx-auto">
    <div class="bg-gray-800 p-4 rounded-lg">
      <div class="flex items-center space-x-3">
        <div
          class="bg-indigo-600 flex h-8 items-center justify-center rounded-full w-8"
        >
          <svg
            class="h-4 text-white w-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
            />
          </svg>
        </div>
        <div>
          <p class="text-gray-400 text-sm">プレイヤー</p>
          <p class="font-medium text-gray-100 text-lg">{{ localUser.name }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
