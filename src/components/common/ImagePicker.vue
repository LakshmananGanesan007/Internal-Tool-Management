<template>
  <div class="flex items-center gap-4">
    <div class="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden shrink-0">
      <img v-if="preview" :src="preview" class="w-full h-full object-cover" alt="" />
      <ImageIcon v-else class="w-6 h-6 text-gray-400" />
    </div>
    <div class="flex flex-wrap gap-2">
      <input ref="input" type="file" accept="image/*" class="hidden" @change="onChange" />
      <button type="button" @click="input?.click()" class="text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm">
        {{ preview ? 'Change' : 'Choose image' }}
      </button>
      <button v-if="preview" type="button" @click="clear" class="text-sm px-3 py-2.5 rounded-xl font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Remove</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { Image as ImageIcon } from 'lucide-vue-next'
import { useUIStore } from '../../stores/ui'

const props = defineProps<{ modelValue: File | null; existingUrl?: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', f: File | null): void; (e: 'remove'): void }>()
const ui = useUIStore()
const input = ref<HTMLInputElement | null>(null)
const preview = ref(props.existingUrl || '')
let objectUrl = ''

watch(() => props.existingUrl, (u) => { if (!objectUrl) preview.value = u || '' })

function onChange(e: Event) {
  const t = e.target as HTMLInputElement
  const f = t.files?.[0]; t.value = ''
  if (!f) return
  if (!f.type.startsWith('image/')) return ui.addToast('Please choose an image file', 'error')
  if (f.size > 10 * 1024 * 1024) return ui.addToast('Image is too large (max 10 MB)', 'error')
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = URL.createObjectURL(f); preview.value = objectUrl
  emit('update:modelValue', f)
}
function clear() {
  if (objectUrl) URL.revokeObjectURL(objectUrl); objectUrl = ''
  preview.value = ''; emit('update:modelValue', null); emit('remove')
}
onBeforeUnmount(() => { if (objectUrl) URL.revokeObjectURL(objectUrl) })
</script>
