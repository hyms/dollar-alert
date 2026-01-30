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
import { useAuthStore } from '@/stores/auth'

const settingsStore = useSettingsStore()
const authStore = useAuthStore()

onMounted(async () => {
  authStore.initAuth()
  await settingsStore.initializeApp()
})
</script>