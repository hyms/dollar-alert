# Multi-stage Dockerfile for DollarUI (Vue 3 + Vite)
# Using npm for dependency installation

# --- Base Stage ---
FROM node:20-alpine AS base
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

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

# --- Production Stage ---
FROM base AS production
ENV NODE_ENV=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 80

# Start production server
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "80"]