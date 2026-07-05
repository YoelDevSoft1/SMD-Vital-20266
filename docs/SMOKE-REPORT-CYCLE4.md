# Smoke Report — Ciclo 4 Track D (Backend-only)

**Fecha:** 2026-07-05 15:30 VET
**Entorno:** Backend `smdvital-backend` corriendo 2h en `localhost:4040` (docker)
**Postgres:** `smdvital-postgres` (expuesto en 5434) | **Redis:** `smdvital-redis` (6381)
**Método:** Node.js script con `fetch` contra `/api/v1/*` + `docker exec psql` para SQL

---

## Resumen

| # | Test | Resultado | Detalle |
|---|---|---|---|
| 1 | Login superadmin | ✅ PASS | token JWT 251 chars |
| 2 | Reset Omar password via `/admin-panel/users/:id/reset-password` | ❌ **FAIL** | Backend rechazó: `"Password must be at least 8 characters"` — el payload `{newPassword: "Password123!"}` (12 chars) no es válido. Necesita investigación del controller/DTO. |
| 3 | INSERT NURSE + AGENT via SQL | ✅ PASS | bcrypt hash generado con Node, insert OK |
| 4a | Login DOCTOR Omar | ⚠️ BLOCKED | Cascada del fail #2 — password nunca se reseteó, no pude probar |
| 4b | Login NURSE (Ana Lopez) | ✅ PASS | /auth/me devolvió `role: NURSE` |
| 4c | Login AGENT (Maria Castillo) | ✅ PASS | /auth/me devolvió `role: AGENT` |
| 5 | DOCTOR `/clinical/appointments` | ⚠️ BLOCKED | Cascada del fail #2 |
| 6 | NURSE `/clinical/appointments` filtrado a NURSING | ✅ PASS | 0 citas devueltas, filtro aplicado correctamente |
| 7 | AGENT bloqueado de `/clinical/*` | ✅ PASS | 403 "Insufficient permissions" (correcto, AGENT no es personal clínico) |
| 8 | Refresh token endpoint | ⚠️ BLOCKED | No se llegó a probar por cascada |

**Total: 4 PASS reales + 4 BLOCKED por cascada + 1 FAIL real (reset-password)**

---

## Gaps confirmados

### 🔴 P0 — Backend no permite crear usuarios vía API

No existe `POST /users` o similar. Solo PATCH (status, verify, reset-password). Para crear un NURSE o AGENT nuevo hay que:
- Insertar directo en la BD (lo que hice para smoke), o
- Usar el `POST /auth/register` que crea paciente por default

**Impacto:** El admin panel probablemente tiene una pantalla de gestión de usuarios que **no tiene endpoint backend para crear**. Verificar `admin-panel-frontend/src/pages/Users.tsx` o equivalente.

### 🔴 P0 — Reset-password API rechaza payloads válidos

```
PATCH /api/v1/admin-panel/users/{id}/reset-password
Body: { newPassword: "Password123!" }   <- 12 chars
Response: 400 Bad Request "Password must be at least 8 characters"
```

El password SÍ tiene 12 chars pero falla validación. Posibles causas:
- Campo esperado es distinto (`password`, `pwd`, `new_password`)
- El DTO Joi tiene regla más estricta que solo longitud
- Hay validación previa que rechaza el formato

Necesita leer el `adminPanelController.resetUserPassword` y el schema Joi asociado.

### 🟡 P1 — No pude verificar el flujo clínico del DOCTOR

Por el gap del reset-password, no pude generar una cita para Omar, no pude iniciar encounter, no pude generar PDFs. **El camino feliz del DOCTOR sigue sin verificación end-to-end real.**

### 🟢 INFO — Estado actual de la BD

| Recurso | Cantidad | Notas |
|---|---|---|
| Usuarios | 3 + 2 (smoke) | superadmin, doctor Omar, paciente Cesar + enfermera Ana + agente Maria (estos 2 creados por smoke) |
| Servicios | 27 | (no 21 como dice seed.ts — BD tiene data mixta) |
| Doctors | 1 | solo Omar |
| NURSE/AGENT | 0 antes del smoke | **problema operativo real** — no existían en la BD |

### 🟡 P1 — El seed.ts NO está aplicado en esta BD

El `smd-vital-backend/prisma/seed.ts` declara 6 usuarios (superadmin, admin, doctor, enfermera, agente, paciente) + 21 servicios. La BD live solo tiene 3 (superadmin, Omar, paciente temp). El `admin`, `enfermera`, `agente` del seed **no existen**. Esto confirma que la BD nunca recibió el seed completo — solo un subset fue creado vía el flujo real del negocio.

---

## Infraestructura verificada

- ✅ Backend health 200 (`GET /health` → `{status: "OK", uptime: 7711s}`)
- ✅ Refresh endpoint responde (responde 401 si token es inválido, no es 404)
- ✅ `/auth/me` responde 200 con datos del usuario
- ✅ Roles se respetan: AGENT bloqueado en `/clinical/*`
- ✅ docker compose up -d postgres redis funciona (alertas de warnings por nombre de proyecto, pero arranca)
- ✅ docker exec + psql funciona para queries a la BD

---

## Lo que falta verificar

1. **Reset-password**: leer `AdminPanelController.resetUserPassword` + DTO
2. **Crear doctor + cita de prueba** vía API o SQL, para poder probar el flujo clínico completo
3. **Upload de archivos** (pdf-lib + uploads/) — ¿fs tiene permisos?
4. **Email con Resend** — ¿hay `RESEND_API_KEY` configurado? Sin eso, los documentos quedan en DocumentDelivery=QUEUED pero nunca se envían

---

## Recomendaciones inmediatas

1. **Antes del próximo demo al cliente:** crear endpoint `POST /users` o garantizar que el admin panel UI lo cubra
2. **Aplicar seed completo** en BD limpia y reintentar todo el flujo — los 6 usuarios + 21 servicios son la base del demo
3. **Definir password policy** y validar que reset-password cumple
4. **Configurar Resend** antes del demo o aceptar que "PDFs en cola" es el fallback aceptable

---

## Archivos generados

- `.smoke/smoke.mjs` — script principal
- `.smoke/smoke2.mjs` — script corregido (admin-panel en vez de admin)
- `.smoke/smoke-report.json` — output estructurado del último run
- `.gitignore` — añadido `.smoke/` para no commitear hashes ni tokens
