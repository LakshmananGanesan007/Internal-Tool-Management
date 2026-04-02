<template>
  <div class="h-screen w-full flex overflow-hidden bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 relative font-sans antialiased tracking-tight">
    
    <transition name="fade">
      <div v-if="workspaceStore.isInitializing" class="fixed inset-0 z-[9999] bg-white dark:bg-gray-950 flex flex-col items-center justify-center">
        
        <div v-if="workspaceStore.currentWorkspace" class="animate-pulse flex flex-col items-center">
          
          <img v-if="workspaceStore.currentWorkspace.logo_url" :src="workspaceStore.currentWorkspace.logo_url" class="w-40 h-40 object-contain drop-shadow-2xl mb-8" />
          
          <div v-else class="w-40 h-40 rounded-[2rem] bg-blue-600 flex items-center justify-center text-white font-black text-6xl shadow-2xl mb-8">
            {{ workspaceStore.currentWorkspace.name.charAt(0).toUpperCase() }}
          </div>
          
          <img v-if="workspaceStore.currentWorkspace.wordmark_url" :src="workspaceStore.currentWorkspace.wordmark_url" class="h-16 md:h-20 object-contain max-w-[90vw]" />
          <h1 v-else class="text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight">
            {{ workspaceStore.currentWorkspace.name }}
          </h1>
        </div>

        <div v-else class="flex flex-col items-center">
           <svg class="w-12 h-12 text-blue-600 animate-spin mb-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
           <p class="text-lg font-bold text-gray-500">Connecting to Workspace...</p>
        </div>
      </div>
    </transition>

    <div class="fixed top-20 right-4 lg:right-8 z-50 flex flex-col gap-3 pointer-events-none">
      <transition-group name="toast">
        <div v-for="toast in uiStore.toasts" :key="toast.id" class="pointer-events-auto flex items-center min-w-[300px] max-w-sm p-4 rounded-2xl shadow-lg border bg-white dark:bg-gray-800" :class="toast.type === 'success' ? 'border-green-200 dark:border-green-900/50' : 'border-red-200 dark:border-red-900/50'">
          <div v-if="toast.type === 'success'" class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 flex-shrink-0"><svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div>
          <div v-else class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-3 flex-shrink-0"><svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></div>
          <p class="text-sm font-bold flex-1">{{ toast.message }}</p>
          <button @click="uiStore.removeToast(toast.id)" class="ml-4 text-gray-400 hover:text-gray-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        </div>
      </transition-group>
    </div>

    <Sidebar />

    <main class="flex-1 flex flex-col min-w-0">
      <Topbar />
      <div class="flex-1 overflow-y-auto p-4 lg:p-8">
        <router-view />
      </div>
    </main>
    
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import Sidebar from '../components/layout/Sidebar.vue'
import Topbar from '../components/layout/Topbar.vue'
import { useUIStore } from '../stores/ui'
import { useWorkspaceStore } from '../stores/workspace'

const uiStore = useUIStore()
const workspaceStore = useWorkspaceStore()

onMounted(() => {
  workspaceStore.initWorkspace()
})
</script>

<style>
body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
</style>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
.toast-enter-from { opacity: 0; transform: translateX(50px) scale(0.9); }
.toast-leave-to { opacity: 0; transform: translateY(-20px) scale(0.9); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.6s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>