<!-- Default Layout for Main Application -->
<template>
  <v-app>
    <AppToolbar />
    
    <v-main>
      <router-view />
    </v-main>
    
    <AppFooter />
  </v-app>
</template>

<script setup lang="ts">
import AppToolbar from '@/components/shared/AppToolbar.vue'
import AppFooter from '@/components/shared/AppFooter.vue'
</script>