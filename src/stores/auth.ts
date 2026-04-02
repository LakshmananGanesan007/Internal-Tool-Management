import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../services/supabase'
import type { User, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const isInitialized = ref(false)

  // Initialize Auth State on app load
  async function initAuth() {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    user.value = data.session?.user ?? null
    isInitialized.value = true

    // Listen for auth changes (e.g., logging in/out in another tab)
    supabase.auth.onAuthStateChange((_event, currentSession) => {
      session.value = currentSession
      user.value = currentSession?.user ?? null
    })
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    user.value = null
    session.value = null
  }

  return { 
    user, 
    session, 
    isInitialized, 
    initAuth, 
    logout 
  }
})