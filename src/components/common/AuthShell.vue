<template>
  <div class="min-h-dvh flex items-center justify-center px-4 py-8 safe-top safe-bottom">
    <div class="max-w-md w-full">
      <div class="text-center mb-6">
        <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-lg">T</div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">{{ title }}</h1>
        <p v-if="subtitle" class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ subtitle }}</p>
      </div>
      <div class="bg-white dark:bg-gray-900 p-5 sm:p-8 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-800">
        <slot />
      </div>
      <div class="mt-5 text-center text-sm text-gray-500 dark:text-gray-400"><slot name="footer" /></div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>
