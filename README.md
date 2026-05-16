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

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **HTTP Client:** Axios
- **State Management:** Context API + React Hooks
- **Routing:** React Router

## 📊 ETAPA 1: MVP Mínimo (En Construcción)

**Status:** Inicialización completada ✅

### US Completadas (1/15):
- ✅ **US-001:** Autenticación básica (Backend + Frontend)

### US En Desarrollo:
- 🔄 **US-002:** Onboarding - Géneros
- ⏳ **US-003:** Onboarding - Directores/Actores
- ⏳ **US-004:** Onboarding - Películas vistas
- ⏳ **US-005:** Finalizar onboarding
- ⏳ **US-006:** Estado de ánimo
- ⏳ **US-007:** Filtros tradicionales
- ⏳ **US-008:** Resumen contexto
- ⏳ **US-009:** Integración OpenAI API
- ⏳ **US-010:** Prompt engineering
- ⏳ **US-011:** Explicación justificada
- ⏳ **US-012:** Descartar inválidas
- ⏳ **US-017:** Validación Zod
- ⏳ **US-018:** Orquestación flujo completo
- ⏳ **US-022:** Integration test E2E

**Story Points:** 15/65 completados

## 🔐 Variables de Entorno

### Backend (`apps/api/.env`)
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=file:./dev.db
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
TMDB_API_KEY=...
```

### Frontend (`apps/web/.env`)
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## 🧪 Testing

```bash
# Backend unit tests
cd apps/api && npm run test:unit

# Integration tests
cd apps/api && npm run test:integration

# Frontend tests
cd apps/web && npm run test
```

## 📚 Documentación

- [AGENTS.md](./AGENTS.md) - Guía arquitectura y convenciones para agentes IA
- [EPICAS_Y_USER_STORIES.md](./EPICAS_Y_USER_STORIES.md) - 24 US del MVP con criterios de aceptación
- [Backend API](./apps/api/README.md) - Documentación de endpoints (coming soon)
- [Frontend Components](./apps/web/README.md) - Guía de componentes React (coming soon)

## 🚨 Riesgos Críticos (ETAPA 1)

1. **Alucinaciones del LLM** → Mitigado en US-012, US-017, US-020
2. **Rate limits de APIs** → Será mitigado en E2 con caché (US-016)
3. **Latencia >7 segundos** → Validado en E2 (US-022, US-023)

## 🤝 Contribuir

1. Leer `AGENTS.md` y `EPICAS_Y_USER_STORIES.md`
2. Crear rama: `feature/US-XXX-descripcion`
3. Implementar + tests unitarios
4. Commit: `[US-XXX] Descripción del cambio`
5. PR y code review
6. Mergear a `main`

## 📞 Contacto

- **PM:** [Tu nombre]
- **Tech Lead:** [Tu nombre]

---

**Última actualización:** 15 de mayo, 2026  
**Versión:** MVP 1.0 (Sprint 1)  
**Estado:** En desarrollo
