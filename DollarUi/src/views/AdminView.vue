<template>
  <v-container fluid class="pa-4">
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="text-h5 mb-4">
              <v-icon class="mr-2">mdi-shield-account</v-icon>
              Administración
            </v-card-title>
            <v-card-subtitle>
              Panel de administración del sistema
            </v-card-subtitle>
          </v-card>
        </v-col>
      </v-row>

      <AuthGuard>
        <v-row class="mt-4">
          <v-col cols="12">
            <ConfigForm />
          </v-col>
        </v-row>

        <v-row class="mt-4">
          <v-col cols="12" md="6">
            <v-card>
              <v-card-title>
                <v-icon class="mr-2">mdi-users</v-icon>
                Usuarios Suscritos
              </v-card-title>
              <v-card-text>
                <v-data-table
                  :headers="userHeaders"
                  :items="users"
                  :loading="loading"
                  items-per-page="10"
                  density="compact"
                >
                  <template v-slot:item.is_active="{ item }">
                    <v-chip
                      :color="item.is_active ? 'success' : 'error'"
                      variant="tonal"
                      size="small"
                    >
                      {{ item.is_active ? 'Activo' : 'Inactivo' }}
                    </v-chip>
                  </template>

                  <template v-slot:item.created_at="{ item }">
                    {{ formatDate(item.created_at) }}
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card>
              <v-card-title>
                <v-icon class="mr-2">mdi-chart-box</v-icon>
                Estadísticas del Sistema
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="6">
                    <v-card variant="tonal" color="primary">
                      <v-card-text class="text-center">
                        <div class="text-h4">1,234</div>
                        <div class="text-caption">Usuarios Totales</div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="6">
                    <v-card variant="tonal" color="success">
                      <v-card-text class="text-center">
                        <div class="text-h4">892</div>
                        <div class="text-caption">Usuarios Activos</div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="6" class="mt-2">
                    <v-card variant="tonal" color="warning">
                      <v-card-text class="text-center">
                        <div class="text-h4">45</div>
                        <div class="text-caption">Alertas Hoy</div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="6" class="mt-2">
                    <v-card variant="tonal" color="info">
                      <v-card-text class="text-center">
                        <div class="text-h4">99.9%</div>
                        <div class="text-caption">Uptime</div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </AuthGuard>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AuthGuard from '@/components/admin/AuthGuard.vue'
import ConfigForm from '@/components/admin/ConfigForm.vue'
import type { UserSubscription } from '@/types'

const loading = ref(false)
const users = ref<UserSubscription[]>([])

const userHeaders = [
  { title: 'Usuario', key: 'username' },
  { title: 'Email', key: 'email' },
  { title: 'Estado', key: 'is_active' },
  { title: 'Umbral', key: 'alert_threshold' },
  { title: 'Creado', key: 'created_at' }
]

const mockUsers: UserSubscription[] = [
  {
    id: '1',
    user_id: 'user123',
    telegram_id: '123456789',
    username: 'usuario_bolivia',
    email: 'usuario@example.com',
    is_active: true,
    alert_threshold: 1.0,
    preferred_currencies: ['USD', 'BOB'],
    notification_types: ['price_change', 'threshold_alert'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-BO')
}

users.value = mockUsers
</script>