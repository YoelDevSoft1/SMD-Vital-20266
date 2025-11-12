# 📖 Ejemplos de Uso - Mejoras Implementadas

Este documento muestra ejemplos prácticos de cómo usar las mejoras implementadas en el backend de SMD Vital.

## 1. 🚀 Caché Redis

### Ejemplo 1: Cachear lista de servicios

```typescript
// src/routes/service.routes.ts
import { Router } from 'express';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.middleware';
import { ServiceController } from '../controllers/service.controller';

const router = Router();
const serviceController = new ServiceController();

// GET /api/v1/services - Cacheado por 5 minutos
router.get('/',
  cacheMiddleware({ ttl: 300 }), // 5 minutos
  serviceController.getAll
);

// GET /api/v1/services/:id - Cacheado por 10 minutos
router.get('/:id',
  cacheMiddleware({ ttl: 600 }), // 10 minutos
  serviceController.getById
);

// POST /api/v1/services - Invalidar caché después de crear
router.post('/',
  invalidateCache(['cache:GET:/api/v1/services:*']),
  serviceController.create
);

// PUT /api/v1/services/:id - Invalidar caché específico y lista
router.put('/:id',
  invalidateCache([
    'cache:GET:/api/v1/services:*',
    'cache:GET:/api/v1/services/:id:*'
  ]),
  serviceController.update
);

// DELETE /api/v1/services/:id - Invalidar caché
router.delete('/:id',
  invalidateCache(['cache:GET:/api/v1/services:*']),
  serviceController.delete
);
```

### Ejemplo 2: Cachear con clave personalizada

```typescript
import { cacheMiddleware } from '../middleware/cache.middleware';

router.get('/doctors',
  cacheMiddleware({
    ttl: 600, // 10 minutos
    keyGenerator: (req) => {
      // Incluir filtros en la clave de caché
      const specialty = req.query.specialty || 'all';
      const city = req.query.city || 'all';
      return `cache:doctors:${specialty}:${city}`;
    }
  }),
  doctorController.getAll
);
```

### Ejemplo 3: Deshabilitar caché para respuesta específica

```typescript
router.get('/services',
  cacheMiddleware({ ttl: 300 }),
  (req, res, next) => {
    // Deshabilitar caché para esta respuesta
    res.setHeader('X-Cache-Disable', 'true');
    next();
  },
  serviceController.getAll
);
```

## 2. 🛡️ Rate Limiting

### Ejemplo 1: Rate limiting en autenticación

```typescript
// src/routes/auth.routes.ts
import { Router } from 'express';
import { rateLimiters } from '../middleware/rateLimit.middleware';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

// Login con rate limiting estricto
router.post('/login',
  rateLimiters.auth, // 5 requests / 15 min
  authController.login
);

// Registro con rate limiting
router.post('/register',
  rateLimiters.registration, // 3 requests / hora
  authController.register
);

// Reset de contraseña con rate limiting
router.post('/forgot-password',
  rateLimiters.passwordReset, // 3 requests / hora
  authController.forgotPassword
);
```

### Ejemplo 2: Rate limiting basado en rol

```typescript
// src/routes/admin.routes.ts
import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { roleBasedRateLimit } from '../middleware/rateLimit.middleware';
import { AdminController } from '../controllers/admin.controller';

const router = Router();
const adminController = new AdminController();

// Aplicar rate limiting basado en rol del usuario
router.use(authMiddleware);
router.use((req, res, next) => {
  const rateLimiter = roleBasedRateLimit(req.userRole || 'PATIENT');
  rateLimiter(req, res, next);
});

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
```

### Ejemplo 3: Rate limiting personalizado

```typescript
import { createRateLimiter } from '../middleware/rateLimit.middleware';

// Rate limiter personalizado para pagos
const paymentRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 requests
  message: 'Demasiadas solicitudes de pago. Por favor espera.',
  keyGenerator: (req) => {
    // Rate limit por usuario autenticado
    return req.userId ? `payment:${req.userId}` : req.ip || 'unknown';
  }
});

router.post('/payments',
  paymentRateLimiter,
  paymentController.processPayment
);
```

## 3. 🔒 Sanitización y Seguridad

### Ejemplo 1: Aplicar sanitización a todas las rutas

```typescript
// src/index.ts
import { securityMiddleware } from './middleware/sanitize.middleware';

// Aplicar a todas las rutas (ya está en index.ts)
app.use(securityMiddleware);
```

### Ejemplo 2: Sanitización específica por ruta

```typescript
// src/routes/user.routes.ts
import { Router } from 'express';
import { sanitizeInput, sanitizeEmail, sanitizePhone } from '../middleware/sanitize.middleware';
import { UserController } from '../controllers/user.controller';

const router = Router();
const userController = new UserController();

// Actualizar perfil con sanitización
router.put('/profile',
  sanitizeInput,
  sanitizeEmail,
  sanitizePhone,
  userController.updateProfile
);
```

### Ejemplo 3: Prevención de NoSQL injection

```typescript
import { preventNoSqlInjection } from '../middleware/sanitize.middleware';

// La prevención de NoSQL injection ya está en securityMiddleware
// Pero puedes aplicarla individualmente si es necesario
router.get('/search',
  preventNoSqlInjection,
  searchController.search
);
```

## 4. 📚 Swagger Documentation

### Ejemplo 1: Documentar endpoint con Swagger

```typescript
// src/routes/auth.routes.ts
import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', authController.login);
```

### Ejemplo 2: Documentar endpoint con parámetros

```typescript
/**
 * @swagger
 * /api/v1/services/{id}:
 *   get:
 *     summary: Obtener servicio por ID
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del servicio
 *     responses:
 *       200:
 *         description: Servicio encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       404:
 *         description: Servicio no encontrado
 */
router.get('/:id', serviceController.getById);
```

## 5. 🔄 Combinación de Middlewares

### Ejemplo completo: Endpoint con todas las mejoras

```typescript
// src/routes/service.routes.ts
import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.middleware';
import { rateLimiters } from '../middleware/rateLimit.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { validationSchemas } from '../types/validation';
import { ServiceController } from '../controllers/service.controller';

const router = Router();
const serviceController = new ServiceController();

// GET /api/v1/services - Público, cacheado
router.get('/',
  cacheMiddleware({ ttl: 300 }), // Cache 5 minutos
  serviceController.getAll
);

// GET /api/v1/services/:id - Público, cacheado
router.get('/:id',
  cacheMiddleware({ ttl: 600 }), // Cache 10 minutos
  serviceController.getById
);

// POST /api/v1/services - Requiere autenticación y rol ADMIN
router.post('/',
  authMiddleware, // Autenticación requerida
  requireRole(['ADMIN', 'SUPER_ADMIN']), // Solo admins
  rateLimiters.api, // Rate limiting
  validateRequest(validationSchemas.createService), // Validación
  invalidateCache(['cache:GET:/api/v1/services:*']), // Invalidar caché
  serviceController.create
);

// PUT /api/v1/services/:id - Requiere autenticación y rol ADMIN
router.put('/:id',
  authMiddleware,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  rateLimiters.api,
  validateRequest(validationSchemas.updateService),
  invalidateCache([
    'cache:GET:/api/v1/services:*',
    'cache:GET:/api/v1/services/:id:*'
  ]),
  serviceController.update
);

// DELETE /api/v1/services/:id - Requiere autenticación y rol ADMIN
router.delete('/:id',
  authMiddleware,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  rateLimiters.api,
  invalidateCache(['cache:GET:/api/v1/services:*']),
  serviceController.delete
);
```

## 6. 🧪 Testing

### Ejemplo: Test con caché

```typescript
// tests/service.test.ts
import request from 'supertest';
import app from '../src/index';

describe('Service Cache', () => {
  it('should cache GET /api/v1/services', async () => {
    // Primera solicitud - Cache MISS
    const response1 = await request(app)
      .get('/api/v1/services')
      .expect(200);

    expect(response1.headers['x-cache']).toBe('MISS');

    // Segunda solicitud - Cache HIT
    const response2 = await request(app)
      .get('/api/v1/services')
      .expect(200);

    expect(response2.headers['x-cache']).toBe('HIT');
  });
});
```

### Ejemplo: Test de rate limiting

```typescript
// tests/auth.test.ts
import request from 'supertest';
import app from '../src/index';

describe('Auth Rate Limiting', () => {
  it('should rate limit login after 5 attempts', async () => {
    // Intentar login 5 veces
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' })
        .expect(401);
    }

    // Sexto intento debería ser rate limited
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' })
      .expect(429);

    expect(response.body.error).toBe('RATE_LIMIT_EXCEEDED');
  });
});
```

## 7. 📊 Monitoreo

### Ejemplo: Verificar estado del caché

```typescript
// src/routes/admin.routes.ts
import { RedisService } from '../services/redis.service';

router.get('/cache/stats', async (req, res) => {
  try {
    const info = await RedisService.info();
    const keys = await RedisService.keys('cache:*');
    
    res.json({
      success: true,
      data: {
        totalCacheKeys: keys.length,
        redisInfo: info
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting cache stats'
    });
  }
});
```

## 8. 🚨 Troubleshooting

### Problema: Caché no funciona

**Solución:**
1. Verificar que Redis esté corriendo
2. Verificar la conexión a Redis en los logs
3. Verificar que el middleware de caché esté aplicado correctamente
4. Verificar headers `X-Cache` en la respuesta

### Problema: Rate limiting muy estricto

**Solución:**
1. Ajustar los límites en `rateLimit.middleware.ts`
2. Usar rate limiters más permisivos
3. Verificar que el keyGenerator esté configurado correctamente

### Problema: Sanitización muy agresiva

**Solución:**
1. Ajustar las funciones de sanitización
2. Deshabilitar sanitización para campos específicos
3. Verificar que los datos estén en el formato correcto

---

## 📝 Notas Adicionales

- El middleware de seguridad se aplica automáticamente a todas las rutas
- El caché solo funciona con respuestas GET
- El rate limiting se aplica antes de procesar la solicitud
- La sanitización se aplica después de parsear el body
- Swagger se actualiza automáticamente cuando agregas comentarios JSDoc

---

**Última actualización:** Enero 2026
**Versión:** 2.1.0

