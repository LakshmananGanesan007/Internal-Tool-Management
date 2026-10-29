<template>
  <AuthShell title="Sign in" subtitle="Enter your details to access your dashboard.">
    <form class="space-y-5" @submit.prevent="submit">
      <div>
        <label for="email" class="block text-sm font-bold mb-2">Email</label>
        <input v-model="email" id="email" type="email" required autocomplete="email" inputmode="email" class="field" placeholder="you@company.com" />
      </div>
      <div>
        <div class="flex justify-between items-center mb-2">
          <label for="password" class="block text-sm font-bold">Password</label>
          <router-link to="/forgot-password" class="text-sm font-semibold text-blue-600 dark:text-blue-400">Forgot?</router-link>
        </div>
        <div class="relative">
          <input v-model="password" id="password" :type="show ? 'text' : 'password'" required autocomplete="current-password" class="field pr-12" placeholder="••••••••" />
          <button type="button" @click="show = !show" class="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400" :aria-label="show ? 'Hide password' : 'Show password'">
            <EyeOffIcon v-if="show" class="w-5 h-5" /><EyeIcon v-else class="w-5 h-5" />
          </button>
        </div>
      </div>
      <p v-if="error" class="text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2" role="alert">{{ error }}</p>
      <button type="submit" :disabled="loading" class="w-full flex justify-center items-center py-3.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60">
        <Loader2Icon v-if="loading" class="w-5 h-5 animate-spin mr-2" /> {{ loading ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>
    <template #footer>Don't have an account? <router-link to="/register" class="font-bold text-blue-600 dark:text-blue-400">Sign up</router-link></template>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye as EyeIcon, EyeOff as EyeOffIcon, Loader2 as Loader2Icon } from 'lucide-vue-next'
import AuthShell from '../../components/common/AuthShell.vue'
import { useAuthStore } from '../../stores/auth'

const router = useRouter(); const auth = useAuthStore()
const email = ref(''); const password = ref(''); const loading = ref(false); const show = ref(false); const error = ref('')

const submit = async () => {
  loading.value = true; error.value = ''
  try { await auth.login(email.value.trim(), password.value); router.push('/') }
  catch (e: any) { error.value = e?.message || 'Could not sign in. Please try again.' }
  finally { loading.value = false }
}
</script>

