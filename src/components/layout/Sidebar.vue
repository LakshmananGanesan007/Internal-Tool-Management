<template>
  <div v-if="uiStore.isSidebarOpen" @click="uiStore.toggleSidebar" class="fixed inset-0 bg-gray-900/50 z-30 lg:hidden"></div>

  <aside class="fixed lg:static inset-y-0 left-0 z-40 w-[280px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ease-in-out shadow-sm lg:shadow-none overflow-hidden" :class="uiStore.isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'">
    
    <a href="/" class="h-24 flex items-center px-6 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer shrink-0">
      <img v-if="workspaceStore.currentWorkspace?.logo_url" :src="workspaceStore.currentWorkspace.logo_url" class="w-12 h-12 rounded-xl bg-white object-cover mr-4 shadow-sm border border-gray-200 dark:border-gray-700 flex-shrink-0" />
      <div v-else class="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-2xl mr-4 shadow-sm flex-shrink-0">
        {{ workspaceStore.currentWorkspace?.name.charAt(0).toUpperCase() || 'W' }}
      </div>
      
      <div class="flex-1 overflow-hidden flex items-center">
        <img v-if="workspaceStore.currentWorkspace?.wordmark_url" :src="workspaceStore.currentWorkspace.wordmark_url" class="h-8 object-contain max-w-full" alt="Wordmark" />
        <span v-else class="font-bold text-xl text-gray-900 dark:text-white truncate tracking-tight">
          {{ workspaceStore.currentWorkspace?.name || 'Loading...' }}
        </span>
      </div>
    </a>

    <nav class="flex-1 overflow-y-auto p-4 space-y-5">
      <div>
        <router-link to="/favorites" class="flex items-center px-4 py-3 text-base font-bold rounded-xl transition-colors" :class="$route.path === '/favorites' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'">
          <HeartIcon class="mr-4 flex-shrink-0 h-5 w-5" :class="$route.path === '/favorites' ? 'text-red-500 fill-current' : 'text-gray-400'" /> Favorites
        </router-link>
      </div>

      <div>
        <div class="flex items-center justify-between px-3 mb-3">
          <p class="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Channels</p>
          <button v-if="uiStore.isEditMode" @click="openChannelModal()" class="text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1.5 rounded-lg transition-colors" title="Add Channel">
            <PlusIcon class="w-4 h-4" />
          </button>
        </div>
        
        <draggable v-model="workspaceStore.channels" item-key="id" :disabled="!uiStore.isEditMode" @end="workspaceStore.saveChannelOrder" class="space-y-1.5" handle=".chan-drag-handle">
          <template #item="{ element: channel }">
            <div class="flex flex-col">
              
              <div class="group flex items-center justify-between px-3 py-3 text-lg font-bold rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer" :class="[uiStore.isEditMode ? 'border border-transparent hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-gray-900 shadow-sm' : '', workspaceStore.activeChannel?.id === channel.id && $route.path === '/' ? 'bg-blue-50/60 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : '']">
                
                <div @click="() => { workspaceStore.setActiveChannel(channel); router.push('/'); }" class="flex items-center flex-1 overflow-hidden transition-colors">
                  <GripVerticalIcon v-if="uiStore.isEditMode" class="chan-drag-handle w-5 h-5 mr-1 text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600 flex-shrink-0" />
                  
                  <img v-if="channel.icon_url" :src="channel.icon_url" class="w-8 h-8 mr-3 object-cover rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 flex-shrink-0" />
                  <div v-else class="w-8 h-8 mr-3 rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-center flex-shrink-0 text-base font-extrabold" :class="workspaceStore.activeChannel?.id === channel.id && $route.path === '/' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-gray-300 dark:group-hover:bg-gray-600 transition-colors'">
                    {{ channel.name.charAt(0).toUpperCase() }}
                  </div>
                  
                  <span class="truncate">{{ channel.name }}</span>
                </div>

                <div v-if="uiStore.isEditMode" class="hidden group-hover:flex items-center space-x-1 ml-2">
                  <button @click.stop="openChannelModal(channel)" class="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-100 dark:hover:bg-gray-700 rounded-md transition-colors"><Edit2Icon class="w-4 h-4" /></button>
                  <button @click.stop="workspaceStore.deleteChannel(channel.id)" class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-gray-700 rounded-md transition-colors"><Trash2Icon class="w-4 h-4" /></button>
                </div>
              </div>

              <div v-if="workspaceStore.activeChannel?.id === channel.id && $route.path === '/'" class="ml-9 mt-1 mb-3 space-y-1 relative border-l-2 border-gray-100 dark:border-gray-800 pl-3">
                <draggable v-model="workspaceStore.categories" item-key="id" :disabled="!uiStore.isEditMode" @end="workspaceStore.saveCategoryOrder" class="space-y-0.5" handle=".cat-drag-handle">
                  <template #item="{ element: category }">
                    <div class="group flex items-center justify-between py-1.5 px-3 text-sm font-medium rounded-lg cursor-pointer transition-colors" :class="[uiStore.isEditMode ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : '', workspaceStore.activeCategory?.id === category.id ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200']">
                      
                      <div v-if="editingCategoryId !== category.id" @click="workspaceStore.setActiveCategory(category)" class="flex items-center flex-1 overflow-hidden">
                        <GripVerticalIcon v-if="uiStore.isEditMode" class="cat-drag-handle w-3.5 h-3.5 mr-2 text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600 flex-shrink-0" />
                        <span class="truncate">{{ category.name }}</span>
                      </div>

                      <div v-else class="flex items-center flex-1 gap-1">
                        <input v-model="editCategoryName" @keydown.enter.prevent="submitEditCategory" class="w-full bg-white dark:bg-gray-700 border border-blue-500 rounded px-2 py-1 outline-none text-xs font-semibold" autofocus />
                        <button @click.stop="submitEditCategory" class="text-green-500 hover:text-green-600 p-1"><CheckIcon class="w-4 h-4" /></button>
                        <button @click.stop="editingCategoryId = null" class="text-gray-400 hover:text-gray-600 p-1"><XIcon class="w-4 h-4" /></button>
                      </div>

                      <div v-if="uiStore.isEditMode && editingCategoryId !== category.id" class="hidden group-hover:flex items-center space-x-1 ml-2">
                        <button @click.stop="startEditCategory(category)" class="p-1 text-gray-400 hover:text-blue-500 rounded"><Edit2Icon class="w-3.5 h-3.5" /></button>
                        <button @click.stop="workspaceStore.deleteCategory(category.id)" class="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2Icon class="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </template>
                </draggable>

                <div v-if="uiStore.isEditMode" class="mt-1">
                  <div v-if="isAddingCategory" class="flex items-center gap-1 mt-1 px-2">
                    <input v-model="newCategoryName" @keydown.enter.prevent="submitAddCategory" placeholder="Category..." class="w-full bg-white dark:bg-gray-800 border border-blue-500 rounded-md px-2 py-1.5 outline-none text-xs font-semibold" autofocus />
                    <button @click="submitAddCategory" class="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"><CheckIcon class="w-4 h-4" /></button>
                    <button @click="isAddingCategory = false; newCategoryName = ''" class="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"><XIcon class="w-4 h-4" /></button>
                  </div>
                  <button v-else @click="isAddingCategory = true" class="flex items-center px-3 py-2 mt-1 text-xs font-bold rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors w-full">
                    <PlusIcon class="mr-2 flex-shrink-0 h-3.5 w-3.5" /> Add Category
                  </button>
                </div>
              </div>

            </div>
          </template>
        </draggable>

        <button v-if="uiStore.isEditMode" @click="openChannelModal()" class="w-full flex items-center px-4 py-3 mt-3 text-sm font-bold rounded-xl text-blue-600 dark:text-blue-400 border-2 border-dashed border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
          <PlusIcon class="mr-2 flex-shrink-0 h-4 w-4" /> Add Channel
        </button>
      </div>
    </nav>

    <div class="border-t border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
      <router-link to="/settings" class="flex items-center px-6 py-5 text-lg font-bold transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300" :class="$route.path === '/settings' ? 'bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400' : ''">
        <SettingsIcon class="mr-4 flex-shrink-0 h-6 w-6" :class="$route.path === '/settings' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'" /> Workspace Settings
      </router-link>
      <div class="p-5 px-6 border-t border-gray-200/60 dark:border-gray-800 flex items-center">
        <div class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl font-bold text-gray-600 dark:text-gray-300 shadow-inner">
          {{ authStore.user?.email?.charAt(0).toUpperCase() || 'U' }}
        </div>
        <div class="ml-4 truncate">
          <p class="text-base font-bold text-gray-700 dark:text-gray-300 truncate">{{ authStore.user?.email }}</p>
        </div>
      </div>
    </div>
  </aside>

  <div v-if="isChannelModalOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="closeChannelModal"></div>
    <div class="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 transform transition-all">
      <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center"><LayoutGridIcon class="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" /> {{ channelForm.id ? 'Edit Channel' : 'Add New Channel' }}</h3>
        <button @click="closeChannelModal" class="text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 p-1.5 rounded-lg transition-colors"><XIcon class="w-5 h-5" /></button>
      </div>
      <form @submit.prevent="submitChannel" class="p-6 space-y-6">
        <div>
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Channel Name <span class="text-red-500">*</span></label>
          <input v-model="channelForm.name" type="text" required placeholder="e.g. YouTube, Marketing, Design" class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" autofocus />
        </div>
        
        <div>
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Custom Channel Icon (Optional)</label>
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden">
              <img v-if="channelForm.iconPreview" :src="channelForm.iconPreview" class="w-full h-full object-cover" />
              <ImageIcon v-else class="w-6 h-6 text-gray-400" />
            </div>
            <div class="flex-1">
              <input type="file" ref="iconInput" @change="handleIconSelection" accept=".png,.jpg,.jpeg,.gif,.svg,.webp" class="hidden" />
              <button type="button" @click="triggerIconInput" class="text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">Choose Image</button>
            </div>
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
          <button type="button" @click="closeChannelModal" class="px-6 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
          <button type="submit" :disabled="isSavingChannel" class="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 transition-all flex items-center">
            <Loader2Icon v-if="isSavingChannel" class="w-5 h-5 animate-spin mr-2" /> {{ isSavingChannel ? 'Saving...' : 'Save Channel' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUIStore } from '../../stores/ui'
import { useAuthStore } from '../../stores/auth'
import { useWorkspaceStore } from '../../stores/workspace'
import { Plus as PlusIcon, Trash2 as Trash2Icon, Edit2 as Edit2Icon, Check as CheckIcon, X as XIcon, Heart as HeartIcon, Settings as SettingsIcon, GripVertical as GripVerticalIcon, Image as ImageIcon, Loader2 as Loader2Icon, LayoutGrid as LayoutGridIcon } from 'lucide-vue-next'
import draggable from 'vuedraggable'

const router = useRouter()
const uiStore = useUIStore()
const authStore = useAuthStore()
const workspaceStore = useWorkspaceStore()

const isChannelModalOpen = ref(false); const isSavingChannel = ref(false); const iconInput = ref<HTMLInputElement | null>(null)
const channelForm = ref({ id: '', name: '', iconFile: null as File | null, iconPreview: '', existingIconUrl: '' })

// NEW: Function to trigger file input safely without $refs in template
const triggerIconInput = () => {
  if (iconInput.value) {
    iconInput.value.click()
  }
}

const openChannelModal = (channel?: any) => {
  if (channel) channelForm.value = { id: channel.id, name: channel.name, iconFile: null, iconPreview: channel.icon_url || '', existingIconUrl: channel.icon_url || '' }
  else channelForm.value = { id: '', name: '', iconFile: null, iconPreview: '', existingIconUrl: '' }
  isChannelModalOpen.value = true
}

const closeChannelModal = () => { isChannelModalOpen.value = false }

const handleIconSelection = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) { 
    channelForm.value.iconFile = target.files[0]; 
    channelForm.value.iconPreview = URL.createObjectURL(target.files[0]) 
  }
}

const submitChannel = async () => {
  if (!channelForm.value.name.trim()) return
  isSavingChannel.value = true
  try {
    let finalIconUrl = channelForm.value.existingIconUrl
    if (channelForm.value.iconFile) {
      const uploadedUrl = await workspaceStore.uploadChannelIcon(channelForm.value.iconFile)
      if (uploadedUrl) finalIconUrl = uploadedUrl
    }
    if (channelForm.value.id) await workspaceStore.updateChannel(channelForm.value.id, channelForm.value.name.trim(), finalIconUrl)
    else await workspaceStore.addChannel(channelForm.value.name.trim(), finalIconUrl)
  } catch (error) { uiStore.addToast("Error saving channel.", "error") } 
  finally { isSavingChannel.value = false; closeChannelModal() }
}

const isAddingCategory = ref(false); const newCategoryName = ref(''); const editingCategoryId = ref<string | null>(null); const editCategoryName = ref('')
const submitAddCategory = async () => { if (newCategoryName.value.trim()) await workspaceStore.addCategory(newCategoryName.value); isAddingCategory.value = false; newCategoryName.value = '' }
const startEditCategory = (category: any) => { editingCategoryId.value = category.id; editCategoryName.value = category.name }
const submitEditCategory = async () => { if (editCategoryName.value.trim() && editingCategoryId.value) await workspaceStore.updateCategory(editingCategoryId.value, editCategoryName.value); editingCategoryId.value = null }
</script>