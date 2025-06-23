<script setup lang="ts">
/**
 * Props
 */
type Props = {
  title: string;
  description: string;
  icon?: 'folder' | 'inbox';
};

const { icon = 'inbox' } = defineProps<Props>();

/**
 * 空状態表示コンポーネント
 */
defineOptions({
  name: 'EmptyState',
});
</script>

<template>
  <div class="p-12 text-center">
    <div
      class="bg-gray-700 flex h-16 items-center justify-center mb-4 mx-auto rounded-full w-16"
    >
      <!-- Inbox Icon -->
      <svg
        v-if="icon === 'inbox'"
        class="h-8 text-gray-400 w-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
        />
      </svg>
      <!-- Folder Icon -->
      <svg
        v-if="icon === 'folder'"
        class="h-8 text-gray-400 w-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
        />
      </svg>
    </div>
    <p class="mb-2 text-gray-300 text-lg">{{ title }}</p>
    <p class="text-gray-400">{{ description }}</p>
  </div>
</template>
