# Deploy en Render — SMD Vital Bogotá

> **TL;DR:** `render.yaml` recrea los 2 servicios críticos (backend + admin) en 1 click.
> El admin en `https://smd-vital-admin.onrender.com` ya responde HTML, pero **sin backend
> el service worker sirve `offline.html`** — eso es lo que estás viendo como "Sin conexion".
> Aplica el blueprint para que el backend reviva.

---

## Por qué está pasando

```
HEAD /api/v1/auth/login
→ HTTP/1.1 404 Not Found
→ x-render-routing: no-server     ← Render tiene el dominio PERO sin servicio
```

El servicio `smdvital-backend` se eliminó del dashboard de Render. El commit `606eb94` borró también el `render.yaml`, así que no se puede recrear automáticamente. **El "Sin conexion" del admin es porque cada llamada a la API devuelve 404 desde el proxy de Render** (no del backend, del proxy) — y el workbox SW asume que es un fallo de red y sirve `/offline.html`.

---

## Pasos (5 min)

### 1. Verifica la BD y el Redis en producción

Necesitas dos URLs que **NO** están en este repo:

- `DATABASE_URL` — formato `postgresql://user:pass@host:5432/dbname?sslmode=require`
  - Si tuviste Postgres en Render y pasaron los 90 días free → se borró. Crea otro en
    [render.com](https://dashboard.render.com) → New → PostgreSQL, o usa
    [Neon](https://neon.tech) / [Supabase](https://supabase.com) (gratis).
- `REDIS_URL` — formato `redis://default:pass@host:6379`
  - Render Redis free plan: [render.com](https://dashboard.render.com) → New → Redis.
  - O usa [Upstash](https://upstash.com) (gratis hasta cierto uso).

**Si no tienes BD/Redis**, primero crea esos y copia las URLs de conexión. Sin ellos el
backend no bootea (start.sh valida `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`,
`REDIS_URL` antes de arrancar).

### 2. Aplica el blueprint

1. Entra a [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**.
2. Conecta el repo (si no lo has hecho). Si tu repo es un fork, conéctalo explícitamente.
3. Render detecta el archivo `render.yaml` automáticamente y muestra los 2 servicios:
   - `smdvital-backend` (web, docker)
   - `smd-vital-admin` (static site)
4. Para `DATABASE_URL` y `REDIS_URL` (marcados `sync: false`) Render te pide el valor.
   Pega las URLs del paso 1.
5. Click **Apply** y espera ~3-5 min al primer build.

### 3. Verifica

```bash
curl -i https://smdvital-backend.onrender.com/api/v1/health
# → HTTP/1.1 200 OK    (no más x-render-routing: no-server)

curl -X POST https://smdvital-backend.onrender.com/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"superadmin@smdvital.com","password":"Password123!"}'
# → { "success": true, "data": { "accessToken": "...", "refreshToken": "..." } }
```

Después abre `https://smd-vital-admin.onrender.com/login`, intenta login y debería entrar.

### 4. Si perdiste los seeds (BD nueva)

El `start.sh` corre `prisma migrate deploy` (idempotente) + `ensure-production-seed.js`
(crea admin@smdvitalbogota.com + usuario del sistema si no existe). Pero **no** crea
usuarios doctor/enfermera/agente/paciente. Si tu BD es nueva:

```bash
# Opción A: crear via SQL con password hasheada
node -e "console.log(require('bcryptjs').hashSync('Password123!', 10))"
# → pega ese hash en el INSERT users … del seed
docker exec -i <postgres> psql -U <user> -d <db> < seed-roles.sql
```

(Opción B: aplicar el seed completo del repo si la BD está vacía — pero borra TODO.)

---

## Después de revivir el backend

Vuelve al **Ciclo 5** y ataja los gaps P0 que dejo en `docs/SMOKE-REPORT-CYCLE4.md`:

1. **Reset-password API rechaza password válido** — leer `AdminPanelController.resetUserPassword` + DTO Joi, fix surgical
2. **No existe endpoint `POST /admin-panel/users`** — el admin no puede crear NURSE/AGENT/ADMIN desde la UI
3. Re-correr `.smoke/smoke2.mjs` con `BASE = 'https://smdvital-backend.onrender.com/api/v1'` para confirmar que el camino feliz del doctor pasa en producción.

---

## Si Render no funciona para ti

Hay opciones:

| Opción | Pros | Cons |
|---|---|---|
| **VPS propio** (Hetzner €4/mes, DigitalOcean $6) | Control total, persistente, sin sleeps | Requiere运维 (Docker compose ya está listo) |
| **Railway.app** | Auto-detecta Dockerfile, $5 free crédito | Plan free muy limitado |
| **Fly.io** | Global, persistent | Requiere `fly.toml` por servicio |

Cualquiera de las 3 requiere un `docker-compose.full.yml` o archivos de config. Si quieres ir por Railway o Fly, hago el `.toml` cuando me digas.
