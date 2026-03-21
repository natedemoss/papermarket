# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source
COPY apps/web ./apps/web/
COPY tsconfig.json ./

# Build
WORKDIR /app/apps/web
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install a simple HTTP server
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/apps/web/dist ./dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start app
CMD ["serve", "-s", "dist", "-l", "3000"]
