<template>
  <i :class="['mdi', `mdi-${name}`]" :style="iconStyle"></i>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  name: string
  size?: number | string
  color?: string
}>()

const iconStyle = computed(() => {
  const style: Record<string, string> = {}
  
  if (props.size) {
    style.fontSize = typeof props.size === 'number' ? `${props.size}px` : props.size
  }
  
  if (props.color) {
    style.color = props.color
  }
  
  return style
})
</script>

<style scoped>
.mdi {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: inherit;
  line-height: 1;
}
</style>
