<template>
  <div class="h-full">
    <div v-if="!workspaceStore.activeChannel" class="flex flex-col items-center justify-center h-[70vh] text-center">
      <div class="w-20 h-20 bg-gray-100 dark:bg-gray-800/50 rounded-2xl flex items-center justify-center mb-6 shadow-inner"><LayoutGridIcon class="w-8 h-8 text-gray-400" /></div>
      <h2 class="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Ready to Organize?</h2>
      <p class="text-gray-500 dark:text-gray-400 max-w-sm text-base">Create a channel in the sidebar to start building your tool universe.</p>
    </div>

    <div v-else-if="!workspaceStore.activeCategory" class="flex flex-col items-center justify-center h-[70vh] text-center">
      <div class="w-24 h-24 rounded-2xl flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shrink-0 mb-6">
        <img v-if="workspaceStore.activeChannel.icon_url" :src="workspaceStore.activeChannel.icon_url" class="w-full h-full object-cover" />
        <div v-else class="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-4xl">
          {{ workspaceStore.activeChannel.name.charAt(0).toUpperCase() }}
        </div>
      </div>
      <h2 class="text-2xl font-bold mb-2 text-gray-900 dark:text-white">No Categories Yet</h2>
      <p class="text-gray-500 dark:text-gray-400 max-w-sm text-base">Create a category in the sidebar under "{{ workspaceStore.activeChannel.name }}" to add tools.</p>
    </div>

    <div v-else class="max-w-7xl mx-auto pb-20">
      
      <div class="mb-6 flex flex-col md:flex-row items-start md:items-center gap-6 bg-white dark:bg-gray-900/40 p-6 rounded-2xl border border-gray-200 dark:border-gray-800/60 shadow-sm">
        <div class="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shrink-0">
          <img v-if="workspaceStore.activeChannel.icon_url" :src="workspaceStore.activeChannel.icon_url" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-4xl shadow-inner">
            {{ workspaceStore.activeChannel.name.charAt(0).toUpperCase() }}
          </div>
        </div>
        
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>{{ workspaceStore.activeChannel.name }}</span>
            <ChevronRightIcon class="w-3 h-3" />
            <span class="text-blue-600 dark:text-blue-400">{{ workspaceStore.activeCategory.name }}</span>
          </div>
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            {{ workspaceStore.activeCategory.name }}
          </h1>
        </div>
      </div>

      <div v-if="availableTags.length > 0" class="mb-8 flex flex-wrap gap-2 items-center">
        <span class="text-sm font-semibold text-gray-400 mr-2 uppercase tracking-wider">Filter:</span>
        <button 
          @click="selectedTag = null" 
          class="px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
          :class="selectedTag === null ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'"
        >
          All Tools
        </button>
        <button 
          v-for="tag in availableTags" 
          :key="tag" 
          @click="selectedTag = tag"
          class="px-3 py-1.5 rounded-lg text-sm font-bold transition-all border"
          :class="selectedTag === tag ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'"
        >
          {{ tag }}
        </button>
      </div>

      <div v-if="workspaceStore.isFetching" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div v-for="j in 4" :key="j" class="h-24 bg-gray-100 dark:bg-gray-800/80 rounded-xl animate-pulse"></div>
      </div>

      <div v-else>
        <draggable 
          v-model="currentCategoryTools" 
          item-key="id" 
          :disabled="!uiStore.isEditMode || selectedTag !== null"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          handle=".tool-drag-handle"
        >
          <template #item="{ element: tool }">
            <a :href="tool.url" target="_blank" class="relative group block p-4 bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer" :class="uiStore.isEditMode && selectedTag === null ? 'hover:border-blue-400 dark:hover:border-blue-600' : 'hover:border-gray-300 dark:hover:border-gray-600'">
              
              <div v-if="uiStore.isEditMode && selectedTag === null" @click.prevent class="absolute top-2 left-2 p-1 tool-drag-handle cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/80 dark:bg-gray-800/80 rounded backdrop-blur-sm">
                <GripHorizontalIcon class="w-4 h-4 text-gray-400 hover:text-blue-500" />
              </div>

              <div class="flex items-start gap-4 mb-3" :class="uiStore.isEditMode ? 'ml-4' : ''">
                <img :src="tool.logo_url" :alt="tool.name" class="w-10 h-10 rounded-lg object-cover bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700/50" />
                <div class="flex-1 min-w-0 pr-6">
                  <h3 class="font-semibold text-gray-900 dark:text-white text-base truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{{ tool.name }}</h3>
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{{ extractDomain(tool.url) }}</p>
                </div>
              </div>
              
              <div v-if="tool.tags && tool.tags.length > 0" class="flex flex-wrap gap-1.5 mt-2" :class="uiStore.isEditMode ? 'ml-4' : ''">
                <span v-for="tag in tool.tags" :key="tag" class="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-gray-100 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 rounded-md border border-gray-200 dark:border-gray-600/50">{{ tag }}</span>
              </div>

              <div class="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200" :class="workspaceStore.favoriteToolIds.includes(tool.id) ? 'opacity-100' : ''">
                <button v-if="!uiStore.isEditMode" @click.prevent="workspaceStore.toggleFavorite(tool.id)" class="p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 transition-colors">
                  <HeartIcon class="w-4 h-4" :class="workspaceStore.favoriteToolIds.includes(tool.id) ? 'fill-current text-red-500' : 'text-gray-400 hover:text-red-400'" />
                </button>
                <button v-if="uiStore.isEditMode" @click.prevent="workspaceStore.deleteTool(tool.id)" class="p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors z-10">
                  <Trash2Icon class="w-4 h-4" />
                </button>
              </div>
            </a>
          </template>
          
          <template #footer>
            <button v-if="uiStore.isEditMode && selectedTag === null" @click="openToolModal(workspaceStore.activeCategory.id)" class="min-h-[100px] border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:bg-white dark:hover:bg-gray-800 hover:border-blue-500 hover:text-blue-600 transition-all duration-200 group">
              <div class="w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-2 group-hover:border-blue-200 transition-all shadow-sm"><PlusIcon class="w-5 h-5" /></div>
              <span class="font-semibold text-xs uppercase tracking-wider">Add Tool</span>
            </button>
          </template>
        </draggable>
      </div>
    </div>

    <div v-if="isToolModalOpen" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="closeToolModal"></div>
      <div class="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 transform transition-all">
        <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center"><PlusIcon class="w-6 h-6 mr-2 text-blue-600" /> Add New Tool</h3>
          <button @click="closeToolModal" class="text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 p-1.5 rounded-lg transition-colors"><XIcon class="w-5 h-5" /></button>
        </div>
        <form @submit.prevent="submitNewTool" class="p-6 space-y-5">
          <div><label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tool Name <span class="text-red-500">*</span></label><input v-model="toolForm.name" type="text" required placeholder="e.g. Figma" class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" autofocus /></div>
          <div><label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Website URL <span class="text-red-500">*</span></label><input v-model="toolForm.url" type="text" required placeholder="e.g. https://figma.com" class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" /></div>
          <div><label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tags (Comma separated)</label><input v-model="toolForm.tags" type="text" placeholder="e.g. design, AI" class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" /></div>
          <div class="pt-4 flex justify-end gap-3"><button type="button" @click="closeToolModal" class="px-6 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button><button type="submit" :disabled="isSavingTool" class="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 disabled:opacity-50 flex items-center"><Loader2Icon v-if="isSavingTool" class="w-5 h-5 animate-spin mr-2" /> {{ isSavingTool ? 'Saving...' : 'Save' }}</button></div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { useUIStore } from '../../stores/ui'
import { Plus as PlusIcon, X as XIcon, Trash2 as Trash2Icon, Loader2 as Loader2Icon, Heart as HeartIcon, LayoutGrid as LayoutGridIcon, ChevronRight as ChevronRightIcon, GripHorizontal as GripHorizontalIcon } from 'lucide-vue-next'
import { getFaviconUrl } from '../../utils/favicon'
import draggable from 'vuedraggable'

const workspaceStore = useWorkspaceStore()
const uiStore = useUIStore()

const extractDomain = (url: string) => { try { return new URL(url).hostname.replace('www.', '') } catch { return url } }

// --- TAG FILTERING LOGIC ---
const selectedTag = ref<string | null>(null)

const availableTags = computed(() => {
  if (!workspaceStore.activeCategory) return []
  const tools = workspaceStore.tools.filter(t => t.category_id === workspaceStore.activeCategory.id)
  const tags = new Set<string>()
  tools.forEach(t => { if (t.tags) t.tags.forEach((tag: string) => tags.add(tag)) })
  return Array.from(tags).sort()
})

// --- DRAGGABLE TOOLS LOGIC ---
const currentCategoryTools = computed({
  get: () => {
    if (!workspaceStore.activeCategory) return []
    let catTools = workspaceStore.tools.filter(t => t.category_id === workspaceStore.activeCategory.id)
    if (selectedTag.value) {
      catTools = catTools.filter(t => t.tags && t.tags.includes(selectedTag.value!))
    }
    return catTools.sort((a,b) => a.sort_order - b.sort_order)
  },
  set: (newOrder) => {
    // Only allow saving order if no filter is applied to avoid index mess
    if (!selectedTag.value && workspaceStore.activeCategory) {
      workspaceStore.saveToolOrder(workspaceStore.activeCategory.id, newOrder)
    }
  }
})

// --- MODAL LOGIC ---
const isToolModalOpen = ref(false); const selectedCategoryId = ref(''); const isSavingTool = ref(false)
const toolForm = ref({ name: '', url: '', tags: '' })

const openToolModal = (categoryId: string) => { selectedCategoryId.value = categoryId; toolForm.value = { name: '', url: '', tags: '' }; isToolModalOpen.value = true }
const closeToolModal = () => { isToolModalOpen.value = false }

const submitNewTool = async () => {
  if (!toolForm.value.name.trim() || !toolForm.value.url.trim()) return
  isSavingTool.value = true
  let finalUrl = toolForm.value.url.trim()
  if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl
  const tagsArray = toolForm.value.tags ? toolForm.value.tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : []
  await workspaceStore.addTool(selectedCategoryId.value, { name: toolForm.value.name.trim(), url: finalUrl, tags: tagsArray, logo_url: getFaviconUrl(finalUrl) })
  isSavingTool.value = false; closeToolModal()
}
</script>