# Motor de Recomendación Inteligente de Cine y Series - Guía para Agentes de IA

## 🎬 Visión del Producto (MVP)

**Problema:** Los usuarios pierden demasiado tiempo navegando catálogos de múltiples plataformas de streaming sin saber qué ver.

**Solución:** Una aplicación web que usa IA generativa para recomendar películas/series **personalizadas, justificadas y geolalizadas**, basadas en:
- Perfil estático del usuario (géneros, directores, actores favoritos, películas que vio)
- Contexto actual (estado de ánimo, filtros: tipo, duración, año)
- Disponibilidad real en plataformas de streaming (Netflix, Max, Prime)

**Propuesta de valor:**
1. **Personalización**: Basada en gustos históricos
2. **Justificación**: "Te recomendamos esto porque..." (explicación generada por IA)
3. **Precisión de catálogo**: Solo películas/series que realmente existen y están disponibles
4. **Latencia baja**: Recomendación en <7 segundos

---

## 🛠️ Stack Tecnológico (MVP)

- **Frontend:** React 18 + Vite + TypeScript + TailwindCSS + TanStack Query
- **Backend:** Node 20 + Express + TypeScript + Prisma 5.13
- **Base de Datos:** PostgreSQL en Azure Database for PostgreSQL (`recomendador-pg-server`)
- **LLM:** Google Gemini 2.5 Flash (`@google/generative-ai`) — reemplazó OpenAI por costo
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Testing:** Vitest (unit) — tests aún no escritos
- **Arquitectura:** Monorepo (`/apps/web` y `/apps/api`)

## 🌐 URLs de Producción (desde 2026-05-17)

- **Frontend:** https://inteligencia-artificial-aplicada-we.vercel.app (Vercel)
- **Backend:** https://inteligenciaartificialaplicada.onrender.com (Render — free tier, puede tardar en iniciar)
- **Health check:** https://inteligenciaartificialaplicada.onrender.com/health

---

## 🏗️ Arquitectura General (MVP)

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Next.js)                 │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ Onboarding  │ │ Captura de   │ │ Tarjeta de           │ │
│  │ (Perfil)    │ │ Contexto     │ │ Recomendación Final  │ │
│  └─────────────┘ └──────────────┘ └──────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              BACKEND (Node.js + Express/Hono)              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 1. Obtener Perfil del Usuario (BD)                    │ │
│  │    ├─ Géneros, Directores, Actores                    │ │
│  │    └─ Películas/Series vistas (ratings)               │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 2. Construir Prompt Engineering (PASO CRÍTICO)        │ │
│  │    ├─ Inyectar perfil + contexto                       │ │
│  │    ├─ Instrucción anti-alucinación                     │ │
│  │    └─ Request structured JSON output                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 3. Llamar OpenAI API (GPT-4o-mini)                    │ │
│  │    └─ Response: {title, explanation}                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 4. Validar con Zod + Buscar en TMDB (VALIDACIÓN)     │ │
│  │    ├─ Si existe → obtener metadatos                    │ │
│  │    └─ Si no existe → reintentar (máx 3)               │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 5. Enriquecer con JustWatch (dónde ver)              │ │
│  │    └─ Mapear plataformas disponibles                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 6. Guardar en BD + Retornar completo al Frontend      │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────┬──────────────────────────────────────────┘
                    │
         ┌──────────┴──────────┬────────────┬──────────────┐
         │                     │            │              │
    ┌────▼─────┐      ┌────────▼──┐  ┌─────▼──┐  ┌────────▼─┐
    │ TMDB API │      │ JustWatch │  │OpenAI  │  │  Redis/  │
    │(Búsqueda)│      │(Streaming)│  │  API   │  │  SQLite  │
    │ Metadatos│      │Plataformas│  │  LLM   │  │  Caché   │
    └──────────┘      └───────────┘  └────────┘  └──────────┘
```

---

## 📁 Estructura de Directorios Esperada

```
InteligenciaArtificialAplicada/
├── frontend/                          # React/Next.js app
│   ├── src/
│   │   ├── pages/                     # Pages: onboarding, recommender, history
│   │   ├── components/
│   │   │   ├── Onboarding/            # Flows de perfilado
│   │   │   ├── ContextCapture/        # Estado de ánimo + filtros
│   │   │   └── RecommendationCard/    # Tarjeta final con TMDB + JustWatch
│   │   ├── hooks/                     # useAuth, useProfile, useRecommendation
│   │   ├── api/                       # Clients para backend
│   │   └── styles/                    # CSS/Tailwind
│   └── package.json
│
├── backend/                           # Node.js API
│   ├── src/
│   │   ├── controllers/               # Endpoints principales
│   │   │   ├── auth.ts                # POST /auth/register, /auth/login
│   │   │   ├── profile.ts             # GET/PUT /profile
│   │   │   ├── recommendation.ts      # POST /recommend (FLUJO PRINCIPAL)
│   │   │   └── history.ts             # GET /history
│   │   ├── services/
│   │   │   ├── profileService.ts      # Obtener perfil del usuario
│   │   │   ├── llmService.ts          # Prompt engineering + OpenAI call
│   │   │   ├── tmdbService.ts         # Búsqueda y validación en TMDB
│   │   │   ├── justWatchService.ts    # Disponibilidad en plataformas
│   │   │   └── cacheService.ts        # Redis/SQLite caché
│   │   ├── middleware/
│   │   │   ├── auth.ts                # JWT verification
│   │   │   └── validation.ts          # Zod schemas + request validation
│   │   ├── schemas/
│   │   │   ├── user.ts                # User profile schema
│   │   │   ├── recommendation.ts      # LLM response schema (Zod)
│   │   │   └── preferences.ts         # Géneros, directores, etc.
│   │   ├── db/
│   │   │   ├── schema.ts              # Tablas: users, profiles, recommendations, history
│   │   │   └── migrations/            # SQL migrations
│   │   └── utils/
│   │       ├── llmPrompt.ts           # Template y construcción de prompts
│   │       ├── logger.ts              # Logging structured
│   │       └── errors.ts              # Custom error classes
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── llmPrompt.test.ts      # Unit test de prompt engineering
│   │   │   └── validation.test.ts     # Unit test de Zod schemas
│   │   └── integration/
│   │       ├── recommendation.e2e.ts  # E2E: perfil → IA → TMDB → respuesta
│   │       └── latency.test.ts        # Validar <7 segundos
│   ├── .env.example                   # Template de variables
│   └── package.json
│
├── docs/
│   ├── ARCHITECTURE.md                # Detalle arquitectura
│   ├── API_INTEGRATION.md             # OpenAI, TMDB, JustWatch
│   └── DEPLOYMENT.md                  # Deploy a producción
│
├── EPICAS_Y_USER_STORIES.md           # Planning del MVP
├── AGENTS.md                          # Este archivo
└── README.md                          # Setup local + rápido start
```

---

## 🎯 6 Épicas del MVP

Ver [EPICAS_Y_USER_STORIES.md](EPICAS_Y_USER_STORIES.md) para detalles completos.

| Épica | Descripción | User Stories |
|-------|------------|--------------|
| **EP-001** | Autenticación y Gestión de Perfil | US-001 a US-005 |
| **EP-002** | Captura de Contexto y Preferencias | US-006 a US-008 |
| **EP-003** | Motor de Recomendación basado en IA | US-009 a US-012 |
| **EP-004** | Integración de Catálogo y Streaming | US-013 a US-015 |
| **EP-005** | Backend, Caché y Validación | US-016 a US-019 |
| **EP-006** | Testing, Validación y Deployment | US-020 a US-024 |

---

## 🔑 Convenciones y Estándares

### **Backend (Node.js/TypeScript)**

#### 1. **Variables de Entorno** (copiar `.env.example` → `.env.local`)
```env
# Autenticación
JWT_SECRET=tu-secret-aqui
SESSION_SECRET=tu-session-secret

# APIs Externas
OPENAI_API_KEY=sk-...
TMDB_API_KEY=tu-api-key-tmdb
JUSTWATCH_API_KEY=tu-api-key-justwatch (si requiere)

# Base de Datos
DATABASE_URL=postgresql://user:password@localhost:5432/movie-recommender

# Caché
REDIS_URL=redis://localhost:6379

# Entorno
NODE_ENV=development|production
LOG_LEVEL=debug|info|warn|error

# Configuración de timing
LLM_TIMEOUT_MS=10000
TMDB_TIMEOUT_MS=5000
JUSTWATCH_TIMEOUT_MS=5000
RECOMMENDATION_MAX_RETRIES=3
```

#### 2. **Estructura de Respuestas API**
```typescript
// Success (200)
{
  "success": true,
  "data": { /* payload */ },
  "timestamp": "2026-05-14T10:30:00Z"
}

// Error (4xx, 5xx)
{
  "success": false,
  "error": {
    "code": "TMDB_NOT_FOUND",
    "message": "Película no encontrada en TMDB",
    "details": { /* extra context */ }
  },
  "timestamp": "2026-05-14T10:30:00Z"
}
```

#### 3. **Logging Structured**
```typescript
logger.info("Recomendación solicitada", {
  userId: user.id,
  contexto: { mood: "mystery", duration: 120 },
  timestamp: new Date().toISOString()
});

logger.error("LLM alucinación detectada", {
  userId: user.id,
  suggestedTitle: "Pelicula Fake",
  reason: "No encontrada en TMDB",
  retryCount: 2
});
```

#### 4. **Naming Conventions**
- **Rutas API**: kebab-case `/api/v1/get-recommendation`, `/api/v1/get-profile`
- **Funciones**: camelCase `getLLMRecommendation()`, `validateWithTMDB()`
- **Constantes**: UPPER_SNAKE_CASE `MAX_RETRIES`, `LLM_TIMEOUT_MS`
- **Archivos**: PascalCase para clases, camelCase para servicios: `LLMService.ts`, `cacheService.ts`

#### 5. **Manejo de Errores**
```typescript
// Custom error class
export class RecommendationError extends Error {
  constructor(
    public code: string,
    public statusCode: number = 500,
    message: string,
    public retryable: boolean = false
  ) {
    super(message);
  }
}

// Uso
throw new RecommendationError(
  "TMDB_NOT_FOUND",
  404,
  "Película no encontrada en TMDB después de 3 intentos",
  true // puede reintentar
);
```

### **Frontend (React/TypeScript)**

#### 1. **Componentes Principales**
- `<OnboardingFlow />`: Multipasos (géneros → directores → películas vistas → crear perfil)
- `<ContextCapture />`: Selector de estado de ánimo + filtros
- `<RecommendationCard />`: Tarjeta final con poster, sinopsis, plataformas
- `<HistoryPage />`: Lista de recomendaciones previas

#### 2. **State Management**
- Usar Context API o Zustand para perfil + autenticación
- React Query para datos de APIs (caché automático)
- Local state para contexto temporal (estado de ánimo, filtros)

#### 3. **Requests a Backend**
```typescript
// Ejemplo: solicitar recomendación
const getRecommendation = async (contextData) => {
  const response = await fetch("/api/v1/get-recommendation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      context: {
        mood: "mystery",
        type: "movie|series",
        maxDuration: 120,
        minYear: 2020
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`Recommendation failed: ${response.statusText}`);
  }
  
  return response.json(); // { data: { title, explanation, poster, platforms } }
};
```

---

## ⚠️ Riesgos Críticos y Mitigaciones

### **1. Alucinaciones del LLM** (RIESGO MÁS ALTO)
**Problema:** OpenAI puede inventar películas o combinar títulos reales con directores incorrectos.

**Mitigación Implementada en Código:**
- ✅ Prompt explícito: "Recomienda solo películas reales que existan en TMDB"
- ✅ Usar `response_format: { "type": "json_schema" }` en OpenAI (Structured Outputs)
- ✅ **NUNCA mostrar respuesta cruda de IA** → siempre validar en TMDB primero
- ✅ Si no existe en TMDB → descartar automáticamente
- ✅ Reintentar hasta 3 veces antes de mostrar error al usuario
- ✅ Logging de todas las alucinaciones detectadas para análisis

**Validación en Backend:**
```typescript
// En llmService.ts - PASO CRÍTICO
const recommendedTitle = llmResponse.title.trim();

// Buscar exactamente en TMDB
const tmdbMovie = await tmdbService.searchExact(recommendedTitle);

if (!tmdbMovie) {
  logger.warn("Alucinación detectada", { suggestedTitle: recommendedTitle });
  // Reintentar con otro prompt
  return retryGetRecommendation(userProfile, context, retryCount + 1);
}

// Solo si existe en TMDB, continuar
return { title: recommendedTitle, tmdbId: tmdbMovie.id, explanation: llmResponse.explanation };
```

### **2. Rate Limits y Cuellos de Botella de APIs**
**Problema:** TMDB, JustWatch y OpenAI tienen límites de requests. Múltiples usuarios pueden saturarlos.

**Mitigación:**
- ✅ **Caché Redis** de metadatos de TMDB (TTL 30 días)
- ✅ **Caché de búsquedas recientes** (últimas 100 películas)
- ✅ **Precarga de datos** (directores/actores populares al deploy)
- ✅ Implementar **backoff exponencial** en reintentos
- ✅ Monitorear **hit rate de caché** (target >70%)

**Implementación:**
```typescript
// En cacheService.ts
async function getTMDBMetadata(movieId: string) {
  // 1. Verificar caché
  const cached = await redis.get(`tmdb:${movieId}`);
  if (cached) return JSON.parse(cached);

  // 2. Consultar API
  const data = await tmdbService.getMovieDetails(movieId);

  // 3. Cachear por 30 días
  await redis.set(`tmdb:${movieId}`, JSON.stringify(data), "EX", 30 * 24 * 60 * 60);

  return data;
}
```

### **3. Latencia >7 segundos**
**Problema:** Muchos requests secuenciales pueden exceder el timeout aceptable.

**Mitigación:**
- ✅ Paralelizar donde sea posible (TMDB + JustWatch en paralelo)
- ✅ Usar **caché** para reducir calls a APIs
- ✅ Timeout agresivo en cada step (5-10s total por API)
- ✅ Circuit breaker para APIs lentas
- ✅ Monitoring de latencia en producción

**Validación:**
- Testing E2E mide latencia: `US-022`
- Criterio de éxito: 95% de requests <7 segundos
- Alertas en producción si promedio >5 segundos

### **4. Formato de Respuesta Inconsistente**
**Problema:** LLM puede devolver texto libre en lugar de JSON estructurado.

**Mitigación:**
- ✅ Usar **OpenAI Structured Outputs** (`response_format: JSON`)
- ✅ Validar respuesta con **Zod schema** en backend
- ✅ Si falla validación → reintentar con prompt corregido

**Schema Zod:**
```typescript
// En schemas/recommendation.ts
import { z } from "zod";

export const LLMRecommendationSchema = z.object({
  title: z.string().min(1).max(200),
  explanation: z.string().min(20).max(1000),
  genre: z.enum(["action", "drama", "comedy", "horror", "sci-fi", ...]),
  year: z.number().min(1900).max(2030)
});

// Validar
const result = LLMRecommendationSchema.safeParse(llmResponse);
if (!result.success) {
  throw new RecommendationError("INVALID_LLM_FORMAT", 500, result.error.message);
}
```

---

## 🚀 Comandos Esenciales

### **Setup Inicial**
```bash
# Backend
cd apps/api
npm install
npm run db:migrate   # prisma migrate deploy
npm run dev          # Inicia server en puerto 3000 (usa .env.local)

# Frontend
cd apps/web
npm install
npm run dev          # Inicia en puerto 5173
```

### **Variables de entorno backend (apps/api/.env.local)**
```env
DATABASE_URL=postgresql://...azure...
JWT_SECRET=...
GEMINI_API_KEY=...        # Google AI Studio (free tier)
TMDB_API_KEY=...          # themoviedb.org
LLM_TIMEOUT_MS=30000      # Gemini 2.5 flash es lento (thinking model)
RECOMMENDATION_MAX_RETRIES=3
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### **Variable de entorno frontend (apps/web)**
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### **Testing**
```bash
cd apps/api
npm run test:unit
```

### **Build producción**
```bash
# Backend (Render corre esto automáticamente)
cd apps/api
npm install --include=dev && npm run build && npx prisma migrate deploy

# Frontend (Vercel corre esto automáticamente)
cd apps/web
npm run build
```

---

## 📊 Criterios de Éxito (MVP)

Validar en `US-023`:

1. **Calidad de Sugerencias** (Cualitativo)
   - 10 usuarios beta generan 50 recomendaciones
   - ≥80% reporta explicaciones con sentido
   - ≥70% descubre contenido "valioso"

2. **Latencia Aceptable**
   - 95% de requests completos en <7 segundos
   - Promedio <5 segundos
   - Monitoreado en tiempo real

3. **Precisión de Catálogo**
   - ≥95% de recomendaciones existen en TMDB
   - ≥95% tienen disponibilidad mapeada en plataformas
   - 0 películas inventadas en producción

---

## 🔗 Integración de APIs Externas

### **OpenAI (LLM - CRÍTICO)**
- **Endpoint:** `POST https://api.openai.com/v1/chat/completions`
- **Modelo:** `gpt-4o-mini` (balance costo/performance)
- **Timeout:** 10 segundos
- **Request Limit:** No superar 100 req/min por usuario
- **Structured Output:** Usar `response_format: { "type": "json_schema", ... }`

### **TMDB (Búsqueda y Metadatos)**
- **Endpoint:** `GET https://api.themoviedb.org/3/search/movie`, `/search/tv`
- **Búsqueda exacta:** Implementar fuzzy matching con match >90%
- **Caché:** 30 días
- **Timeout:** 5 segundos
- **Rate limit:** Monitorear y usar backoff

### **JustWatch (Disponibilidad de Streaming)**
- **Endpoint:** GraphQL `https://graphql.justwatch.com/`
- **Datos:** Plataformas disponibles, precios, links
- **Caché:** 24-48 horas (streaming availability cambia frecuentemente)
- **Timeout:** 5 segundos

---

## 🧪 Testing Strategy

### **Pirámide de Testing**
```
        E2E (Integration) - 10%
           /            \
      Integration Tests - 20%
         /                  \
    Unit Tests - 70%
```

### **Cobertura Mínima**
- Unit tests: >80% (prompts, validación, lógica de negocio)
- Integration: >60% (flujo completo de recomendación)
- E2E: Happy path + error scenarios

### **Casos de Testing Obligatorios**
1. **Prompt Engineering**: Verifica inclusión de perfil + contexto
2. **Validación Zod**: Rechaza respuestas malformadas
3. **TMDB**: Búsqueda exitosa, manejo de 404, rate limiting
4. **Latencia**: <7 segundos end-to-end
5. **Anti-alucinación**: Detecta y descarta películas ficticias

---

## 🎓 Recursos para Agentes IA

### **Antes de Empezar Cualquier Task**
1. Leer `EPICAS_Y_USER_STORIES.md` para entender el alcance
2. Revisar esta sección relevante en `AGENTS.md`
3. Consultar `docs/ARCHITECTURE.md` (cuando exista)

### **Al Trabajar en Código**
- Mantener typing strict en TypeScript (`strict: true` en tsconfig)
- Usar Zod para validación de input/output
- Implementar logging structured
- Agregar tests unitarios junto con código
- Documentar prompts de IA en `utils/llmPrompt.ts`

### **Antes de Mergear**
- Tests pasan localmente
- No hay console.log (usar logger)
- Variables de entorno documentadas en `.env.example`
- Commits descriptivos con task ID (ej: `[US-009] Integrar OpenAI API`)

---

## 🚨 Pitfalls Comunes (Evitar)

| Pitfall | ¿Qué no hacer? | ✅ Hacer |
|---------|--------|---------|
| **LLM Crudo** | Mostrar respuesta directa de OpenAI | Validar en TMDB primero, descartar si no existe |
| **Rate Limits** | Hacer calls consecutivos a TMDB | Cachear, paralelizar, implementar backoff |
| **Timeout Largo** | Esperar >10s por respuesta | Timeout agresivo, fallback a error legible |
| **Sin Logging** | Solo console.log | Structured logging con contexto |
| **API Keys en Código** | Hardcodear credenciales | Usar .env + variables de entorno |
| **Sin Validación** | Asumir formato de API | Validar todo con Zod |
| **Testing Pobre** | Tests sin casos de error | Cubrir happy path + edge cases |

---

## 📋 Tareas Frecuentes para Agentes

### **"Quiero implementar [US-XXX]"**
1. Leer user story en `EPICAS_Y_USER_STORIES.md`
2. Revisar criterios de aceptación (Gherkin)
3. Crear rama: `feature/US-XXX-descripcion`
4. Implementar + tests unitarios
5. Validar: `npm run test:unit`
6. Mergear cuando tests pasen

### **"La recomendación tarda >7 segundos"**
1. Revisar latencia en logs (cada step debe tomar <2s)
2. Verificar hit rate caché (target >70%)
3. Paralelizar TMDB + JustWatch si no lo hacen
4. Implementar circuit breaker si API está lenta
5. Validar con `npm run test:integration --verbose`

### **"Necesito agregar un campo nuevo al LLM"**
1. Actualizar schema Zod en `schemas/recommendation.ts`
2. Actualizar prompt en `utils/llmPrompt.ts`
3. Actualizar tests en `tests/unit/llmPrompt.test.ts`
4. Desplegar con feature flag si es crítico

---

## 📞 Puntos de Contacto Clave

| Componente | Responsable | Archivo Principal |
|-----------|------------|------------------|
| **Autenticación** | Backend | `controllers/auth.ts`, `middleware/auth.ts` |
| **Perfil de Usuario** | Backend | `controllers/profile.ts`, `services/profileService.ts` |
| **LLM + Prompt** | Backend | `services/llmService.ts`, `utils/llmPrompt.ts` |
| **Validación TMDB** | Backend | `services/tmdbService.ts` |
| **Plataformas (JustWatch)** | Backend | `services/justWatchService.ts` |
| **Caché** | Backend | `services/cacheService.ts` |
| **Onboarding UI** | Frontend | `components/Onboarding/`, `pages/onboarding` |
| **Contexto UI** | Frontend | `components/ContextCapture/` |
| **Tarjeta de Recomendación** | Frontend | `components/RecommendationCard/` |

---

## 🔄 Flujo de Contribución (MVP)

1. **Checkout rama de feature:** `git checkout -b feature/US-XXX`
2. **Implementar según user story**
3. **Escribir tests unitarios**
4. **Validar localmente:** `npm run test:unit && npm run dev`
5. **Commit con referencia:** `git commit -m "[US-XXX] Descripción"`
6. **Push y create PR**
7. **Validación:** Tests pasan + code review
8. **Mergear a main**
9. **Deploy a staging** (si aplica)

---

**Última actualización:** 17 de mayo, 2026  
**Versión:** MVP 1.0 — 91% completado  
**Estado:** En producción con flujo completo (auth, onboarding, IA, TMDB, plataformas, historial). Pendiente: tests E2E y validación con usuarios.
