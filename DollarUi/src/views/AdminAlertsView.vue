<template>
  <v-container fluid class="pa-4">
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-bell-ring</v-icon>
            Gestión de Alertas
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="refreshData">
              <v-icon left>mdi-refresh</v-icon>
              Actualizar
            </v-btn>
          </v-card-title>
          <v-card-subtitle>
            Monitorea y gestiona las alertas del sistema
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <!-- Stats Cards -->
    <v-row class="mt-4">
      <v-col cols="12" sm="6" md="3">
        <v-card variant="tonal" color="primary">
          <v-card-text class="text-center">
            <v-icon size="32" class="mb-2">mdi-bell</v-icon>
            <div class="text-h4">{{ totalAlerts }}</div>
            <div class="text-caption">Total Alertas</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card variant="tonal" color="success">
          <v-card-text class="text-center">
            <v-icon size="32" class="mb-2">mdi-check-circle</v-icon>
            <div class="text-h4">{{ activeAlerts }}</div>
            <div class="text-caption">Enviadas</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card variant="tonal" color="warning">
          <v-card-text class="text-center">
            <v-icon size="32" class="mb-2">mdi-clock-outline</v-icon>
            <div class="text-h4">{{ pendingAlerts }}</div>
            <div class="text-caption">Pendientes</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card variant="tonal" color="info">
          <v-card-text class="text-center">
            <v-icon size="32" class="mb-2">mdi-account-group</v-icon>
            <div class="text-h4">{{ subscribers }}</div>
            <div class="text-caption">Suscritos</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Alerts Table -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-history</v-icon>
            Historial de Alertas
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="alerts"
              :loading="loading"
              items-per-page="10"
            >
              <template v-slot:item.type="{ item }">
                <v-chip :color="getTypeColor(item.type)" size="small" variant="tonal">
                  <v-icon start size="small">{{ getTypeIcon(item.type) }}</v-icon>
                  {{ item.type }}
                </v-chip>
              </template>

              <template v-slot:item.status="{ item }">
                <v-chip :color="item.is_read ? 'success' : 'warning'" size="small" variant="tonal">
                  {{ item.is_read ? 'Leída' : 'Pendiente' }}
                </v-chip>
              </template>

              <template v-slot:item.created_at="{ item }">
                {{ formatDate(item.created_at) }}
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn icon variant="text" size="small" @click="viewAlert(item)">
                  <v-icon>mdi-eye</v-icon>
                </v-btn>
                <v-btn
                  v-if="!item.is_read"
                  icon
                  variant="text"
                  size="small"
                  color="success"
                  @click="markAsRead(item)"
                >
                  <v-icon>mdi-check</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Subscribers Section -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-account-group</v-icon>
            Suscriptores
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="subscriberHeaders"
              :items="subscribersList"
              :loading="loading"
              items-per-page="5"
            >
              <template v-slot:item.platform="{ item }">
                <v-chip :color="item.platform === 'telegram' ? 'info' : 'success'" size="small" variant="tonal">
                  <v-icon start size="small">
                    {{ item.platform === 'telegram' ? 'mdi-telegram' : 'mdi-bell' }}
                  </v-icon>
                  {{ item.platform }}
                </v-chip>
              </template>

              <template v-slot:item.is_active="{ item }">
                <v-chip :color="item.is_active ? 'success' : 'error'" size="small" variant="tonal">
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
    </v-row>

    <!-- Alert Detail Dialog -->
    <v-dialog v-model="showDetailDialog" max-width="500">
      <v-card v-if="selectedAlert">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" :color="getTypeColor(selectedAlert.type)">
            {{ getTypeIcon(selectedAlert.type) }}
          </v-icon>
          Detalle de Alerta
        </v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item>
              <v-list-item-title>Tipo</v-list-item-title>
              <v-list-item-subtitle>{{ selectedAlert.type }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Mensaje</v-list-item-title>
              <v-list-item-subtitle class="text-wrap">{{ selectedAlert.message }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Estado</v-list-item-title>
              <v-list-item-subtitle>
                {{ selectedAlert.is_read ? 'Leída' : 'Pendiente' }}
              </v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Fecha</v-list-item-title>
              <v-list-item-subtitle>{{ formatDate(selectedAlert.created_at) }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDetailDialog = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Alert {
  id: string
  type: string
  message: string
  is_read: boolean
  created_at: string
}

interface Subscriber {
  id: string
  user_identifier: string
  platform: string
  is_active: boolean
  created_at: string
}

const loading = ref(false)
const showDetailDialog = ref(false)
const selectedAlert = ref<Alert | null>(null)

const alerts = ref<Alert[]>([
  { id: '1', type: 'price_change', message: 'Tasa oficial actualizada a 6.97 Bs', is_read: false, created_at: new Date().toISOString() },
  { id: '2', type: 'threshold_alert', message: 'Umbral alcanzado: 7.20 Bs en mercado paralelo', is_read: true, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', type: 'price_change', message: 'Tasa paralela actualizada a 7.15 Bs', is_read: true, created_at: new Date(Date.now() - 7200000).toISOString() }
])

const subscribersList = ref<Subscriber[]>([
  { id: '1', user_identifier: '@usuario_telegram', platform: 'telegram', is_active: true, created_at: new Date().toISOString() },
  { id: '2', user_identifier: 'user@example.com', platform: 'web_push', is_active: true, created_at: new Date(Date.now() - 86400000).toISOString() }
])

const headers = [
  { title: 'Tipo', key: 'type' },
  { title: 'Mensaje', key: 'message' },
  { title: 'Estado', key: 'status' },
  { title: 'Fecha', key: 'created_at' },
  { title: 'Acciones', key: 'actions', sortable: false }
]

const subscriberHeaders = [
  { title: 'Usuario', key: 'user_identifier' },
  { title: 'Plataforma', key: 'platform' },
  { title: 'Estado', key: 'is_active' },
  { title: 'Fecha', key: 'created_at' }
]

const totalAlerts = computed(() => alerts.value.length)
const activeAlerts = computed(() => alerts.value.filter(a => a.is_read).length)
const pendingAlerts = computed(() => alerts.value.filter(a => !a.is_read).length)
const subscribers = computed(() => subscribersList.value.length)

function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    price_change: 'primary',
    threshold_alert: 'warning'
  }
  return colors[type] || 'grey'
}

function getTypeIcon(type: string) {
  const icons: Record<string, string> = {
    price_change: 'mdi-currency-usd',
    threshold_alert: 'mdi-alert'
  }
  return icons[type] || 'mdi-bell'
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('es-BO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function refreshData() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 1000)
}

function viewAlert(alert: Alert) {
  selectedAlert.value = alert
  showDetailDialog.value = true
}

function markAsRead(alert: Alert) {
  alert.is_read = true
}
</script>
