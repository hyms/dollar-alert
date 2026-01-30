<template>
  <v-container fluid class="fill-height" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card elevation="10" class="pa-4">
          <v-card-title class="text-center mb-4">
            <v-icon size="64" color="primary" class="mb-2">mdi-currency-usd</v-icon>
            <div class="text-h4 font-weight-bold">DollarAlert</div>
            <div class="text-subtitle-1 text-grey">Monitoreo USD/BOB</div>
          </v-card-title>

          <v-card-text>
            <v-form ref="form" v-model="isValid" @submit.prevent="handleLogin">
              <v-text-field
                v-model="email"
                label="Usuario"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                :rules="[rules.required]"
                class="mb-2"
              ></v-text-field>

              <v-text-field
                v-model="password"
                label="Contraseña"
                prepend-inner-icon="mdi-lock"
                variant="outlined"
                type="password"
                :rules="[rules.required]"
                class="mb-4"
              ></v-text-field>

              <v-alert
                v-if="authStore.error"
                type="error"
                variant="tonal"
                class="mb-4"
              >
                {{ authStore.error }}
              </v-alert>

              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                :loading="authStore.loading"
                :disabled="!isValid"
              >
                <v-icon class="mr-2">mdi-login</v-icon>
                Iniciar Sesión
              </v-btn>
            </v-form>
          </v-card-text>

          <v-card-actions class="justify-center">
            <v-btn
              variant="text"
              color="primary"
              @click="goToDashboard"
            >
              Continuar como invitado
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const isValid = ref(false)
const form = ref()

const rules = {
  required: (v: string) => !!v || 'Este campo es requerido'
}

const handleLogin = async () => {
  if (!isValid.value) return
  
  await authStore.login(email.value, password.value)
  
  if (authStore.isAuthenticated) {
    router.push({ name: 'Admin' })
  }
}

const goToDashboard = () => {
  router.push({ name: 'Dashboard' })
}
</script>
