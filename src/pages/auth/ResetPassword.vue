<template>
  <AuthShell title="Choose a new password">
    <div v-if="!auth.user" class="text-center py-2">
      <p class="font-bold mb-1">This link is invalid or has expired</p>
      <p class="text-sm text-gray-500 mb-4">Request a new reset link and try again.</p>
      <router-link to="/forgot-password" class="inline-block px-6 py-3 rounded-xl bg-blue-600 text-white font-bold">Send a new link</router-link>
    </div>
    <form v-else class="space-y-5" @submit.prevent="submit">
      <div>
        <label for="pw" class="block text-sm font-bold mb-2">New password</label>
        <div class="relative">
          <input v-model="password" id="pw" :type="show ? 'text' : 'password'" required minlength="8" autocomplete="new-password" class="block w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500" placeholder="At least 8 characters" />
          <button type="button" @click="show = !show" class="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400" :aria-label="show ? 'Hide password' : 'Show password'">
            <EyeOffIcon v-if="show" class="w-5 h-5" /><EyeIcon v-else class="w-5 h-5" />
          </button>
        </div>
      </div>
      <div>
        <label for="pw2" class="block text-sm font-bold mb-2">Confirm password</label>
        <input v-model="confirm" id="pw2" :type="show ? 'text' : 'password'" required minlength="8" autocomplete="new-password" class="block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <p v-if="error" class="text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2" role="alert">{{ error }}</p>
      <button type="submit" :disabled="loading" class="w-full flex justify-center items-center py-3.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60">
        <Loader2Icon v-if="loading" class="w-5 h-5 animate-spin mr-2" /> {{ loading ? 'Saving…' : 'Update password' }}
      </button>
    </form>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye as EyeIcon, EyeOff as EyeOffIcon, Loader2 as Loader2Icon } from 'lucide-vue-next'
import AuthShell from '../../components/common/AuthShell.vue'
import { useAuthStore } from '../../stores/auth'
import { useUIStore } from '../../stores/ui'

const router = useRouter(); const auth = useAuthStore(); const ui = useUIStore()
const password = ref(''); const confirm = ref(''); const show = ref(false); const loading = ref(false); const error = ref('')

const submit = async () => {
  error.value = ''
  if (password.value !== confirm.value) { error.value = 'Passwords do not match.'; return }
  loading.value = true
  try { await auth.setNewPassword(password.value); ui.addToast('Password updated'); router.replace('/') }
  catch (e: any) { error.value = e?.message || 'Could not update password.' }
  finally { loading.value = false }
}
</script>
