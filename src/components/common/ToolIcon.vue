<template>
  <img v-if="src && !failed" :src="src" :alt="name" loading="lazy" decoding="async" @error="failed = true"
    class="object-cover bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700/50" :class="[size, rounded]" />
  <div v-else class="flex items-center justify-center font-bold text-white bg-gradient-to-br from-blue-500 to-indigo-600" :class="[size, rounded]">
    {{ name.charAt(0).toUpperCase() }}
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
const props = withDefaults(defineProps<{ src?: string | null; name: string; size?: string; rounded?: string }>(), { size: 'w-10 h-10', rounded: 'rounded-lg' })
const failed = ref(false)
watch(() => props.src, () => { failed.value = false })
</script>
