# Etapa 1: Build del bundle Vite
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Cache-friendly: solo package*.json primero
COPY package*.json ./
RUN npm ci || npm install

# Codigo fuente
COPY . .

# URL del backend embebida en el bundle. Si no se pasa como build-arg,
# cae al default (Render). En Fly.io se sobreescribe con `fly secrets set
# VITE_API_URL=...` o en el toml [env].
ARG VITE_API_URL=https://smdvital-backend.onrender.com/api/v1
ENV VITE_API_URL=$VITE_API_URL

# Publica que el SW debe activarse
ENV VITE_ENABLE_PWA=true

RUN npm run build

# -----------------------------------------------------------------------------
# Etapa 2: Servidor estatico (nginx)
# -----------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

# Quitar el sitio default
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copiar el bundle construido
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar la config de nginx (SPA fallback + cache-control del SW)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Healthcheck interno de Fly
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/ || exit 1

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
