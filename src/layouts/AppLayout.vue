<template>
  <div class="h-dvh-screen w-full flex overflow-hidden bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 relative">

    <!-- Splash only while the very first load runs (no artificial delay) -->
    <transition name="fade">
      <div v-if="ws.isInitializing" class="fixed inset-0 z-[9999] bg-white dark:bg-gray-950 flex flex-col items-center justify-center p-6">
        <template v-if="ws.currentWorkspace">
          <img v-if="ws.currentWorkspace.logo_url" :src="ws.currentWorkspace.logo_url" class="w-28 h-28 sm:w-40 sm:h-40 object-contain mb-6" alt="" />
          <div v-else class="w-28 h-28 sm:w-40 sm:h-40 rounded-[2rem] bg-blue-600 flex items-center justify-center text-white font-black text-5xl sm:text-6xl shadow-2xl mb-6">
            {{ ws.currentWorkspace.name.charAt(0).toUpperCase() }}
          </div>
          <img v-if="ws.currentWorkspace.wordmark_url" :src="ws.currentWorkspace.wordmark_url" class="h-12 sm:h-20 object-contain max-w-[90vw]" alt="" />
          <h1 v-else class="text-3xl sm:text-5xl font-black text-center">{{ ws.currentWorkspace.name }}</h1>
        </template>
        <div v-else class="flex flex-col items-center">
          <Loader2Icon class="w-10 h-10 text-blue-600 animate-spin mb-3" />
          <p class="font-semibold text-gray-500">Loading your workspace…</p>
        </div>
      </div>
    </transition>

    <div class="fixed top-16 sm:top-20 inset-x-3 sm:inset-x-auto sm:right-6 z-[90] flex flex-col gap-2 pointer-events-none items-stretch sm:items-end">
      <transition-group name="toast">
        <div v-for="t in ui.toasts" :key="t.id" class="pointer-events-auto flex items-center sm:min-w-[300px] sm:max-w-sm p-3 pr-2 rounded-2xl shadow-lg border bg-white dark:bg-gray-800"
          :class="t.type === 'error' ? 'border-red-200 dark:border-red-900/50' : t.type === 'info' ? 'border-blue-200 dark:border-blue-900/50' : 'border-green-200 dark:border-green-900/50'">
          <div class="w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0"
            :class="t.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : t.type === 'info' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-green-100 dark:bg-green-900/30 text-green-600'">
            <XIcon v-if="t.type === 'error'" class="w-4 h-4" /><InfoIcon v-else-if="t.type === 'info'" class="w-4 h-4" /><CheckIcon v-else class="w-4 h-4" />
          </div>
          <p class="text-sm font-semibold flex-1">{{ t.message }}</p>
          <button @click="ui.removeToast(t.id)" class="p-2 text-gray-400 hover:text-gray-600" aria-label="Dismiss"><XIcon class="w-4 h-4" /></button>
        </div>
      </transition-group>
    </div>

    <Sidebar />

    <main class="flex-1 flex flex-col min-w-0">
      <Topbar />
      <div class="flex-1 overflow-y-auto overscroll-contain p-4 lg:p-8 pb-24 lg:pb-8">
        <div v-if="ws.loadError && !ws.currentWorkspace" class="max-w-sm mx-auto mt-16 text-center">
          <p class="font-bold mb-1">Couldn't load your workspace</p>
          <p class="text-sm text-gray-500 mb-4">{{ ws.loadError }}</p>
          <button @click="ws.initWorkspace(true)" class="px-5 py-3 rounded-xl bg-blue-600 text-white font-bold">Retry</button>
        </div>
        <router-view v-else v-slot="{ Component }">
          <Suspense><component :is="Component" /></Suspense>
        </router-view>
      </div>
      <BottomNav />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Loader2 as Loader2Icon, X as XIcon, Check as CheckIcon, Info as InfoIcon } from 'lucide-vue-next'
import Sidebar from '../components/layout/Sidebar.vue'
import Topbar from '../components/layout/Topbar.vue'
import BottomNav from '../components/layout/BottomNav.vue'
import { useUIStore } from '../stores/ui'
import { useWorkspaceStore } from '../stores/workspace'
import { useTaskStore } from '../stores/tasks'

const ui = useUIStore()
const ws = useWorkspaceStore()
const tasks = useTaskStore()

onMounted(() => {
  ws.initWorkspace()
  tasks.fetchTasks() // loads in the background; powers the task badge
})
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
.toast-enter-from { opacity: 0; transform: translateY(-12px) scale(0.96); }
.toast-leave-to { opacity: 0; transform: translateY(-12px) scale(0.96); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.35s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
