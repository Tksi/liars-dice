<script setup lang="ts">
import type { User } from '~/types';

/**
 * Props
 */
defineProps<{
  user: User;
}>();
</script>

<template>
  <div
    class="bg-gray-700 border border-gray-600 flex items-center justify-between p-4 rounded-lg"
  >
    <div class="flex items-center space-x-3">
      <!-- アバター -->
      <div
        class="flex h-10 items-center justify-center rounded-full w-10"
        :class="{
          'bg-purple-600': user.isCpu,
          'bg-indigo-600': !user.isCpu,
        }"
      >
        <svg
          v-if="user.isCpu"
          class="h-6 text-white w-6"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <svg
          v-else
          class="h-6 text-white w-6"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
          />
        </svg>
      </div>

      <!-- ユーザー情報 -->
      <div>
        <div class="flex items-center space-x-2">
          <h3 class="font-medium text-white">{{ user.name }}</h3>
        </div>
      </div>
    </div>
  </div>
</template>
