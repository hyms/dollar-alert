# Dockerfile for DollarBack (Node.js + Fastify)
# Development and Production multi-stage build

# ==========================================
# Development Stage
# ==========================================
FROM node:20 AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy node_modules to backup location
RUN cp -r node_modules node_modules_bak

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Use entrypoint script
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# ==========================================
# Production Stage
# ==========================================
FROM node:20 AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy compiled application
COPY dist ./dist

# Expose port
EXPOSE 3000

# Start production server
CMD ["node", "dist/main/index.js"]