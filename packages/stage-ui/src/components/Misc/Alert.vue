<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type?: 'error' | 'warning'
}>()

const containerClass = computed(() => {
  switch (props.type) {
    case 'error':
      return 'border-solid border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
    case 'warning':
      return 'border-solid border-2 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
  }
  return ''
})

const iconClass = computed(() => {
  switch (props.type) {
    case 'error':
      return 'i-solar:close-circle-line-duotone text-red-500 dark:text-red-400'
    case 'warning':
      return 'i-solar:danger-circle-line-duotone text-amber-500 dark:text-amber-400'
  }
  return ''
})
</script>

<template>
  <div class="flex flex-col gap-3 rounded-lg p-4" :class="containerClass">
    <div class="flex items-center gap-1 font-medium">
      <div class="text-2xl" :class="iconClass" />
      <slot name="title" />
    </div>
    <div class="text-sm">
      <slot name="content" />
    </div>
  </div>
</template>
