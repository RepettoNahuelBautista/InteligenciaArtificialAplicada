# RecomiendaFilms — Motor de Recomendación de Cine con IA + Red Social

Motor inteligente de recomendaciones de películas y series basado en IA generativa (Google Gemini), con una capa social completa para compartir reseñas, listas y seguir a otros usuarios.

## Producción

| Servicio | URL |
|---------|-----|
| **Frontend** | https://inteligencia-artificial-aplicada-we.vercel.app |
| **Backend API** | https://inteligenciaartificialaplicada.onrender.com |
| **Health check** | https://inteligenciaartificialaplicada.onrender.com/health |

> El backend corre en Render free tier — puede tardar ~30s en despertar si estuvo inactivo.

## Quick Start

```bash
# 1. Instalar todas las dependencias
npm run install-all

# 2. Configurar backend
cd apps/api
cp .env.example .env.local
# Editar .env.local con tus API keys (ver sección Variables de Entorno)

# 3. Aplicar migraciones
npx prisma migrate deploy

# 4. Configurar frontend
cd ../web
cp .env.example .env.local
# VITE_API_BASE_URL=http://localhost:3000/api/v1

# 5. Volver a raíz y ejecutar
cd ../..
npm run dev
```

**Frontend:** http://localhost:3001  
**Backend API:** http://localhost:3000

## Estructura del Proyecto

```
InteligenciaArtificialAplicada/
├── apps/
│   ├── api/                    # Backend (Express + TypeScript + Prisma)
│   │   ├── src/
│   │   │   ├── controllers/    # Request handlers
│   │   │   ├── services/       # Business logic (gemini, tmdb, recommendation, reviews...)
│   │   │   ├── middleware/     # Auth + error handling
│   │   │   ├── schemas/        # Zod validation schemas
│   │   │   ├── db/             # Prisma client
│   │   │   └── utils/          # Logger, errors, jwt
│   │   └── prisma/             # Schema + migrations
│   │
│   └── web/                    # Frontend (React + Vite + TypeScript)
│       └── src/
│           ├── pages/          # AuthPage, HomePage, ProfilePage, ReviewsPage, ...
│           ├── components/     # Auth, Onboarding, Recommendation, MoodSelector...
│           ├── hooks/          # Custom hooks por feature
│           └── api/            # Axios client
│
├── EPICAS_Y_USER_STORIES.md    # User Stories completas con criterios de aceptación
├── TESTING.md                  # Guía de testing manual y pruebas de API
└── README.md                   # Este archivo
```

## Stack Tecnológico

### Backend
- **Framework:** Express 4.18
- **Language:** TypeScript 5.3
- **ORM:** Prisma 5.13
- **Base de datos:** PostgreSQL (Azure Database for PostgreSQL)
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Validación:** Zod 3.23
- **LLM:** Google Gemini 2.5 Flash (`@google/generative-ai`)
- **Imágenes:** Cloudinary (avatares de usuario, multer memory storage)
- **APIs externas:** TMDB (catálogo + watch providers)

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite 5
- **Language:** TypeScript
- **Styling:** TailwindCSS 3.3
- **HTTP Client:** Axios
- **Routing:** React Router 6.20
- **Estado:** Context API + React Hooks (sin Redux)

## Variables de Entorno

### Backend (`apps/api/.env.local`)
```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3001

# PostgreSQL (Azure)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Auth
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRY=7d

# APIs externas
GEMINI_API_KEY=AIza...
TMDB_API_KEY=...

# Cloudinary (solo en Render, nunca en código)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Timeouts
LLM_TIMEOUT_MS=30000
TMDB_TIMEOUT_MS=5000
RECOMMENDATION_MAX_RETRIES=3
```

### Frontend (`apps/web/.env.local`)
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## Rutas de la Aplicación

| Ruta | Descripción | Auth |
|------|------------|------|
| `/` | Login / Registro | Pública |
| `/home` | Dashboard principal | Privada |
| `/onboarding` | Setup de perfil (5 pasos) | Privada |
| `/profile` | Perfil propio con estadísticas y foto | Privada |
| `/recommendation` | Obtener recomendación IA | Privada |
| `/history` | Historial de recomendaciones | Privada |
| `/reviews` | Reseñas de películas/series | Privada |
| `/lists` | Mis listas de películas | Privada |
| `/lists/:listId` | Detalle de lista | Privada |
| `/users/search` | Buscar usuarios | Privada |
| `/users/:userId` | Perfil público de usuario | Privada |

## Estado del Proyecto — MVP Completo + Features Sociales

### Núcleo MVP (completado)

| ID | Descripción | SP |
|----|-----------|----|
| US-001 | Autenticación JWT (register/login/me) | 5 |
| US-002 | Onboarding: géneros favoritos (mín. 3) | 3 |
| US-003 | Onboarding: directores y actores (búsqueda TMDB) | 5 |
| US-004 | Onboarding: películas vistas (👍/👎) | 5 |
| US-005 | Perfil completo con estadísticas | 3 |
| US-006 | Selector de 8 estados de ánimo | 3 |
| US-007 | Filtros: tipo, duración, año | 5 |
| US-008 | Resumen de contexto antes de recomendar | 2 |
| US-009 | Motor de IA con Gemini 2.5 Flash | 8 |
| US-010 | Prompt engineering (perfil + contexto + anti-alucinación) | 5 |
| US-011 | Explicación justificada personalizada | 3 |
| US-012 | Validación TMDB + hasta 3 reintentos | 5 |
| US-013 | Enriquecimiento TMDB: póster, sinopsis, año | 5 |
| US-014 | Disponibilidad en plataformas (TMDB Watch Providers) | 5 |
| US-015 | Tarjeta de recomendación completa | 3 |
| US-019 | Historial de recomendaciones | 3 |
| US-024 | Deployment a producción (Render + Vercel) | 5 |

### Features Sociales (completadas post-MVP)

| ID | Descripción |
|----|------------|
| US-025 | Seguir / dejar de seguir usuarios |
| US-026 | Búsqueda de usuarios por nombre o email |
| US-027 | Perfil público con stats, géneros, listas y reseñas |
| US-028 | Foto de perfil (Cloudinary, redonda) |
| US-029 | Reseñas: crear/editar, 1 por usuario por título, 👍/👎 + rating + texto |
| US-030 | Reacciones a reseñas: like/dislike de otros usuarios |
| US-031 | Listas de películas: públicas/privadas, CRUD completo |

### Pendiente

| ID | Descripción | SP | Prioridad |
|----|-----------|----|-----------|
| US-016 | Caché de metadatos TMDB en DB | 5 | Media |
| US-022 | Integration tests E2E (Vitest) | 5 | Alta |
| US-023 | Validación de criterios de éxito | 5 | Alta |

## Documentación

- [EPICAS_Y_USER_STORIES.md](./EPICAS_Y_USER_STORIES.md) — User Stories con criterios de aceptación
- [TESTING.md](./TESTING.md) — Guía de testing manual completa
- [Backend README](./apps/api/README.md) — Endpoints, servicios, schema DB
- [Frontend README](./apps/web/README.md) — Páginas, componentes, hooks

---

**Última actualización:** 18 de mayo de 2026  
**Estado:** MVP + Features Sociales en producción. Pendiente: tests E2E y validación con usuarios.
