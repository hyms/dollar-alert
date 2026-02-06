<template>
  <v-card
    elevation="1"
    class="binance-rate-card"
  >
    <!-- Header: Currency Pair & Change -->
    <v-card-text class="pa-4">
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center">
          <div class="currency-icon mr-3" :class="type === 'official' ? 'official-bg' : 'parallel-bg'">
            <v-icon size="24" color="white">
              {{ type === 'official' ? 'mdi-bank' : 'mdi-currency-usd' }}
            </v-icon>
          </div>
          <div>
            <div class="text-h6 font-weight-bold currency-pair">
              {{ type === 'official' ? 'OFICIAL' : 'PARALELO' }}
            </div>
            <div class="text-caption text-grey">USD/BOB</div>
          </div>
        </div>
        
        <div class="d-flex align-center">
          <v-icon 
            size="18" 
            :color="getChangeColor(changePercentage)"
            class="mr-1"
          >
            {{ getChangeIcon(changePercentage) }}
          </v-icon>
          <span 
            class="text-subtitle-1 font-weight-bold"
            :class="getChangeTextClass(changePercentage)"
          >
            {{ formatPercentage(changePercentage) }}
          </span>
        </div>
      </div>

      <!-- Main Price Section -->
      <div class="main-price mb-4">
        <div class="text-caption text-grey mb-1">Precio Promedio</div>
        <div class="d-flex align-baseline">
          <span class="text-h3 font-weight-bold price-value">
            Bs {{ averagePrice.toFixed(2) }}
          </span>
        </div>
      </div>

      <!-- Buy/Sell Grid - Binance Style -->
      <div class="prices-grid">
        <div class="price-box buy-box">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-caption text-grey">Compra</span>
            <v-icon size="14" color="success">mdi-arrow-down</v-icon>
          </div>
          <div class="text-h5 font-weight-bold success--text">
            Bs {{ buyPrice.toFixed(2) }}
          </div>
        </div>

        <div class="price-box sell-box">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-caption text-grey">Venta</span>
            <v-icon size="14" color="error">mdi-arrow-up</v-icon>
          </div>
          <div class="text-h5 font-weight-bold error--text">
            Bs {{ sellPrice.toFixed(2) }}
          </div>
        </div>
      </div>

      <!-- Spread Info -->
      <div class="spread-info mt-3">
        <div class="d-flex align-center justify-space-between">
          <span class="text-caption text-grey">Spread</span>
          <span class="text-caption font-weight-medium">
            Bs {{ (sellPrice - buyPrice).toFixed(2) }} ({{ ((sellPrice - buyPrice) / averagePrice * 100).toFixed(2) }}%)
          </span>
        </div>
        <v-progress-linear
          :model-value="((sellPrice - buyPrice) / averagePrice * 100)"
          color="primary"
          height="4"
          class="mt-2"
          rounded
        ></v-progress-linear>
      </div>

      <!-- Last Updated -->
      <div class="mt-4 pt-3 border-top">
        <div class="d-flex align-center justify-space-between text-caption">
          <span class="text-grey">Última actualización</span>
          <span class="font-weight-medium">{{ formatTime(lastUpdated) }}</span>
        </div>
      </div>
    </v-card-text>

    <!-- Action Button -->
    <v-card-actions class="pa-4 pt-0">
      <v-btn
        block
        variant="outlined"
        color="primary"
        class="trade-btn"
        height="44"
        @click="$emit('trade')"
      >
        <v-icon left size="18" class="mr-2">mdi-chart-line</v-icon>
        Ver Histórico
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  type: 'official' | 'parallel'
  buyPrice: number
  sellPrice: number
  averagePrice: number
  changePercentage: number
  lastUpdated: string
}

const props = defineProps<Props>()

defineEmits<{
  (e: 'trade'): void
}>()

function getChangeColor(change: number): string {
  if (change > 0) return 'success'
  if (change < 0) return 'error'
  return 'grey'
}

function getChangeTextClass(change: number): string {
  if (change > 0) return 'success--text'
  if (change < 0) return 'error--text'
  return 'grey--text'
}

function getChangeIcon(change: number): string {
  if (change > 0) return 'mdi-trending-up'
  if (change < 0) return 'mdi-trending-down'
  return 'mdi-minus'
}

function formatPercentage(change: number): string {
  return `${change > 0 ? '+' : ''}${change.toFixed(2)}%`
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>

<style scoped>
.binance-rate-card {
  border-radius: 16px !important;
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%) !important;
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
  transition: all 0.3s ease;
  overflow: hidden;
}

.binance-rate-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12) !important;
}

.currency-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.official-bg {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
}

.parallel-bg {
  background: linear-gradient(135deg, #00c853 0%, #00a344 100%);
}

.currency-pair {
  letter-spacing: 0.5px;
}

.main-price {
  background: linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.price-value {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.prices-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.price-box {
  background: #ffffff;
  border-radius: 12px;
  padding: 12px 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
}

.price-box:hover {
  border-color: rgba(0, 0, 0, 0.12);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.buy-box {
  border-left: 3px solid #00c853;
}

.sell-box {
  border-left: 3px solid #ff1744;
}

.spread-info {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  padding: 12px 16px;
}

.border-top {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.trade-btn {
  border-radius: 10px !important;
  text-transform: none !important;
  font-weight: 600 !important;
  letter-spacing: 0.3px !important;
  border-width: 1.5px !important;
}

/* Custom colors for success/error text */
.success--text {
  color: #00c853 !important;
}

.error--text {
  color: #ff1744 !important;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .binance-rate-card {
    border-radius: 12px !important;
  }
  
  .price-value {
    font-size: 1.75rem !important;
  }
  
  .prices-grid {
    gap: 8px;
  }
  
  .price-box {
    padding: 10px 12px;
  }
}
</style>