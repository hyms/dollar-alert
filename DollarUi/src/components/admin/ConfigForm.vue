<!-- Site Configuration Form -->
<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card elevation="4" class="config-form">
          <v-card-title class="text-h5 mb-4">
            <v-icon left>mdi-cog</v-icon>
            Configuración del Sistema
          </v-card-title>
          
          <v-form @submit.prevent="saveConfig">
            <v-text-field
              v-model="form.site_title"
              label="Título del Sitio"
              prepend-inner-icon="mdi-web"
              variant="outlined"
              class="mb-4"
            ></v-text-field>
            
            <v-switch
              v-model="form.maintenance_mode"
              label="Modo Mantenimiento"
              inset
              color="warning"
              messages="Activar para desactivar temporalmente el sitio"
              class="mb-4"
            ></v-switch>
            
            <v-text-field
              v-if="form.maintenance_mode"
              v-model="form.maintenance_message"
              label="Mensaje de Mantenimiento"
              prepend-inner-icon="mdi-alert"
              variant="outlined"
              class="mb-4"
            ></v-text-field>
            
            <v-card class="mb-4">
              <v-card-title class="text-subtitle-1">Frecuencia de Actualización</v-card-title>
              <v-card-text>
                <v-slider
                  v-model="form.update_frequency"
                  :min="1"
                  :max="60"
                  :step="1"
                  thumb-label="`${form.update_frequency} minutos`"
                  ticks="tickLabels"
                  class="mt-2"
                ></v-slider>
              </v-card-text>
            </v-card>
            
            <v-card class="mb-4">
              <v-card-title class="text-subtitle-1">Umbral de Notificación Global</v-card-title>
              <v-card-text>
                <v-slider
                  v-model="form.notification_threshold"
                  :min="0.1"
                  :max="10"
                  :step="0.1"
                  thumb-label="`${form.notification_threshold}%`"
                  class="mt-2"
                ></v-slider>
              </v-card-text>
            </v-card>
            
            <v-divider class="my-4"></v-divider>
            
            <div class="d-flex gap-4">
              <v-btn
                type="submit"
                color="primary"
                :loading="loading"
                size="large"
              >
                <v-icon left>mdi-content-save</v-icon>
                Guardar Configuración
              </v-btn>
              
              <v-btn
                variant="outlined"
                color="secondary"
                @click="resetConfig"
                :disabled="loading"
                size="large"
              >
                <v-icon left>mdi-restore</v-icon>
                Restablecer
              </v-btn>
            </div>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

const loading = ref(false)
const form = ref({
  site_title: '',
  maintenance_mode: false,
  maintenance_message: '',
  update_frequency: 5,
  notification_threshold: 1.0
})

const tickLabels = ref([
  { value: 1, title: '1 min' },
  { value: 5, title: '5 min' },
  { value: 10, title: '10 min' },
  { value: 15, title: '15 min' },
  { value: 30, title: '30 min' },
  { value: 60, title: '60 min' }
])

async function saveConfig() {
  loading.value = true
  
  try {
    // Simulate API call to save configuration
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Update local settings
    Object.keys(form.value).forEach(key => {
      settingsStore.updateSetting(key as any, form.value[key as any])
    })
    
    // Show success message
    console.log('Configuration saved successfully')
  } catch (error) {
    console.error('Error saving configuration:', error)
  } finally {
    loading.value = false
  }
}

function resetConfig() {
  form.value = {
    site_title: '',
    maintenance_mode: false,
    maintenance_message: '',
    update_frequency: 5,
    notification_threshold: 1.0
  }
}

function loadConfig() {
  form.value = { ...settingsStore.settings }
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.config-form {
  max-width: 800px;
  margin: 0 auto;
}

.gap-4 {
  gap: 16px;
}
</style>