# 🚀 Inicio Rápido - Panel de Administración

## Opción 1: Docker Compose Completo (Recomendado)

### Desde la raíz del proyecto:

```bash
# Iniciar todo (Backend + Panel)
docker-compose -f docker-compose.full.yml up -d --build
```

### Acceso:
- **Panel Admin:** http://localhost:5174
- **Backend API:** http://localhost:3000

## Opción 2: Desarrollo Local

### Backend (Docker)
```bash
cd smd-vital-backend
docker-compose up -d
```

### Panel Admin (Local)
```bash
cd admin-panel-frontend
npm install
npm run dev
```

### Acceso:
- **Panel Admin:** http://localhost:5173
- **Backend API:** http://localhost:3000

## Opción 3: Solo Panel Admin con Docker

```bash
cd admin-panel-frontend

# Windows
docker-build.bat

# Linux/macOS
chmod +x docker-build.sh
./docker-build.sh
```

### Acceso:
- **Panel Admin:** http://localhost:5174

## 🔐 Primer Acceso

1. Ir a http://localhost:5174
2. Hacer clic en "Crear cuenta"
3. Registrarse con rol ADMIN o SUPER_ADMIN
4. Iniciar sesión

## 📚 Más Información

- Ver `README-DOCKER.md` para documentación completa
- Ver `SETUP-COMPLETO.md` para setup completo del proyecto

---

**¡Listo para usar!** 🎉

