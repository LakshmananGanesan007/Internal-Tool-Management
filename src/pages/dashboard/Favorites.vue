<template>
  <div class="max-w-7xl mx-auto">
    <div class="mb-6 flex items-center">
      <HeartIcon class="w-7 h-7 mr-3 text-red-500 fill-current" />
      <h1 class="text-2xl sm:text-3xl font-bold">Favorites</h1>
    </div>

    <div v-if="!favoriteTools.length" class="flex flex-col items-center justify-center min-h-[50dvh] text-center px-4">
      <div class="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-4"><HeartIcon class="w-8 h-8 text-red-400" /></div>
      <h2 class="text-xl font-bold mb-2">No favorites yet</h2>
      <p class="text-gray-500 max-w-sm">Tap the heart on any tool to pin it here for quick access.</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      <div v-for="tool in favoriteTools" :key="tool.id" class="relative">
        <a :href="tool.url" target="_blank" rel="noopener noreferrer" @click="ws.trackOpen(tool.id)"
          class="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm active:scale-[0.99] lg:hover:shadow-md lg:hover:border-red-300 transition-all">
          <ToolIcon :src="tool.logo_url" :name="tool.name" />
          <div class="flex-1 min-w-0 pr-9">
            <h3 class="font-semibold truncate">{{ tool.name }}</h3>
            <p class="text-xs text-gray-500 truncate">{{ extractDomain(tool.url) }}</p>
          </div>
        </a>
        <button @click="ws.toggleFavorite(tool.id)" class="absolute top-1/2 -translate-y-1/2 right-2 p-2.5 rounded-lg" aria-label="Remove from favorites">
          <HeartIcon class="w-5 h-5 fill-current text-red-500" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Heart as HeartIcon } from 'lucide-vue-next'
import ToolIcon from '../../components/common/ToolIcon.vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { extractDomain } from '../../utils/url'

const ws = useWorkspaceStore()
const favoriteTools = computed(() => ws.allWorkspaceTools.filter(t => ws.favoriteToolIds.includes(t.id)))
</script>
