<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 sm:px-6 lg:px-8 font-sans antialiased">
    <div class="max-w-md w-full space-y-8">
      
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Create your Workspace</h2>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">Set up your account to start managing tools.</p>
      </div>
      
      <div class="bg-white dark:bg-gray-900 py-8 px-6 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-800 sm:px-10">
        <form class="space-y-6" @submit.prevent="handleRegister">
          
          <div>
            <label for="email" class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Work Email</label>
            <input v-model="email" id="email" type="email" required class="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white transition-all font-medium" placeholder="you@company.com" />
          </div>
          
          <div>
            <label for="password" class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Secure Password</label>
            <input v-model="password" id="password" type="password" required class="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white transition-all font-medium" placeholder="••••••••" />
          </div>

          <div>
            <button type="submit" :disabled="loading" class="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50">
              {{ loading ? 'Creating Workspace...' : 'Sign Up' }}
            </button>
          </div>
        </form>

        <div class="mt-6 text-center">
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Already have an account? 
            <router-link to="/login" class="font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Log in here</router-link>
          </p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../services/supabase'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)

const handleRegister = async () => {
  loading.value = true
  const { error } = await supabase.auth.signUp({ email: email.value, password: password.value })
  loading.value = false
  
  if (error) {
    alert(error.message)
  } else {
    router.push('/')
  }
}
</script>