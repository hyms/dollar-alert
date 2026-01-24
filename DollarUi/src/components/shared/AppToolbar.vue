<!-- Application Toolbar with Navigation -->
<template>
  <v-app-bar color="primary" elevation="2">
    <v-app-bar-title>
      <v-icon class="mr-2">mdi-currency-usd</v-icon>
      DollarAlert
    </v-app-bar-title>
    
    <v-spacer></v-spacer>
    
    <v-btn 
      :to="'/'" 
      variant="text" 
      class="mx-2"
    >
      <v-icon left>mdi-view-dashboard</v-icon>
      Dashboard
    </v-btn>
    
    <v-btn 
      :to="'/history'" 
      variant="text" 
      class="mx-2"
    >
      <v-icon left>mdi-chart-line</v-icon>
      Historial
    </v-btn>
    
    <v-btn 
      :to="'/notifications'" 
      variant="text" 
      class="mx-2"
    >
      <v-icon left>mdi-bell</v-icon>
      Alertas
    </v-btn>
    
    <!-- Currency Selector -->
    <v-menu offset-y>
      <template #activator="{ props }">
        <v-btn variant="text" class="mx-2">
          <v-icon left>mdi-currency-usd</v-icon>
          {{ currentCurrency }}
          <v-icon right>mdi-chevron-down</v-icon>
        </v-btn>
      </template>
      
      <v-list>
        <v-list-item
          v-for="currency in availableCurrencies"
          :key="currency.code"
          @click="selectCurrency(currency)"
        >
          <v-list-item-title>{{ currency.flag }} {{ currency.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    
    <!-- Auth Menu -->
    <template v-if="!isAuthenticated">
      <v-btn variant="text" :to="'/login'" class="mx-2">
        <v-icon left>mdi-login</v-icon>
        Iniciar Sesión
      </v-btn>
    </template>
    
    <template v-else>
      <v-menu offset-y>
        <template #activator="{ props }">
          <v-btn variant="text" class="mx-2">
            <v-icon>mdi-account</v-icon>
            Admin
            <v-icon right>mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        
        <v-list>
          <v-list-item @click="goToAdmin">
            <v-list-item-title>Panel de Administración</v-list-item-title>
          </v-list-item>
          <v-list-item @click="logout">
            <v-list-item-title>Cerrar Sesión</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
  </v-app-bar>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

interface Currency {
  code: string
  name: string
  flag: string
}

const router = useRouter()
const currentCurrency = ref('USD/BOB')

const availableCurrencies: Currency[] = [
  { code: 'USD/BOB', name: 'Dólar Boliviano', flag: '🇧🇴' },
  { code: 'EUR/BOB', name: 'Euro Boliviano', flag: '🇪🇧' },
  { code: 'CLP/BOB', name: 'Peso Chileno', flag: '🇨🇱' },
]

const isAuthenticated = computed(() => {
  return !!localStorage.getItem('auth_token')
})

function selectCurrency(currency: Currency) {
  currentCurrency.value = currency.code
  // Store preference and update data
}

function goToAdmin() {
  router.push('/admin')
}

function logout() {
  localStorage.removeItem('auth_token')
  router.push('/login')
}
</script>

<style scoped>
.mx-2 {
  margin-left: 8px;
}
</style>