<template>
  <AuthShell title="Reset password" subtitle="We'll email you a secure link to choose a new password.">
    <div v-if="sent" class="text-center py-2">
      <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><MailIcon class="w-6 h-6 text-green-600" /></div>
      <h2 class="font-bold text-lg mb-1">Check your email</h2>
      <p class="text-sm text-gray-500">If an account exists for <b>{{ email }}</b>, a reset link is on its way.</p>
    </div>
    <form v-else class="space-y-5" @submit.prevent="submit">
      <div>
        <label for="email" class="block text-sm font-bold mb-2">Email</label>
        <input v-model="email" id="email" type="email" required autocomplete="email" inputmode="email" class="block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@company.com" />
      </div>
      <p v-if="error" class="text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2" role="alert">{{ error }}</p>
      <button type="submit" :disabled="loading" class="w-full flex justify-center items-center py-3.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60">
        <Loader2Icon v-if="loading" class="w-5 h-5 animate-spin mr-2" /> {{ loading ? 'Sending…' : 'Send reset link' }}
      </button>
    </form>
    <template #footer><router-link to="/login" class="font-bold text-blue-600 dark:text-blue-400">Back to sign in</router-link></template>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Loader2 as Loader2Icon, Mail as MailIcon } from 'lucide-vue-next'
import AuthShell from '../../components/common/AuthShell.vue'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const email = ref(''); const loading = ref(false); const sent = ref(false); const error = ref('')

const submit = async () => {
  loading.value = true; error.value = ''
  try { await auth.sendPasswordResetLink(email.value.trim()); sent.value = true }
  catch (e: any) { error.value = e?.message || 'Could not send the email. Try again shortly.' }
  finally { loading.value = false }
}
</script>
