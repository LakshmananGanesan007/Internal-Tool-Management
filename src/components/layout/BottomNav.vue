<template>
  <nav class="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 safe-bottom">
    <div class="grid grid-cols-5 h-16">
      <button @click="ui.toggleSidebar" class="flex flex-col items-center justify-center gap-0.5 text-gray-500 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800">
        <MenuIcon class="w-5 h-5" /><span class="text-[11px] font-semibold">Channels</span>
      </button>
      <router-link v-for="item in items" :key="item.to" :to="item.to"
        class="relative flex flex-col items-center justify-center gap-0.5 active:bg-gray-100 dark:active:bg-gray-800"
        :class="isActive(item.to) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'">
        <component :is="item.icon" class="w-5 h-5" />
        <span class="text-[11px] font-semibold">{{ item.label }}</span>
        <span v-if="item.badge" class="absolute top-1.5 left-1/2 ml-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{{ item.badge }}</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Menu as MenuIcon, Home as HomeIcon, Heart as HeartIcon, CheckSquare as CheckSquareIcon, Settings as SettingsIcon } from 'lucide-vue-next'
import { useUIStore } from '../../stores/ui'
import { useTaskStore } from '../../stores/tasks'

const ui = useUIStore()
const taskStore = useTaskStore()
const route = useRoute()
const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))

const items = computed(() => [
  { to: '/', label: 'Home', icon: HomeIcon, badge: 0 },
  { to: '/tasks', label: 'Tasks', icon: CheckSquareIcon, badge: taskStore.openCount },
  { to: '/favorites', label: 'Favorites', icon: HeartIcon, badge: 0 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, badge: 0 },
])
</script>
