<!-- Application Footer -->
<template>
  <v-footer color="primary" elevation="4" class="text-center py-4">
    <v-container>
      <v-row justify="center" align="center">
        <v-col cols="12" md="8">
          <div class="footer-content">
            <p class="mb-2">
              &copy; {{ new Date().getFullYear() }} DollarAlert - 
              <span class="font-weight-bold">Sistema de Monitoreo de Tipo de Cambio</span>
            </p>
            <p class="text-caption">
              Datos en tiempo real del mercado de divisas boliviano
            </p>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>

<script setup lang="ts">
// Footer component with no additional logic needed
</script>

<style scoped>
.footer-content {
  color: white;
}

.footer-content p {
  margin: 0;
}

.text-caption {
  opacity: 0.8;
  font-size: 0.875rem;
}
</style>