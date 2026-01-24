<template>
  <DefaultLayout>
    <v-container fluid class="pa-4">
      <v-row justify="center">
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="text-center">
              <v-icon size="64" color="error" class="mb-4">mdi-help-circle</v-icon>
              <div class="text-h4">Página No Encontrada</div>
            </v-card-title>
            <v-card-text class="text-center">
              <p class="text-h6 mb-4">La página que buscas no existe.</p>
              <p class="text-body-1 mb-6">
                Es posible que la URL esté incorrecta o la página haya sido movida.
              </p>
              
              <v-btn
                color="primary"
                size="large"
                prepend-icon="mdi-home"
                @click="$router.push('/')"
              >
                Volver al Inicio
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue'
</script>