# 🎬 Motor de Recomendación de Cine con IA

Motor inteligente de recomendaciones de películas y series basado en IA generativa.

## 🚀 Quick Start

### Requisitos Previos
- Node.js 20+
- npm 10+

### Setup Inicial

```bash
# 1. Instalar todas las dependencias
npm run install-all

# 2. Setup base de datos (backend)
cd apps/api
cp .env.example .env.local
npm run db:push

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
│   │   │   ├── services/       # Business logic
│   │   │   ├── middleware/     # Express middleware
│   │   │   ├── schemas/        # Zod validation schemas
│   │   │   ├── db/             # Database & Prisma
│   │   │   └── utils/          # Utilities (logger, errors, jwt)
│   │   ├── tests/              # Unit & integration tests
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                    # Frontend (React + Vite + TypeScript)
│       ├── src/
│       │   ├── pages/          # Pages components
│       │   ├── components/     # Reusable components
│       │   ├── hooks/          # Custom React hooks
│       │   ├── api/            # API clients
│       │   ├── styles/         # Global styles
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── index.html
│       ├── package.json
│       └── vite.config.ts
│
├── AGENTS.md                   # Guía de arquitectura para agentes IA
├── EPICAS_Y_USER_STORIES.md    # 24 User Stories del MVP
└── README.md                   # Este archivo
```

## 🛠️ Stack Tecnológico

### Backend
- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** SQLite (Prisma ORM)
- **Auth:** JWT + bcryptjs
- **Validation:** Zod
- **Testing:** Vitest + Playwright
- **External APIs:** OpenAI, TMDB, JustWatch

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **HTTP Client:** Axios
- **State Management:** Context API + React Hooks
- **Routing:** React Router

## 📊 ETAPA 1: MVP Mínimo (26/65 SP - 40% completado)

### ✅ US Completadas (5/15 = 33%):

| ID | Título | SP | Estado |
|----|---------|----|--------|
| **US-001** | Autenticación básica | 5 | ✅ Completada |
| **US-002** | Onboarding - Géneros | 3 | ✅ Completada |
| **US-003** | Onboarding - Directores/Actores | 5 | ✅ Completada |
| **US-004** | Onboarding - Películas vistas | 5 | ✅ Completada |
| **US-005** | Finalizar onboarding | 3 | ✅ Completada |

**Total completado:** 21 SP de 65

### 🔄 US En Desarrollo (1 en progreso):

| ID | Título | SP | Estado | Progreso |
|----|---------|----|--------|----------|
| **US-006** | Captura de estado de ánimo | 3 | 🔄 EN DESARROLLO | Backend ✅ + Frontend ✅ |

### ⏳ US Próximas (9 pendientes):

- **US-007:** Filtros tradicionales (5 SP) - Duración, tipo, año
- **US-008:** Vista previa contexto (2 SP) - Resumen antes de recomendar
- **US-009:** Integración OpenAI (8 SP) - LLM para recomendaciones
- **US-010:** Prompt engineering (5 SP) - Personalización de prompts
- **US-011:** Explicación justificada (3 SP) - "Por qué esta recomendación"
- **US-012:** Validación de alucinaciones (5 SP) - Descartar películas falsas
- **US-017:** Validación Zod (3 SP) - Input/output validation
- **US-018:** Orquestación completa (8 SP) - Flujo end-to-end
- **US-022:** Testing E2E (5 SP) - Latencia <7 segundos

**Sprint Actual:** 2-3 semanas en (US-001 a US-006 = 24 SP)  
**Próximo hito:** US-009 (Motor LLM)

## 🔐 Variables de Entorno

### Backend (`apps/api/.env.local`)
```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3001
DATABASE_URL=file:./dev.db
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRY=604800000
OPENAI_API_KEY=sk-... (requerido para US-009+)
TMDB_API_KEY=... (requerido actualmente)
```

### Frontend (`apps/web/.env.local`)
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## 🌍 Rutas Principales de la Aplicación

### Públicas (sin autenticación)
- `GET /` - Página de Login/Register
- `GET /health` - Health check del backend

### Privadas (requieren autenticación JWT)
- `GET /home` - Dashboard principal
- `GET /onboarding` - Flujo de onboarding (5 pasos)
- `GET /profile` - Perfil del usuario con estadísticas
- `GET /recommendation` - Selector de estado de ánimo (US-006)

## 📚 Documentación

- [AGENTS.md](./AGENTS.md) - Guía arquitectura y convenciones para agentes IA
- [EPICAS_Y_USER_STORIES.md](./EPICAS_Y_USER_STORIES.md) - 24 US del MVP con criterios de aceptación
- [Backend README](./apps/api/README.md) - Endpoints y servicios
- [Frontend README](./apps/web/README.md) - Componentes y hooks

## 🧪 Testing

```bash
# Backend unit tests
cd apps/api && npm run test:unit

# Integration tests
cd apps/api && npm run test:integration

# Frontend tests
cd apps/web && npm run test

# All tests
npm run test:all
```

## 🚨 Riesgos Críticos (Mitigaciones en Progreso)

| Riesgo | Impacto | Mitigación | Estado |
|--------|---------|-----------|--------|
| Alucinaciones del LLM | 🔴 Crítico | Validación en TMDB (US-012) | Planificado |
| Rate limits APIs | 🟠 Alto | Caché + Backoff exponencial | Planificado E2 |
| Latencia >7 segundos | 🟠 Alto | Paralelización + Caché | En validación |

## 🎯 Criterios de Éxito (MVP)

- ✅ Auth/perfilado funcionando
- ✅ Onboarding 5 pasos completado
- 🔄 Mood selector implementado (US-006)
- ⏳ LLM generando recomendaciones (US-009+)
- ⏳ Validación TMDB (anti-alucinación)
- ⏳ Integración JustWatch (dónde ver)
- ⏳ Latencia <7 segundos (95% requests)

## 🤝 Contribuir

1. Leer `AGENTS.md` y `EPICAS_Y_USER_STORIES.md`
2. Crear rama: `feature/US-XXX-descripcion`
3. Implementar + tests unitarios
4. Commit: `[US-XXX] Descripción del cambio`
5. PR y code review
6. Mergear a `main`

## 📞 Team

- **PM/Architect:** Nahuel (nahue@...)
- **Tech Lead:** Colaborativo
- **Status:** MVP en desarrollo activo

---

**Última actualización:** 16 de mayo, 2026  
**Versión:** MVP 1.0 (Sprint 1-2)  
**Estado:** En desarrollo - US-006 en progress
