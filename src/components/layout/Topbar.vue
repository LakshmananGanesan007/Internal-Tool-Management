<template>
  <header class="h-14 lg:h-16 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-3 lg:px-8 safe-top shrink-0">

    <!-- Mobile search overlay -->
    <div v-if="mobileSearch" class="absolute inset-0 z-30 bg-white dark:bg-gray-900 flex items-center px-3 gap-2 md:hidden">
      <SearchIcon class="w-5 h-5 text-gray-400 shrink-0" />
      <input ref="mobileInput" v-model="query" type="search" placeholder="Search tools…" class="flex-1 bg-transparent outline-none py-2" @keydown.esc="closeMobileSearch" />
      <button @click="closeMobileSearch" class="p-2 text-gray-500" aria-label="Close search"><XIcon class="w-5 h-5" /></button>
    </div>

    <div class="flex items-center gap-2 flex-1 min-w-0">
      <h1 class="md:hidden font-bold truncate text-base">{{ pageTitle }}</h1>

      <div class="hidden md:block relative w-full max-w-md" ref="searchContainer">
        <div class="relative flex items-center">
          <SearchIcon class="w-4 h-4 absolute left-3 text-gray-400" />
          <input ref="deskInput" type="text" v-model="query" @focus="open = true" placeholder="Search tools, tags…  ( / )" class="w-full pl-10 pr-9 py-2 bg-gray-100 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:border-blue-500 rounded-lg text-sm outline-none" />
          <button v-if="query" @click="clearSearch" class="absolute right-3 text-gray-400" aria-label="Clear"><XIcon class="w-4 h-4" /></button>
        </div>
      </div>
    </div>

    <!-- Results (shared by desktop dropdown and mobile sheet) -->
    <div v-if="(open || mobileSearch) && query.trim()" class="fixed md:absolute md:top-14 md:left-8 md:w-[28rem] inset-x-0 top-14 md:inset-x-auto bg-white dark:bg-gray-800 border-y md:border md:rounded-xl border-gray-200 dark:border-gray-700 shadow-xl z-40 max-h-[70dvh] overflow-y-auto">
      <p v-if="!results.length" class="p-4 text-center text-sm text-gray-500">No tools found for "{{ query }}"</p>
      <a v-for="r in results" :key="r.item.id" :href="r.item.url" target="_blank" rel="noopener noreferrer" @click="openResult(r.item)"
        class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
        <img :src="r.item.logo_url || ''" class="w-8 h-8 rounded bg-gray-100 dark:bg-gray-900 object-cover" alt="" />
        <div class="min-w-0">
          <p class="text-sm font-semibold truncate">{{ r.item.name }}</p>
          <p class="text-xs text-gray-500 truncate">{{ extractDomain(r.item.url) }}</p>
        </div>
      </a>
    </div>

    <div class="flex items-center gap-1 lg:gap-3 ml-2">
      <button @click="openMobileSearch" class="md:hidden p-2.5 rounded-lg text-gray-500 dark:text-gray-400" aria-label="Search"><SearchIcon class="w-5 h-5" /></button>

      <button @click="ui.toggleEditMode" class="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold border transition-all"
        :class="ui.isEditMode ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700'">
        <Edit3Icon class="w-4 h-4" />
        <span>{{ ui.isEditMode ? 'Done' : 'Edit' }}</span>
      </button>

      <button @click="ui.toggleDark()" class="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400" aria-label="Toggle theme">
        <SunIcon v-if="ui.isDark" class="w-5 h-5" /><MoonIcon v-else class="w-5 h-5" />
      </button>

      <button @click="handleLogout" class="hidden sm:block p-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600" title="Log out" aria-label="Log out"><LogOutIcon class="w-5 h-5" /></button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search as SearchIcon, Sun as SunIcon, Moon as MoonIcon, Edit3 as Edit3Icon, LogOut as LogOutIcon, X as XIcon } from 'lucide-vue-next'
import Fuse from 'fuse.js'
import { onClickOutside } from '@vueuse/core'
import { useUIStore } from '../../stores/ui'
import { useAuthStore } from '../../stores/auth'
import { useWorkspaceStore } from '../../stores/workspace'
import { extractDomain } from '../../utils/url'
import type { Tool } from '../../types'

const ui = useUIStore(); const auth = useAuthStore(); const ws = useWorkspaceStore()
const router = useRouter(); const route = useRoute()

const titles: Record<string, string> = { '/': '', '/favorites': 'Favorites', '/tasks': 'Tasks', '/settings': 'Settings' }
const pageTitle = computed(() => titles[route.path] || ws.activeCategory?.name || ws.currentWorkspace?.name || 'ToolHive')

const query = ref(''); const open = ref(false); const mobileSearch = ref(false)
const searchContainer = ref<HTMLElement | null>(null)
const mobileInput = ref<HTMLInputElement | null>(null); const deskInput = ref<HTMLInputElement | null>(null)

// Build the index once per change to the tool list (not a deep watch on every field)
const fuse = computed(() => new Fuse(ws.allWorkspaceTools, { keys: ['name', 'tags'], threshold: 0.35 }))
const results = computed(() => (query.value.trim() ? fuse.value.search(query.value.trim()).slice(0, 8) : []))

onClickOutside(searchContainer, () => { open.value = false })

const clearSearch = () => { query.value = ''; open.value = false }
const openMobileSearch = async () => { mobileSearch.value = true; await nextTick(); mobileInput.value?.focus() }
const closeMobileSearch = () => { mobileSearch.value = false; query.value = '' }
const openResult = (t: Tool) => { ws.trackOpen(t.id); open.value = false; if (mobileSearch.value) closeMobileSearch() }

const onKey = (e: KeyboardEvent) => {
  const tag = (e.target as HTMLElement)?.tagName
  if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') { e.preventDefault(); deskInput.value?.focus() }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

const handleLogout = async () => { await auth.logout(); ws.reset(); router.push('/login') }
</script>
