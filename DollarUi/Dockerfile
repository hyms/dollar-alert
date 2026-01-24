# Multi-stage Dockerfile for DollarUI (Vue 3 + Vite)

# Development stage
FROM node:20-alpine as development

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose Vite port
EXPOSE 5173

# Start development server with hot reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
