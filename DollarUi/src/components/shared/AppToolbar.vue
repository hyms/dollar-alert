<!-- Application Toolbar with Navigation -->
<template>
  <v-app-bar color="primary" elevation="2">
    <v-app-bar-title @click="goHome" class="cursor-pointer">
      <v-icon class="mr-2">mdi-currency-usd</v-icon>
      DollarAlert
    </v-app-bar-title>

    <v-spacer></v-spacer>

    <v-btn
      :to="'/'"
      variant="text"
      class="mx-1 hidden-sm-and-down"
    >
      <v-icon left>mdi-view-dashboard</v-icon>
      Dashboard
    </v-btn>

    <v-btn
      :to="'/history'"
      variant="text"
      class="mx-1 hidden-sm-and-down"
    >
      <v-icon left>mdi-chart-line</v-icon>
      Historial
    </v-btn>

    <v-divider vertical class="mx-2 hidden-sm-and-down"></v-divider>

    <!-- Admin Menu (visible when authenticated) -->
    <template v-if="isAuthenticated">
      <v-menu offset-y>
        <template #activator="{ props }">
          <v-btn
            variant="outlined"
            color="white"
            class="mx-1"
            v-bind="props"
          >
            <v-icon left>mdi-shield-crown</v-icon>
            Admin
            <v-icon right>mdi-chevron-down</v-icon>
          </v-btn>
        </template>

        <v-list nav density="compact" class="admin-menu">
          <v-list-subheader>Panel de Administración</v-list-subheader>

          <v-list-item
            prepend-icon="mdi-view-dashboard"
            title="Dashboard"
            @click="goToAdmin"
          ></v-list-item>

          <v-list-item
            prepend-icon="mdi-web"
            title="Fuentes de Scraping"
            @click="goToScraping"
          ></v-list-item>

          <v-list-item
            prepend-icon="mdi-bell-ring"
            title="Alertas"
            @click="goToAlerts"
          ></v-list-item>

          <v-list-item
            prepend-icon="mdi-cog"
            title="Configuración"
            @click="goToSettings"
          ></v-list-item>

          <v-divider class="my-2"></v-divider>

          <v-list-item
            prepend-icon="mdi-logout"
            title="Cerrar Sesión"
            @click="logout"
            class="text-error"
          ></v-list-item>
        </v-list>
      </v-menu>
    </template>

    <!-- Login Button (when not authenticated) -->
    <template v-else>
      <v-btn
        variant="outlined"
        color="white"
        :to="'/login'"
        class="mx-1"
      >
        <v-icon left>mdi-login</v-icon>
        Iniciar Sesión
      </v-btn>
    </template>

    <!-- User Info (when authenticated) -->
    <template v-if="isAuthenticated">
      <v-chip color="white" variant="outlined" class="ml-2 hidden-sm-and-down">
        <v-icon start>mdi-account-check</v-icon>
        {{ username }}
      </v-chip>
    </template>
  </v-app-bar>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const username = computed(() => authStore.user?.email || 'Admin')

function goHome() {
  router.push('/')
}

function goToAdmin() {
  router.push('/admin')
}

function goToScraping() {
  router.push('/admin/scraping')
}

function goToAlerts() {
  router.push('/admin/alerts')
}

function goToSettings() {
  router.push('/settings')
}

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.mx-1 {
  margin-left: 4px;
  margin-right: 4px;
}

.admin-menu {
  min-width: 220px;
}

.admin-menu .v-list-item {
  margin: 2px 4px;
  border-radius: 8px;
}

.admin-menu .v-list-item:hover {
  background: rgba(var(--v-theme-primary), 0.08);
}

.text-error {
  color: rgb(var(--v-theme-error));
}

:deep(.v-list-subheader) {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 12px 4px;
}
</style>