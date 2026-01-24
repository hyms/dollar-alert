<template>
  <DefaultLayout>
    <v-container fluid class="pa-4">
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="text-h5 mb-4">
              <v-icon class="mr-2">mdi-cog</v-icon>
              Configuración
            </v-card-title>
            <v-card-subtitle>
              Administra tus preferencias y alertas
            </v-card-subtitle>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-bell-outline</v-icon>
              Configuración de Alertas
            </v-card-title>
            <v-card-text>
              <v-form>
                <v-switch
                  v-model="alertsEnabled"
                  label="Activar alertas"
                  color="primary"
                ></v-switch>
                
                <v-text-field
                  v-model.number="alertThreshold"
                  label="Umbral de cambio (%)"
                  type="number"
                  step="0.1"
                  prepend-icon="mdi-percent"
                  :disabled="!alertsEnabled"
                ></v-text-field>

                <v-select
                  v-model="notificationTypes"
                  :items="notificationOptions"
                  label="Tipos de notificación"
                  multiple
                  chips
                  :disabled="!alertsEnabled"
                ></v-select>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-theme-light-dark</v-icon>
              Preferencias de Visualización
            </v-card-title>
            <v-card-text>
              <v-form>
                <v-select
                  v-model="theme"
                  :items="themeOptions"
                  label="Tema"
                  prepend-icon="mdi-palette"
                ></v-select>

                <v-select
                  v-model="currency"
                  :items="currencyOptions"
                  label="Moneda de referencia"
                  prepend-icon="mdi-currency-usd"
                ></v-select>

                <v-switch
                  v-model="autoRefresh"
                  label="Actualización automática"
                  color="primary"
                ></v-switch>

                <v-text-field
                  v-model.number="refreshInterval"
                  label="Intervalo (segundos)"
                  type="number"
                  prepend-icon="mdi-timer"
                  :disabled="!autoRefresh"
                ></v-text-field>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12">
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-telegram</v-icon>
              Integración con Telegram
            </v-card-title>
            <v-card-text>
              <v-form>
                <v-text-field
                  v-model="telegramUsername"
                  label="Usuario de Telegram"
                  prepend-icon="mdi-account"
                  readonly
                ></v-text-field>

                <v-btn
                  color="primary"
                  prepend-icon="mdi-telegram"
                  @click="connectTelegram"
                  :disabled="!!telegramUsername"
                >
                  Conectar con Telegram
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12" class="d-flex justify-end">
          <v-btn color="success" prepend-icon="mdi-content-save" @click="saveSettings">
            Guardar Configuración
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const alertsEnabled = ref(true)
const alertThreshold = ref(1.0)
const notificationTypes = ref(['price_change', 'threshold_alert'])
const notificationOptions = [
  { title: 'Cambios de precio', value: 'price_change' },
  { title: 'Alertas por umbral', value: 'threshold_alert' }
]

const theme = ref('light')
const themeOptions = [
  { title: 'Claro', value: 'light' },
  { title: 'Oscuro', value: 'dark' },
  { title: 'Automático', value: 'auto' }
]

const currency = ref('BOB')
const currencyOptions = [
  { title: 'Bolivianos (BOB)', value: 'BOB' },
  { title: 'Dólares (USD)', value: 'USD' }
]

const autoRefresh = ref(true)
const refreshInterval = ref(60)
const telegramUsername = ref('')

const connectTelegram = () => {
  console.log('Connecting to Telegram...')
}

const saveSettings = () => {
  console.log('Saving settings...')
}
</script>