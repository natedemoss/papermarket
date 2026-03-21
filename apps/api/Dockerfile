# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source and prisma
COPY apps/api ./apps/api/
COPY tsconfig.json ./

# Build
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm install --legacy-peer-deps --production && \
    npm install --legacy-peer-deps -w apps/api

# Copy built app from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Regenerate Prisma client for this environment (Debian)
WORKDIR /app/apps/api
RUN npx prisma generate

# Create .env file placeholder
RUN echo "NODE_ENV=production" > .env

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start app
WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]
