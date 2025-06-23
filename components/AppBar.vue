<script setup lang="ts">
/**
 * アプリケーションヘッダーバー
 */
defineOptions({
  name: 'AppBar',
});
</script>

<template>
  <div class="bg-gray-800 shadow-md">
    <div class="container flex items-center mx-auto px-4 py-4">
      <div class="bg-indigo-600 mr-4 p-2 rounded-full">
        <svg class="h-6 text-white w-6" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"
          />
        </svg>
      </div>
      <h1 class="font-medium text-2xl text-gray-100">ライアーズダイス</h1>
    </div>
  </div>
</template>
