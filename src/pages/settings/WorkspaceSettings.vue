<template>
  <div class="max-w-3xl mx-auto">
    <h1 class="text-2xl sm:text-3xl font-bold mb-5">Settings</h1>

    <!-- Tabs: scroll sideways on phones -->
    <div class="flex gap-1 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-6 pb-1 scrollbar-none border-b border-gray-200 dark:border-gray-800">
      <button v-for="t in tabs" :key="t.key" @click="tab = t.key" class="flex items-center px-4 py-3 text-sm font-bold shrink-0 border-b-2 -mb-px transition-colors"
        :class="tab === t.key ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'">
        <component :is="t.icon" class="w-4 h-4 mr-2" />{{ t.label }}
      </button>
    </div>

    <!-- PROFILE -->
    <div v-show="tab === 'profile'" class="space-y-5">
      <section class="card p-5 sm:p-6">
        <h2 class="font-bold text-lg mb-4">Profile photo</h2>
        <div class="flex items-center gap-4">
          <img v-if="avatar" :src="avatar" class="w-20 h-20 rounded-full object-cover" alt="" />
          <div v-else class="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl font-bold text-gray-600 dark:text-gray-300">{{ initial }}</div>
          <div class="flex flex-wrap gap-2">
            <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="e => pick(e, ws.uploadProfilePicture, 'avatar')" />
            <button @click="avatarInput?.click()" :disabled="busy.avatar" class="btn-ghost !py-2.5"><Loader2Icon v-if="busy.avatar" class="w-4 h-4 animate-spin mr-2" />{{ avatar ? 'Change' : 'Upload' }}</button>
            <button v-if="avatar" @click="ws.deleteProfilePicture" class="px-3 py-2.5 rounded-xl font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Remove</button>
          </div>
        </div>
      </section>

      <section class="card p-5 sm:p-6">
        <h2 class="font-bold text-lg mb-4">Display name</h2>
        <form @submit.prevent="saveName" class="flex flex-col sm:flex-row gap-3">
          <input v-model="displayName" maxlength="60" placeholder="Your name" class="field flex-1" />
          <button type="submit" :disabled="busy.name || displayName.trim() === (auth.user?.user_metadata?.full_name || '')" class="btn-primary">Save</button>
        </form>
      </section>

      <section class="card p-5 sm:p-6">
        <h2 class="font-bold text-lg mb-1">Email address</h2>
        <p class="text-sm text-gray-500 mb-4">Changing it requires a one-time code sent to the new address.</p>
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="flex-1 min-w-0 flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <MailIcon class="w-5 h-5 text-gray-400 shrink-0" /><span class="truncate font-medium">{{ auth.user?.email }}</span>
          </div>
          <button @click="openEmailModal" class="btn-ghost">Change email</button>
        </div>
        <p v-if="auth.user?.new_email" class="text-sm text-amber-600 mt-3">A change to <b>{{ auth.user.new_email }}</b> is waiting for confirmation.</p>
      </section>
    </div>

    <!-- SECURITY -->
    <div v-show="tab === 'security'" class="space-y-5">
      <section class="card p-5 sm:p-6">
        <h2 class="font-bold text-lg mb-1">Password</h2>
        <p class="text-sm text-gray-500 mb-4">For your safety your password is never shown. To change it, we email a secure link to <b>{{ auth.user?.email }}</b>.</p>
        <button @click="sendReset" :disabled="resetBusy || cooldown > 0" class="btn-primary">
          <Loader2Icon v-if="resetBusy" class="w-4 h-4 animate-spin mr-2" /><KeyRoundIcon v-else class="w-4 h-4 mr-2" />
          {{ cooldown > 0 ? `Link sent · resend in ${cooldown}s` : 'Email me a password reset link' }}
        </button>
      </section>

      <section class="card p-5 sm:p-6">
        <h2 class="font-bold text-lg mb-1">Sessions</h2>
        <p class="text-sm text-gray-500 mb-4">Signed in on a device you lost or no longer use? Sign out everywhere else.</p>
        <div class="flex flex-col sm:flex-row gap-3">
          <button @click="signOutOthers" :disabled="busy.others" class="btn-ghost">Sign out other devices</button>
          <button @click="signOut" class="btn-ghost !text-red-600 !border-red-200 dark:!border-red-900/50"><LogOutIcon class="w-4 h-4 mr-2" />Sign out</button>
        </div>
      </section>
    </div>

    <!-- WORKSPACE -->
    <div v-show="tab === 'workspace'" class="space-y-5">
      <section class="card p-5 sm:p-6">
        <h2 class="font-bold text-lg mb-4">Workspace name</h2>
        <form @submit.prevent="ws.updateWorkspaceName(workspaceName)" class="flex flex-col sm:flex-row gap-3">
          <input v-model="workspaceName" maxlength="60" class="field flex-1" />
          <button type="submit" :disabled="!workspaceName.trim() || workspaceName.trim() === ws.currentWorkspace?.name" class="btn-primary">Save</button>
        </form>
      </section>

      <section class="card p-5 sm:p-6">
        <h2 class="font-bold text-lg mb-1">Branding</h2>
        <p class="text-sm text-gray-500 mb-5">Shown in the sidebar, the loading screen and your browser tab.</p>
        <div class="space-y-6">
          <div class="flex items-center gap-4">
            <img v-if="ws.currentWorkspace?.logo_url" :src="ws.currentWorkspace.logo_url" class="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-gray-700" alt="" />
            <div v-else class="w-16 h-16 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-2xl">{{ ws.currentWorkspace?.name?.charAt(0).toUpperCase() }}</div>
            <div class="flex-1 min-w-0">
              <p class="font-bold">Logo</p>
              <div class="flex flex-wrap gap-2 mt-2">
                <input ref="logoInput" type="file" accept="image/*" class="hidden" @change="e => pick(e, ws.uploadLogo, 'logo')" />
                <button @click="logoInput?.click()" :disabled="busy.logo" class="btn-ghost !py-2"><Loader2Icon v-if="busy.logo" class="w-4 h-4 animate-spin mr-2" />Upload</button>
                <button v-if="ws.currentWorkspace?.logo_url" @click="ws.deleteLogo" class="px-3 py-2 rounded-xl font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Remove</button>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden p-1">
              <img v-if="ws.currentWorkspace?.wordmark_url" :src="ws.currentWorkspace.wordmark_url" class="max-w-full max-h-full object-contain" alt="" /><ImageIcon v-else class="w-6 h-6 text-gray-400" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-bold">Text logo</p>
              <div class="flex flex-wrap gap-2 mt-2">
                <input ref="wordmarkInput" type="file" accept="image/*" class="hidden" @change="e => pick(e, ws.uploadWordmark, 'wordmark')" />
                <button @click="wordmarkInput?.click()" :disabled="busy.wordmark" class="btn-ghost !py-2"><Loader2Icon v-if="busy.wordmark" class="w-4 h-4 animate-spin mr-2" />Upload</button>
                <button v-if="ws.currentWorkspace?.wordmark_url" @click="ws.deleteWordmark" class="px-3 py-2 rounded-xl font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Remove</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="card p-5 sm:p-6">
        <h2 class="font-bold text-lg mb-4">Appearance</h2>
        <button @click="ui.toggleDark()" class="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700">
          <span class="flex items-center font-semibold"><MoonIcon v-if="ui.isDark" class="w-5 h-5 mr-3" /><SunIcon v-else class="w-5 h-5 mr-3" />Dark mode</span>
          <span class="w-11 h-6 rounded-full p-0.5 transition-colors" :class="ui.isDark ? 'bg-blue-600' : 'bg-gray-300'"><span class="block w-5 h-5 rounded-full bg-white transition-transform" :class="ui.isDark ? 'translate-x-5' : ''"></span></span>
        </button>
      </section>
    </div>

    <!-- DATA -->
    <div v-show="tab === 'data'" class="space-y-5">
      <section class="card p-5 sm:p-6">
        <h2 class="font-bold text-lg mb-4">Your workspace at a glance</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div v-for="s in stats" :key="s.label" class="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 text-center"><p class="text-2xl font-extrabold">{{ s.value }}</p><p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">{{ s.label }}</p></div>
        </div>
      </section>

      <section class="card p-5 sm:p-6">
        <h2 class="font-bold text-lg mb-1">Backup &amp; restore</h2>
        <p class="text-sm text-gray-500 mb-4">Download everything (channels, categories, tools, favorites) as a JSON file, or restore from one. Restoring adds to what you already have.</p>
        <div class="flex flex-col sm:flex-row gap-3">
          <button @click="ws.exportBackup" class="btn-ghost"><DownloadIcon class="w-4 h-4 mr-2" />Download backup</button>
          <input ref="importInput" type="file" accept=".json,application/json" class="hidden" @change="onImport" />
          <button @click="importInput?.click()" :disabled="ws.isFetching" class="btn-ghost"><Loader2Icon v-if="ws.isFetching" class="w-4 h-4 animate-spin mr-2" /><UploadIcon v-else class="w-4 h-4 mr-2" />Restore from file</button>
        </div>
      </section>
    </div>

    <!-- Change email -->
    <BaseModal v-model="emailOpen" title="Change email">
      <form v-if="emailStep === 1" @submit.prevent="requestEmail" class="space-y-4">
        <div><label class="block text-sm font-bold mb-2">New email address</label>
          <input v-model="newEmail" type="email" required inputmode="email" autocomplete="email" class="field" placeholder="new@company.com" /></div>
        <p class="text-sm text-gray-500">We'll send a 6-digit code to this address to confirm it's yours.</p>
        <p v-if="emailError" class="text-sm text-red-600" role="alert">{{ emailError }}</p>
        <div class="flex justify-end gap-3"><button type="button" @click="emailOpen = false" class="btn-ghost">Cancel</button>
          <button type="submit" :disabled="busy.email" class="btn-primary"><Loader2Icon v-if="busy.email" class="w-4 h-4 animate-spin mr-2" />Send code</button></div>
      </form>
      <form v-else @submit.prevent="confirmEmail" class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-300">Enter the code we sent to <b>{{ emailStep === 2 ? newEmail : oldEmail }}</b>.</p>
        <input v-model="otp" required inputmode="numeric" autocomplete="one-time-code" maxlength="8" class="field text-center text-2xl tracking-[0.4em] font-bold" placeholder="••••••" />
        <p v-if="emailError" class="text-sm text-red-600" role="alert">{{ emailError }}</p>
        <div class="flex justify-end gap-3"><button type="button" @click="emailStep = 1" class="btn-ghost" v-if="emailStep === 2">Back</button>
          <button type="submit" :disabled="busy.email || otp.length < 6" class="btn-primary"><Loader2Icon v-if="busy.email" class="w-4 h-4 animate-spin mr-2" />Verify</button></div>
      </form>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { User as UserIcon, Shield as ShieldIcon, Building2 as BuildingIcon, Database as DatabaseIcon, Mail as MailIcon, KeyRound as KeyRoundIcon, LogOut as LogOutIcon, Image as ImageIcon, Download as DownloadIcon, Upload as UploadIcon, Loader2 as Loader2Icon, Sun as SunIcon, Moon as MoonIcon } from 'lucide-vue-next'
import BaseModal from '../../components/common/BaseModal.vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { useUIStore } from '../../stores/ui'
import { useAuthStore } from '../../stores/auth'

const ws = useWorkspaceStore(); const ui = useUIStore(); const auth = useAuthStore(); const router = useRouter()

type Tab = 'profile' | 'security' | 'workspace' | 'data'
const tab = ref<Tab>('profile')
const tabs = [
  { key: 'profile' as Tab, label: 'Profile', icon: UserIcon }, { key: 'security' as Tab, label: 'Security', icon: ShieldIcon },
  { key: 'workspace' as Tab, label: 'Workspace', icon: BuildingIcon }, { key: 'data' as Tab, label: 'Data', icon: DatabaseIcon },
]

const avatar = computed(() => auth.user?.user_metadata?.avatar_url as string | undefined)
const initial = computed(() => (auth.user?.user_metadata?.full_name || auth.user?.email || 'U').charAt(0).toUpperCase())

const busy = ref<Record<string, boolean>>({})
const avatarInput = ref<HTMLInputElement | null>(null); const logoInput = ref<HTMLInputElement | null>(null)
const wordmarkInput = ref<HTMLInputElement | null>(null); const importInput = ref<HTMLInputElement | null>(null)

async function pick(e: Event, fn: (f: File) => Promise<unknown>, key: string) {
  const t = e.target as HTMLInputElement; const f = t.files?.[0]; t.value = ''
  if (!f) return
  busy.value[key] = true
  try { await fn(f) } finally { busy.value[key] = false }
}

// --- Display name ---
const displayName = ref(auth.user?.user_metadata?.full_name || '')
const saveName = async () => {
  busy.value.name = true
  try { await auth.updateProfile({ full_name: displayName.value.trim() }); ui.addToast('Name saved') }
  catch { ui.addToast('Could not save name', 'error') } finally { busy.value.name = false }
}

// --- Workspace name ---
const workspaceName = ref('')
watch(() => ws.currentWorkspace?.name, (n) => { workspaceName.value = n || '' }, { immediate: true })

// --- Email change via OTP ---
const emailOpen = ref(false); const emailStep = ref<1 | 2 | 3>(1)
const newEmail = ref(''); const oldEmail = ref(''); const otp = ref(''); const emailError = ref('')
const openEmailModal = () => { emailStep.value = 1; newEmail.value = ''; otp.value = ''; emailError.value = ''; oldEmail.value = auth.user?.email || ''; emailOpen.value = true }

async function requestEmail() {
  emailError.value = ''
  const e = newEmail.value.trim().toLowerCase()
  if (e === oldEmail.value.toLowerCase()) { emailError.value = 'That is already your email.'; return }
  busy.value.email = true
  try { await auth.requestEmailChange(e); newEmail.value = e; otp.value = ''; emailStep.value = 2 }
  catch (err: any) { emailError.value = err?.message || 'Could not send the code.' }
  finally { busy.value.email = false }
}

async function confirmEmail() {
  emailError.value = ''; busy.value.email = true
  try {
    const user = await auth.verifyEmailChange(emailStep.value === 2 ? newEmail.value : oldEmail.value, otp.value)
    if (user?.email?.toLowerCase() === newEmail.value) { emailOpen.value = false; ui.addToast('Email updated') }
    else if (emailStep.value === 2) { emailStep.value = 3; otp.value = '' } // "secure email change": also confirm from the current address
    else { emailOpen.value = false; ui.addToast('Email change confirmed') }
  } catch (err: any) { emailError.value = err?.message || 'That code is invalid or has expired.' }
  finally { busy.value.email = false }
}

// --- Password reset link (with a resend cooldown) ---
const resetBusy = ref(false); const cooldown = ref(0); let timer: ReturnType<typeof setInterval> | undefined
async function sendReset() {
  if (!auth.user?.email) return
  resetBusy.value = true
  try {
    await auth.sendPasswordResetLink(auth.user.email)
    ui.addToast('Reset link sent. Check your inbox.')
    cooldown.value = 60; clearInterval(timer)
    timer = setInterval(() => { cooldown.value--; if (cooldown.value <= 0) clearInterval(timer) }, 1000)
  } catch (e: any) { ui.addToast(e?.message || 'Could not send the email', 'error') }
  finally { resetBusy.value = false }
}
onBeforeUnmount(() => clearInterval(timer))

// --- Sessions ---
async function signOutOthers() {
  busy.value.others = true
  try { await auth.logoutOtherDevices(); ui.addToast('Signed out of other devices') }
  catch { ui.addToast('Could not sign out other devices', 'error') } finally { busy.value.others = false }
}
async function signOut() { await auth.logout(); ws.reset(); router.push('/login') }

// --- Data ---
const stats = computed(() => [
  { label: 'Channels', value: ws.channels.length }, { label: 'Categories', value: ws.allWorkspaceCategories.length },
  { label: 'Tools', value: ws.allWorkspaceTools.length }, { label: 'Favorites', value: ws.favoriteToolIds.length },
])

function onImport(e: Event) {
  const t = e.target as HTMLInputElement; const f = t.files?.[0]; t.value = ''
  if (!f) return
  if (f.size > 5 * 1024 * 1024) return ui.addToast('Backup file is too large', 'error')
  const reader = new FileReader()
  reader.onload = async () => {
    let data: unknown
    try { data = JSON.parse(String(reader.result)) } catch { return ui.addToast('That file is not valid JSON.', 'error') }
    await ws.restoreBackup(data)
  }
  reader.onerror = () => ui.addToast('Could not read the file', 'error')
  reader.readAsText(f)
}
</script>
