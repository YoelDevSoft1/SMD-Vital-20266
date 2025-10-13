# 🎨 SMD Vital - Panel de Administración Frontend

Panel de administración moderno y profesional construido con React, TypeScript, Tailwind CSS y Vite.

## 🚀 Tecnologías

- ⚡ **Vite** - Build tool ultra rápido
- ⚛️ **React 18** - Librería UI
- 🔷 **TypeScript** - Type safety
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 📊 **Recharts** - Gráficas y visualizaciones
- 🔄 **React Query** - Data fetching y cache
- 🛣️ **React Router** - Client-side routing
- 🎯 **Zustand** - State management ligero
- 🎉 **React Hot Toast** - Notificaciones elegantes
- 🎨 **Lucide React** - Iconos hermosos

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Preview de producción
npm run preview
```

## 🏗️ Estructura del Proyecto

```
admin-panel-frontend/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── layout/          # Layout, Sidebar, Header
│   │   ├── ui/              # Componentes UI base
│   │   ├── dashboard/       # Componentes del dashboard
│   │   ├── tables/          # Tablas de datos
│   │   └── charts/          # Gráficas
│   ├── pages/               # Páginas de la aplicación
│   │   ├── Dashboard.tsx
│   │   ├── Users.tsx
│   │   ├── Doctors.tsx
│   │   ├── Appointments.tsx
│   │   ├── Payments.tsx
│   │   ├── Services.tsx
│   │   ├── Reviews.tsx
│   │   ├── Analytics.tsx
│   │   ├── SystemHealth.tsx
│   │   └── Login.tsx
│   ├── services/            # API services
│   │   ├── api.ts           # Axios instance
│   │   ├── auth.service.ts
│   │   └── admin.service.ts
│   ├── store/               # Zustand stores
│   │   └── auth.store.ts
│   ├── hooks/               # Custom React hooks
│   │   └── useAuth.ts
│   ├── utils/               # Utilidades
│   │   ├── format.ts
│   │   └── constants.ts
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   ├── App.tsx              # Componente principal
│   ├── main.tsx             # Entry point
│   └── index.css            # Estilos globales
├── public/                  # Assets estáticos
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🎨 Características

### ✅ Dashboard Completo
- KPIs en tiempo real
- Gráficas interactivas (ingresos, citas, usuarios)
- Tasas de crecimiento
- Top performers (doctores y servicios)
- Actividad reciente

### ✅ Gestión de Recursos
- **Usuarios**: CRUD completo con filtros avanzados
- **Doctores**: Gestión de disponibilidad y especialidades
- **Citas**: Timeline, filtros por estado y fecha
- **Pagos**: Reportes y filtros por método
- **Servicios**: Catálogo con estadísticas
- **Reseñas**: Moderación y verificación

### ✅ Analíticas
- Tendencias por período (día/semana/mes)
- Reportes de ingresos detallados
- Comparativas de rendimiento

### ✅ Sistema
- Monitor de salud del sistema
- Logs en tiempo real
- Exportación de datos

### ✅ UX/UI
- Diseño responsive (móvil, tablet, desktop)
- Dark mode (opcional)
- Búsqueda y filtros avanzados
- Paginación eficiente
- Loading states
- Notificaciones toast
- Animaciones suaves

## 🔐 Autenticación

El panel utiliza JWT para autenticación:

```typescript
// Login
POST /api/v1/auth/login
{
  "email": "admin@smdvital.com",
  "password": "your_password"
}

// Response
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": {...}
}
```

El token se almacena automáticamente y se incluye en todas las peticiones.

## 📊 Páginas Principales

### 1. Dashboard (`/`)
- Vista general con KPIs
- Gráficas de tendencias
- Actividad reciente
- Top performers

### 2. Usuarios (`/users`)
- Lista paginada de usuarios
- Filtros: rol, activo, verificado, búsqueda
- Acciones: activar/desactivar, verificar, eliminar

### 3. Doctores (`/doctors`)
- Lista de doctores con especialidades
- Control de disponibilidad
- Estadísticas de citas y reseñas

### 4. Citas (`/appointments`)
- Timeline de citas
- Filtros por estado, fecha, doctor, paciente
- Cambio de estado

### 5. Pagos (`/payments`)
- Lista de transacciones
- Filtros por estado y método
- Reportes de ingresos

### 6. Servicios (`/services`)
- Catálogo de servicios médicos
- Activar/desactivar servicios
- Estadísticas de uso

### 7. Reseñas (`/reviews`)
- Moderación de reseñas
- Verificación manual
- Eliminar contenido inapropiado

### 8. Analíticas (`/analytics`)
- Tendencias personalizables
- Reportes de ingresos
- Comparativas de períodos

### 9. Sistema (`/system`)
- Monitor de salud
- Logs del sistema
- Métricas de servidor

## 🎨 Temas y Personalización

### Colores del tema:
```css
--primary: #3b82f6 (azul)
--secondary: #8b5cf6 (morado)
--success: #10b981 (verde)
--danger: #ef4444 (rojo)
--warning: #f59e0b (amarillo)
```

### Cambiar a dark mode:
El proyecto está preparado para dark mode. Para activarlo, agrega la clase `dark` al elemento `<html>`.

## 🔄 API Integration

Todas las llamadas a la API se hacen a través de `axios` configurado con:

- Base URL: `http://localhost:3000/api/v1`
- Interceptors para agregar token JWT
- Manejo automático de errores
- Retry logic
- Response caching con React Query

## 📱 Responsive Design

El panel está optimizado para:
- 📱 **Móvil** (320px - 640px)
- 📲 **Tablet** (640px - 1024px)
- 💻 **Desktop** (1024px+)
- 🖥️ **Large Desktop** (1920px+)

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar en modo desarrollo (port 5173)

# Producción
npm run build            # Compilar para producción
npm run preview          # Preview del build

# Linting y Type checking
npm run lint             # Ejecutar ESLint
npm run type-check       # Verificar tipos TypeScript
```

## 🔧 Configuración de Variables

Crea un archivo `.env` en la raíz:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=SMD Vital Admin
VITE_APP_VERSION=1.0.0
```

## 📈 Performance

- **Lazy loading** de rutas con React.lazy()
- **Code splitting** automático con Vite
- **React Query cache** para reducir llamadas API
- **Memoización** de componentes pesados
- **Virtual scrolling** para listas largas (opcional)

## 🎓 Guía de Desarrollo

### Agregar una nueva página:

1. Crear el componente en `src/pages/NuevaPagina.tsx`
2. Agregar la ruta en `src/App.tsx`
3. Agregar link en `src/components/layout/Sidebar.tsx`
4. Crear servicios necesarios en `src/services/`

### Crear un nuevo componente UI:

```typescript
// src/components/ui/Button.tsx
import { cn } from '@/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition',
        variant === 'primary' && 'bg-blue-500 text-white hover:bg-blue-600',
        className
      )}
      {...props}
    />
  );
}
```

### Llamar a la API:

```typescript
// src/pages/Users.tsx
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';

function Users() {
  const { data, isLoading } = useQuery({
    queryKey: ['users', { page: 1, limit: 20 }],
    queryFn: () => adminService.getUsers({ page: 1, limit: 20 }),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.data.users.map(user => (
        <div key={user.id}>{user.email}</div>
      ))}
    </div>
  );
}
```

## 🐛 Debugging

### React Query Devtools (opcional):
```typescript
// src/main.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### Logs de desarrollo:
```typescript
// Habilitar logs de axios
// src/services/api.ts
api.interceptors.request.use(config => {
  console.log('Request:', config);
  return config;
});
```

## 📦 Build y Deploy

### Build para producción:
```bash
npm run build
```

Esto genera una carpeta `dist/` con archivos estáticos optimizados.

### Deploy opciones:
- **Vercel**: `vercel deploy`
- **Netlify**: Conectar repo de GitHub
- **AWS S3 + CloudFront**: Upload de dist/
- **Docker**: Incluye Dockerfile si es necesario

## 🔐 Seguridad

- ✅ Validación de formularios
- ✅ Sanitización de inputs
- ✅ CORS configurado
- ✅ HTTPS en producción
- ✅ Tokens JWT con expiración
- ✅ Refresh token automático
- ✅ Logout en múltiples tabs

## 🎉 Próximas Mejoras

- [ ] WebSockets para notificaciones en tiempo real
- [ ] PWA (Progressive Web App)
- [ ] Internacionalización (i18n)
- [ ] Tests con Vitest y React Testing Library
- [ ] Storybook para componentes
- [ ] Modo offline con Service Workers
- [ ] Exportación de reportes en PDF
- [ ] Drag & drop para tablas
- [ ] Keyboard shortcuts

## 📞 Soporte

Para preguntas:
- Email: dev@smdvitalbogota.com
- GitHub Issues: (tu repo)

---

**🎨 Diseñado y desarrollado con ❤️ para SMD Vital**

© 2024 SMD Vital. Todos los derechos reservados.
