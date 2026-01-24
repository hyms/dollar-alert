# Multi-stage Dockerfile for DollarBack (Node.js + Fastify)
# Simplified and optimized

# --- Base Stage ---
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# --- Development Stage ---
FROM base AS development
ENV NODE_ENV=development
ENV PORT=3000
ENV HOST=0.0.0.0
ENV FRONTEND_URL=http://localhost:5173
ENV LOG_LEVEL=debug

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]