<template>
  <v-container fluid class="pa-4">
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="text-h5 mb-4">
              <v-icon class="mr-2">mdi-chart-line</v-icon>
              Panel Principal - DollarAlert 🇧🇴
            </v-card-title>
            <v-card-subtitle>
              Monitoreo en tiempo real de las tasas de cambio USD/BOB
            </v-card-subtitle>
          </v-card>
        </v-col>
      </v-row>

      <!-- Rate Cards Section - Binance Style -->
      <v-row class="mt-6">
        <v-col cols="12">
          <div class="d-flex align-center justify-space-between mb-4">
            <h2 class="text-h5 font-weight-bold d-flex align-center">
              <v-icon class="mr-2" color="secondary">mdi-chart-line</v-icon>
              Tasas de Cambio
            </h2>
            <v-btn
              variant="text"
              color="primary"
              :loading="loading"
              @click="fetchRates"
              size="small"
            >
              <v-icon left>mdi-refresh</v-icon>
              Actualizar
            </v-btn>
          </div>
        </v-col>
        
        <!-- Loading Spinner -->
        <v-col v-if="loading" cols="12" class="text-center py-12">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
            width="6"
            class="mb-4"
          >
            <v-icon size="32" color="white">mdi-currency-usd</v-icon>
          </v-progress-circular>
          <div class="text-h6 text-grey-darken-1">
            Cargando tasas de cambio...
          </div>
          <div class="text-caption text-grey mt-2">
            Obteniendo datos desde Supabase
          </div>
        </v-col>

        <!-- Skeleton Loading (Alternative) -->
        <template v-else-if="loading">
          <v-col cols="12" md="6" v-for="i in 2" :key="`skeleton-${i}`">
            <v-card elevation="2" class="rounded-xl">
              <v-card-text>
                <v-skeleton-loader type="article, table" />
              </v-card-text>
            </v-card>
          </v-col>
        </template>

        <!-- Error State -->
        <v-col v-else-if="error" cols="12">
          <v-alert type="error" variant="tonal">
            <template v-slot:prepend>
              <v-icon>mdi-alert-circle</v-icon>
            </template>
            <div class="text-h6 mb-2">Error al cargar los datos</div>
            <div>{{ error }}</div>
            <template v-slot:append>
              <v-btn variant="outlined" color="error" size="small" @click="fetchRates">
                <v-icon left>mdi-refresh</v-icon>
                Reintentar
              </v-btn>
            </template>
          </v-alert>
        </v-col>

        <!-- Rate Cards -->
        <template v-else>
          <v-col cols="12" md="6" v-for="rate in exchangeRates" :key="rate.id">
            <BinanceRateCard 
              :type="rate.type"
              :buyPrice="rate.buy_price"
              :sellPrice="rate.sell_price"
              :averagePrice="rate.average_price"
              :changePercentage="rate.change_percentage_24h"
              :lastUpdated="rate.last_updated"
              @trade="viewRateHistory(rate)"
            />
          </v-col>
          
          <!-- Last Updated Timestamp -->
          <v-col v-if="exchangeRates.length > 0" cols="12" class="mt-2">
            <div class="d-flex align-center justify-center text-caption text-grey">
              <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
              Última actualización: {{ lastUpdated }}
            </div>
          </v-col>
        </template>
      </v-row>

      <v-row class="mt-6">
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-chart-area</v-icon>
              Tendencia Últimos 7 Días
            </v-card-title>
            <v-card-text>
              <v-alert type="info" variant="tonal">
                Gráfico de tendencias próximamente disponible
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-bell</v-icon>
              Alertas Recientes
            </v-card-title>
            <v-card-text>
              <v-alert type="success" variant="tonal">
                Sin alertas nuevas
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { ExchangeRate } from '@/types'
import BinanceRateCard from '@/components/dashboard/BinanceRateCard.vue'
import { useSettingsStore } from '@/stores/settings'

// TODO: Replace mock data with API call
const API_URL = import.meta.env.VITE_API_URL

const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const exchangeRates = ref<ExchangeRate[]>([])

const mockRates: ExchangeRate[] = [
  {
    id: '1',
    type: 'official',
    base_currency: 'USD',
    target_currency: 'BOB',
    buy_price: 7.10,
    sell_price: 7.25,
    average_price: 7.175,
    spread_amount: 0.15,
    change_24h: 0.05,
    change_percentage_24h: 0.7,
    last_updated: new Date().toISOString(),
    source: 'Banco Central de Bolivia'
  },
  {
    id: '2',
    type: 'parallel',
    base_currency: 'USD',
    target_currency: 'BOB',
    buy_price: 7.30,
    sell_price: 7.45,
    average_price: 7.375,
    spread_amount: 0.15,
    change_24h: -0.02,
    change_percentage_24h: -0.27,
    last_updated: new Date().toISOString(),
    source: 'Mercado paralelo'
  }
]

const viewRateHistory = (rate: ExchangeRate) => {
  console.log('View history for:', rate.type)
  // TODO: Implement navigation to rate history
}

const loading = ref(false)
const error = ref<string | null>(null)
const lastUpdated = ref<string>('')

const formatTimestamp = () => {
  const now = new Date()
  return now.toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const fetchRates = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch(`${API_URL}/api/rates/current`)
    if (!response.ok) {
      throw new Error('Error al obtener las tasas')
    }
    
    const data = await response.json()
    exchangeRates.value = data.length > 0 ? data : mockRates
    lastUpdated.value = formatTimestamp()
  } catch (err) {
    console.error('Error fetching rates:', err)
    error.value = err instanceof Error ? err.message : 'Error desconocido'
    // Fallback a mock data si la API falla
    exchangeRates.value = mockRates
    lastUpdated.value = formatTimestamp()
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await settingsStore.loadSettings()
  await fetchRates()
})
</script>