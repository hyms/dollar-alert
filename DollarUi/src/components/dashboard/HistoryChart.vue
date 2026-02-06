<template>
  <div class="history-chart-container">
    <div class="chart-header">
      <h3 class="chart-title">
        <mdi-icon name="chart-line" class="title-icon" />
        Histórico de Tasas
      </h3>
      <div class="chart-controls">
        <button
          v-for="type in rateTypes"
          :key="type.value"
          :class="['type-btn', { active: selectedType === type.value }]"
          @click="selectedType = type.value"
        >
          {{ type.label }}
        </button>
      </div>
    </div>
    <div class="chart-wrapper">
      <Line v-if="chartData" :data="chartData" :options="chartOptions" />
      <div v-else class="chart-loading">
        <mdi-icon name="loading" class="spin" />
        Cargando datos...
      </div>
    </div>
    <div v-if="!loading && (!historyData || historyData.length === 0)" class="chart-empty">
      <mdi-icon name="chart-timeline-variant" class="empty-icon" />
      <p>No hay datos históricos disponibles</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { useRateStore } from '@/stores/rateStore'
import MdiIcon from '@/components/common/MdiIcon.vue'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const rateStore = useRateStore()

const rateTypes = [
  { value: 'all', label: 'Ambos' },
  { value: 'official', label: 'Oficial' },
  { value: 'parallel', label: 'Paralelo' }
]

const selectedType = ref('all')
const loading = ref(false)

const historyData = computed(() => rateStore.history)
const currentRates = computed(() => rateStore.rates)

const chartData = computed(() => {
  if (!historyData.value || historyData.value.length === 0) return null

  const filteredData = historyData.value.filter(
    d => selectedType.value === 'all' || d.rate_type === selectedType.value
  )

  if (filteredData.length === 0) return null

  const groupedByDate = filteredData.reduce((acc, item) => {
    const date = new Date(item.recorded_at).toLocaleDateString('es-BO', {
      day: 'numeric',
      month: 'short'
    })
    if (!acc[date]) {
      acc[date] = { official: [], parallel: [] }
    }
    if (item.rate_type === 'official') {
      acc[date].official.push(item.average_price)
    } else {
      acc[date].parallel.push(item.average_price)
    }
    return acc
  }, {} as Record<string, { official: number[]; parallel: number[] }>)

  const labels = Object.keys(groupedByDate)
  const datasets = []

  if (selectedType.value === 'all' || selectedType.value === 'official') {
    const officialData = labels.map(date => {
      const prices = groupedByDate[date].official
      return prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null
    })
    datasets.push({
      label: 'Oficial',
      data: officialData,
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6
    })
  }

  if (selectedType.value === 'all' || selectedType.value === 'parallel') {
    const parallelData = labels.map(date => {
      const prices = groupedByDate[date].parallel
      return prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null
    })
    datasets.push({
      label: 'Paralelo',
      data: parallelData,
      borderColor: '#F59E0B',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6
    })
  }

  return { labels, datasets }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false
  },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: '#94A3B8',
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(30, 41, 59, 0.95)',
      titleColor: '#F1F5F9',
      bodyColor: '#CBD5E1',
      borderColor: '#475569',
      borderWidth: 1,
      padding: 12,
      displayColors: true,
      callbacks: {
        label: (context: any) => {
          return `${context.dataset.label}: Bs ${context.parsed.y.toFixed(2)}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(148, 163, 184, 0.1)'
      },
      ticks: {
        color: '#94A3B8',
        font: {
          size: 11
        }
      }
    },
    y: {
      grid: {
        color: 'rgba(148, 163, 184, 0.1)'
      },
      ticks: {
        color: '#94A3B8',
        font: {
          size: 11
        },
        callback: (value: any) => `Bs ${value.toFixed(2)}`
      }
    }
  }
}

onMounted(async () => {
  loading.value = true
  await rateStore.fetchHistory()
  loading.value = false
})

watch(selectedType, () => {
  rateStore.fetchHistory(selectedType.value !== 'all' ? selectedType.value : undefined)
})
</script>

<style scoped>
.history-chart-container {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #F1F5F9;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.title-icon {
  color: #3B82F6;
  font-size: 1.3rem;
}

.chart-controls {
  display: flex;
  gap: 8px;
}

.type-btn {
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(30, 41, 59, 0.6);
  color: #94A3B8;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-btn:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

.type-btn.active {
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  color: white;
  border-color: transparent;
}

.chart-wrapper {
  height: 300px;
  position: relative;
}

.chart-loading,
.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94A3B8;
  gap: 12px;
}

.spin {
  font-size: 2rem;
  animation: spin 1s linear infinite;
}

.empty-icon {
  font-size: 2.5rem;
  opacity: 0.5;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .chart-controls {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
