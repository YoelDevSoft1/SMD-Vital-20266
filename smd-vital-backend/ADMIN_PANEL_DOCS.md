# 📊 Panel de Administración SMD Vital - Documentación Completa

## Descripción General

El panel de administración de SMD Vital proporciona una interfaz completa para gestionar todos los aspectos de la plataforma de atención médica a domicilio. Incluye dashboard con métricas en tiempo real, gestión de usuarios, doctores, citas, pagos, servicios, reseñas y herramientas de sistema.

## URL Base

```
/api/v1/admin-panel
```

## Autenticación

Todos los endpoints requieren:
- **Autenticación**: Token JWT válido en header `Authorization: Bearer <token>`
- **Autorización**: Rol de `ADMIN` o `SUPER_ADMIN`

---

## 📈 Dashboard & Analytics

### 1. Get Dashboard Statistics

Obtiene estadísticas completas del dashboard incluyendo métricas generales, tendencias y actividad reciente.

**Endpoint:** `GET /dashboard`

**Response:**
```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "overview": {
      "totalUsers": 1250,
      "totalPatients": 1000,
      "totalDoctors": 50,
      "totalAppointments": 3500,
      "totalPayments": 3200,
      "activeUsers": 1150,
      "verifiedDoctors": 45,
      "totalRevenue": 125000000,
      "monthlyRevenue": 15000000,
      "averageRating": 4.7
    },
    "appointments": {
      "total": 3500,
      "pending": 120,
      "completed": 3100,
      "cancelled": 280,
      "completionRate": 88.57
    },
    "growth": {
      "appointments": 15.5,
      "users": 8.3
    },
    "recentActivity": {
      "appointments": [...],
      "users": [...]
    },
    "topPerformers": {
      "doctors": [...],
      "services": [...]
    }
  }
}
```

**Métricas Incluidas:**
- ✅ Conteo total de usuarios, pacientes, doctores
- ✅ Estadísticas de citas (pendientes, completadas, canceladas)
- ✅ Ingresos totales y mensuales
- ✅ Calificación promedio
- ✅ Tasas de crecimiento (comparado con mes anterior)
- ✅ Actividad reciente (últimas 10 citas y usuarios)
- ✅ Top 5 doctores por calificación
- ✅ Top 5 servicios más populares

---

### 2. Get Advanced Analytics

Obtiene analíticas avanzadas con tendencias por período de tiempo.

**Endpoint:** `GET /analytics`

**Query Parameters:**
- `startDate` (required): Fecha inicial (ISO 8601)
- `endDate` (required): Fecha final (ISO 8601)
- `groupBy` (optional): Agrupación (`day`, `week`, `month`)

**Example:**
```
GET /analytics?startDate=2024-01-01&endDate=2024-12-31&groupBy=month
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-12-31T23:59:59.999Z",
      "groupBy": "month"
    },
    "trends": [
      {
        "date": "2024-01",
        "appointments": 250,
        "revenue": 10000000,
        "users": 85
      }
    ],
    "summary": {
      "totalAppointments": 3500,
      "totalRevenue": 125000000,
      "totalUsers": 1250,
      "averageOrderValue": 35714
    }
  }
}
```

---

### 3. Get Revenue Report

Genera reporte detallado de ingresos con desglose por método de pago y servicios.

**Endpoint:** `GET /revenue`

**Query Parameters:**
- `startDate` (required): Fecha inicial
- `endDate` (required): Fecha final

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    },
    "summary": {
      "totalRevenue": 125000000,
      "pendingRevenue": 5000000,
      "completedPayments": 3200,
      "pendingPayments": 150,
      "failedPayments": 50
    },
    "byMethod": [
      {
        "method": "CARD",
        "_sum": { "amount": 80000000 },
        "_count": 2100
      },
      {
        "method": "CASH",
        "_sum": { "amount": 30000000 },
        "_count": 800
      }
    ],
    "byStatus": [...],
    "topServices": [...],
    "recentPayments": [...]
  }
}
```

---

## 👥 User Management

### 4. Get All Users

Lista todos los usuarios con filtros y paginación.

**Endpoint:** `GET /users`

**Query Parameters:**
- `page` (default: 1): Número de página
- `limit` (default: 10): Elementos por página
- `role` (optional): Filtrar por rol (`PATIENT`, `DOCTOR`, `ADMIN`)
- `search` (optional): Buscar por nombre o email
- `isActive` (optional): Filtrar por estado activo (`true`/`false`)
- `isVerified` (optional): Filtrar por verificación (`true`/`false`)

**Example:**
```
GET /users?page=1&limit=20&role=DOCTOR&isActive=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_123",
        "email": "doctor@example.com",
        "firstName": "Juan",
        "lastName": "Pérez",
        "phone": "+57300123456 7",
        "role": "DOCTOR",
        "isActive": true,
        "isVerified": true,
        "avatar": "https://...",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "_count": {
          "notifications": 5
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### 5. Get User Details

Obtiene información detallada de un usuario específico.

**Endpoint:** `GET /users/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "patient@example.com",
    "firstName": "María",
    "lastName": "González",
    "role": "PATIENT",
    "patient": {
      "id": "patient_456",
      "dateOfBirth": "1990-05-15",
      "gender": "FEMALE",
      "address": "Calle 123 #45-67",
      "city": "Bogotá",
      "medicalHistory": "...",
      "allergies": "Penicilina",
      "appointments": [...],
      "reviews": [...],
      "_count": {
        "appointments": 15,
        "reviews": 8
      }
    },
    "notifications": [...]
  }
}
```

---

### 6. Update User Status

Activa o desactiva un usuario.

**Endpoint:** `PATCH /users/:id/status`

**Body:**
```json
{
  "isActive": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "User deactivated successfully",
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "isActive": false,
    "role": "PATIENT"
  }
}
```

---

### 7. Verify User

Verifica manualmente una cuenta de usuario.

**Endpoint:** `PATCH /users/:id/verify`

**Response:**
```json
{
  "success": true,
  "message": "User verified successfully",
  "data": {
    "id": "user_123",
    "isVerified": true
  }
}
```

---

### 8. Delete User

Elimina un usuario (y todos sus datos relacionados por cascada).

**Endpoint:** `DELETE /users/:id`

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## 👨‍⚕️ Doctor Management

### 9. Get All Doctors

Lista todos los doctores con filtros.

**Endpoint:** `GET /doctors`

**Query Parameters:**
- `page`, `limit`: Paginación
- `specialty` (optional): Filtrar por especialidad
- `isAvailable` (optional): Filtrar por disponibilidad
- `search` (optional): Buscar por nombre

**Response:**
```json
{
  "success": true,
  "data": {
    "doctors": [
      {
        "id": "doctor_123",
        "licenseNumber": "MD-12345",
        "specialty": "Medicina General",
        "experience": 10,
        "rating": 4.8,
        "totalReviews": 150,
        "isAvailable": true,
        "consultationFee": 80000,
        "user": {
          "id": "user_123",
          "firstName": "Dr. Carlos",
          "lastName": "Rodríguez",
          "email": "carlos@smdvital.com",
          "phone": "+573001234567",
          "avatar": "https://..."
        },
        "_count": {
          "appointments": 320,
          "reviews": 150
        }
      }
    ],
    "pagination": {...}
  }
}
```

---

### 10. Update Doctor Availability

Actualiza la disponibilidad de un doctor.

**Endpoint:** `PATCH /doctors/:id/availability`

**Body:**
```json
{
  "isAvailable": true
}
```

---

## 📅 Appointment Management

### 11. Get All Appointments

Lista todas las citas con filtros avanzados.

**Endpoint:** `GET /appointments`

**Query Parameters:**
- `page`, `limit`: Paginación
- `status` (optional): Filtrar por estado
- `dateFrom`, `dateTo` (optional): Rango de fechas
- `doctorId` (optional): Filtrar por doctor
- `patientId` (optional): Filtrar por paciente

**Response:**
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "appointment_123",
        "status": "COMPLETED",
        "scheduledAt": "2024-01-20T14:00:00.000Z",
        "duration": 60,
        "totalPrice": 80000,
        "address": "Calle 123 #45-67",
        "city": "Bogotá",
        "patient": {
          "id": "patient_456",
          "user": {
            "firstName": "María",
            "lastName": "González",
            "email": "maria@example.com",
            "phone": "+573009876543"
          }
        },
        "doctor": {
          "id": "doctor_789",
          "user": {
            "firstName": "Dr. Carlos",
            "lastName": "Rodríguez"
          }
        },
        "service": {
          "id": "service_111",
          "name": "Consulta Médica General",
          "category": "CONSULTATION"
        },
        "payments": [...]
      }
    ],
    "pagination": {...}
  }
}
```

---

### 12. Update Appointment Status

Actualiza el estado de una cita.

**Endpoint:** `PATCH /appointments/:id/status`

**Body:**
```json
{
  "status": "COMPLETED"
}
```

**Estados Válidos:**
- `PENDING`
- `CONFIRMED`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELLED`
- `NO_SHOW`
- `RESCHEDULED`

---

## 💳 Payment Management

### 13. Get All Payments

Lista todos los pagos con filtros.

**Endpoint:** `GET /payments`

**Query Parameters:**
- `page`, `limit`: Paginación
- `status` (optional): Filtrar por estado
- `method` (optional): Filtrar por método de pago
- `dateFrom`, `dateTo` (optional): Rango de fechas

**Response:**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "payment_123",
        "amount": 80000,
        "currency": "COP",
        "status": "COMPLETED",
        "method": "CARD",
        "transactionId": "txn_456789",
        "createdAt": "2024-01-20T14:30:00.000Z",
        "appointment": {
          "id": "appointment_123",
          "scheduledAt": "2024-01-20T14:00:00.000Z",
          "patient": {...},
          "doctor": {...},
          "service": {...}
        }
      }
    ],
    "pagination": {...}
  }
}
```

---

## 🏥 Service Management

### 14. Get All Services

Lista todos los servicios médicos.

**Endpoint:** `GET /services`

**Query Parameters:**
- `page`, `limit`: Paginación
- `category` (optional): Filtrar por categoría
- `isActive` (optional): Filtrar por estado activo

**Response:**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "service_123",
        "name": "Consulta Médica General",
        "description": "Consulta médica general a domicilio",
        "category": "CONSULTATION",
        "basePrice": 80000,
        "duration": 60,
        "isActive": true,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "_count": {
          "appointments": 1250,
          "doctorServices": 45
        }
      }
    ],
    "pagination": {...}
  }
}
```

**Categorías de Servicios:**
- `CONSULTATION` - Consulta médica
- `EMERGENCY` - Emergencia
- `LABORATORY` - Laboratorio
- `NURSING` - Enfermería
- `SPECIALIST` - Especialista
- `THERAPY` - Terapia
- `VACCINATION` - Vacunación
- `OTHER` - Otros

---

### 15. Update Service Status

Activa o desactiva un servicio.

**Endpoint:** `PATCH /services/:id/status`

**Body:**
```json
{
  "isActive": false
}
```

---

## ⭐ Review Management

### 16. Get All Reviews

Lista todas las reseñas con filtros.

**Endpoint:** `GET /reviews`

**Query Parameters:**
- `page`, `limit`: Paginación
- `doctorId` (optional): Filtrar por doctor
- `minRating` (optional): Calificación mínima (1-5)
- `isVerified` (optional): Filtrar por verificación

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "review_123",
        "rating": 5,
        "comment": "Excelente atención, muy profesional",
        "isVerified": true,
        "createdAt": "2024-01-21T10:00:00.000Z",
        "patient": {
          "user": {
            "id": "user_456",
            "firstName": "María",
            "lastName": "González",
            "avatar": "https://..."
          }
        },
        "doctor": {
          "user": {
            "id": "user_789",
            "firstName": "Dr. Carlos",
            "lastName": "Rodríguez"
          }
        },
        "appointment": {
          "id": "appointment_111",
          "scheduledAt": "2024-01-20T14:00:00.000Z",
          "status": "COMPLETED"
        }
      }
    ],
    "pagination": {...}
  }
}
```

---

### 17. Verify Review

Verifica manualmente una reseña.

**Endpoint:** `PATCH /reviews/:id/verify`

---

### 18. Delete Review

Elimina una reseña (por ejemplo, si es inapropiada).

**Endpoint:** `DELETE /reviews/:id`

---

## 🖥️ System Management

### 19. Get System Health

Obtiene el estado de salud del sistema.

**Endpoint:** `GET /system/health`

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-22T10:00:00.000Z",
    "uptime": 8640000,
    "services": {
      "database": "connected",
      "redis": "connected"
    },
    "system": {
      "memory": {
        "used": 250,
        "total": 512,
        "external": 15,
        "unit": "MB"
      },
      "cpu": {
        "user": 125000,
        "system": 45000,
        "unit": "microseconds"
      },
      "platform": "linux",
      "nodeVersion": "v18.17.0"
    }
  }
}
```

---

### 20. Get System Logs

Obtiene logs del sistema con filtros.

**Endpoint:** `GET /system/logs`

**Query Parameters:**
- `level` (optional): Nivel de log (`error`, `warn`, `info`, `debug`)
- `limit` (default: 100): Número máximo de logs
- `startDate`, `endDate` (optional): Rango de fechas

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      "2024-01-22 10:15:32 [INFO]: User logged in successfully",
      "2024-01-22 10:14:22 [ERROR]: Payment processing failed: Insufficient funds"
    ],
    "total": 1523,
    "limit": 100
  }
}
```

---

## 📤 Data Export

### 21. Export Data

Exporta datos en varios formatos.

**Endpoint:** `POST /export`

**Body:**
```json
{
  "type": "appointments",
  "format": "json",
  "filters": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "status": "COMPLETED"
  }
}
```

**Tipos de Exportación:**
- `users`
- `appointments`
- `payments`
- `doctors`
- `services`
- `reviews`

**Formatos Disponibles:**
- `json`
- `csv`
- `excel` (próximamente)

**Response:**
```json
{
  "success": true,
  "message": "Data exported successfully",
  "data": {
    "type": "appointments",
    "format": "json",
    "count": 3200,
    "data": [...],
    "exportedAt": "2024-01-22T10:00:00.000Z"
  }
}
```

---

## 🔐 Seguridad

### Rate Limiting
- **Límite General**: 100 requests por 15 minutos por IP
- **Endpoints Sensibles**: Límites adicionales pueden aplicar

### Permisos por Rol

| Endpoint | ADMIN | SUPER_ADMIN |
|----------|-------|-------------|
| Dashboard | ✅ | ✅ |
| Analytics | ✅ | ✅ |
| Users (Read) | ✅ | ✅ |
| Users (Write) | ❌ | ✅ |
| Users (Delete) | ❌ | ✅ |
| Doctors | ✅ | ✅ |
| Appointments | ✅ | ✅ |
| Payments | ✅ | ✅ |
| Services | ✅ | ✅ |
| Reviews | ✅ | ✅ |
| System Health | ✅ | ✅ |
| System Logs | ❌ | ✅ |
| Export Data | ✅ | ✅ |

---

## 📊 Códigos de Error

| Código | Descripción |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Error en la petición |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Error del servidor |

---

## 🚀 Ejemplos de Uso

### Ejemplo con cURL

```bash
# Login para obtener token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@smdvital.com",
    "password": "SecurePassword123"
  }'

# Obtener dashboard (usando el token)
curl -X GET http://localhost:3000/api/v1/admin-panel/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Buscar usuarios activos
curl -X GET "http://localhost:3000/api/v1/admin-panel/users?isActive=true&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Actualizar estado de usuario
curl -X PATCH http://localhost:3000/api/v1/admin-panel/users/user_123/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

### Ejemplo con JavaScript (Fetch)

```javascript
// Obtener dashboard
const getDashboard = async () => {
  const response = await fetch('http://localhost:3000/api/v1/admin-panel/dashboard', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  console.log(data);
};

// Filtrar citas por estado
const getAppointments = async () => {
  const params = new URLSearchParams({
    page: '1',
    limit: '20',
    status: 'PENDING',
    dateFrom: '2024-01-01',
    dateTo: '2024-12-31'
  });

  const response = await fetch(
    `http://localhost:3000/api/v1/admin-panel/appointments?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  const data = await response.json();
  console.log(data);
};
```

---

## 📝 Notas Adicionales

1. **Timestamps**: Todas las fechas están en formato ISO 8601 (UTC)
2. **Paginación**: Por defecto `page=1` y `limit=10`
3. **Moneda**: Todos los valores monetarios en COP (Pesos Colombianos)
4. **IDs**: Todos los IDs son CUIDs únicos
5. **Soft Delete**: Los usuarios eliminados pueden ser restaurados por SUPER_ADMIN

---

## 🔄 Changelog

### v1.0.0 (2024-01-22)
- ✨ Lanzamiento inicial del panel de administración
- ✅ Dashboard con métricas en tiempo real
- ✅ Gestión completa de usuarios, doctores, citas
- ✅ Sistema de analíticas y reportes
- ✅ Monitoreo de sistema y logs
- ✅ Exportación de datos

---

## 📞 Soporte

Para soporte técnico:
- **Email**: dev@smdvitalbogota.com
- **GitHub Issues**: https://github.com/smdvital/backend/issues

---

© 2024 SMD Vital. Todos los derechos reservados.
