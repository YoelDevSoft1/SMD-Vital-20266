# SMD Vital 2026 — Deploy Guide

> Estado: **listo para deploy**. Última limpieza: commit `chore: surgical cleanup for deploy readiness`.

Este repo usa **Docker Compose** como fuente única de deploy para el backend + admin panel + base de datos + cache. El sitio de marketing (Astro) se despliega por separado en **Netlify**.

---

## 1. Topología

```
┌─────────────────────────────────────────────────────────────────┐
│  HOST (Docker Compose — docker-compose.full.yml)                │
│                                                                 │
│  ┌─────────────────┐   ┌─────────────────┐  ┌────────────────┐  │
│  │ smdvital-postgres│  │  smdvital-redis │  │smdvital-backend│  │
│  │   :5432          │   │   :6379        │  │   :3000        │  │
│  │ (smd_vital_db)   │◄──┤ (cache+queues) │◄─┤ (NestJS)       │  │
│  └─────────────────┘   └─────────────────┘  └────────────────┘  │
│                                                       ▲         │
│                                                       │ /api     │
│  ┌─────────────────────────────────────────────┐      │         │
│  │ smdvital-admin-panel (nginx + PWA)          │──────┘         │
│  │   :80 → host :5174                          │                │
│  │ expone nginx proxy /api/* → backend:3000    │                │
│  └─────────────────────────────────────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         ▲                                       ▲
         │ Host :43173, :43174, :45436, :46382    │
         │ (com host ocupado, ver § 4)            │
         └─────────── dev local ─────────────────┘

┌──────────────────────────────────────┐
│  Netlify (separado)                  │
│  Astro marketing site (/)            │
│  push a main → deploy automático     │
└──────────────────────────────────────┘
```

---

## 2. Requisitos

| Herramienta | Versión | Notas |
|---|---|---|
| Docker Desktop | 4.x+ | Engine 24+, Compose v2 |
| Node | 18+ | sólo para el sitio Astro local |
| PowerShell 5.1+ | — | comandos de este doc |

---

## 3. Quick start (desarrollo local con Docker)

```powershell
# 1. Variables de entorno (sólo la primera vez)
cp env.example .env

# 2. Levantar stack base
docker compose -f docker-compose.full.yml up -d postgres redis backend admin-panel

# 3. (Opcional) Prisma Studio en perfil dev
docker compose -f docker-compose.full.yml --profile dev up prisma-studio

# 4. Ver logs
docker compose -f docker-compose.full.yml logs -f backend
```

El backend correrá automáticamente `prisma migrate deploy` + `node dist/scripts/ensure-production-seed.js` antes de levantar (ver `smd-vital-backend/start.sh`).

---

## 4. Conflictos de puertos con otros proyectos Docker

Si ya tienes otros stacks corriendo (caso típico: LA-CAJA, Clazico), los puertos por defecto chocan:

| Servicio | Puerto por defecto | Reservado por | Mitigación |
|---|---|---|---|
| postgres | `5432` | la-caja-db, postgres nativo | compose ya lo expone en `${POSTGRES_EXTERNAL_PORT:-5433}` o autoasigna |
| redis   | `6379` | la-caja-redis | `${REDIS_EXTERNAL_PORT:-6380}` o autoasigna |
| backend | `3000` | varios | `${BACKEND_PORT:-3000}` o autoasigna |
| admin   | `5174` | — | `${ADMIN_PANEL_PORT:-5174}` o autoasigna |

Para producción, **fija los puertos en `.env`** con variables como `BACKEND_PORT=3000`, `POSTGRES_EXTERNAL_PORT=5433`, etc., para que el deploy sea determinista.

---

## 5. Variables de entorno (production)

`docker-compose.full.yml` lee las siguientes vars (todas tienen defaults placeholders que **deben** ser reemplazadas):

### Críticas
- `POSTGRES_PASSWORD` — contraseña fuerte de la BD
- `REDIS_PASSWORD` — contraseña fuerte de Redis
- `JWT_SECRET` — generado con `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `JWT_REFRESH_SECRET` — distinto del anterior

### URLs (ajustar por entorno)
- `CORS_ORIGIN` — lista separada por comas de origenes permitidos
- `BACKEND_PORT`, `ADMIN_PANEL_PORT`, `POSTGRES_EXTERNAL_PORT`, `REDIS_EXTERNAL_PORT`, `PRISMA_STUDIO_EXTERNAL_PORT`

### Opcionales (integraciones futuras — ver `INTEGRATIONS.md`)
- `SMTP_*` / `RESEND_API_KEY` — email
- `TWILIO_*` — SMS
- `STRIPE_*` — pagos
- `CLOUDINARY_*` — uploads
- `GOOGLE_MAPS_API_KEY` — mapas
- `SENTRY_DSN` — error tracking

---

## 6. Deploy production

### Opción A — VPS / servidor propio (recomendado para empezar)

```powershell
# 1. Clonar
git clone https://github.com/YoelDevSoft1/SMD-Vital-20266.git smd-vital
cd smd-vital

# 2. Crear .env de production con secretos fuertes
cp env.example .env
notepad .env   # editar: POSTGRES_PASSWORD, REDIS_PASSWORD, JWT_SECRET, etc.

# 3. Levantar
docker compose -f docker-compose.full.yml up -d

# 4. Verificar
curl http://localhost:3000/api/v1/health
```

### Opción B — Render / Railway / Fly.io

**Nota:** este repo ya **NO** usa Render Blueprint (`render.yaml` eliminado). Para deploy en PaaS, usa cualquiera de:

- **Render**: define los servicios manualmente en el dashboard, conecta el repo, apunta a este `docker-compose.full.yml` (Render soporta `docker compose` desde 2024).
- **Railway**: detecta `Dockerfile` automáticamente. Crea 4 servicios: `postgres`, `redis`, `backend`, `admin-panel`. No soportará `docker-compose.yml` directamente — usa `railway.json` por servicio.
- **Fly.io**: usa `fly.toml` por servicio (similar a Railway).

### Opción C — Híbrido

- Backend + Postgres + Redis en un VPS pequeño (Hetzner, DigitalOcean)
- Admin PWA en Vercel o Netlify (build estático)
- Marketing Astro en Netlify

---

## 7. Astro marketing site (despliegue Netlify)

```powershell
# Local
npm install
npm run dev      # http://localhost:4321

# Build
npm run build    # → dist/
npm run preview  # preview local
```

`netlify.toml` ya está configurado. Cualquier `git push` a `main` dispara deploy.

---

## 8. Post-deploy checklist

- [ ] `curl http://TU-BACKEND/api/v1/health` devuelve 200 OK
- [ ] `docker compose ps` — todos los servicios `healthy`
- [ ] Login superadmin funciona: `POST /api/v1/auth/login` con credenciales de seed
- [ ] Nginx admin-panel sirve la SPA y el proxy `/api` → backend responde
- [ ] Logs backend sin stacktraces: `docker compose logs backend --since 1m`
- [ ] Variables de entorno reales: ningún `change-me-in-production` quedó activo
- [ ] Backups de Postgres configurados (cron `pg_dump` a S3 o similar)
- [ ] Certificado TLS (Caddy / Traefik / Nginx reverse proxy + certbot)

---

## 9. Estructura del repo

```
.
├── src/                          # Astro marketing site
├── admin-panel-frontend/         # React + Vite + PWA (admin)
├── smd-vital-backend/            # NestJS + Prisma (API)
├── vendor/                       # (intencional) SMD v2 integration utils
├── docker-compose.full.yml       # ÚNICA fuente de deploy para backend stack
├── env.example                   # plantilla — copiar a .env
├── netlify.toml                  # config Netlify (Astro)
├── .env / .env.example (root)    # Astro env
└── docs/                         # este doc + INTEGRATIONS.md
```

---

## 10. Comandos útiles

```powershell
# Estado
docker compose -f docker-compose.full.yml ps

# Reiniciar un servicio
docker compose -f docker-compose.full.yml restart backend

# Reconstruir una imagen tras cambio de código
docker compose -f docker-compose.full.yml build backend
docker compose -f docker-compose.full.yml up -d --no-deps backend

# Logs en tiempo real
docker compose -f docker-compose.full.yml logs -f backend

# Entrar al contenedor
docker compose -f docker-compose.full.yml exec backend sh

# Backup Postgres
docker compose -f docker-compose.full.yml exec postgres pg_dump -U smd_vital_user smd_vital_db > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql

# Restaurar
Get-Content backup_20260703_213200.sql | docker compose -f docker-compose.full.yml exec -T postgres psql -U smd_vital_user -d smd_vital_db

# Apagar todo (mantiene datos)
docker compose -f docker-compose.full.yml down

# Apagar y BORRAR datos (⚠️ irreversible)
docker compose -f docker-compose.full.yml down -v
```
