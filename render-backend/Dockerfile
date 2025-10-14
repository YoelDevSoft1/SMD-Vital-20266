# Dockerfile para Render - Backend SMD Vital
FROM node:18-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache openssl

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci --only=production

# Generar Prisma Client
RUN npx prisma generate

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Exponer puerto
EXPOSE 10000

# Comando de inicio
CMD ["npm", "start"]
