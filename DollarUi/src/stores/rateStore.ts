import { defineStore } from 'pinia'

export interface ExchangeRate {
  id: string
  type: 'official' | 'parallel'
  base_currency: string
  target_currency: string
  buy_price: number
  sell_price: number
  average_price: number
  spread_amount: number
  change_24h: number
  change_percentage_24h: number
  source?: string
  last_updated: string
}

export interface HistoryRecord {
  id: string
  rate_type: 'official' | 'parallel'
  base_currency: string
  target_currency: string
  buy_price: number
  sell_price: number
  average_price: number
  recorded_at: string
}

interface RateState {
  rates: ExchangeRate[]
  history: HistoryRecord[]
  loading: boolean
  error: string | null
  lastUpdated: string
}

export const useRateStore = defineStore('rates', {
  state: (): RateState => ({
    rates: [],
    history: [],
    loading: false,
    error: null,
    lastUpdated: ''
  }),

  getters: {
    officialRate: (state) => state.rates.find(r => r.type === 'official'),
    parallelRate: (state) => state.rates.find(r => r.type === 'parallel')
  },

  actions: {
    async fetchRates() {
      this.loading = true
      this.error = null

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/rates/current`)
        if (!response.ok) {
          throw new Error('Error al obtener las tasas')
        }

        const data = await response.json()
        this.rates = data
        this.lastUpdated = new Date().toISOString()
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Error desconocido'
        console.error('Error fetching rates:', err)
      } finally {
        this.loading = false
      }
    },

    async fetchHistory(rateType?: 'official' | 'parallel') {
      this.loading = true
      this.error = null

      try {
        const params = new URLSearchParams()
        if (rateType) {
          params.append('rateType', rateType)
        }
        params.append('limit', '30')

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/rates/history?${params.toString()}`
        )

        if (!response.ok) {
          throw new Error('Error al obtener el historial')
        }

        const data = await response.json()
        this.history = data
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Error desconocido'
        console.error('Error fetching history:', err)
      } finally {
        this.loading = false
      }
    }
  },

  persist: {
    key: 'dollaralert-rates',
    paths: ['rates', 'lastUpdated']
  }
})
