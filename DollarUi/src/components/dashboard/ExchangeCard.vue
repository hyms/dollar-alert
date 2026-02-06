<template>
  <v-card
    elevation="0"
    border
    rounded="xl"
    class="exchange-card"
  >
    <!-- Header with Logo, Name and Verified Badge -->
    <v-list-item class="pa-4">
      <template v-slot:prepend>
        <v-avatar
          size="48"
          :color="avatarColor"
          class="exchange-avatar"
        >
          <v-img
            v-if="logoUrl"
            :src="logoUrl"
            :alt="exchangeName"
            cover
          />
          <span v-else class="text-h6 font-weight-bold white--text">
            {{ exchangeName.charAt(0).toUpperCase() }}
          </span>
        </v-avatar>
      </template>

      <v-list-item-title class="text-h6 font-weight-bold">
        {{ exchangeName }}
      </v-list-item-title>

      <v-list-item-subtitle class="text-caption text-grey">
        {{ currency }}
      </v-list-item-subtitle>

      <template v-slot:append>
        <v-chip
          v-if="verified"
          color="success"
          size="small"
          variant="flat"
          class="verified-chip"
        >
          <v-icon size="14" class="mr-1">mdi-check-circle</v-icon>
          Verificado
        </v-chip>
      </template>
    </v-list-item>

    <v-divider class="mx-4"></v-divider>

    <!-- Main Price Display -->
    <v-card-text class="pa-4">
      <div class="text-center mb-4">
        <div class="text-caption text-grey mb-1">Precio Promedio</div>
        <div class="text-h4 font-weight-bold price-display">
          Bs {{ averagePrice.toFixed(2) }}
        </div>
        <v-chip
          :color="getChangeColor(changePercentage)"
          size="small"
          variant="flat"
          class="mt-2"
        >
          <v-icon size="14" class="mr-1">
            {{ getChangeIcon(changePercentage) }}
          </v-icon>
          {{ formatPercentage(changePercentage) }}
        </v-chip>
      </div>

      <!-- Buy/Sell Boxes -->
      <v-row class="mt-2">
        <v-col cols="6">
          <v-sheet
            color="#F9F9F9"
            rounded="lg"
            class="pa-3 price-box"
          >
            <div class="text-caption text-grey">Compra</div>
            <div class="text-h6 font-weight-bold text-success">
              Bs {{ buyPrice.toFixed(2) }}
            </div>
          </v-sheet>
        </v-col>
        <v-col cols="6">
          <v-sheet
            color="#F9F9F9"
            rounded="lg"
            class="pa-3 price-box"
          >
            <div class="text-caption text-grey">Venta</div>
            <div class="text-h6 font-weight-bold text-error">
              Bs {{ sellPrice.toFixed(2) }}
            </div>
          </v-sheet>
        </v-col>
      </v-row>

      <!-- Spread Info -->
      <div class="text-center mt-3">
        <span class="text-caption text-grey">
          Spread: Bs {{ spreadAmount.toFixed(2) }}
        </span>
      </div>
    </v-card-text>

    <!-- Action Buttons -->
    <v-card-actions class="pa-4 pt-0">
      <v-btn
        block
        class="gradient-btn-primary mb-2"
        height="48"
        @click="$emit('view-details')"
      >
        <v-icon left class="mr-2">mdi-eye</v-icon>
        Ver Detalles
      </v-btn>
      <v-btn
        block
        variant="outlined"
        class="gradient-btn-secondary"
        height="48"
        @click="$emit('set-alert')"
      >
        <v-icon left class="mr-2">mdi-bell</v-icon>
        Crear Alerta
      </v-btn>
    </v-card-actions>

    <!-- Last Updated -->
    <v-card-text class="pa-4 pt-0 text-center">
      <div class="text-caption text-grey">
        Actualizado: {{ formatDate(lastUpdated) }}
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  exchangeName: string
  currency: string
  buyPrice: number
  sellPrice: number
  averagePrice: number
  spreadAmount: number
  changePercentage: number
  lastUpdated: string
  logoUrl?: string
  verified?: boolean
  avatarColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  logoUrl: '',
  verified: true,
  avatarColor: 'primary'
})

defineEmits<{
  (e: 'view-details'): void
  (e: 'set-alert'): void
}>()

function getChangeColor(change: number): string {
  if (change > 0) return 'success'
  if (change < 0) return 'error'
  return 'grey'
}

function getChangeIcon(change: number): string {
  if (change > 0) return 'mdi-trending-up'
  if (change < 0) return 'mdi-trending-down'
  return 'mdi-minus'
}

function formatPercentage(change: number): string {
  return `${change > 0 ? '+' : ''}${change.toFixed(2)}%`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.exchange-card {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05) !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-radius: 24px !important;
}

.exchange-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1) !important;
}

.exchange-avatar {
  border: 2px solid rgba(0, 0, 0, 0.05);
}

.verified-chip {
  font-weight: 500;
}

.price-display {
  background: linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.price-box {
  transition: transform 0.2s ease;
  border-radius: 12px !important;
}

.price-box:hover {
  transform: scale(1.02);
}

.gradient-btn-primary {
  background: linear-gradient(90deg, #9C27B0 0%, #E91E63 100%) !important;
  color: white !important;
  border-radius: 12px !important;
  text-transform: none !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px !important;
}

.gradient-btn-secondary {
  background: linear-gradient(90deg, #FF9800 0%, #00BCD4 100%) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  text-transform: none !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px !important;
}

.gradient-btn-secondary::before {
  display: none !important;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .exchange-card {
    border-radius: 20px !important;
  }
  
  .price-display {
    font-size: 1.75rem !important;
  }
}
</style>