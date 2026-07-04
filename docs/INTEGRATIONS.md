# SMD Vital — Roadmap de Integraciones y Correcciones de Flujo

> **Estado:** este documento es el índice de trabajo de la **fase 2**. Sólo lista los puntos de integración y los flujos a corregir; **no contiene el trabajo todavía**.
>
> Cada item tiene: estado, archivos relevantes, dependencias externas, y notas de la corrección/enhancement prevista.

---

## A. Integraciones externas (preparadas en `docker-compose.full.yml`)

Todas las variables de entorno para estas integraciones ya están en el compose file con placeholders vacíos. Hace falta implementar/verificar cada una.

### A1. Email (SMTP / Resend)

**Estado:** esqueletos en backend; no verificado en production.
- `nodemailer` instalado; transporter configurado en `smd-vital-backend/src/services/email.service.ts` (verificar).
- Variante Resend: `resend` instalado; `RESEND_API_KEY` en `.env`.

**Archivos relevantes:**
- `smd-vital-backend/src/services/email.service.ts`
- `smd-vital-backend/src/controllers/auth.controller.ts` → `forgotPassword`, `resetPassword`
- `smd-vital-backend/src/templates/emails/` (si no existe, crearlo)

**Trabajo pendiente:**
1. Confirmar cuál transporter se usa (¿SMTP Gmail? ¿Resend?)
2. Templates HTML para: bienvenida, reset password, confirmación de cita, recordatorio 24h
3. Manejo de bounces y complaints
4. Logs de envío (audit)

**Decisión previa:** ¿Gmail SMTP (gratis hasta 500/día) o Resend (gratis hasta 100/día, mejor deliverability)?

---

### A2. SMS (Twilio)

**Estado:** paquete instalado, sin uso verificado.
- `twilio` instalado en `package.json`.
- Vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.

**Archivos relevantes:**
- `smd-vital-backend/src/services/sms.service.ts` (verificar)
- `smd-vital-backend/src/templates/sms/` (plantillas)
- `appointment.controller.ts` → recordatorios

**Trabajo pendiente:**
1. Implementar envío de SMS para confirmación de cita y recordatorio 1h antes
2. Validar formato de teléfono colombiano (+57)
3. Rate limiting (Twilio cobra por mensaje; evitar spam)
4. Compliance Habeas Data Colombia (Ley 1581/2012)

---

### A3. Pagos (Stripe)

**Estado:** paquete instalado, esqueletos de rutas existen.
- `stripe` instalado.
- Vars: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`.
- Rutas: `/api/v1/payments/*` ya están montadas en `index.ts:191`.

**Archivos relevantes:**
- `smd-vital-backend/src/routes/payment.routes.ts`
- `smd-vital-backend/src/services/payment.service.ts` (verificar)
- `smd-vital-backend/src/controllers/payment.controller.ts`
- `admin-panel-frontend/src/views/payments/` (UI)

**Trabajo pendiente:**
1. PaymentIntent flow para citas a domicilio
2. Webhook handler `POST /api/v1/payments/webhook` con firma verificada
3. Reembolsos (cancelaciones, disputas)
4. Reportes de pagos para admin (CSV, receipts)
5. Impuestos (Colombia: IVA 19% en servicios médicos gravados — confirmar con contador)

---

### A4. Uploads / File storage (Cloudinary)

**Estado:** paquete instalado, uso parcial.
- `cloudinary` instalado.
- Vars: `CLOUDINARY_*`.
- Backend tiene `uploads/` local como fallback actual — Docker monta `smd-vital-backend/uploads` como volumen.

**Trabivos:**
1. Decidir: ¿Cloudinary desde día 1 o local con Nginx después?
2. Si Cloudinary: reemplazar `multer.diskStorage` por `multer-storage-cloudinary`
3. Limpiar `uploads/` local tras upload exitoso a Cloudinary
4. Validación de tipo MIME y tamaño (limitación por plan)

---

### A5. Google Maps (geolocalización para médico a domicilio)

**Estado:** `GOOGLE_MAPS_API_KEY` declarada, sin uso verificado.

**Trabajos:**
1. Geocoding de direcciones de pacientes
2. Cálculo de distancia médico↔paciente
3. Verificación de zona de cobertura
4. Mostrar mapa en admin y en panel del médico
5. Estimar tiempo de llegada

---

### A6. Sentry / error tracking

**Estado:** `SENTRY_DSN` declarada, sin integración.

**Trabajos:**
1. `Sentry.init` en `smd-vital-backend/src/index.ts`
2. Source maps cargados a Sentry en CI
3. PII scrubbing (sensitive data nunca a Sentry)
4. Alertas de volumen / regression

---

## B. Flujos clínicos a corregir / endurecer

### B1. Auth flow

**Estado actual:**
- `/api/v1/auth/login` (POST) — bcrypt + JWT, retorna `access_token`
- `/api/v1/auth/refresh` (POST) — refresh token
- `/api/v1/auth/forgot-password` (POST) — esqueletos (probablemente no implementado end-to-end)
- `/api/v1/auth/reset-password` (POST) — idem

**Problemas a auditar:**
1. Rate limiting en `/login` y `/forgot-password` (prevenir brute force / enumeration)
2. Política de contraseñas (mínimo 12 chars, OWASP top breached list check)
3. JWT expiry (actualmente 24h; producción debería ser 15min + refresh sliding)
4. Invalidación de tokens en logout (redis denylist?)
5. Auditoría de intentos de login fallidos

**Tests pendientes:** E2E auth flow completo (registro → login → me → logout → refresh → verificar rotación).

### B2. Flujo de citas (Appointment)

**Rutas:** `/api/v1/appointments/*`
**Estados esperados:** `pending → confirmed → in_progress → completed | cancelled | no_show`

**Trabajos:**
1. Transiciones de estado válidas (state machine, no transiciones libre)
2. Detección de conflictos de horario (médico disponible)
3. Recordatorios automáticos: 24h antes (email + SMS), 1h antes (SMS), al médico 30min antes
4. Política de cancelación (penalización si < 2h)
5. Reagendamiento (cuántas veces, política)
6. Reserva con pago parcial / hold de slot (Stripe)

### B3. Telemedicina

**Rutas:** probable subconjunto de appointments con `MODALITY=TELEMEDICINE`.

**Trabajos:**
1. Video — ¿Twilio Video, Daily.co, Jitsi propio?
2. Sala virtual con JWT scoped al appointment
3. Cancelación si no llega paciente en 10min
4. Grabación (opt-in, requiere consentimiento explícito)

### B4. Historia clínica / registros médicos

**Modelos relevantes:** `MedicalRecord`, `Prescription`, `LabResult`.

**Trabajos:**
1. Validación de acceso (RBAC estricto: paciente solo ve los suyos; médico solo ve sus pacientes asignados)
2. Inmutabilidad: registros médicos NO editables, sólo addendums
3. Export PDF firmado digitalmente (¿Colombia exige esto? verificar)
4. Retención: Ley 1581/2012 + normas Habeas Data

### B5. Pagos a médicos / liquidación

**Trabajos:**
1. Cálculo de comisión (admin define %)
2. Cierre quincenal
3. Reporte para admin
4. Export contable (CSV para software contable colombiano)

### B6. Notificaciones

**Backend:** `bull` queue + `ioredis` (instalados), worker Dockerfile existe (`Dockerfile.worker`).

**Trabajos:**
1. Worker separado no se está corriendo en compose actual (sólo `backend` service). Verificar si debe añadirse como servicio `worker` al compose.
2. Dashboard de Bull (opcional, sólo dev)
3. Reintentos con backoff exponencial
4. Dead-letter queue para fallos permanentes

---

## C. Infraestructura / DevOps

### C1. CI/CD

- [ ] GitHub Actions: lint + typecheck + tests por PR
- [ ] Build de imágenes Docker en CI
- [ ] Push a GHCR / Docker Hub
- [ ] Deploy automático a staging on merge a `main`
- [ ] Deploy manual a producción con approval

### C2. Observability

- [ ] Prometheus metrics (prom-client ya está importado en backend — exponer `/metrics`)
- [ ] Logs estructurados (Winston ya instalado)
- [ ] Tracing (OpenTelemetry pendiente)

### C3. Backups

- [ ] Cron `pg_dump` diario → S3 / Backblaze B2
- [ ] Retención 30 días
- [ ] Test de restore mensual (smoke)

### C4. Security

- [ ] Helmet ya está activo ✅
- [ ] CORS_ORIGIN estricto (no wildcards en prod) ✅
- [ ] Rate limiting en endpoints sensibles (verificar `/auth/login`)
- [ ] Auditoría OWASP top 10
- [ ] Pen test antes de lanzar a producción real

---

## D. Limpiezas técnicas pendientes (cosméticas)

1. ✅ Eliminado: carpetas `api/`, `render-admin/`, `render-backend/`, configs `vercel.json` / `render.yaml` (commit `606eb94`)
2. Pendiente: archivos `*.csv` antiguos en raíz (research SEO de Oct 2025) — si son datos clínicos reales que importaste, dime; si son research de keyword, los borramos
3. Pendiente: árbol de archivos `.md` en raíz y en `smd-vital-backend/` — muchos son notas de proceso (`CAMBIOS-DOCKER.md`, `SOLUCION-ERROR-DOCKER.md`, etc.); vale la pena consolidar en `docs/` o borrar
4. Pendiente: `check-*.js` / `debug-*.js` / `create-test-users.js` en backend (debug scripts, deberían vivir en `scripts/debug/` o eliminarse)
5. Pendiente: warnings de Astro `[...blog]` (rutas dinámicas chocan con estáticas `/blog`, `/beneficios-atencion-medica`, etc.) — funciona pero escupe warnings. Reordenar generador o renombrar rutas estáticas.

---

## E. Orden sugerido de ejecución (fase 2)

```
1. (rápido) B1 endpoints auth que faltan + rate limiting         [1-2 días]
2. (rápido) A1 email templates + verificación real                [2-3 días]
3. (medio)  C1 GitHub Actions CI                                 [1 día]
4. (medio)  B2 appointment state machine + recordatorios          [3-4 días]
5. (medio)  A3 Stripe real (test mode first)                      [2-3 días]
6. (medio)  C3 backups automatizados                             [1 día]
7. (medio)  B4 RBAC historia clínica                             [2-3 días]
8. (largo)  A4 A5 según decisión Cloudinary / Google Maps         [3-5 días]
9. (largo)  B3 telemedicina (según proveedor video)              [5-7 días]
10. (varios)D limpieza cosmética restante                         [1 día]
```

---

## F. Preguntas para el usuario (decisiones pendientes)

Antes de empezar cada item, idealmente discutimos:

1. **Email provider** — ¿SMTP Gmail, Resend, o SES?
2. **Telemedicine video provider** — ¿Twilio, Daily.co, Jitsi propio?
3. **Cloudinary desde día 1** — o ¿local con Nginx hasta cierto volumen?
4. **¿Hispanoamericano o sólo Colombia?** — afecta temas impositivos, retención de datos
5. **Pagos — ¿qué cubre el sistema?** — sólo consulta a domicilio, o incluye telemedicina, servicios, productos?

---

> Cuando arranquemos cualquiera de estos items, abrimos un branch por cada uno (`feat/integrations-email`, `fix/auth-ratelimit`, etc.) y PR contra `main`.
