<template>
  <DefaultLayout>
    <v-container fluid class="pa-4">
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="text-h5 mb-4">
              <v-icon class="mr-2">mdi-history</v-icon>
              Historial de Tasas
            </v-card-title>
            <v-card-subtitle>
              Consulta el historial de tasas de cambio USD/BOB
            </v-card-subtitle>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12">
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-filter</v-icon>
              Filtros
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="3">
                  <v-select
                    v-model="filters.rateType"
                    :items="rateTypeOptions"
                    label="Tipo de tasa"
                    clearable
                  ></v-select>
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field
                    v-model="filters.startDate"
                    type="date"
                    label="Fecha inicio"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field
                    v-model="filters.endDate"
                    type="date"
                    label="Fecha fin"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="3" class="d-flex align-center">
                  <v-btn color="primary" @click="applyFilters" block>
                    <v-icon class="mr-2">mdi-magnify</v-icon>
                    Aplicar filtros
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12">
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-table</v-icon>
              Historial de Tasas
            </v-card-title>
            <v-card-text>
              <v-data-table
                :headers="headers"
                :items="historicalRates"
                :loading="loading"
                items-per-page="25"
                class="elevation-1"
              >
                <template v-slot:item.rate_type="{ item }">
                  <v-chip
                    :color="item.rate_type === 'official' ? 'primary' : 'secondary'"
                    variant="tonal"
                  >
                    {{ item.rate_type === 'official' ? 'Oficial' : 'Paralelo' }}
                  </v-chip>
                </template>

                <template v-slot:item.average_price="{ item }">
                  <span class="font-weight-medium">
                    Bs. {{ item.average_price.toFixed(3) }}
                  </span>
                </template>

                <template v-slot:item.spread_amount="{ item }">
                  <v-chip
                    :color="item.spread_amount > 0.2 ? 'error' : 'success'"
                    variant="tonal"
                    size="small"
                  >
                    Bs. {{ item.spread_amount.toFixed(3) }}
                  </v-chip>
                </template>

                <template v-slot:item.recorded_at="{ item }">
                  {{ formatDate(item.recorded_at) }}
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { HistoricalRate } from '@/types'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const loading = ref(false)
const historicalRates = ref<HistoricalRate[]>([])

const filters = ref({
  rateType: '',
  startDate: '',
  endDate: ''
})

const rateTypeOptions = [
  { title: 'Oficial', value: 'official' },
  { title: 'Paralelo', value: 'parallel' }
]

const headers = [
  { title: 'Fecha', key: 'recorded_at', sortable: true },
  { title: 'Tipo', key: 'rate_type', sortable: true },
  { title: 'Compra', key: 'buy_price', sortable: true },
  { title: 'Venta', key: 'sell_price', sortable: true },
  { title: 'Promedio', key: 'average_price', sortable: true },
  { title: 'Spread', key: 'spread_amount', sortable: true }
]

const mockHistoricalRates: HistoricalRate[] = [
  {
    id: '1',
    rate_type: 'official',
    base_currency: 'USD',
    target_currency: 'BOB',
    buy_price: 7.08,
    sell_price: 7.23,
    average_price: 7.155,
    recorded_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: '2',
    rate_type: 'parallel',
    base_currency: 'USD',
    target_currency: 'BOB',
    buy_price: 7.28,
    sell_price: 7.43,
    average_price: 7.355,
    recorded_at: new Date(Date.now() - 86400000).toISOString()
  }
]

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-BO')
}

const applyFilters = () => {
  console.log('Applying filters:', filters.value)
}

onMounted(() => {
  historicalRates.value = mockHistoricalRates
})
</script>