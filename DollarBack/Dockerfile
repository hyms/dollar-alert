# Dockerfile para Producción y Desarrollo del Backend (Fastify)
# Ubicación: DollarBack/Dockerfile

# --- Etapa de Desarrollo / Base ---
FROM node:20-slim AS base

WORKDIR /app

# Instalación de dependencias
COPY package*.json ./
RUN npm install

# Copiar el código fuente
COPY . .

# Exponer el puerto configurado
EXPOSE 3000

# --- Target para Desarrollo ---
# Se activa con: docker build --target development
FROM base AS development
ENV NODE_ENV=development
# Comando para desarrollo con recarga automática (requiere nodemon o similar en package.json)
CMD ["npm", "run", "dev"]

# --- Target para Producción ---
# Se activa por defecto o con: docker build --target production
FROM base AS production
ENV NODE_ENV=production
# Eliminar dependencias de desarrollo para aligerar la imagen
RUN npm prune --production
# Comando para producción
CMD ["node", "dist/index.js"]
