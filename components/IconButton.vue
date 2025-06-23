<script setup lang="ts">
/**
 * Props
 */
type Props = {
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'lg' | 'md' | 'sm';
};

/**
 * Events
 */
type Emits = {
  click: [];
};

const {
  disabled = false,
  variant = 'primary',
  size = 'md',
} = defineProps<Props>();

const emit = defineEmits<Emits>();

/**
 * アイコンボタンコンポーネント
 */
defineOptions({
  name: 'IconButton',
});

/**
 * クリックハンドラー
 */
const handleClick = (): void => {
  if (!disabled) {
    emit('click');
  }
};

/**
 * CSS クラスを計算
 */
const buttonClass = computed(() => {
  const baseClass =
    'duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-lg shadow-md transition-all';

  const variantClass =
    variant === 'primary'
      ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 text-white hover:shadow-lg'
      : 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 text-white';

  const sizeClass =
    size === 'sm'
      ? 'px-3 py-2 text-sm'
      : size === 'lg'
        ? 'px-8 py-4 text-lg'
        : 'px-6 py-3';

  const disabledClass = disabled
    ? 'disabled:bg-gray-600 disabled:cursor-not-allowed'
    : '';

  return `${baseClass} ${variantClass} ${sizeClass} ${disabledClass}`;
});
</script>

<template>
  <button
    :class="buttonClass"
    :disabled="disabled"
    @click="() => handleClick()"
  >
    <div class="flex items-center justify-center space-x-2">
      <slot name="icon" />
      <slot />
    </div>
  </button>
</template>
