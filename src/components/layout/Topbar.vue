<template>
  <header class="h-16 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 lg:px-8 transition-colors">
    
    <div class="flex items-center gap-4 flex-1">
      <button @click="uiStore.toggleSidebar" class="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
        <MenuIcon class="w-5 h-5" />
      </button>
      
      <div class="hidden md:block relative w-full max-w-md" ref="searchContainer">
        <div class="relative flex items-center">
          <SearchIcon class="w-4 h-4 absolute left-3 text-gray-400" />
          <input 
            type="text" 
            v-model="searchQuery"
            @focus="isSearchOpen = true"
            placeholder="Search tools, tags, or URLs..." 
            class="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-900 border focus:border-blue-500 rounded-lg text-sm outline-none transition-all"
          />
          <button v-if="searchQuery" @click="clearSearch" class="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <XIcon class="w-4 h-4" />
          </button>
        </div>

        <div 
          v-if="isSearchOpen && searchQuery.trim() !== ''" 
          class="absolute top-full mt-2 left-0 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto"
        >
          <div v-if="searchResults.length === 0" class="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No tools found for "{{ searchQuery }}"
          </div>
          
          <div v-else class="py-2">
            <p class="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Results</p>
            <a 
              v-for="result in searchResults" 
              :key="result.item.id" 
              :href="result.item.url" 
              target="_blank"
              class="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              @click="isSearchOpen = false"
            >
              <img :src="result.item.logo_url" class="w-6 h-6 rounded bg-gray-100 dark:bg-gray-900 object-cover" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ result.item.name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ result.item.url }}</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2 lg:gap-4 ml-4">
      <button 
        @click="uiStore.toggleEditMode" 
        class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all border"
        :class="uiStore.isEditMode ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' : 'bg-transparent border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'"
      >
        <Edit3Icon class="w-4 h-4" />
        <span class="hidden sm:inline">{{ uiStore.isEditMode ? 'Editing Enabled' : 'Edit Mode' }}</span>
      </button>

      <div class="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

      <button @click="uiStore.toggleDark()" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
        <SunIcon v-if="uiStore.isDark" class="w-5 h-5" />
        <MoonIcon v-else class="w-5 h-5" />
      </button>

      <button @click="handleLogout" class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors" title="Log Out">
        <LogOutIcon class="w-5 h-5" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useUIStore } from '../../stores/ui'
import { useAuthStore } from '../../stores/auth'
import { useWorkspaceStore } from '../../stores/workspace'
import { useRouter } from 'vue-router'
import { Menu as MenuIcon, Search as SearchIcon, Sun as SunIcon, Moon as MoonIcon, Edit3 as Edit3Icon, LogOut as LogOutIcon, X as XIcon } from 'lucide-vue-next'
import Fuse from 'fuse.js'
import { onClickOutside } from '@vueuse/core'

const uiStore = useUIStore()
const authStore = useAuthStore()
const workspaceStore = useWorkspaceStore()
const router = useRouter()

// --- Search Logic ---
const searchQuery = ref('')
const isSearchOpen = ref(false)
const searchResults = ref<any[]>([])
const searchContainer = ref(null)

// Initialize Fuse.js
let fuse: Fuse<any> | null = null

// Watch the global tools list and update the Fuse index if it changes
watch(() => workspaceStore.allWorkspaceTools, (newTools) => {
  fuse = new Fuse(newTools, {
    keys: ['name', 'url', 'tags'],
    threshold: 0.3, // 0.0 requires exact match, 1.0 matches anything
    includeScore: true
  })
}, { deep: true, immediate: true })

// Watch search input and filter results
watch(searchQuery, (query) => {
  if (!query || !fuse) {
    searchResults.value = []
    return
  }
  searchResults.value = fuse.search(query).slice(0, 8) // Limit to top 8 results
})

// Close dropdown if clicked outside
onClickOutside(searchContainer, () => {
  isSearchOpen.value = false
})

const clearSearch = () => {
  searchQuery.value = ''
  isSearchOpen.value = false
}

// --- Auth ---
const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>