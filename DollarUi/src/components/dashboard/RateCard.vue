/* Exchange Rate Card Component */
<template>
  <v-card elevation="2" class="rate-card">
    <v-card-title class="d-flex align-center">
      <v-icon :color="type === 'official' ? 'blue' : 'green'" class="mr-2">
        {{ type === 'official' ? '🏛️' : '💱' }}
      </v-icon>
      {{ type === 'official' ? 'Tipo Oficial' : 'Tipo Paralelo' }}
      <v-spacer></v-spacer>
      <v-chip
        :color="getChangeColor(changePercentage)"
        variant="flat"
        size="small"
      >
        {{ getChangeIcon(changePercentage) }} {{ formatPercentage(changePercentage) }}
      </v-chip>
    </v-card-title>
    
    <v-card-text>
      <div class="rate-display">
        <div class="rate-item">
          <span class="rate-label">Compra:</span>
          <span class="rate-value">Bs {{ buyPrice.toFixed(2) }}</span>
        </div>
        <div class="rate-item">
          <span class="rate-label">Venta:</span>
          <span class="rate-value">Bs {{ sellPrice.toFixed(2) }}</span>
        </div>
        <div class="rate-item average">
          <span class="rate-label">Promedio:</span>
          <span class="rate-value" :class="getChangeColor(changePercentage)">
            Bs {{ averagePrice.toFixed(2) }}
          </span>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type: 'official' | 'parallel'
  buyPrice: number
  sellPrice: number
  averagePrice: number
  changePercentage: number
}

const props = defineProps<Props>()

function getChangeColor(change: number): string {
  if (change > 0) return 'success'
  if (change < 0) return 'error'
  return 'grey'
}

function getChangeIcon(change: number): string {
  if (change > 0) return '↑'
  if (change < 0) return '↓'
  return '→'
}

function formatPercentage(change: number): string {
  return `${change > 0 ? '+' : ''}${change.toFixed(2)}%`
}
</script>

<style scoped>
.rate-card {
  transition: transform 0.2s ease;
}

.rate-card:hover {
  transform: translateY(-2px);
}

.rate-display {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rate-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.rate-item:last-child {
  border-bottom: none;
}

.rate-item.average {
  border-top: 2px solid #e0e0e0;
  padding-top: 12px;
  font-weight: 600;
}

.rate-label {
  color: #666;
  font-weight: 500;
}

.rate-value {
  font-weight: 600;
  font-size: 1.1rem;
}
</style>