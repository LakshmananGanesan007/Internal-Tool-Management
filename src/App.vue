<template>
  <div v-if="!isSupabaseConfigured" class="min-h-dvh flex items-center justify-center p-6 text-center">
    <div class="max-w-md">
      <h1 class="text-2xl font-bold mb-2">Setup needed</h1>
      <p class="text-gray-500 dark:text-gray-400">Add <code class="font-mono">VITE_SUPABASE_URL</code> and <code class="font-mono">VITE_SUPABASE_ANON_KEY</code> to your <code class="font-mono">.env</code> file (or your hosting environment variables) and rebuild.</p>
    </div>
  </div>

  <div v-else-if="crashed" class="min-h-dvh flex items-center justify-center p-6 text-center">
    <div class="max-w-sm">
      <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><AlertTriangleIcon class="w-7 h-7 text-red-500" /></div>
      <h1 class="text-xl font-bold mb-2">Something went wrong</h1>
      <p class="text-gray-500 dark:text-gray-400 mb-5 text-sm">The page hit an unexpected error. Your data is safe.</p>
      <div class="flex gap-3 justify-center">
        <button @click="crashed = false" class="px-5 py-3 rounded-xl font-bold border border-gray-300 dark:border-gray-700">Try again</button>
        <button @click="reload" class="px-5 py-3 rounded-xl font-bold bg-blue-600 text-white">Reload</button>
      </div>
    </div>
  </div>

  <router-view v-else />

  <div v-if="offline" class="fixed top-0 inset-x-0 z-[100] bg-amber-500 text-white text-center text-sm font-semibold py-1.5 safe-top">You're offline. Changes will fail until you reconnect.</div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, onMounted, onBeforeUnmount } from 'vue'
import { AlertTriangle as AlertTriangleIcon } from 'lucide-vue-next'
import { isSupabaseConfigured } from './services/supabase'

const crashed = ref(false)
const offline = ref(!navigator.onLine)
const reload = () => window.location.reload()

// A render error anywhere below shows a friendly recovery screen instead of a blank page
onErrorCaptured((err) => { console.error(err); crashed.value = true; return false })

const on = () => (offline.value = false)
const off = () => (offline.value = true)
onMounted(() => { window.addEventListener('online', on); window.addEventListener('offline', off) })
onBeforeUnmount(() => { window.removeEventListener('online', on); window.removeEventListener('offline', off) })
</script>
