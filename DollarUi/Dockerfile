# Multi-stage Dockerfile for DollarUI (Vue 3 + Vite)
# Simplified and optimized for development

# --- Base Stage ---
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# --- Development Stage ---
FROM base AS development
ENV NODE_ENV=development
ENV VITE_API_URL=http://localhost:3000
ENV CHOKIDAR_USEPOLLING=true

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Start development server with HMR
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]