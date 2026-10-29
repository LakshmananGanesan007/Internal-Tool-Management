<template>
  <div v-if="ui.isSidebarOpen" @click="ui.closeSidebar" class="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"></div>

  <aside class="fixed lg:static inset-y-0 left-0 z-50 w-[86vw] max-w-[320px] lg:w-[280px] lg:max-w-none bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none overflow-hidden safe-top"
    :class="ui.isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'">

    <div class="h-20 lg:h-24 flex items-center px-4 lg:px-6 border-b border-gray-200 dark:border-gray-800 shrink-0">
      <router-link to="/" class="flex items-center flex-1 min-w-0">
        <img v-if="ws.currentWorkspace?.logo_url" :src="ws.currentWorkspace.logo_url" class="w-11 h-11 rounded-xl bg-white object-cover mr-3 shadow-sm border border-gray-200 dark:border-gray-700 shrink-0" alt="" />
        <div v-else class="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl mr-3 shrink-0">
          {{ ws.currentWorkspace?.name?.charAt(0).toUpperCase() || 'T' }}
        </div>
        <img v-if="ws.currentWorkspace?.wordmark_url" :src="ws.currentWorkspace.wordmark_url" class="h-7 object-contain max-w-full" alt="" />
        <span v-else class="font-bold text-lg truncate tracking-tight">{{ ws.currentWorkspace?.name || 'ToolHive' }}</span>
      </router-link>
      <button @click="ui.closeSidebar" class="lg:hidden p-2 -mr-2 text-gray-400" aria-label="Close menu"><XIcon class="w-5 h-5" /></button>
    </div>

    <nav class="flex-1 overflow-y-auto overscroll-contain p-3 space-y-4">
      <div class="space-y-1">
        <router-link v-for="l in links" :key="l.to" :to="l.to" class="flex items-center px-3 py-3 text-base font-bold rounded-xl transition-colors"
          :class="route.path === l.to ? l.active : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'">
          <component :is="l.icon" class="mr-3 h-5 w-5 shrink-0" /> {{ l.label }}
          <span v-if="l.to === '/tasks' && tasks.openCount" class="ml-auto text-xs bg-blue-600 text-white rounded-full px-2 py-0.5">{{ tasks.openCount }}</span>
        </router-link>
      </div>

      <div>
        <div class="flex items-center justify-between px-3 mb-2">
          <p class="text-xs font-black text-gray-400 uppercase tracking-widest">Channels</p>
          <button @click="ui.toggleEditMode" class="text-xs font-bold px-2.5 py-1.5 rounded-lg border" :class="ui.isEditMode ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-500'">
            {{ ui.isEditMode ? 'Done' : 'Edit' }}
          </button>
        </div>

        <p v-if="!ws.channels.length" class="px-3 py-4 text-sm text-gray-500">No channels yet. Tap <b>Edit</b>, then <b>Add Channel</b>.</p>

        <draggable v-model="ws.channels" item-key="id" :disabled="!ui.isEditMode" @end="ws.saveChannelOrder" class="space-y-1" handle=".chan-drag-handle" :delay="120" :delay-on-touch-only="true" :animation="150">
          <template #item="{ element: channel }">
            <div class="flex flex-col">
              <div class="flex items-center px-2 py-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                :class="ws.activeChannel?.id === channel.id && route.path === '/' ? 'bg-blue-50/70 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'">
                <GripVerticalIcon v-if="ui.isEditMode" class="chan-drag-handle touch-none-important w-6 h-6 p-0.5 mr-1 text-gray-400 cursor-grab shrink-0" />
                <button @click="openChannel(channel)" class="flex items-center flex-1 min-w-0 py-2 text-left text-base font-bold">
                  <img v-if="channel.icon_url" :src="channel.icon_url" loading="lazy" class="w-8 h-8 mr-3 object-cover rounded-lg border border-gray-200/50 dark:border-gray-700/50 shrink-0" alt="" />
                  <span v-else class="w-8 h-8 mr-3 rounded-lg flex items-center justify-center shrink-0 text-sm font-extrabold"
                    :class="ws.activeChannel?.id === channel.id && route.path === '/' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'">{{ channel.name.charAt(0).toUpperCase() }}</span>
                  <span class="truncate">{{ channel.name }}</span>
                </button>
                <div v-if="ui.isEditMode" class="flex items-center shrink-0">
                  <button @click="openChannelModal(channel)" class="p-2.5 text-gray-400 hover:text-blue-500 rounded-lg" aria-label="Edit channel"><Edit2Icon class="w-4 h-4" /></button>
                  <button @click="ws.deleteChannel(channel.id)" class="p-2.5 text-gray-400 hover:text-red-500 rounded-lg" aria-label="Delete channel"><Trash2Icon class="w-4 h-4" /></button>
                </div>
              </div>

              <div v-if="ws.activeChannel?.id === channel.id && route.path === '/'" class="ml-8 mt-1 mb-2 border-l-2 border-gray-100 dark:border-gray-800 pl-2">
                <draggable v-model="ws.categories" item-key="id" :disabled="!ui.isEditMode" @end="ws.saveCategoryOrder" class="space-y-0.5" handle=".cat-drag-handle" :delay="120" :delay-on-touch-only="true" :animation="150">
                  <template #item="{ element: category }">
                    <div class="flex items-center rounded-lg text-sm font-medium"
                      :class="ws.activeCategory?.id === category.id ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400'">
                      <template v-if="editingCategoryId !== category.id">
                        <GripVerticalIcon v-if="ui.isEditMode" class="cat-drag-handle touch-none-important w-5 h-5 ml-1 text-gray-400 cursor-grab shrink-0" />
                        <button @click="openCategory(category)" class="flex-1 min-w-0 text-left px-2.5 py-2.5 truncate">{{ category.name }}</button>
                        <div v-if="ui.isEditMode" class="flex shrink-0">
                          <button @click="startEditCategory(category)" class="p-2 text-gray-400 hover:text-blue-500" aria-label="Rename category"><Edit2Icon class="w-3.5 h-3.5" /></button>
                          <button @click="ws.deleteCategory(category.id)" class="p-2 text-gray-400 hover:text-red-500" aria-label="Delete category"><Trash2Icon class="w-3.5 h-3.5" /></button>
                        </div>
                      </template>
                      <div v-else class="flex items-center flex-1 gap-1 p-1">
                        <input v-model="editCategoryName" @keydown.enter.prevent="submitEditCategory" @keydown.esc="editingCategoryId = null" class="w-full min-w-0 bg-white dark:bg-gray-700 border border-blue-500 rounded-lg px-2 py-2 outline-none font-semibold" />
                        <button @click="submitEditCategory" class="p-2 text-green-500" aria-label="Save"><CheckIcon class="w-4 h-4" /></button>
                        <button @click="editingCategoryId = null" class="p-2 text-gray-400" aria-label="Cancel"><XIcon class="w-4 h-4" /></button>
                      </div>
                    </div>
                  </template>
                </draggable>

                <div v-if="ui.isEditMode" class="mt-1">
                  <div v-if="isAddingCategory" class="flex items-center gap-1 p-1">
                    <input v-model="newCategoryName" @keydown.enter.prevent="submitAddCategory" @keydown.esc="cancelAddCategory" placeholder="Category name" class="w-full min-w-0 bg-white dark:bg-gray-800 border border-blue-500 rounded-lg px-2 py-2 outline-none font-semibold" />
                    <button @click="submitAddCategory" class="p-2 text-green-500" aria-label="Save category"><CheckIcon class="w-4 h-4" /></button>
                    <button @click="cancelAddCategory" class="p-2 text-gray-500" aria-label="Cancel"><XIcon class="w-4 h-4" /></button>
                  </div>
                  <button v-else @click="isAddingCategory = true" class="flex items-center px-3 py-2.5 text-sm font-bold rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full">
                    <PlusIcon class="mr-2 h-4 w-4" /> Add Category
                  </button>
                </div>
              </div>
            </div>
          </template>
        </draggable>

        <button v-if="ui.isEditMode" @click="openChannelModal()" class="w-full flex items-center px-4 py-3 mt-3 text-sm font-bold rounded-xl text-blue-600 dark:text-blue-400 border-2 border-dashed border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20">
          <PlusIcon class="mr-2 h-4 w-4" /> Add Channel
        </button>
      </div>
    </nav>

    <router-link to="/settings" class="border-t border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 shrink-0 safe-bottom">
      <img v-if="avatar" :src="avatar" class="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
      <div v-else class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 shrink-0">{{ auth.user?.email?.charAt(0).toUpperCase() || 'U' }}</div>
      <div class="min-w-0">
        <p class="text-sm font-bold truncate">{{ auth.user?.user_metadata?.full_name || 'My account' }}</p>
        <p class="text-xs text-gray-500 truncate">{{ auth.user?.email }}</p>
      </div>
    </router-link>
  </aside>

  <BaseModal v-model="isChannelModalOpen" :title="channelForm.id ? 'Edit Channel' : 'Add New Channel'">
    <form @submit.prevent="submitChannel" class="space-y-5">
      <div>
        <label class="block text-sm font-bold mb-2">Channel Name <span class="text-red-500">*</span></label>
        <input v-model="channelForm.name" type="text" required maxlength="40" placeholder="e.g. Marketing, Design" class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-sm font-bold mb-3">Channel Icon (optional)</label>
        <ImagePicker v-model="channelForm.iconFile" :existing-url="channelForm.existingIconUrl" @remove="channelForm.existingIconUrl = ''" />
      </div>
      <div class="flex justify-end gap-3 pt-2">
        <button type="button" @click="isChannelModalOpen = false" class="px-5 py-3 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
        <button type="submit" :disabled="isSavingChannel" class="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 disabled:opacity-50 flex items-center">
          <Loader2Icon v-if="isSavingChannel" class="w-5 h-5 animate-spin mr-2" /> {{ isSavingChannel ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import draggable from 'vuedraggable'
import { Plus as PlusIcon, Trash2 as Trash2Icon, Edit2 as Edit2Icon, Check as CheckIcon, X as XIcon, Heart as HeartIcon, Settings as SettingsIcon, GripVertical as GripVerticalIcon, Loader2 as Loader2Icon, Home as HomeIcon, CheckSquare as CheckSquareIcon } from 'lucide-vue-next'
import BaseModal from '../common/BaseModal.vue'
import ImagePicker from '../common/ImagePicker.vue'
import { useUIStore } from '../../stores/ui'
import { useAuthStore } from '../../stores/auth'
import { useWorkspaceStore } from '../../stores/workspace'
import { useTaskStore } from '../../stores/tasks'
import type { Channel, Category } from '../../types'

const route = useRoute(); const router = useRouter()
const ui = useUIStore(); const auth = useAuthStore(); const ws = useWorkspaceStore(); const tasks = useTaskStore()

const avatar = computed(() => auth.user?.user_metadata?.avatar_url as string | undefined)
const links = [
  { to: '/', label: 'Dashboard', icon: HomeIcon, active: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
  { to: '/tasks', label: 'Tasks', icon: CheckSquareIcon, active: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
  { to: '/favorites', label: 'Favorites', icon: HeartIcon, active: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, active: 'bg-gray-100 text-blue-600 dark:bg-gray-800 dark:text-blue-400' },
]

const openChannel = async (c: Channel) => { await ws.setActiveChannel(c); if (route.path !== '/') router.push('/'); else if (!ui.isEditMode && window.innerWidth < 1024 && !ws.categories.length) ui.closeSidebar() }
const openCategory = async (c: Category) => { await ws.setActiveCategory(c); if (route.path !== '/') router.push('/'); ui.closeSidebar() }

// --- Channel modal ---
const isChannelModalOpen = ref(false); const isSavingChannel = ref(false)
const channelForm = ref({ id: '', name: '', iconFile: null as File | null, existingIconUrl: '' })
const openChannelModal = (c?: Channel) => {
  channelForm.value = c ? { id: c.id, name: c.name, iconFile: null, existingIconUrl: c.icon_url || '' } : { id: '', name: '', iconFile: null, existingIconUrl: '' }
  isChannelModalOpen.value = true
}
const submitChannel = async () => {
  const name = channelForm.value.name.trim(); if (!name || isSavingChannel.value) return
  isSavingChannel.value = true
  try {
    let icon = channelForm.value.existingIconUrl
    if (channelForm.value.iconFile) icon = (await ws.uploadChannelIcon(channelForm.value.iconFile)) || icon
    if (channelForm.value.id) await ws.updateChannel(channelForm.value.id, name, icon)
    else await ws.addChannel(name, icon || undefined)
    isChannelModalOpen.value = false
  } catch (e: any) { ui.addToast(e?.message || 'Could not save channel', 'error') }
  finally { isSavingChannel.value = false }
}

// --- Category inline editing ---
const isAddingCategory = ref(false); const newCategoryName = ref('')
const editingCategoryId = ref<string | null>(null); const editCategoryName = ref('')
const cancelAddCategory = () => { isAddingCategory.value = false; newCategoryName.value = '' }
const submitAddCategory = async () => { const n = newCategoryName.value.trim(); cancelAddCategory(); if (n) await ws.addCategory(n) }
const startEditCategory = (c: Category) => { editingCategoryId.value = c.id; editCategoryName.value = c.name }
const submitEditCategory = async () => { const id = editingCategoryId.value; const n = editCategoryName.value.trim(); editingCategoryId.value = null; if (id && n) await ws.updateCategory(id, n) }
</script>
