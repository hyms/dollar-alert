<template>
  <v-app>
    <DefaultLayout>
      <router-view />
    </DefaultLayout>
  </v-app>
</template>

<script setup lang="ts">
import DefaultLayout from './layouts/DefaultLayout.vue'
import { onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

onMounted(async () => {
  await settingsStore.initializeApp()
})
</script>