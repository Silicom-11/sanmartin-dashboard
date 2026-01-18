# San Martín Digital - Dashboard Administrativo

Dashboard de gestión educativa para administradores del sistema San Martín Digital.

## 🚀 Tecnologías

- **React 18** + **TypeScript**
- **Vite** - Build tool ultrarrápido
- **TailwindCSS** - Estilos utility-first
- **shadcn/ui** - Componentes accesibles y personalizables
- **Zustand** - State management minimalista
- **React Query** - Server state management
- **React Router v6** - Navegación SPA
- **Recharts** - Gráficos interactivos
- **Leaflet** - Mapas para GPS tracking
- **Socket.io** - Comunicación en tiempo real

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## 🔧 Variables de Entorno

Crear archivo `.env` en la raíz:

```env
VITE_API_URL=https://sanmartin-backend.onrender.com
```

## 📁 Estructura del Proyecto

```
src/
├── components/
│   └── ui/                 # Componentes shadcn/ui
├── layouts/
│   └── MainLayout.tsx      # Layout principal con sidebar
├── pages/
│   ├── LoginPage.tsx       # Login de administrador
│   ├── DashboardPage.tsx   # Dashboard con KPIs
│   ├── StudentsPage.tsx    # CRUD de estudiantes
│   ├── TeachersPage.tsx    # Gestión de docentes
│   ├── CoursesPage.tsx     # Administración de cursos
│   ├── GradesPage.tsx      # Visualización de notas
│   ├── AttendancePage.tsx  # Control de asistencia
│   ├── JustificationsPage.tsx # Revisión de justificaciones
│   ├── CalendarPage.tsx    # Calendario escolar
│   ├── MessagesPage.tsx    # Sistema de mensajería
│   ├── GPSTrackingPage.tsx # 🔒 Ubicación en tiempo real
│   ├── ReportsPage.tsx     # Reportes y estadísticas
│   └── SettingsPage.tsx    # Configuración del sistema
├── services/
│   └── api.ts              # Cliente Axios configurado
├── stores/
│   └── authStore.ts        # Zustand store para auth
└── lib/
    └── utils.ts            # Utilidades y helpers
```

## 🔐 Autenticación

El dashboard usa JWT para autenticación. Solo usuarios con rol `administrativo` pueden acceder.

## 🌐 Deploy en Vercel

1. Conectar repositorio a Vercel
2. Configurar variables de entorno:
   - `VITE_API_URL`: URL del backend en Render
3. Deploy automático con cada push a main

## 📱 Plan de Desarrollo (30 días)

| Semana | Módulos |
|--------|---------|
| 1 | Dashboard, Auth, CRUD básico |
| 2 | Notas, Asistencia, Calendario, Mensajería |
| 3 | GPS Tracking, Notificaciones Push, Reportes |
| 4 | Testing, Optimización, Documentación |

## 🔒 Funcionalidad Innovadora: GPS Tracking

Sistema de seguridad en tiempo real que permite:
- Visualización de ubicación de estudiantes en mapa
- Zonas seguras con geofencing
- Alertas automáticas al salir de zona segura
- Historial de ubicaciones

## 📄 Licencia

Propiedad de San Martín Digital © 2024
