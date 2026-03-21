# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
RUN npm install --legacy-peer-deps

COPY apps/web ./apps/web/
COPY tsconfig.json ./

WORKDIR /app/apps/web
RUN npm run build

# Production stage — nginx serves files + proxies /api to backend
FROM nginx:alpine

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
