<template>
  <div class="h-full max-w-4xl mx-auto pb-20">
    <div class="mb-8 flex items-center">
      <SettingsIcon class="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
    </div>

    <div class="space-y-8">
      
      <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-6">Personal Profile</h2>
        
        <div class="flex items-center gap-6">
          <div class="relative group">
            <div class="relative w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden shadow-sm cursor-pointer" @click="$refs.avatarInput.click()">
              <img v-if="authStore.user?.user_metadata?.avatar_url" :src="authStore.user.user_metadata.avatar_url" class="w-full h-full object-cover" />
              <div v-else class="text-gray-500 font-bold text-2xl">{{ authStore.user?.email?.charAt(0).toUpperCase() }}</div>
              <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="text-white text-[10px] font-bold uppercase tracking-wider">Change</span>
              </div>
            </div>
            <button v-if="authStore.user?.user_metadata?.avatar_url" @click.stop="workspaceStore.deleteProfilePicture" class="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 shadow-md hover:bg-red-600 transition-all z-10">
              <Trash2Icon class="w-3.5 h-3.5" />
            </button>
            <input type="file" ref="avatarInput" @change="handleAvatarUpload" accept=".png,.jpg,.jpeg,.webp" class="hidden" />
          </div>
          
          <div>
            <h3 class="font-bold text-gray-900 dark:text-white">{{ authStore.user?.email }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Click your avatar to upload a custom profile picture.</p>
          </div>
        </div>
      </section>

      <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-6">Workspace Identity</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-gray-100 dark:border-gray-700 pb-8">
          
          <div class="flex flex-col items-start gap-4">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Brand Icon (Favicon / Square)</h3>
            <div class="relative group">
              <div class="relative w-32 h-32 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden cursor-pointer" @click="$refs.fileInput.click()">
                <img v-if="workspaceStore.currentWorkspace?.logo_url" :src="workspaceStore.currentWorkspace.logo_url" class="w-full h-full object-cover" />
                <ImageIcon v-else class="w-10 h-10 text-gray-400" />
                <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span class="text-white text-xs font-bold uppercase tracking-wider">Change</span></div>
              </div>
              <button v-if="workspaceStore.currentWorkspace?.logo_url" @click.stop="workspaceStore.deleteLogo" class="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 shadow-md hover:bg-red-600 transition-all z-10">
                <Trash2Icon class="w-4 h-4" />
              </button>
            </div>
            <input type="file" ref="fileInput" @change="handleFileUpload" accept=".png,.jpg,.jpeg,.gif,.svg,.webp" class="hidden" />
          </div>

          <div class="flex flex-col items-start gap-4">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Text Logo / Wordmark</h3>
            <div class="relative group">
              <div class="relative w-full min-w-[200px] h-32 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden p-4 cursor-pointer" @click="$refs.wordmarkInput.click()">
                <img v-if="workspaceStore.currentWorkspace?.wordmark_url" :src="workspaceStore.currentWorkspace.wordmark_url" class="w-full h-full object-contain" />
                <div v-else class="text-gray-400 font-bold text-xl">{{ workspaceStore.currentWorkspace?.name || 'Wordmark' }}</div>
                <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span class="text-white text-xs font-bold uppercase tracking-wider">Change</span></div>
              </div>
              <button v-if="workspaceStore.currentWorkspace?.wordmark_url" @click.stop="workspaceStore.deleteWordmark" class="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 shadow-md hover:bg-red-600 transition-all z-10">
                <Trash2Icon class="w-4 h-4" />
              </button>
            </div>
            <input type="file" ref="wordmarkInput" @change="handleWordmarkUpload" accept=".png,.jpg,.jpeg,.gif,.svg,.webp" class="hidden" />
          </div>
        </div>
        
        <div class="w-full space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Workspace Text Name (Browser Tab)</label>
            <div class="flex items-center gap-2">
              <input v-model="workspaceNameInput" type="text" class="flex-1 max-w-md bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 dark:text-white font-medium" />
              <button @click="saveWorkspaceName" :disabled="workspaceNameInput === workspaceStore.currentWorkspace?.name" class="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">Save</button>
            </div>
          </div>
        </div>
      </section>

      <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Data Management</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col items-start">
            <div class="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center mb-3"><DownloadIcon class="w-5 h-5" /></div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-1">Export Data</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-1">Download a JSON backup of your tools.</p>
            <button @click="workspaceStore.exportBackup" class="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm">Export to JSON</button>
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col items-start">
            <div class="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-3"><UploadIcon class="w-5 h-5" /></div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-1">Import Data</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-1">Restore your dashboard from a backup.</p>
            <input type="file" ref="importInput" @change="handleImportUpload" accept=".json" class="hidden" />
            <button @click="$refs.importInput.click()" class="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm">Import JSON Backup</button>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { useUIStore } from '../../stores/ui'
import { useAuthStore } from '../../stores/auth'
import { Settings as SettingsIcon, Image as ImageIcon, Download as DownloadIcon, Upload as UploadIcon, Trash2 as Trash2Icon } from 'lucide-vue-next'

const workspaceStore = useWorkspaceStore()
const uiStore = useUIStore()
const authStore = useAuthStore()

const fileInput = ref<HTMLInputElement | null>(null)
const wordmarkInput = ref<HTMLInputElement | null>(null)
const avatarInput = ref<HTMLInputElement | null>(null)
const importInput = ref<HTMLInputElement | null>(null)
const workspaceNameInput = ref('')

watch(() => workspaceStore.currentWorkspace, (newWs) => {
  if (newWs) workspaceNameInput.value = newWs.name
}, { immediate: true })

const saveWorkspaceName = async () => { await workspaceStore.updateWorkspaceName(workspaceNameInput.value) }

const handleAvatarUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    await workspaceStore.uploadProfilePicture(target.files[0])
    target.value = '' // reset input
  }
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    await workspaceStore.uploadLogo(target.files[0])
    target.value = ''
  }
}

const handleWordmarkUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    await workspaceStore.uploadWordmark(target.files[0])
    target.value = ''
  }
}

const handleImportUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try { await workspaceStore.restoreBackup(JSON.parse(e.target?.result as string)) } 
      catch (err) { uiStore.addToast("Failed to parse JSON file.", "error") }
      target.value = ''
    }
    reader.readAsText(target.files[0])
  }
}
</script>