import { ref } from 'vue'
import { defineStore } from 'pinia'

export interface Settings {
  site_title: string
  maintenance_mode: boolean
  default_currency: string
  update_frequency: number
  notification_threshold: number
  supported_currencies: string[]
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>({
    site_title: 'DollarAlert',
    maintenance_mode: false,
    default_currency: 'USD/BOB',
    update_frequency: 5, // minutes
    notification_threshold: 1.0, // percentage
    supported_currencies: ['USD/BOB', 'EUR/BOB', 'CLP/BOB', 'BRL/BOB']
  })

  function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    settings.value[key] = value
    // Persist to backend/API
    localStorage.setItem(`setting_${key}`, JSON.stringify(value))
  }

  function loadSettings() {
    const stored = localStorage.getItem('settings')
    if (stored) {
      const parsedSettings = JSON.parse(stored)
      Object.assign(settings.value, parsedSettings)
    }
  }

  function resetSettings() {
    settings.value = {
      site_title: 'DollarAlert',
      maintenance_mode: false,
      default_currency: 'USD/BOB',
      update_frequency: 5,
      notification_threshold: 1.0,
      supported_currencies: ['USD/BOB', 'EUR/BOB', 'CLP/BOB', 'BRL/BOB']
    }
    localStorage.removeItem('settings')
  }

  async function initializeApp() {
    loadSettings()
    // Aquí se pueden agregar más inicializaciones
    // como cargar configuración desde el backend
  }

  return {
    settings,
    updateSetting,
    loadSettings,
    resetSettings,
    initializeApp
  }
})