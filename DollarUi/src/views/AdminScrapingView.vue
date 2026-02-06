<template>
  <v-container fluid class="pa-4">
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-web</v-icon>
            Gestión de Fuentes de Scraping
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="showAddDialog = true">
              <v-icon left>mdi-plus</v-icon>
              Agregar Fuente
            </v-btn>
          </v-card-title>
          <v-card-subtitle>
            Configura las fuentes de datos para el monitoreo de tasas de cambio
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12" md="6" lg="4" v-for="source in sources" :key="source.id">
        <v-card variant="outlined">
          <v-card-title class="d-flex align-center">
            <v-icon :color="source.is_active ? 'success' : 'grey'" class="mr-2">
              {{ source.is_active ? 'mdi-check-circle' : 'mdi-circle-outline' }}
            </v-icon>
            {{ source.name }}
            <v-spacer></v-spacer>
            <v-chip :color="source.is_active ? 'success' : 'grey'" size="small" variant="tonal">
              {{ source.rate_type }}
            </v-chip>
          </v-card-title>

          <v-card-text>
            <v-list density="compact">
              <v-list-item prepend-icon="mdi-link">
                <v-list-item-title class="text-truncate">
                  <a :href="source.url" target="_blank">{{ source.url }}</a>
                </v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-css">
                <v-list-item-title>Selector: <code>{{ source.selector }}</code></v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-clock-outline">
                <v-list-item-title>Frecuencia: {{ source.frequency }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>

          <v-card-actions>
            <v-btn variant="text" color="primary" @click="testSource(source)">
              <v-icon left>mdi-play</v-icon>
              Probar
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn icon variant="text" @click="editSource(source)">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn icon variant="text" color="error" @click="deleteSource(source)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col v-if="sources.length === 0" cols="12">
        <v-alert type="info" variant="tonal">
          <template #prepend>
            <v-icon>mdi-information</v-icon>
          </template>
          <div class="text-h6">No hay fuentes configuradas</div>
          <div>Agrega una fuente de scraping para comenzar el monitoreo</div>
        </v-alert>
      </v-col>
    </v-row>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="showAddDialog" max-width="600">
      <v-card>
        <v-card-title>
          {{ editingSource ? 'Editar Fuente' : 'Agregar Fuente de Scraping' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-text-field
              v-model="sourceForm.name"
              label="Nombre"
              prepend-inner-icon="mdi-label"
              required
            ></v-text-field>

            <v-text-field
              v-model="sourceForm.url"
              label="URL"
              prepend-inner-icon="mdi-link"
              required
            ></v-text-field>

            <v-text-field
              v-model="sourceForm.selector"
              label="Selector CSS"
              prepend-inner-icon="mdi-css"
              hint="Ej: .tipo-cambio, #price-value"
              required
            ></v-text-field>

            <v-select
              v-model="sourceForm.rate_type"
              :items="['official', 'parallel']"
              label="Tipo de Tasa"
              prepend-inner-icon="mdi-tag"
              required
            ></v-select>

            <v-text-field
              v-model="sourceForm.frequency"
              label="Frecuencia (cron)"
              prepend-inner-icon="mdi-clock"
              hint="Ej: 0 */6 * * *"
            ></v-text-field>

            <v-switch
              v-model="sourceForm.is_active"
              label="Activo"
              color="success"
            ></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDialog">Cancelar</v-btn>
          <v-btn color="primary" @click="saveSource">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Test Result Dialog -->
    <v-dialog v-model="showTestDialog" max-width="500">
      <v-card>
        <v-card-title>Resultado de Prueba</v-card-title>
        <v-card-text>
          <v-alert :type="testResult?.success ? 'success' : 'error'" variant="tonal">
            <template #prepend>
              <v-icon>{{ testResult?.success ? 'mdi-check-circle' : 'mdi-alert-circle' }}</v-icon>
            </template>
            <div>{{ testResult?.message }}</div>
          </v-alert>
          <div v-if="testResult?.data" class="mt-4">
            <strong>Valor extraído:</strong>
            <code class="d-block mt-2 pa-2 bg-grey-lighten-4 rounded">
              {{ testResult.data }}
            </code>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showTestDialog = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface ScrapingSource {
  id: string
  name: string
  url: string
  selector: string
  rate_type: 'official' | 'parallel'
  frequency: string
  is_active: boolean
}

const sources = ref<ScrapingSource[]>([])
const showAddDialog = ref(false)
const showTestDialog = ref(false)
const editingSource = ref<ScrapingSource | null>(null)
const testResult = ref<{ success: boolean; message: string; data?: string } | null>(null)

const sourceForm = ref({
  name: '',
  url: '',
  selector: '',
  rate_type: 'official' as 'official' | 'parallel',
  frequency: '0 */6 * * *',
  is_active: true
})

onMounted(() => {
  loadSources()
})

function loadSources() {
  const stored = localStorage.getItem('scraping_sources')
  if (stored) {
    sources.value = JSON.parse(stored)
  } else {
    sources.value = [
      {
        id: '1',
        name: 'Banco Central de Bolivia',
        url: 'https://www.bcb.gob.bo/',
        selector: '.tipo-cambio',
        rate_type: 'official',
        frequency: '0 */6 * * *',
        is_active: true
      },
      {
        id: '2',
        name: 'Dolar Bolivia',
        url: 'https://dolarbolivia.com/',
        selector: '.col-md-6 .card .card-body .h3',
        rate_type: 'parallel',
        frequency: '0 */2 * * *',
        is_active: true
      }
    ]
  }
}

function saveSource() {
  if (editingSource.value) {
    const index = sources.value.findIndex(s => s.id === editingSource.value!.id)
    if (index !== -1) {
      sources.value[index] = { ...sourceForm.value, id: editingSource.value.id }
    }
  } else {
    sources.value.push({
      ...sourceForm.value,
      id: Date.now().toString()
    })
  }

  localStorage.setItem('scraping_sources', JSON.stringify(sources.value))
  closeDialog()
}

function editSource(source: ScrapingSource) {
  editingSource.value = source
  sourceForm.value = { ...source }
  showAddDialog.value = true
}

function deleteSource(source: ScrapingSource) {
  sources.value = sources.value.filter(s => s.id !== source.id)
  localStorage.setItem('scraping_sources', JSON.stringify(sources.value))
}

function testSource(source: ScrapingSource) {
  testResult.value = {
    success: true,
    message: `Probando fuente: ${source.name}`,
    data: `Valor simulado: ${source.rate_type === 'official' ? '6.97' : '7.20'} Bs`
  }
  showTestDialog.value = true
}

function closeDialog() {
  showAddDialog.value = false
  editingSource.value = null
  sourceForm.value = {
    name: '',
    url: '',
    selector: '',
    rate_type: 'official',
    frequency: '0 */6 * * *',
    is_active: true
  }
}
</script>
