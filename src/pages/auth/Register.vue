<template>
  <AuthShell title="Create account" subtitle="Set up your own tool workspace in seconds.">
    <div v-if="sent" class="text-center py-2">
      <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><MailIcon class="w-6 h-6 text-green-600" /></div>
      <h2 class="font-bold text-lg mb-1">Check your email</h2>
      <p class="text-sm text-gray-500">We sent a confirmation link to <b>{{ email }}</b>. Open it, then sign in.</p>
      <router-link to="/login" class="inline-block mt-4 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold">Go to sign in</router-link>
    </div>
    <form v-else class="space-y-5" @submit.prevent="submit">
      <div>
        <label for="email" class="block text-sm font-bold mb-2">Email</label>
        <input v-model="email" id="email" type="email" required autocomplete="email" inputmode="email" class="field" placeholder="you@company.com" />
      </div>
      <div>
        <label for="password" class="block text-sm font-bold mb-2">Password</label>
        <div class="relative">
          <input v-model="password" id="password" :type="show ? 'text' : 'password'" required minlength="8" autocomplete="new-password" class="field pr-12" placeholder="At least 8 characters" />
          <button type="button" @click="show = !show" class="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400" :aria-label="show ? 'Hide password' : 'Show password'">
            <EyeOffIcon v-if="show" class="w-5 h-5" /><EyeIcon v-else class="w-5 h-5" />
          </button>
        </div>
      </div>
      <p v-if="error" class="text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2" role="alert">{{ error }}</p>
      <button type="submit" :disabled="loading" class="w-full flex justify-center items-center py-3.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60">
        <Loader2Icon v-if="loading" class="w-5 h-5 animate-spin mr-2" /> {{ loading ? 'Creating…' : 'Create account' }}
      </button>
    </form>
    <template #footer>Already have an account? <router-link to="/login" class="font-bold text-blue-600 dark:text-blue-400">Sign in</router-link></template>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye as EyeIcon, EyeOff as EyeOffIcon, Loader2 as Loader2Icon, Mail as MailIcon } from 'lucide-vue-next'
import AuthShell from '../../components/common/AuthShell.vue'
import { useAuthStore } from '../../stores/auth'

const router = useRouter(); const auth = useAuthStore()
const email = ref(''); const password = ref(''); const loading = ref(false); const show = ref(false); const error = ref(''); const sent = ref(false)

const submit = async () => {
  loading.value = true; error.value = ''
  try {
    const signedIn = await auth.register(email.value.trim(), password.value)
    if (signedIn) router.push('/'); else sent.value = true // email confirmation is enabled
  } catch (e: any) { error.value = e?.message || 'Could not create account.' }
  finally { loading.value = false }
}
</script>

