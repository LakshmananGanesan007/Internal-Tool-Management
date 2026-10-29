import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../services/supabase'
import { useUIStore } from './ui'
import { useAuthStore } from './auth'
import type { Task, TaskPriority } from '../types'

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const isLoading = ref(false)
  const isLoaded = ref(false)
  const tableMissing = ref(false) // the SQL migration hasn't been run yet

  const openCount = computed(() => tasks.value.filter(t => !t.completed).length)
  const overdueCount = computed(() => {
    const today = new Date().toISOString().slice(0, 10)
    return tasks.value.filter(t => !t.completed && t.due_date && t.due_date < today).length
  })

  const isMissingTable = (e: any) => e?.code === '42P01' || e?.code === 'PGRST205' || /does not exist|schema cache/i.test(e?.message || '')

  async function fetchTasks() {
    const uid = useAuthStore().userId
    if (!uid) return
    isLoading.value = true
    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    if (error) {
      if (isMissingTable(error)) tableMissing.value = true
      else useUIStore().addToast('Could not load tasks', 'error')
    } else {
      tasks.value = (data as Task[]) || []
      tableMissing.value = false
    }
    isLoading.value = false
    isLoaded.value = true
  }

  async function addTask(input: { title: string; notes?: string; priority?: TaskPriority; due_date?: string | null; tool_id?: string | null }) {
    const ui = useUIStore(); const uid = useAuthStore().userId
    if (!uid || !input.title.trim()) return
    const { data, error } = await supabase.from('tasks').insert({
      user_id: uid, title: input.title.trim(), notes: input.notes?.trim() || null,
      priority: input.priority || 'medium', due_date: input.due_date || null, tool_id: input.tool_id || null,
    }).select().single()
    if (error) return ui.addToast(isMissingTable(error) ? 'Tasks are not set up yet (run the SQL migration).' : 'Failed to add task', 'error')
    tasks.value.unshift(data as Task)
    ui.addToast('Task added')
  }

  async function updateTask(id: string, patch: Partial<Task>) {
    const ui = useUIStore()
    const t = tasks.value.find(x => x.id === id); if (!t) return
    const before = { ...t }
    Object.assign(t, patch) // optimistic
    const { error } = await supabase.from('tasks').update(patch).eq('id', id)
    if (error) { Object.assign(t, before); ui.addToast('Failed to update task', 'error') }
  }

  const toggleTask = (id: string) => { const t = tasks.value.find(x => x.id === id); if (t) return updateTask(id, { completed: !t.completed }) }

  async function deleteTask(id: string) {
    const ui = useUIStore()
    const before = tasks.value
    tasks.value = tasks.value.filter(t => t.id !== id)
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) { tasks.value = before; ui.addToast('Failed to delete task', 'error') }
  }

  async function clearCompleted() {
    const ui = useUIStore(); const uid = useAuthStore().userId
    if (!uid) return
    const before = tasks.value
    tasks.value = tasks.value.filter(t => !t.completed)
    const { error } = await supabase.from('tasks').delete().eq('user_id', uid).eq('completed', true)
    if (error) { tasks.value = before; ui.addToast('Failed to clear tasks', 'error') } else ui.addToast('Completed tasks cleared')
  }

  return { tasks, isLoading, isLoaded, tableMissing, openCount, overdueCount, fetchTasks, addTask, updateTask, toggleTask, deleteTask, clearCompleted }
})
