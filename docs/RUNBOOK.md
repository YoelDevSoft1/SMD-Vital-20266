# RUNBOOK — Operación Diaria SMD Vital

> **Objetivo:** que cualquier operador pueda correr la operación diaria del negocio
> (gestión de usuarios, citas, encounters clínicos, pagos) sin necesidad de pedir
> ayuda externa. Cada caso tiene: **síntoma → comando listo → dónde mirar el resultado**.

---

## 0. Antes de empezar — credenciales y URLs

| Recurso | URL / Valor | Notas |
|---|---|---|
| **Admin panel (PWA)** | `https://smd-vital-admin.onrender.com` | Aplicación diaria del equipo |
| **Backend API** | `https://smdvital-backend.onrender.com` | Base para `curl` cuando la UI no alcanza |
| **Postgres local (dev)** | `localhost:5434` (container `smdvital-postgres`) | Solo desarrollo |
| **Render dashboard** | https://dashboard.render.com | Para reiniciar servicios, ver logs, env vars |

**Usuarios seed (production):**
```
superadmin@smdvital.com         / Password123!     SUPER_ADMIN
admin@smdvital.com              / Password123!     ADMIN
doctor@smdvital.com             / Password123!     DOCTOR     (seed del repositorio)
enfermera@smdvital.com          / Password123!     NURSE      (seed)
agente@smdvital.com             / Password123!     AGENT      (seed)
paciente@smdvital.com           / Password123!     PATIENT    (seed)
omar@smdvitalbogota.com         / <ver paso 3>     DOCTOR     (creado por uso real)
```

⚠️ Si alguna password no es `Password123!`, el flujo está documentado en [§3.4 Resetear password](#34-resetear-password).

---

## 1. Diagnóstico rápido (algo no responde)

### 1.1 Admin panel muestra "Sin conexion"
1. Entrá al admin panel.
2. Si ves el chip ámbar `Sin conexion` o la pantalla offline completa, **el backend no responde**.
3. Probá `https://smdvital-backend.onrender.com/api/v1/health` en el navegador (debe devolver 200 con JSON).
4. Si devuelve 404 o no responde → ir a [§6 Backend caído](#6-backend-ca%C3%ADdo).

### 1.2 Un endpoint específico devuelve 401
1. El access token JWT probablemente **expiró**. Las apps cliente hacen refresh automático (cambio reciente en `api.ts`). Si ves 401 persistente, hay un bug. Ver logs:
   ```bash
   docker logs smdvital-backend --tail 200 | grep -i 'jwt\|token'
   ```

### 1.3 Endpoint devuelve 403 "Insufficient permissions"
1. El rol del usuario logueado no tiene permiso para ese endpoint. Verificá que estés logueado con el rol correcto.
2. Lista de permisos por rol:
   - **SUPER_ADMIN:** todo
   - **ADMIN:** casi todo excepto reset-password de otros admins
   - **AGENT:** solo lectura + crear appointment
   - **DOCTOR/NURSE:** `/clinical/*`
   - **PATIENT:** `/clinical/patient/history`

---

## 2. Crear / editar / activar usuarios

### 2.1 Crear un nuevo doctor / enfermero / agente / admin

**Opción A — UI (recomendado):** Panel admin → **Usuarios** → **+ Nuevo usuario** → completar form → **Crear**.

**Opción B — API directa** (cuando la UI no alcance):

```bash
TOKEN=$(curl -sS -X POST https://smdvital-backend.onrender.com/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"superadmin@smdvital.com","password":"Password123!"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).data.accessToken))")

curl -X POST https://smdvital-backend.onrender.com/api/v1/admin-panel/users \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"nuevo.doctor@smdvital.com",
    "password":"Password123!",
    "firstName":"Nombre",
    "lastName":"Apellido",
    "phone":"+573001234567",
    "role":"DOCTOR",
    "isActive":true,
    "isVerified":true
  }'
```

> Si `role: "DOCTOR"`, el servicio crea automáticamente la fila en `doctors` con `licenseNumber` placeholder. **El nuevo doctor tiene que editar su perfil** para agregar `licenseNumber` real (la UI permite esto).

### 2.2 Crear paciente rápido (sin email todavía)

Cuando el call-center toma una cita por WhatsApp y el paciente **no tiene email**:

```bash
curl -X POST https://smdvital-backend.onrender.com/api/v1/admin-panel/patients/quick \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "firstName":"Pedro",
    "lastName":"Pérez",
    "documentId":"1234567890",
    "phone":"+573001234567"
  }'
```

Esto crea un user `isPlaceholder: true` con email sintético `1234567890@paciente.smdvital.temp`. **Esta es la única forma soportada de crear placeholders.** Para activarlos después, el paciente debe registrarse formalmente en `/auth/register` con ese mismo documentId y el sistema lo "reclama".

### 2.3 Desactivar vs eliminar un usuario

**Diferencia importante desde Ciclo 5:**

| Acción | Cuándo se usa | Resultado |
|---|---|---|
| **Desactivar** (recomendado) | Empleado se fue de la empresa, doctor renunció, etc. | `isActive: false`, conserva historia de citas / pagos / historias clínicas |
| **Eliminar (hard delete)** | Cuenta se creó por error y nunca tuvo actividad | Borra todo (citas, pagos, etc.) |

**Desde la UI:** Users → seleccionar → **Desactivar** (toggle) o **Eliminar** (botón trash). Si es paciente placeholder, eliminar = desactivar (preserva historia automáticamente).

**Desde la API:**
```bash
curl -X PATCH "https://smdvital-backend.onrender.com/api/v1/admin-panel/users/{id}/status" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"isActive":false}'

# Hard delete (solo si no es placeholder patient):
curl -X DELETE "https://smdvital-backend.onrender.com/api/v1/admin-panel/users/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 3. Contraseñas y login

### 3.1 Login normal
**UI:** admin panel → email + password.

### 3.2 Un usuario olvidó su contraseña
1. Pedile al usuario que entre al admin panel y use **"¿Olvidaste tu contraseña?"**.
2. El sistema envía un email con link de reset (si `RESEND_API_KEY` está configurado).
3. Si no llega el email o no hay Resend configurado → [§3.4 Resetear password](#34-resetear-password) manual.

### 3.3 El equipo necesita el password de un doctor/nurse (caso Omar)
**Caso típico:** un doctor real existe en la BD pero nadie recuerda su password. La UI no permite ver passwords (hasheadas con bcrypt, no reversibles). Solución: reset a una password conocida.

### 3.4 Resetear password (manual via API)

```bash
TOKEN=$(curl -sS -X POST https://smdvital-backend.onrender.com/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"superadmin@smdvital.com","password":"Password123!"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).data.accessToken))")

# Listar usuarios para encontrar el id
curl -sS "https://smdvital-backend.onrender.com/api/v1/admin-panel/users?search=omar" \
  -H "Authorization: Bearer $TOKEN" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const u=JSON.parse(d).data.data[0];console.log(u.id, u.email)})"

# Resetear a Password123! (recordale al usuario que la cambie al primer login)
curl -X PATCH "https://smdvital-backend.onrender.com/api/v1/admin-panel/users/{id}/reset-password" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"newPassword":"Password123!"}'
```

> El controller acepta tanto `password` como `newPassword` — funcionan los dos.

---

## 4. Citas y encuentro clínico

### 4.1 El doctor no ve sus citas
1. Confirmá que está logueado con su cuenta (no la del paciente).
2. `GET /clinical/appointments` debería devolverlas paginadas. Si devuelve 0:
   - Verificá que `assignedNurseId` y `doctorId` estén asignados en la BD.
   - Verificar status: solo `PENDING`, `CONFIRMED`, `IN_PROGRESS` aparecen en este endpoint.

```bash
TOKEN=$(...login como doctor...)
curl -sS "https://smdvital-backend.onrender.com/api/v1/clinical/appointments?status=PENDING&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 4.2 Iniciar un encuentro clínico
1. UI: DoctorAppointments → cita → **Iniciar Atención**.
2. El status pasa a `IN_PROGRESS`, se crea `Encounter` en BD, ServiceTrace + AuditLog se registran.
3. Si falla con "Appointment already completed" → ya se finalizó en otro dispositivo.

### 4.3 La enfermera no ve signos vitales para registrar
1. Solo citas con `service.category === 'NURSING'` muestran el formulario de signos vitales (filtro del backend).
2. UI: DoctorAppointments como NURSE → las citas de laboratorio/curaciones aparecen.
3. Endpoint crudo: `POST /clinical/encounters/{id}/vitals` con los signos.

### 4.4 Finalizar el encuentro y generar PDFs
1. UI: DoctorAppointments → cita `IN_PROGRESS` → **Finalizar y Guardar**.
2. El sistema en transacción:
   - Crea MedicalRecord (PDF historia clínica) en `/uploads/documents/`
   - Crea Prescription + PrescriptionItems (PDF fórmula médica) si aplica
   - Marca cita `COMPLETED`
   - Crea `DocumentDelivery` para envío de email
3. **El email sale solo si `RESEND_API_KEY` está configurado en producción.** Si no, los PDFs quedan generados pero el email queda en `DocumentDelivery.status = QUEUED`.
4. Para forzar re-envío: `POST /clinical/appointments/{id}/send-documents`.

### 4.5 Verificar que los PDFs se generaron

```bash
docker exec smdvital-backend ls -la /app/uploads/documents/ | tail -20
# o en producción:
# ssh al host o container
ls -la /app/uploads/documents/  # (si tenés acceso)
```

---

## 5. Pagos y comisiones (Billing Core)

### 5.1 Ver comisiones pendientes de pagar
1. UI: Login como admin → **Billing** o **My Earnings** (depende del rol).
2. Endpoint: `GET /api/v1/acknowledgements?status=PENDING`

### 5.2 Crear un lote de pago semanal
1. UI: Billing → seleccionar profesional / agente → rango de fechas → **Generar lote**.
2. El sistema crea `PayoutBatch` con sus `PayoutBatchItems` (referencias a PaymentAcknowledgements).
3. Estado: `DRAFT` → `APPROVED` (cuando admin revisa) → `PAID` (cuando se transfiere).

### 5.3 Reconstruir el snapshot de margen de una cita vieja
- El `MarginSnapshot` se crea al confirmar la cita (snapshot inmutable).
- Si una cita vieja NO tiene snapshot (migración vieja), consultá:
  ```bash
  SELECT * FROM margin_snapshots WHERE "appointmentId" = 'XXX';
  ```
- Si está vacío, podés regenerarlo via endpoint admin (ver docs/INTEGRATIONS.md).

---

## 6. Backend caído (incidente)

### 6.1 Backend en Render no responde
1. Dashboard de Render: https://dashboard.render.com → servicio `smdvital-backend` → **Logs**.
2. Si está en "Sleeping" (free tier paused) → hacé click **Manual Deploy** → espera ~30s.
3. Si está crasheando → revisá los logs y re-deployá la última versión buena.

### 6.2 Backend local (Docker) no responde
```bash
docker ps --format "table {{.Names}}\t{{.Status}}" | grep smdvital
# Si dice "Restarting" o "Exited":
docker logs smdvital-backend --tail 50
# Reiniciar
docker restart smdvital-backend
```

### 6.3 Aplicar un fix al backend (cambio de código)

**Esto es lo más común: tenés un edit local, querés verlo en producción.**

```bash
# 1. Verificá que compila
cd smd-vital-backend
npm run build

# 2. Si compiló OK, hacé docker cp del archivo al container
docker cp dist/controllers/<archivo>.js smdvital-backend:/app/dist/controllers/<archivo>.js

# 3. Restart (Node reinicia con el código nuevo, ~5s)
docker restart smdvital-backend

# 4. Verificá
sleep 8
curl.exe -sS http://localhost:4040/api/v1/health
```

**Múltiples archivos:**
```bash
docker cp dist/services/admin-panel.service.js smdvital-backend:/app/dist/services/
docker cp dist/services/clinical.service.js smdvital-backend:/app/dist/services/
docker restart smdvital-backend
```

### 6.4 Cambios de schema (Prisma migration)

```bash
# Generar migración
npx prisma migrate dev --name <descripcion>

# Aplicar en producción (CUIDADO — irreversible)
npx prisma migrate deploy
```

⚠️ Las migraciones son **irreversibles** sin backup. Siempre:
1. Backup de la BD primero: `pg_dump` de la BD
2. Probar en dev primero
3. Aplicar en producción solo si el CI pasa

---

## 7. Email (Resend)

### 7.1 Los emails no salen
1. Verificá que `RESEND_API_KEY` esté en env del backend (Render dashboard → Environment).
2. Verificá `FROM_EMAIL` esté verificado en Resend (no puede ser un random).
3. Mirá la cola: `GET /api/v1/admin-panel/audit` filtrada por entity=APPOINTMENT + action=SEND_EMAIL.
4. **Stuck queue:** `SELECT * FROM document_deliveries WHERE status IN ('QUEUED','FAILED') ORDER BY createdAt DESC LIMIT 20;` — si hay muchos QUEUED sin avanzar, Resend está caído o key inválida.

### 7.2 Reenviar un email manualmente
```bash
curl -X POST "https://smdvital-backend.onrender.com/api/v1/clinical/appointments/{id}/send-documents" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"emailConsentAccepted":true}'
```

### 7.3 Ver el historial de envíos
```sql
SELECT id, email, status, attempts, "lastError", "createdAt", "sentAt"
FROM document_deliveries
ORDER BY createdAt DESC LIMIT 50;
```

---

## 8. Monitoreo / salud del sistema

### 8.1 Health checks rápidos
```bash
# Backend
curl.exe -sS https://smdvital-backend.onrender.com/api/v1/health | head -c 200

# Postgres
docker exec smdvital-postgres pg_isready -U smd_vital_user -d smd_vital_db

# Redis
docker exec smdvital-redis redis-cli ping
```

### 8.2 Logs
```bash
# Backend local
docker logs smdvital-backend --tail 100 --follow

# Solo errores
docker logs smdvital-backend --tail 200 | grep -i 'error\|exception'

# Filtrar por appointment
docker logs smdvital-backend --tail 500 | grep -i 'appointmentId.*<id>'
```

### 8.3 Métricas Prometheus (si está habilitado)
- Backend expone `/api/v1/metrics` en formato prom (configurado en docker-compose.full.yml perfil `monitoring`).
- Si el admin quiere stats en tiempo real, conectar Grafana a Render.

---

## 9. Plantillas operativas

### 9.1 Cuando llega una queja: "el doctor no me atendió"
1. Verificá la cita en la BD:
   ```sql
   SELECT a.id, a.status, a."scheduledAt", a."finishedAt",
          u_p.email AS patient_email,
          u_d.email AS doctor_email
   FROM appointments a
   JOIN patients p ON p.id = a."patientId"
   JOIN users u_p ON u_p.id = p."userId"
   JOIN doctors d ON d.id = a."doctorId"
   JOIN users u_d ON u_d.id = d."userId"
   WHERE u_p.email ILIKE '%<email>%' OR p."insuranceNumber" = '<docId>'
   ORDER BY a."scheduledAt" DESC LIMIT 5;
   ```
2. Si `status = COMPLETED` pero no hay `MedicalRecord.pdfPath` → regenerar el PDF desde el servicio `clinicalService.sendAppointmentDocuments`.
3. Si `status = NO_SHOW` o `CANCELLED` → escalar al call center.

### 9.2 Cuando llega una queja: "me cobraron doble"
1. `SELECT * FROM payments WHERE "appointmentId" = '<id>' ORDER BY createdAt;`
2. Si hay 2 PENDING/COMPLETED → cancelar uno via `PATCH /payments/{id}/status` con `{status:"CANCELLED"}`.
3. Si hay un PaymentAcknowledgement PAID + la cita no se hizo → escalar a admin para reembolso.

### 9.3 Auditoría rápida
```sql
-- Últimas N acciones críticas
SELECT al.id, al."actorRole", al.entity, al.action, al.payload, al."createdAt"
FROM audit_logs al
WHERE al."createdAt" > NOW() - INTERVAL '7 days'
  AND al.entity IN ('APPOINTMENT', 'MEDICAL_RECORD', 'PRESCRIPTION', 'PAYMENT')
ORDER BY al."createdAt" DESC LIMIT 50;
```

---

## 10. Glosario de endpoints útiles (referencia rápida)

| Endpoint | Método | Quién | Para qué |
|---|---|---|---|
| `/auth/login` | POST | todos | Login |
| `/auth/refresh` | POST | todos | Renovar JWT usando refresh token |
| `/auth/me` | GET | todos | Quién soy |
| `/admin-panel/users` | GET/POST | ADMIN | Listar / crear usuarios |
| `/admin-panel/users/:id/status` | PATCH | ADMIN | Activar/desactivar |
| `/admin-panel/users/:id/reset-password` | PATCH | SUPER_ADMIN | Resetear password |
| `/admin-panel/users/:id` | DELETE | ADMIN | Eliminar (soft si es placeholder patient) |
| `/admin-panel/doctors` | GET | todos | Listar doctores |
| `/admin-panel/patients/quick` | POST | ADMIN | Crear paciente placeholder |
| `/admin-panel/dashboard` | GET | ADMIN | Métricas |
| `/clinical/appointments` | GET | DOCTOR/NURSE | Mis citas asignadas |
| `/clinical/appointments/:id/start` | POST | DOCTOR/NURSE | Iniciar encounter |
| `/clinical/appointments/:id/finish` | POST | DOCTOR/NURSE | Finalizar + generar PDFs |
| `/clinical/encounters/:id/vitals` | POST | NURSE | Registrar signos vitales |
| `/clinical/encounters/:id/notes` | POST | DOCTOR | Agregar nota clínica |
| `/clinical/patient/history` | GET | PATIENT | Mi historial |
| `/clinical/records/:id/document` | GET | todos con ownership | Descargar PDF historia |
| `/clinical/prescriptions/:id/document` | GET | todos con ownership | Descargar PDF fórmula |
| `/acknowledgements` | GET | ADMIN | Acks de pago pendientes |
| `/payouts` | GET/POST | ADMIN | Lotes de pago |

> Documentación interactiva completa: `https://smdvital-backend.onrender.com/api/docs`

---

## 11. Errores frecuentes y solución

| Error | Causa probable | Solución |
|---|---|---|
| `Route PATCH /api/v1/admin-panel/users/.../reset-password not found` | URL mal escrita (typo `/admin/` en vez de `/admin-panel/`) | Usar `/admin-panel/` siempre |
| `Password must be at least 8 characters` con password de 13 chars | Body usa `newPassword` field — **el controller acepta ambos ahora**, si ves esto, recargá el backend | Ver §3.4 |
| `Access token is required` | Token expirado o nunca enviado | Headers: `Authorization: Bearer <token>` |
| `Email already belongs to a non-patient account` (409) | Intentás crear patient placeholder con email de doctor/nurse | Usá un `documentId` distinto o desvinculá primero |
| `Insufficient permissions` (403) | Rol no autorizado para ese endpoint | Verificá tabla §1.3 |
| `Appointment already completed` (409) | Intentar iniciar/finalizar cita que ya tiene `status = COMPLETED` | Verificá status antes de actuar — no se puede reabrir |
| PDF historia no aparece en PatientHistory | Falta consentimiento de email o `RESEND_API_KEY` no configurado | Reenviar manualmente: §7.2 |
| Único doctor en BD no puede login | Password original perdida | Reset via §3.4 |
| Cita vieja no aparece al doctor | Asignación perdida o servicio NURSING (el doctor solo ve SPECIALIST/CONSULTATION) | Verificar `service.category` y `doctorId` |

---

## 12. Procedimientos de emergencia

### 12.1 Pérdida total de BD (worst case)
1. **No entrar en pánico.** Los backups de Render (plan Starter+) son diarios.
2. Render dashboard → Postgres → **Backups** → restaurar la última snapshot.
3. Si no hay backups, el `seed.ts` y los scripts de migración pueden recrear la estructura vacía.
4. **Los PDFs y uploads NO están en la BD** — están en el filesystem del container. Si Render perdió el container, esos archivos se perdieron. La BD solo guarda `pdfPath` apuntando al archivo.

### 12.2 Compromiso de credenciales
1. Resetear `JWT_SECRET` y `JWT_REFRESH_SECRET` en Render → todos los tokens quedan inválidos → todos los usuarios tienen que re-loguear.
2. Cambiar passwords de superadmin.
3. Auditar `audit_logs` para acciones sospechosas en las últimas 24h.

### 12.3 "Hay un user que no debería existir"
1. Si es placeholder patient → **NO LO ELIMINES** (se recrearía). Solo desactivá:
   ```bash
   curl -X PATCH .../admin-panel/users/{id}/status -d '{"isActive":false}'
   ```
2. Si es cuenta real (DOCTOR/NURSE/AGENTE) → podés hard-delete.
3. Documentá la acción con un audit_log (ya se hace automáticamente).

---

**Si algo no está cubierto acá:**
1. Buscá en `docs/SMOKE-REPORT-CYCLE4.md` (smoke tests)
2. Buscá en `docs/INTEGRATIONS.md` (cómo encaja cada pieza)
3. Buscá en `docs/DEPLOY-RENDER.md` (infra)
4. Si nada de eso ayuda → revisar `docker logs smdvital-backend --tail 200`

> **Última actualización:** 2026-07-05 — Ciclo 5 (fix + soft-delete + reactivación).
