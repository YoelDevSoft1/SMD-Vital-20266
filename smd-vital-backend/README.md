# SMD Vital Backend

Backend robusto para SMD Vital - Médico a Domicilio en Bogotá. Una plataforma completa de atención médica domiciliaria con funcionalidades avanzadas de telemedicina, gestión de citas, pagos y notificaciones.

## 🚀 Características

- **Arquitectura de Microservicios** con Node.js + TypeScript
- **Base de Datos PostgreSQL** con Prisma ORM
- **Cache Redis** para sesiones y datos temporales
- **Autenticación JWT** con refresh tokens
- **Sistema de Colas** con Bull para tareas asíncronas
- **WebSockets** para notificaciones en tiempo real
- **Integración de Pagos** con Stripe
- **SMS y Email** con Twilio y Nodemailer
- **Monitoreo** con Prometheus y Grafana
- **Docker** para contenedorización
- **Rate Limiting** y seguridad avanzada

## 📋 Requisitos

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker y Docker Compose (opcional)

## 🛠️ Instalación

### Desarrollo Local

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd smd-vital-backend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp env.example .env
# Editar .env con tus configuraciones
```

4. **Configurar base de datos**
```bash
# Crear base de datos PostgreSQL
createdb smd_vital_db

# Ejecutar migraciones
npm run db:migrate

# Poblar datos iniciales (opcional)
npm run db:seed
```

5. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

### Docker

1. **Construir y ejecutar con Docker Compose**
```bash
docker-compose up -d
```

2. **Ver logs**
```bash
docker-compose logs -f backend
```

3. **Detener servicios**
```bash
docker-compose down
```

## 🔧 Configuración

### Variables de Entorno

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `DATABASE_URL` | URL de conexión a PostgreSQL | `postgresql://username:password@localhost:5432/smd_vital_db` |
| `REDIS_URL` | URL de conexión a Redis | `redis://localhost:6379` |
| `JWT_SECRET` | Clave secreta para JWT | Requerido |
| `JWT_REFRESH_SECRET` | Clave secreta para refresh tokens | Requerido |
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `CORS_ORIGIN` | Origen permitido para CORS | `http://localhost:4322` |

### Base de Datos

El esquema de la base de datos se define en `prisma/schema.prisma`. Para aplicar cambios:

```bash
# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Resetear base de datos (desarrollo)
npm run db:reset
```

## 📚 API Documentation

### Endpoints Principales

#### Autenticación
- `POST /api/v1/auth/register` - Registro de usuario
- `POST /api/v1/auth/login` - Inicio de sesión
- `POST /api/v1/auth/refresh` - Renovar token
- `POST /api/v1/auth/logout` - Cerrar sesión
- `GET /api/v1/auth/me` - Perfil del usuario
- `PUT /api/v1/auth/profile` - Actualizar perfil

#### Citas Médicas
- `GET /api/v1/appointments` - Listar citas
- `POST /api/v1/appointments` - Crear cita
- `GET /api/v1/appointments/:id` - Obtener cita
- `PUT /api/v1/appointments/:id` - Actualizar cita
- `DELETE /api/v1/appointments/:id` - Cancelar cita

#### Doctores
- `GET /api/v1/doctors` - Listar doctores
- `GET /api/v1/doctors/:id` - Obtener doctor
- `GET /api/v1/doctors/:id/availability` - Disponibilidad del doctor
- `POST /api/v1/doctors/:id/rating` - Calificar doctor

#### Servicios
- `GET /api/v1/services` - Listar servicios
- `POST /api/v1/services` - Crear servicio
- `PUT /api/v1/services/:id` - Actualizar servicio
- `DELETE /api/v1/services/:id` - Eliminar servicio

#### Pagos
- `POST /api/v1/payments` - Crear pago
- `GET /api/v1/payments/:id` - Obtener pago
- `POST /api/v1/payments/:id/process` - Procesar pago

### Autenticación

Todas las rutas protegidas requieren un token JWT en el header:

```
Authorization: Bearer <your-jwt-token>
```

### Respuestas de la API

Todas las respuestas siguen el formato:

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "unique-request-id"
}
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests en modo watch
npm run test:watch

# Coverage
npm run test:coverage
```

## 📊 Monitoreo

### Prometheus
- URL: http://localhost:9090
- Métricas del backend en `/metrics`

### Grafana
- URL: http://localhost:3001
- Usuario: `admin`
- Contraseña: `admin`

### Logs
Los logs se almacenan en:
- `logs/combined.log` - Todos los logs
- `logs/error.log` - Solo errores
- `logs/exceptions.log` - Excepciones no manejadas

## 🔒 Seguridad

- **Rate Limiting**: 100 requests por 15 minutos por IP
- **CORS**: Configurado para dominios específicos
- **Helmet**: Headers de seguridad
- **JWT**: Tokens con expiración
- **Bcrypt**: Hash de contraseñas
- **Validación**: Esquemas Zod para validación de datos

## 🚀 Despliegue

### Producción

1. **Configurar variables de entorno de producción**
2. **Construir imagen Docker**
```bash
docker build -t smd-vital-backend .
```

3. **Desplegar con Docker Compose**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Variables de Entorno de Producción

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/smd_vital_db
REDIS_URL=redis://host:6379
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
CORS_ORIGIN=https://yourdomain.com
```

## 📈 Escalabilidad

### Horizontal Scaling
- Múltiples instancias del backend
- Load balancer (Nginx)
- Redis Cluster para cache distribuido
- PostgreSQL con réplicas de lectura

### Vertical Scaling
- Aumentar recursos de CPU/RAM
- Optimizar consultas de base de datos
- Implementar cache de consultas

## 🔄 CI/CD

### GitHub Actions
```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run lint
```

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Construir aplicación
npm run start        # Iniciar servidor de producción

# Base de datos
npm run db:migrate   # Ejecutar migraciones
npm run db:generate  # Generar cliente Prisma
npm run db:seed      # Poblar datos iniciales

# Testing
npm test             # Ejecutar tests
npm run test:watch   # Tests en modo watch
npm run test:coverage # Coverage de tests

# Linting
npm run lint         # Ejecutar ESLint
npm run lint:fix     # Corregir errores de linting

# Docker
npm run docker:build # Construir imagen Docker
npm run docker:up    # Iniciar con Docker Compose
npm run docker:down  # Detener Docker Compose
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- Email: soporte@smdvitalbogota.com
- WhatsApp: +57 300 123 4567
- Website: https://smdvitalbogota.com

## 🏥 SMD Vital

**SMD Vital** - Atención médica profesional a domicilio en Bogotá 24/7

- 🚑 Servicios médicos a domicilio
- 👨‍⚕️ Doctores certificados
- ⏰ Llegamos en 45 minutos
- 💰 Precios transparentes
- 📱 App móvil disponible
- 🌍 Cobertura en las 20 localidades de Bogotá

---

© 2024 SMD Vital. Todos los derechos reservados.






