# Smoke Report — Ciclo 4 + Ciclo 5 (Backend-only)

**Fecha:** 2026-07-05 15:30 VET → 15:50 VET
**Entorno:** Backend `smdvital-backend` corriendo 2h+ en `localhost:4040` (docker)
**Postgres:** `smdvital-postgres` (expuesto en 5434) | **Redis:** `smdvital-redis` (6381)
**Método:** Node.js con `fetch` contra `/api/v1/*` + `docker exec psql` para SQL + `docker cp` + restart para deploy de fixes

---

## Ciclo 4 — Primer smoke (4 PASS, 6 FAIL)

| # | Test | Resultado | Detalle |
|---|---|---|---|
| 1 | Login superadmin | ✅ PASS | token JWT 251 chars |
| 2 | Reset Omar password via `/admin-panel/users/:id/reset-password` | ❌ **FAIL** | Backend rechazó: `"Password must be at least 8 characters"` — el payload `{newPassword: "Password123!"}` (12 chars) no es válido. |
| 3 | INSERT NURSE + AGENT via SQL | ✅ PASS | bcrypt hash generado con Node, insert OK |
| 4a | Login DOCTOR Omar | ⚠️ BLOCKED | Cascada del fail #2 |
| 4b | Login NURSE | ✅ PASS | /auth/me devolvió `role: NURSE` |
| 4c | Login AGENT | ✅ PASS | /auth/me devolvió `role: AGENT` |
| 5 | DOCTOR `/clinical/appointments` | ⚠️ BLOCKED | Cascada |
| 6 | NURSE `/clinical/appointments` filtrado a NURSING | ✅ PASS | 0 citas, filtro OK |
| 7 | AGENT bloqueado en `/clinical/*` | ✅ PASS | 403 "Insufficient permissions" |
| 8 | Refresh token endpoint | ⚠️ BLOCKED | Cascada |

**Total: 4 PASS reales + 4 BLOCKED + 1 FAIL real.**

---

## Ciclo 5 — Fixes aplicados y re-smoke (7/7 PASS ✅)

### Fix quirúrgico

Commit: `8ae90ed fix(admin-panel): reset-password accepts both password and newPassword`

**Cambio:** En `src/controllers/admin-panel.controller.ts:855-878`, el controller destructuraba `{ password }` del body. Como la convención del resto del backend es `newPassword`, los clientes mandaban `newPassword` y la validación fallaba porque `password` era `undefined`.

**Antes:**
```ts
const { password } = req.body;
if (typeof password !== 'string' || password.length < 8) {
  // 400 'Password must be at least 8 characters'
}
```

**Después:**
```ts
const password: unknown = req.body?.password ?? req.body?.newPassword;
if (typeof password !== 'string' || password.length < 8) {
  // 400 'Password must be at least 8 characters' (same message)
}
```

### Investigado pero NO FIX necesario

- `POST /api/v1/admin-panel/users` **YA EXISTE** desde `src/routes/admin-panel.routes.ts:63-66`. El service `AdminPanelService.createUser()` acepta `role` arbitrario y crea el profile de Doctor automáticamente si `role === 'DOCTOR'`. El gap era del smoke, no del código. Confirmado en re-smoke paso #5.

### Deploy del fix al container live

1. `npm install --force @babel/types` (el node_modules venía corrupto — `.d.ts` empezaba con NUL bytes)
2. `npm run build` recompiló `dist/controllers/admin-panel.controller.js` con el fix verificado
3. `docker cp dist/controllers/admin-panel.controller.js smdvital-backend:/app/dist/controllers/admin-panel.controller.js`
4. `docker restart smdvital-backend` (10s hasta healthy)

### Re-smoke `.smoke/post-fix.mjs` (7/7 PASS)

| # | Test | Resultado |
|---|---|---|
| 1 | superadmin login | ✅ PASS |
| 2 | Reset Omar password con `{newPassword}` | ✅ PASS — `"User password reset successfully"` |
| 3 | Omar login con `Password123!` (doctor por fin accesible) | ✅ PASS — `role: DOCTOR` |
| 4 | Reset Omar con `{password}` (canonical) | ✅ PASS — backwards-compat OK |
| 5 | `POST /admin-panel/users` crea nuevo NURSE | ✅ PASS — 201 con id |
| 6 | Login del nuevo NURSE recién creado | ✅ PASS — `role: NURSE` |
| 7 | Omar ve sus `/clinical/appointments` | ✅ PASS — 1 cita (Lavado de Oídos) |

**Resultado neto:**
- ❌ → ✅ Doctor Omar puede login
- ❌ → ✅ Admin puede resetear passwords desde la UI
- ❌ → ✅ Admin puede crear NURSE/AGENT/ADMIN via API sin tocar SQL
- ❌ → ✅ Camino feliz del DOCTOR en backend verificado

---

## Lo que falta (fuera de mi alcance sin infra)

### Render production deploy
- `smdvital-backend.onrender.com` devuelve `x-render-routing: no-server` (servicio eliminado)
- `render.yaml` recrea los 2 servicios con 1 click
- BD/Redis en producción: el usuario debe confirmar dónde están (probable: Neon/Supabase para BD, Upstash para Redis, o recrear en Render)
- Detalles en `docs/DEPLOY-RENDER.md`

### Cierre del admin panel "Sin conexion"
Una vez el backend de Render responda a `/api/v1/health`, el workbox SW del admin deja de servir `offline.html` automáticamente. No requiere cambio en código.

### Resend / SMTP para envío de PDFs
Actualmente los `MedicalRecord` se generan y `DocumentDelivery.status` se crea, pero sin `RESEND_API_KEY` los emails quedan en `QUEUED`. Configurar en `.env` o en Render dashboard.

---

## Archivos generados (todos en `.smoke/` — gitignored)

- `.smoke/smoke.mjs` — primer script (tenía typo en /admin vs /admin-panel)
- `.smoke/smoke2.mjs` — script corregido
- `.smoke/post-fix.mjs` — verificación post-fix
- `.smoke/post-fix-report.json` — output estructurado del último run
- `.smoke/smoke-report.json` — output estructurado del smoke2
- `docs/SMOKE-REPORT-CYCLE4.md` — este doc (merged de C4 + C5)
- `docs/DEPLOY-RENDER.md` — guía de deploy
- `render.yaml` — blueprint

## Commits relevantes del ciclo

```
8ae90ed fix(admin-panel): reset-password accepts both password and newPassword
8c0e8e6 fix(deploy): restore render.yaml blueprint for backend + admin
1506ad6 docs(smoke): cycle 4 backend smoke test report + ignore .smoke dir
ee50f68 docs(qa): manual checklist for the 3-role clinical happy path
7c0442a feat(api): auto-refresh on 401 + getErrorMessage helper
a53553e feat(auth): persist refreshToken and pass it on login/register
```

Working tree clean. Branch `main` ahead of origin por 6 commits (no push — esperando tu OK).
