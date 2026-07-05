# Multi-stage build para optimizar el tamaño de la imagen
FROM node:18-alpine AS builder

# Instalar dependencias del sistema necesarias para compilar
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    openssl \
    libc6-compat

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar todas las dependencias (incluyendo devDependencies para el build)
RUN npm ci && npm cache clean --force

# Copiar código fuente
COPY . .

# Generar cliente de Prisma
RUN npx prisma generate

# Compilar TypeScript
RUN npm run build

# Etapa de producción
FROM node:18-alpine AS production

# Instalar solo dependencias de runtime
RUN apk add --no-cache \
    dumb-init \
    openssl \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY prisma ./prisma/

# Instalar solo dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar artefactos construidos desde la etapa builder.
# Importante: `npm ci --only=production` reinstala `@prisma/client` desde npm
# y borra el cliente generado por `prisma generate` en el builder. Hay que
# restaurar AMBOS: el paquete `@prisma` (cliente + CLI + engines) y `.prisma`
# (carpeta con los binarios del cliente generado). Si solo se restaura `.prisma`,
# cualquier script que importe `@prisma/client` falla con "Cannot find module".
# Tambien copiamos `node_modules/prisma` (la CLI standalone, fuera del scope
# @prisma) porque `prisma` esta en devDependencies y `start.sh` la invoca
# directamente desde alli para `migrate deploy`.
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/prisma ./prisma

# Copiar script de inicio
COPY --chown=nodejs:nodejs start.sh ./start.sh
RUN chmod +x start.sh
# Defensivo: si el contexto llega con CRLF (Windows host con core.autocrlf=true),
# busybox sh rompe con "set: illegal option -". Forzar LF antes de ejecutar.
RUN sed -i 's/\r$//' /app/start.sh

# Crear directorios necesarios
RUN mkdir -p logs uploads && \
    chown -R nodejs:nodejs /app

# Cambiar a usuario no root
USER nodejs

# Exponer puerto
EXPOSE 4040

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4040/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Usar dumb-init para manejar señales correctamente
ENTRYPOINT ["dumb-init", "--"]

# Comando de inicio (corre migraciones y luego arranca el servidor)
CMD ["sh", "start.sh"]
