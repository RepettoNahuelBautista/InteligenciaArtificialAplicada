# Backend API — Express + TypeScript + Prisma

## Setup

```bash
cd apps/api
npm install
cp .env.example .env.local
# Editar .env.local con tus keys
npm run dev   # http://localhost:3000
```

> El servidor usa `tsx watch --env-file=.env.local` y `dotenv.config()` en los servicios para cargar variables.

## Servicios implementados

| Servicio | Descripción |
|---------|------------|
| `authService` | Registro, login, validación JWT |
| `profileService` | Perfil completo; resuelve nombres de directores/actores desde TMDB |
| `geminiService` | Llama a Gemini 2.5 Flash, construye prompt, parsea JSON |
| `recommendationService` | Orquesta: Perfil → LLM → TMDB → persistencia; hasta 3 reintentos |
| `tmdbService` | Búsqueda de películas/series/personas, enriquecimiento de datos |
| `personService` | CRUD de directores/actores favoritos |
| `movieService` | CRUD de películas vistas + ratings |
| `genreService` | Lista y guarda géneros favoritos |

## Endpoints API

### Auth (US-001)

```
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me              [Bearer token]
```

### Géneros (US-002)

```
GET  /api/v1/genres               Listado (query: ?type=movie|tv)
POST /api/v1/profile/genres       [Auth] { genreIds: number[] }
```

### Moods (US-006)

```
GET  /api/v1/moods                Devuelve 8 estados de ánimo con emoji
```

### Recomendación IA (US-009 a US-013)

```
POST /api/v1/recommendations      [Auth]
Body: {
  moodId: 'mystery'|'relax'|'emotional'|'laugh'|'action'|'romantic'|'horror'|'inspiring',
  contentType?: 'movie'|'tv'|null,
  duration?: 'short'|'normal'|'long'|null,
  year?: 'classic'|'recent'|'new'|null
}
Response: {
  tmdbId, title, year, genre, overview, posterPath, contentType, explanation
}
```

Flujo interno:
1. Carga perfil completo del usuario (géneros, directores, actores, películas)
2. Construye prompt para Gemini 2.5 Flash (en español argentino)
3. Parsea respuesta JSON (limpia markdown si lo hay)
4. Valida el título contra TMDB (anti-alucinaciones)
5. Si no existe en TMDB → reintenta hasta 3 veces con lista de excluidos
6. Si TMDB_API_KEY no está configurada → omite validación y devuelve datos del LLM
7. Persiste recomendación en DB con contexto (mood, tipo, duración, época)

### Perfil completo (US-005)

```
GET /api/v1/profile               [Auth]
Response: {
  userId, email, createdAt,
  preferences: {
    genres: number[],
    directors: [{ id, name }],    // nombres reales desde TMDB
    actors: [{ id, name }]        // nombres reales desde TMDB
  },
  stats: { genreCount, directorCount, actorCount, moviesWatched, moviesLiked, moviesDisliked },
  recentMovies: [{ tmdbId, title, rating, createdAt }]
}
```

### Personas — directores y actores (US-003)

```
GET  /api/v1/search/people?q=...  Búsqueda TMDB (sin auth)
POST /api/v1/profile/people       [Auth] { personIds: number[], type: 'directors'|'actors' }
GET  /api/v1/profile/people       [Auth] Devuelve { directors: number[], actors: number[] }
```

### Películas vistas (US-004)

```
GET    /api/v1/search/movies?q=...&type=movie|tv   Búsqueda TMDB (sin auth)
POST   /api/v1/profile/watched-movies              [Auth] { tmdbId, title, rating: '1'|'5' }
GET    /api/v1/profile/watched-movies              [Auth] { movies, stats }
DELETE /api/v1/profile/watched-movies/:movieId     [Auth]
```

## Schema de Base de Datos (Prisma + PostgreSQL)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
}

model UserProfile {
  id                 String @id @default(cuid())
  userId             String @unique
  favoriteGenres     Json   // number[]
  favoriteDirectors  Json   // number[] (TMDB person IDs)
  favoriteActors     Json   // number[]
}

model WatchedMovie {
  id        String   @id @default(cuid())
  userId    String
  tmdbId    String
  title     String
  rating    Int      // 1 = dislike, 5 = like
  createdAt DateTime @default(now())
  @@unique([userId, tmdbId])
}

model Recommendation {
  id              String   @id @default(cuid())
  userId          String
  tmdbId          String
  title           String
  explanation     String
  genre           String
  year            Int
  contextMood     String
  contextType     String?
  contextDuration Int?
  contextYear     Int?
  createdAt       DateTime @default(now())
}
```

## Variables de Entorno

```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3001
LOG_LEVEL=debug

DATABASE_URL=postgresql://...     # Azure Database for PostgreSQL

JWT_SECRET=...
JWT_EXPIRY=7d

GEMINI_API_KEY=AIza...            # Google AI Studio — free tier 1500 req/día
TMDB_API_KEY=...                  # themoviedb.org — gratis

LLM_TIMEOUT_MS=30000              # Gemini 2.5-flash es un thinking model
TMDB_TIMEOUT_MS=5000
RECOMMENDATION_MAX_RETRIES=3
```

## Comandos

```bash
npm run dev          # tsx watch --env-file=.env.local (puerto 3000)
npm run build        # tsc → dist/
npm start            # node dist/index.js
npm run db:push      # Aplica schema Prisma a la DB
npm run db:studio    # Prisma Studio (GUI)
npm run db:migrate   # Crea migración
npm run test:unit    # Vitest unit tests
```

## Manejo de Errores

Todas las respuestas de error siguen el formato:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensaje legible"
  },
  "timestamp": "2026-05-16T..."
}
```

Códigos HTTP usados: `200`, `201`, `400`, `401`, `404`, `409`, `502`, `503`

## Notas de Implementación

- `dotenv.config({ path: '.env.local', override: true })` en `geminiService.ts` y `tmdbService.ts` porque `tsx watch --env-file` no propaga variables al child process en Windows
- `gemini-2.5-flash` no acepta `responseSchema` (SDK 0.24.x) — se usa solo `responseMimeType: 'application/json'` + instrucción en prompt
- El JSON de Gemini puede venir envuelto en `{ recommendation: {...} }` — se maneja con fallback en el parser
- `TMDB_API_KEY` sin configurar → validación TMDB omitida, se devuelve recomendación sin póster/sinopsis
