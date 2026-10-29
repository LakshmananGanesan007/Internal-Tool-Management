import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import type { User, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const isInitialized = ref(false)
  const isRecovery = ref(false) // true while arriving from a password-reset link
  let listening = false
  let initPromise: Promise<void> | null = null

  const userId = computed(() => user.value?.id ?? null)

  function initAuth() {
    if (initPromise) return initPromise
    initPromise = (async () => {
      try {
        if (isSupabaseConfigured) {
          const { data } = await supabase.auth.getSession()
          session.value = data.session
          user.value = data.session?.user ?? null
          if (!listening) {
            listening = true
            supabase.auth.onAuthStateChange((event, s) => {
              session.value = s
              user.value = s?.user ?? null
              if (event === 'PASSWORD_RECOVERY') isRecovery.value = true
            })
          }
        }
      } catch (e) {
        console.error('Auth init failed', e)
      } finally {
        isInitialized.value = true
      }
    })()
    return initPromise
  }

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  /** Returns true when a session was created (email confirmation disabled). */
  async function register(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return !!data.session
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) console.warn(error)
    user.value = null
    session.value = null
  }

  async function logoutOtherDevices() {
    const { error } = await supabase.auth.signOut({ scope: 'others' })
    if (error) throw error
  }

  // --- Password: only ever changed through an emailed link ---
  async function sendPasswordResetLink(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    if (error) throw error
  }

  async function setNewPassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    isRecovery.value = false
  }

  // --- Email: change with a one-time code ---
  async function requestEmailChange(newEmail: string) {
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) throw error
  }

  async function verifyEmailChange(email: string, token: string) {
    const { error } = await supabase.auth.verifyOtp({ email, token: token.trim(), type: 'email_change' })
    if (error) throw error
    const { data } = await supabase.auth.refreshSession()
    if (data.session) { session.value = data.session; user.value = data.session.user }
    return user.value
  }

  async function updateProfile(data: Record<string, unknown>) {
    const { data: res, error } = await supabase.auth.updateUser({ data })
    if (error) throw error
    if (res.user) user.value = res.user
  }

  return {
    user, session, userId, isInitialized, isRecovery,
    initAuth, login, register, logout, logoutOtherDevices,
    sendPasswordResetLink, setNewPassword, requestEmailChange, verifyEmailChange, updateProfile,
  }
})
