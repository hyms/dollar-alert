<!-- Authentication Guard for Admin Routes -->
<template>
  <slot v-if="isAuthenticated && isAdmin"></slot>
  
  <v-container v-else class="text-center py-16">
    <v-card elevation="4" max-width="400" class="mx-auto">
      <v-card-title class="text-h5 mb-4">
        <v-icon left>mdi-lock</v-icon>
        Acceso Restringido
      </v-card-title>
      
      <v-card-text>
        <p class="mb-4">Necesitas privilegios de administrador para acceder a esta página.</p>
        <p class="text-caption">Por favor, inicie sesión con una cuenta de administrador.</p>
      </v-card-text>
      
      <v-btn 
        color="primary" 
        block 
        @click="$router.push('/login')"
        class="mt-4"
      >
        <v-icon left>mdi-login</v-icon>
        Ir al Inicio de Sesión
      </v-btn>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAdmin = computed(() => authStore.isAdmin)
</script>