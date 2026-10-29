<template>
  <div class="h-full">
    <!-- Loading skeleton (never a blank page) -->
    <div v-if="ws.isInitializing && !ws.channels.length" class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div v-for="i in 8" :key="i" class="h-24 bg-gray-100 dark:bg-gray-800/80 rounded-xl animate-pulse"></div>
    </div>

    <div v-else-if="!ws.activeChannel" class="flex flex-col items-center justify-center min-h-[60dvh] text-center px-4">
      <div class="w-20 h-20 bg-gray-100 dark:bg-gray-800/50 rounded-2xl flex items-center justify-center mb-6"><LayoutGridIcon class="w-8 h-8 text-gray-400" /></div>
      <h2 class="text-2xl font-bold mb-2">Ready to organise?</h2>
      <p class="text-gray-500 dark:text-gray-400 max-w-sm mb-5">Create your first channel (for example "Marketing" or "Design"), then add categories and tools.</p>
      <button @click="startEditing" class="btn-primary">Get started</button>
    </div>

    <div v-else-if="!ws.activeCategory" class="flex flex-col items-center justify-center min-h-[60dvh] text-center px-4">
      <ToolIcon :src="ws.activeChannel.icon_url" :name="ws.activeChannel.name" size="w-20 h-20" rounded="rounded-2xl" />
      <h2 class="text-2xl font-bold mt-5 mb-2">No categories yet</h2>
      <p class="text-gray-500 dark:text-gray-400 max-w-sm mb-5">Add a category to "{{ ws.activeChannel.name }}" to start adding tools.</p>
      <button @click="startEditing" class="btn-primary">Add a category</button>
    </div>

    <div v-else class="max-w-7xl mx-auto pb-8">
      <!-- Recently opened -->
      <section v-if="ws.recentTools.length && !ui.isEditMode" class="mb-5">
        <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center"><ClockIcon class="w-3.5 h-3.5 mr-1.5" /> Recently opened</p>
        <div class="flex gap-2 overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 pb-1 scrollbar-none">
          <a v-for="t in ws.recentTools" :key="t.id" :href="t.url" target="_blank" rel="noopener noreferrer" @click="ws.trackOpen(t.id)"
            class="flex items-center gap-2 pl-2 pr-3 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shrink-0 text-sm font-semibold">
            <ToolIcon :src="t.logo_url" :name="t.name" size="w-6 h-6" rounded="rounded-full" />{{ t.name }}
          </a>
        </div>
      </section>

      <div class="mb-5 flex items-center gap-4 card p-4 sm:p-6">
        <ToolIcon :src="ws.activeChannel.icon_url" :name="ws.activeChannel.name" size="w-14 h-14 sm:w-20 sm:h-20" rounded="rounded-2xl" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-0">
            <span class="truncate">{{ ws.activeChannel.name }}</span><ChevronRightIcon class="w-3 h-3 shrink-0" />
          </div>
          <h1 class="text-2xl sm:text-4xl font-bold tracking-tight truncate">{{ ws.activeCategory.name }}</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ ws.tools.length }} {{ ws.tools.length === 1 ? 'tool' : 'tools' }}</p>
        </div>
        <button v-if="ui.isEditMode" @click="openToolModal()" class="hidden sm:inline-flex btn-primary shrink-0"><PlusIcon class="w-4 h-4 mr-1.5" /> Add tool</button>
      </div>

      <!-- Category switcher for phones (the sidebar is a drawer) -->
      <div v-if="ws.categories.length > 1" class="lg:hidden mb-4 flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none">
        <button v-for="c in ws.categories" :key="c.id" @click="ws.setActiveCategory(c)" class="px-4 py-2 rounded-full text-sm font-bold shrink-0 border"
          :class="ws.activeCategory.id === c.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'">{{ c.name }}</button>
      </div>

      <div v-if="availableTags.length" class="mb-5 flex gap-2 items-center overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap pb-1 scrollbar-none">
        <button @click="selectedTag = null" class="px-3 py-2 rounded-lg text-sm font-bold shrink-0 border" :class="selectedTag === null ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'">All</button>
        <button v-for="tag in availableTags" :key="tag" @click="selectedTag = tag" class="px-3 py-2 rounded-lg text-sm font-bold shrink-0 border"
          :class="selectedTag === tag ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'">{{ tag }}</button>
      </div>

      <div v-if="ws.isFetching" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <div v-for="j in 4" :key="j" class="h-24 bg-gray-100 dark:bg-gray-800/80 rounded-xl animate-pulse"></div>
      </div>

      <draggable v-else v-model="currentCategoryTools" item-key="id" :disabled="!ui.isEditMode || selectedTag !== null"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3" handle=".tool-drag-handle" :delay="120" :delay-on-touch-only="true" :animation="150">
        <template #item="{ element: tool }">
          <div class="relative group">
            <a :href="tool.url" target="_blank" rel="noopener noreferrer" @click="onToolClick($event, tool)"
              class="block p-4 bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 rounded-xl shadow-sm active:scale-[0.99] lg:hover:shadow-md lg:hover:-translate-y-0.5 transition-all">
              <div class="flex items-center gap-3" :class="ui.isEditMode && selectedTag === null ? 'pl-7' : ''">
                <ToolIcon :src="tool.logo_url" :name="tool.name" />
                <div class="flex-1 min-w-0" :class="ui.isEditMode ? 'pr-16' : 'pr-9'">
                  <h3 class="font-semibold text-base truncate">{{ tool.name }}</h3>
                  <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ extractDomain(tool.url) }}</p>
                </div>
              </div>
              <div v-if="tool.tags?.length" class="flex flex-wrap gap-1.5 mt-3">
                <span v-for="tag in tool.tags" :key="tag" class="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-gray-100 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 rounded-md">{{ tag }}</span>
              </div>
            </a>

            <div v-if="ui.isEditMode && selectedTag === null" class="tool-drag-handle touch-none-important absolute left-1 top-1/2 -translate-y-1/2 p-2 cursor-grab text-gray-400"><GripVerticalIcon class="w-5 h-5" /></div>

            <div class="absolute top-1.5 right-1.5 flex items-center">
              <template v-if="ui.isEditMode">
                <button @click="openToolModal(tool)" class="p-2.5 rounded-lg text-gray-400 hover:text-blue-500" aria-label="Edit tool"><Edit2Icon class="w-4 h-4" /></button>
                <button @click="ws.deleteTool(tool.id)" class="p-2.5 rounded-lg text-gray-400 hover:text-red-500" aria-label="Delete tool"><Trash2Icon class="w-4 h-4" /></button>
              </template>
              <button v-else @click="ws.toggleFavorite(tool.id)" class="p-2.5 rounded-lg" :aria-label="isFav(tool.id) ? 'Remove favorite' : 'Add favorite'"
                :class="isFav(tool.id) ? '' : 'lg:opacity-0 lg:group-hover:opacity-100 transition-opacity'">
                <HeartIcon class="w-5 h-5" :class="isFav(tool.id) ? 'fill-current text-red-500' : 'text-gray-300 dark:text-gray-500 hover:text-red-400'" />
              </button>
            </div>
          </div>
        </template>

        <template #footer>
          <p v-if="!ws.tools.length && !ui.isEditMode" class="col-span-full text-center text-gray-500 py-12">No tools here yet. Tap <b>Edit</b> to add some.</p>
          <p v-else-if="selectedTag && !currentCategoryTools.length" class="col-span-full text-center text-gray-500 py-12">No tools with this tag.</p>
          <button v-if="ui.isEditMode && selectedTag === null" @click="openToolModal()" class="min-h-[88px] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-600">
            <PlusIcon class="w-6 h-6 mb-1" /><span class="font-semibold text-xs uppercase tracking-wider">Add tool</span>
          </button>
        </template>
      </draggable>
    </div>

    <!-- Floating add button on phones while editing -->
    <button v-if="ui.isEditMode && ws.activeCategory" @click="openToolModal()" class="sm:hidden fixed right-4 bottom-24 z-30 w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl flex items-center justify-center" aria-label="Add tool"><PlusIcon class="w-7 h-7" /></button>

    <BaseModal v-model="isToolModalOpen" :title="toolForm.id ? 'Edit tool' : 'Add new tool'">
      <form @submit.prevent="submitTool" class="space-y-4">
        <div>
          <label class="block text-sm font-bold mb-2">Name <span class="text-red-500">*</span></label>
          <input v-model="toolForm.name" type="text" required maxlength="60" placeholder="e.g. Figma" class="field" />
        </div>
        <div>
          <label class="block text-sm font-bold mb-2">Website URL <span class="text-red-500">*</span></label>
          <input v-model="toolForm.url" type="text" required inputmode="url" autocapitalize="none" autocorrect="off" placeholder="figma.com" class="field" :class="urlError ? 'border-red-500' : ''" />
          <p v-if="urlError" class="text-xs text-red-600 mt-1">{{ urlError }}</p>
        </div>
        <div>
          <label class="block text-sm font-bold mb-2">Tags <span class="text-gray-400 font-normal">(comma separated)</span></label>
          <input v-model="toolForm.tags" type="text" placeholder="design, ai" class="field" />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="isToolModalOpen = false" class="btn-ghost">Cancel</button>
          <button type="submit" :disabled="isSavingTool" class="btn-primary"><Loader2Icon v-if="isSavingTool" class="w-5 h-5 animate-spin mr-2" /> {{ isSavingTool ? 'Saving…' : 'Save' }}</button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import draggable from 'vuedraggable'
import { Plus as PlusIcon, Trash2 as Trash2Icon, Edit2 as Edit2Icon, Loader2 as Loader2Icon, Heart as HeartIcon, LayoutGrid as LayoutGridIcon, ChevronRight as ChevronRightIcon, GripVertical as GripVerticalIcon, Clock as ClockIcon } from 'lucide-vue-next'
import BaseModal from '../../components/common/BaseModal.vue'
import ToolIcon from '../../components/common/ToolIcon.vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { useUIStore } from '../../stores/ui'
import { getFaviconUrl } from '../../utils/favicon'
import { normalizeUrl, extractDomain } from '../../utils/url'
import type { Tool } from '../../types'

const ws = useWorkspaceStore()
const ui = useUIStore()

const isFav = (id: string) => ws.favoriteToolIds.includes(id)
// Channels/categories are managed in the sidebar, so open it (drawer on phones) in edit mode
const startEditing = () => { ui.isEditMode = true; if (window.innerWidth < 1024) ui.isSidebarOpen = true }

// Don't navigate away while rearranging/editing
const onToolClick = (e: MouseEvent, tool: Tool) => { if (ui.isEditMode) e.preventDefault(); else ws.trackOpen(tool.id) }

// --- Tag filtering ---
const selectedTag = ref<string | null>(null)
watch(() => ws.activeCategory?.id, () => { selectedTag.value = null })
const availableTags = computed(() => {
  const tags = new Set<string>()
  ws.tools.forEach(t => t.tags?.forEach(tag => tags.add(tag)))
  return Array.from(tags).sort()
})

const currentCategoryTools = computed<Tool[]>({
  get: () => (selectedTag.value ? ws.tools.filter(t => t.tags?.includes(selectedTag.value!)) : ws.tools),
  set: (order) => { if (!selectedTag.value && ws.activeCategory) ws.saveToolOrder(ws.activeCategory.id, order) },
})

// --- Add / edit tool ---
const isToolModalOpen = ref(false); const isSavingTool = ref(false); const urlError = ref('')
const toolForm = ref({ id: '', name: '', url: '', tags: '' })

const openToolModal = (tool?: Tool) => {
  urlError.value = ''
  toolForm.value = tool ? { id: tool.id, name: tool.name, url: tool.url, tags: (tool.tags || []).join(', ') } : { id: '', name: '', url: '', tags: '' }
  isToolModalOpen.value = true
}

const submitTool = async () => {
  if (isSavingTool.value || !ws.activeCategory) return
  const name = toolForm.value.name.trim()
  const url = normalizeUrl(toolForm.value.url)
  if (!url) { urlError.value = 'Enter a valid website address, like figma.com'; return }
  urlError.value = ''
  const tags = [...new Set(toolForm.value.tags.split(',').map(t => t.trim()).filter(Boolean))]
  isSavingTool.value = true
  const payload = { name, url, tags, logo_url: getFaviconUrl(url) }
  const ok = toolForm.value.id ? await ws.updateTool(toolForm.value.id, payload) : await ws.addTool(ws.activeCategory.id, payload)
  isSavingTool.value = false
  if (ok) isToolModalOpen.value = false
}
</script>

<style>
.scrollbar-none { scrollbar-width: none; }
.scrollbar-none::-webkit-scrollbar { display: none; }
</style>
