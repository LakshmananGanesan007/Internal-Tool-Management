<template>
  <teleport to="body">
    <transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="close"></div>
        <!-- Bottom sheet on phones, centred card on larger screens -->
        <div class="modal-panel relative w-full sm:max-w-md bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[92dvh] flex flex-col safe-bottom">
          <div class="sm:hidden mx-auto mt-2 h-1.5 w-10 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0"></div>
          <div class="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
            <h3 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">{{ title }}</h3>
            <button type="button" @click="close" class="text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 -mr-2 rounded-lg" aria-label="Close"><XIcon class="w-5 h-5" /></button>
          </div>
          <div class="p-5 sm:p-6 overflow-y-auto overscroll-contain"><slot /></div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { X as XIcon } from 'lucide-vue-next'

const props = defineProps<{ modelValue: boolean; title: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()
const close = () => emit('update:modelValue', false)

const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
watch(() => props.modelValue, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) window.addEventListener('keydown', onKey); else window.removeEventListener('keydown', onKey)
})
onBeforeUnmount(() => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) })
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity .2s ease; }
.modal-enter-active .modal-panel, .modal-leave-active .modal-panel { transition: transform .25s cubic-bezier(.2,.8,.2,1); }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-panel, .modal-leave-to .modal-panel { transform: translateY(40px); }
</style>
