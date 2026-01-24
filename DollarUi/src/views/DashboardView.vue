<template>
  <DefaultLayout>
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

      <v-row class="mt-4">
        <v-col cols="12" md="6" lg="4" v-for="rate in exchangeRates" :key="rate.id">
          <RateCard :rate="rate" />
        </v-col>
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
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ExchangeRate } from '@/types'
import RateCard from '@/components/dashboard/RateCard.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()
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

onMounted(async () => {
  await settingsStore.initializeApp()
  exchangeRates.value = mockRates
})
</script>