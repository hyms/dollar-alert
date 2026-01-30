<!-- Default Layout for Main Application -->
<template>
  <AppToolbar />
  
  <v-main>
    <slot></slot>
  </v-main>
  
  <AppFooter />
</template>

<script setup lang="ts">
import AppToolbar from '@/components/shared/AppToolbar.vue'
import AppFooter from '@/components/shared/Footer.vue'
</script>