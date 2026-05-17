# 🎬 Motor de Recomendación de Cine con IA

Motor inteligente de recomendaciones de películas y series basado en IA generativa (Google Gemini).

## 🚀 Quick Start

### Requisitos Previos
- Node.js 20.6+
- npm 10+
- Cuenta en [Google AI Studio](https://aistudio.google.com) (API key de Gemini, gratis)
- Cuenta en [TMDB](https://www.themoviedb.org) (API key gratis)

### Setup Inicial

```bash
# 1. Instalar todas las dependencias
npm run install-all

# 2. Configurar backend
cd apps/api
cp .env.example .env.local
# Editar .env.local con tus API keys (ver sección Variables de Entorno)

# 3. Configurar frontend
cd ../web
cp .env.example .env.local

# 4. Volver a raíz
cd ../..
```

### Ejecutar en desarrollo

```bash
# Ambos servidores (backend + frontend)
npm run dev

# Backend solo (puerto 3000)
cd apps/api && npm run dev

# Frontend solo (puerto 3001)
cd apps/web && npm run dev
```

**🌐 Frontend:** http://localhost:3001  
**🔌 Backend API:** http://localhost:3000

## 📁 Estructura del Proyecto

```
InteligenciaArtificialAplicada/
├── apps/
│   ├── api/                    # Backend (Express + TypeScript + Prisma)
│   │   ├── src/
│   │   │   ├── controllers/    # Request handlers
│   │   │   ├── services/       # Business logic (gemini, tmdb, recommendation...)
│   │   │   ├── middleware/     # Auth + error handling
│   │   │   ├── schemas/        # Zod validation schemas
│   │   │   ├── db/             # Prisma client
│   │   │   └── utils/          # Logger, errors, jwt
│   │   └── prisma/             # Schema + migrations
│   │
│   └── web/                    # Frontend (React + Vite + TypeScript)
│       └── src/
│           ├── pages/          # AuthPage, HomePage, ProfilePage, RecommendationPage
│           ├── components/     # Auth, Onboarding, Recommendation, MoodSelector...
│           ├── hooks/          # Custom hooks por feature
│           └── api/            # Axios client
│
├── AGENTS.md                   # Guía de arquitectura para agentes IA
├── EPICAS_Y_USER_STORIES.md    # 24 User Stories del MVP con criterios de aceptación
└── README.md                   # Este archivo
```

## 🛠️ Stack Tecnológico

### Backend
- **Runtime:** Node.js 20.6+
- **Framework:** Express 4.18
- **Language:** TypeScript 5.3
- **ORM:** Prisma 5.13
- **Base de datos:** PostgreSQL (Azure Database for PostgreSQL)
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Validación:** Zod 3.23
- **LLM:** Google Gemini 2.5 Flash (`@google/generative-ai`)
- **APIs externas:** TMDB (activo), JustWatch (pendiente)

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite 5
- **Language:** TypeScript
- **Styling:** TailwindCSS 3.3
- **HTTP Client:** Axios
- **Routing:** React Router 6.20
- **Estado:** Context API + React Hooks (sin Redux)

## 🌐 Producción

| Servicio | URL |
|---------|-----|
| **Frontend** | https://inteligencia-artificial-aplicada-we.vercel.app |
| **Backend API** | https://inteligenciaartificialaplicada.onrender.com |
| **Health check** | https://inteligenciaartificialaplicada.onrender.com/health |

> El backend corre en Render free tier — puede tardar ~30s en despertar si estuvo inactivo.

## 📊 Estado del MVP — 91% completado (~91/100 SP estimados)

### ✅ Completado

| ID | Descripción | SP |
|----|-----------|----|
| US-001 | Autenticación JWT (register/login) | 5 |
| US-002 | Onboarding: géneros favoritos | 3 |
| US-003 | Onboarding: directores y actores (búsqueda TMDB) | 5 |
| US-004 | Onboarding: películas vistas (like/dislike) | 5 |
| US-005 | Perfil completo con estadísticas y nombres reales | 3 |
| US-006 | Selector de 8 estados de ánimo | 3 |
| US-007 | Filtros: tipo (película/serie), duración, época | 5 |
| US-008 | Resumen de contexto antes de pedir recomendación | 2 |
| US-009 | Motor de IA con Gemini 2.5 Flash | 8 |
| US-010 | Prompt engineering (perfil + contexto + anti-alucinación) | 5 |
| US-011 | Explicación justificada personalizada | 3 |
| US-012 | Validación TMDB + hasta 3 reintentos anti-alucinación | 5 |
| US-013 | Enriquecimiento TMDB: póster, sinopsis, título real | 5 |
| US-014 | Disponibilidad en plataformas (JustWatch vía TMDB) | 5 |
| US-015 | Tarjeta de recomendación completa | 3 |
| US-017 | Validación y limpieza de respuestas JSON del LLM | 3 |
| US-018 | Orquestación: Perfil → LLM → TMDB → persistencia | 8 |
| US-019 | Historial de recomendaciones (backend + UI) | 3 |
| US-024 | Deployment a producción (Render + Vercel) | 5 |

**Total completado: ~91 SP**

### ⏳ Pendiente para cerrar el MVP

| ID | Descripción | SP | Prioridad |
|----|-----------|----|-----------|
| US-016 | Caché de metadatos TMDB | 5 | Media |
| US-022 | Integration test E2E | 5 | Alta |
| US-023 | Validación de criterios de éxito con usuarios | 5 | Alta |

## 🔐 Variables de Entorno

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
GEMINI_API_KEY=AIza...          # aistudio.google.com/app/apikey
TMDB_API_KEY=...                # themoviedb.org/settings/api

# Timeouts (ms)
LLM_TIMEOUT_MS=30000            # Gemini 2.5-flash es un thinking model, tarda más
TMDB_TIMEOUT_MS=5000
RECOMMENDATION_MAX_RETRIES=3
```

### Frontend (`apps/web/.env.local`)
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## 🌍 Rutas de la Aplicación

| Ruta | Descripción | Auth |
|------|------------|------|
| `/` | Login / Registro | Pública |
| `/home` | Dashboard principal | Privada |
| `/onboarding` | Setup de perfil (5 pasos) | Privada |
| `/profile` | Perfil con estadísticas | Privada |
| `/recommendation` | Obtener recomendación IA | Privada |

## 🧪 Testing

```bash
cd apps/api && npm run test:unit
cd apps/api && npm run test:integration
```

> Sin cobertura de tests aún — pendiente US-020, US-021, US-022.

## 🎯 Criterios de Éxito del MVP

| Criterio | Estado |
|---------|--------|
| Auth + onboarding funcionando | ✅ |
| Recomendaciones por IA con explicación | ✅ |
| Póster y sinopsis desde TMDB | ✅ |
| Disponibilidad en plataformas (JustWatch) | ⏳ |
| Latencia <7 segundos (95% requests) | ⚠️ Gemini 2.5-flash tarda ~8-15s |
| >95% recomendaciones válidas en TMDB | ✅ (3 reintentos) |

## 📚 Documentación

- [AGENTS.md](./AGENTS.md) — Arquitectura y convenciones para agentes IA
- [EPICAS_Y_USER_STORIES.md](./EPICAS_Y_USER_STORIES.md) — 24 US con criterios de aceptación
- [Backend README](./apps/api/README.md) — Endpoints, servicios, schema DB
- [Frontend README](./apps/web/README.md) — Páginas, componentes, hooks

---

**Última actualización:** 17 de mayo de 2026  
**Versión:** MVP 1.0 — Sprint 6 (91% completado)  
**Estado:** En producción — flujo completo funcionando. Pendiente: tests y validación con usuarios.
