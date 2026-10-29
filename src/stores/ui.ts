import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDark, useToggle } from '@vueuse/core'

export interface Toast { id: number; message: string; type: 'success' | 'error' | 'info' }

export const useUIStore = defineStore('ui', () => {
  const isEditMode = ref(false)
  const isSidebarOpen = ref(false) // closed by default so phones never start covered by the drawer
  const isDark = useDark()
  const toggleDark = useToggle(isDark)

  const toasts = ref<Toast[]>([])
  let toastId = 0

  function addToast(message: string, type: Toast['type'] = 'success') {
    const id = toastId++
    toasts.value = [...toasts.value.slice(-3), { id, message, type }]
    setTimeout(() => removeToast(id), type === 'error' ? 5000 : 3000)
  }
  function removeToast(id: number) { toasts.value = toasts.value.filter(t => t.id !== id) }
  function toggleEditMode() { isEditMode.value = !isEditMode.value }
  function toggleSidebar() { isSidebarOpen.value = !isSidebarOpen.value }
  function closeSidebar() { isSidebarOpen.value = false }

  return { isEditMode, isSidebarOpen, isDark, toasts, toggleDark, toggleEditMode, toggleSidebar, closeSidebar, addToast, removeToast }
})
