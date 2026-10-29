<template>
  <div class="max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-5">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold">Tasks</h1>
        <p class="text-sm text-gray-500 mt-0.5">
          {{ store.openCount }} open<span v-if="store.overdueCount" class="text-red-600 font-semibold"> · {{ store.overdueCount }} overdue</span>
        </p>
      </div>
      <button @click="openModal()" class="btn-primary" :disabled="store.tableMissing"><PlusIcon class="w-5 h-5 sm:mr-1.5" /><span class="hidden sm:inline">New task</span></button>
    </div>

    <!-- Quick add -->
    <form @submit.prevent="quickAdd" class="card p-2 flex items-center gap-2 mb-5" v-if="!store.tableMissing">
      <input v-model="quickTitle" placeholder="Add a task and press Enter…" class="flex-1 min-w-0 bg-transparent outline-none px-3 py-2.5" maxlength="200" />
      <button type="submit" :disabled="!quickTitle.trim()" class="btn-primary !px-4 !py-2.5">Add</button>
    </form>

    <div v-if="store.tableMissing" class="card p-5 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10">
      <p class="font-bold mb-1">One-time setup needed</p>
      <p class="text-sm text-gray-600 dark:text-gray-300">Tasks need a database table. Open the Supabase SQL editor and run the script in <code class="font-mono">supabase/migrations/001_tasks.sql</code>, then reload this page.</p>
      <button @click="store.fetchTasks()" class="btn-ghost mt-3">I've run it, check again</button>
    </div>

    <template v-else>
      <div class="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-4 pb-1 scrollbar-none">
        <button v-for="f in filters" :key="f.key" @click="filter = f.key" class="px-4 py-2 rounded-full text-sm font-bold shrink-0 border"
          :class="filter === f.key ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'">
          {{ f.label }} <span class="opacity-60">{{ counts[f.key] }}</span>
        </button>
      </div>

      <div v-if="store.isLoading && !store.isLoaded" class="space-y-2"><div v-for="i in 4" :key="i" class="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div></div>

      <div v-else-if="!visible.length" class="text-center py-16 text-gray-500">
        <CheckSquareIcon class="w-10 h-10 mx-auto mb-3 text-gray-300" />
        <p class="font-semibold">{{ filter === 'done' ? 'Nothing completed yet' : 'You are all caught up' }}</p>
      </div>

      <ul v-else class="space-y-2">
        <li v-for="t in visible" :key="t.id" class="card flex items-start gap-3 p-3 sm:p-4">
          <button @click="store.toggleTask(t.id)" class="mt-0.5 p-1 shrink-0" :aria-label="t.completed ? 'Mark as not done' : 'Mark as done'">
            <CheckCircle2Icon v-if="t.completed" class="w-6 h-6 text-green-500" /><CircleIcon v-else class="w-6 h-6 text-gray-300 dark:text-gray-600" />
          </button>
          <button class="flex-1 min-w-0 text-left" @click="openModal(t)">
            <p class="font-semibold break-words" :class="t.completed ? 'line-through text-gray-400' : ''">{{ t.title }}</p>
            <p v-if="t.notes" class="text-sm text-gray-500 mt-0.5 line-clamp-2">{{ t.notes }}</p>
            <div class="flex flex-wrap items-center gap-2 mt-2 text-xs font-semibold">
              <span class="px-2 py-0.5 rounded-md" :class="priorityClass[t.priority]">{{ t.priority }}</span>
              <span v-if="t.due_date" class="flex items-center" :class="isOverdue(t) ? 'text-red-600' : 'text-gray-500'"><CalendarIcon class="w-3.5 h-3.5 mr-1" />{{ formatDue(t.due_date) }}</span>
              <span v-if="toolName(t)" class="flex items-center text-gray-500"><LinkIcon class="w-3.5 h-3.5 mr-1" />{{ toolName(t) }}</span>
            </div>
          </button>
          <button @click="store.deleteTask(t.id)" class="p-2 text-gray-400 hover:text-red-500 shrink-0" aria-label="Delete task"><Trash2Icon class="w-4 h-4" /></button>
        </li>
      </ul>

      <button v-if="counts.done" @click="clearDone" class="mt-5 text-sm font-semibold text-gray-500 hover:text-red-600">Clear {{ counts.done }} completed</button>
    </template>

    <BaseModal v-model="isOpen" :title="form.id ? 'Edit task' : 'New task'">
      <form @submit.prevent="save" class="space-y-4">
        <div><label class="block text-sm font-bold mb-2">Title <span class="text-red-500">*</span></label><input v-model="form.title" required maxlength="200" class="field" placeholder="What needs doing?" /></div>
        <div><label class="block text-sm font-bold mb-2">Notes</label><textarea v-model="form.notes" rows="3" class="field resize-none" placeholder="Optional details"></textarea></div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-bold mb-2">Priority</label>
            <select v-model="form.priority" class="field"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
          </div>
          <div><label class="block text-sm font-bold mb-2">Due date</label><input v-model="form.due_date" type="date" class="field" /></div>
        </div>
        <div v-if="ws.allWorkspaceTools.length">
          <label class="block text-sm font-bold mb-2">Related tool</label>
          <select v-model="form.tool_id" class="field"><option value="">None</option><option v-for="tool in ws.allWorkspaceTools" :key="tool.id" :value="tool.id">{{ tool.name }}</option></select>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="isOpen = false" class="btn-ghost">Cancel</button>
          <button type="submit" class="btn-primary">Save</button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus as PlusIcon, Trash2 as Trash2Icon, Circle as CircleIcon, CheckCircle2 as CheckCircle2Icon, CheckSquare as CheckSquareIcon, Calendar as CalendarIcon, Link as LinkIcon } from 'lucide-vue-next'
import BaseModal from '../../components/common/BaseModal.vue'
import { useTaskStore } from '../../stores/tasks'
import { useWorkspaceStore } from '../../stores/workspace'
import type { Task, TaskPriority } from '../../types'

const store = useTaskStore(); const ws = useWorkspaceStore()
onMounted(() => { if (!store.isLoaded) store.fetchTasks() })

const today = () => new Date().toISOString().slice(0, 10)
const isOverdue = (t: Task) => !t.completed && !!t.due_date && t.due_date < today()
const formatDue = (d: string) => (d === today() ? 'Today' : new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))
const priorityClass: Record<TaskPriority, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
}
const toolName = (t: Task) => (t.tool_id ? ws.allWorkspaceTools.find(x => x.id === t.tool_id)?.name : '')

type FilterKey = 'open' | 'today' | 'overdue' | 'done' | 'all'
const filter = ref<FilterKey>('open')
const filters: { key: FilterKey; label: string }[] = [
  { key: 'open', label: 'Open' }, { key: 'today', label: 'Today' }, { key: 'overdue', label: 'Overdue' }, { key: 'done', label: 'Done' }, { key: 'all', label: 'All' },
]
const counts = computed<Record<FilterKey, number>>(() => ({
  open: store.openCount, today: store.tasks.filter(t => !t.completed && t.due_date === today()).length,
  overdue: store.overdueCount, done: store.tasks.filter(t => t.completed).length, all: store.tasks.length,
}))
const rank: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 }
const visible = computed(() => {
  const list = store.tasks.filter(t => {
    if (filter.value === 'open') return !t.completed
    if (filter.value === 'today') return !t.completed && t.due_date === today()
    if (filter.value === 'overdue') return isOverdue(t)
    if (filter.value === 'done') return t.completed
    return true
  })
  return [...list].sort((a, b) => Number(a.completed) - Number(b.completed) || (a.due_date || '9999').localeCompare(b.due_date || '9999') || rank[a.priority] - rank[b.priority])
})

const quickTitle = ref('')
const quickAdd = async () => { const t = quickTitle.value; quickTitle.value = ''; await store.addTask({ title: t }) }
const clearDone = () => { if (confirm('Delete all completed tasks?')) store.clearCompleted() }

const isOpen = ref(false)
const form = ref({ id: '', title: '', notes: '', priority: 'medium' as TaskPriority, due_date: '', tool_id: '' })
const openModal = (t?: Task) => {
  form.value = t ? { id: t.id, title: t.title, notes: t.notes || '', priority: t.priority, due_date: t.due_date || '', tool_id: t.tool_id || '' }
    : { id: '', title: '', notes: '', priority: 'medium', due_date: '', tool_id: '' }
  isOpen.value = true
}
const save = async () => {
  const f = form.value; if (!f.title.trim()) return
  if (f.id) await store.updateTask(f.id, { title: f.title.trim(), notes: f.notes.trim() || null, priority: f.priority, due_date: f.due_date || null, tool_id: f.tool_id || null })
  else await store.addTask({ title: f.title, notes: f.notes, priority: f.priority, due_date: f.due_date, tool_id: f.tool_id })
  isOpen.value = false
}
</script>
