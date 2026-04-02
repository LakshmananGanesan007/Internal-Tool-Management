<template>
  <div class="h-full max-w-7xl mx-auto pb-20">
    <div class="mb-8 flex items-center">
      <HeartIcon class="w-8 h-8 mr-3 text-red-500 fill-current" />
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Favorites</h1>
    </div>

    <div v-if="favoriteTools.length === 0" class="flex flex-col items-center justify-center h-[60vh] text-center">
      <div class="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-4">
        <HeartIcon class="w-8 h-8 text-red-400 dark:text-red-500" />
      </div>
      <h2 class="text-xl font-bold mb-2">No Favorites Yet</h2>
      <p class="text-gray-500 max-w-sm">Hover over any tool in your workspace and click the heart icon to add it to your favorites.</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <a 
        v-for="tool in favoriteTools" 
        :key="tool.id" 
        :href="tool.url" 
        target="_blank" 
        class="relative group block p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md hover:border-red-300 dark:hover:border-red-700 transition-all cursor-pointer"
      >
        <div class="flex items-start gap-4">
          <img :src="tool.logo_url" :alt="tool.name" class="w-10 h-10 rounded-lg object-cover bg-gray-100 dark:bg-gray-900" />
          <div class="flex-1 min-w-0 pr-8">
            <h3 class="font-semibold text-gray-900 dark:text-white truncate group-hover:text-red-500 transition-colors">{{ tool.name }}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{{ extractDomain(tool.url) }}</p>
          </div>
        </div>

        <button 
          @click.prevent="workspaceStore.toggleFavorite(tool.id)" 
          class="absolute top-2 right-2 p-1.5 rounded-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100 opacity-100"
          title="Remove from favorites"
        >
          <HeartIcon class="w-4 h-4 fill-current text-red-500 hover:text-gray-400 transition-colors" />
        </button>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { Heart as HeartIcon } from 'lucide-vue-next'

const workspaceStore = useWorkspaceStore()

const extractDomain = (url: string) => {
  try { return new URL(url).hostname.replace('www.', '') } 
  catch { return url }
}

// Compute the tools that have been favorited using our global tools list
const favoriteTools = computed(() => {
  return workspaceStore.allWorkspaceTools.filter(t => workspaceStore.favoriteToolIds.includes(t.id))
})
</script>