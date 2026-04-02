import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDark, useToggle } from '@vueuse/core'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

export const useUIStore = defineStore('ui', () => {
  const isEditMode = ref(false)
  const isSidebarOpen = ref(true)
  
  const isDark = useDark()
  const toggleDark = useToggle(isDark)

  // --- Toast System ---
  const toasts = ref<Toast[]>([])
  let toastId = 0

  function addToast(message: string, type: 'success' | 'error' = 'success') {
    const id = toastId++
    toasts.value.push({ id, message, type })
    // Auto-remove after 3.5 seconds
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, 3500)
  }

  function removeToast(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function toggleEditMode() {
    isEditMode.value = !isEditMode.value
  }

  function toggleSidebar() {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  return { 
    isEditMode, isSidebarOpen, isDark, toasts, 
    toggleDark, toggleEditMode, toggleSidebar, addToast, removeToast 
  }
})