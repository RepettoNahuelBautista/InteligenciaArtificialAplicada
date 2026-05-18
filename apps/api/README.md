# Backend API — Express + TypeScript + Prisma

## Setup

```bash
cd apps/api
npm install
cp .env.example .env.local
# Editar .env.local con tus keys
npx prisma migrate deploy
npm run dev   # http://localhost:3000
```

> El servidor usa `tsx watch --env-file=.env.local` y `dotenv.config()` en los servicios para cargar variables.

## Servicios implementados

| Servicio | Descripción |
|---------|------------|
| `authService` | Registro, login, validación JWT |
| `profileService` | Perfil completo: stats, preferencias, recentMovies (merge WatchedMovies + Reviews) |
| `geminiService` | Llama a Gemini 2.5 Flash, construye prompt, parsea JSON |
| `recommendationService` | Orquesta: Perfil → LLM → TMDB → persistencia; hasta 3 reintentos |
| `tmdbService` | Búsqueda de películas/series/personas, enriquecimiento, watch providers |
| `personService` | CRUD de directores/actores favoritos |
| `movieService` | CRUD de películas vistas + ratings |
| `genreService` | Lista y guarda géneros favoritos |
| `reviewService` | CRUD de reseñas (1 por usuario por título), con liked + rating + texto |
| `reviewLikeService` | Like/dislike de reseñas de otros usuarios (toggle) |
| `movieListService` | CRUD de listas de películas (públicas/privadas) con ítems |
| `followService` | Seguir/dejar de seguir usuarios, contadores de seguidores/seguidos |
| `avatarService` | Subida de foto de perfil a Cloudinary (multer memory storage) |
| `userService` | Búsqueda de usuarios por nombre/email, perfil público |

## Endpoints API

### Auth

```
POST /api/v1/auth/register          { email, password }
POST /api/v1/auth/login             { email, password }
GET  /api/v1/auth/me                [Bearer token]
```

### Géneros

```
GET  /api/v1/genres                 Listado (query: ?type=movie|tv)
POST /api/v1/profile/genres         [Auth] { genreIds: number[] }
```

### Moods

```
GET  /api/v1/moods                  Devuelve 8 estados de ánimo con emoji
```

### Recomendación IA

```
POST /api/v1/recommendations        [Auth]
Body: {
  moodId: 'mystery'|'relax'|'emotional'|'laugh'|'action'|'romantic'|'horror'|'inspiring',
  contentType?: 'movie'|'tv'|null,
  duration?: 'short'|'normal'|'long'|null,
  year?: 'classic'|'recent'|'new'|null
}
GET  /api/v1/recommendations        [Auth]  Historial
```

Flujo interno:
1. Carga perfil completo del usuario (géneros, directores, actores, películas)
2. Construye prompt para Gemini 2.5 Flash (en español argentino)
3. Parsea respuesta JSON (limpia markdown si lo hay)
4. Valida el título contra TMDB (anti-alucinaciones)
5. Si no existe en TMDB → reintenta hasta 3 veces con lista de excluidos
6. Persiste recomendación en DB con contexto (mood, tipo, duración, época)

### Perfil

```
GET  /api/v1/profile                [Auth]
PUT  /api/v1/profile/personal       [Auth] { displayName, birthDate, country, language }
POST /api/v1/profile/avatar         [Auth] multipart/form-data (campo: avatar)
GET  /api/v1/profile/followers      [Auth]
GET  /api/v1/profile/following      [Auth]
```

Respuesta de `GET /profile`:
```json
{
  "userId": "...",
  "email": "...",
  "createdAt": "...",
  "personalInfo": { "displayName", "birthDate", "country", "language", "avatarUrl" },
  "preferences": {
    "genres": [28, 12],
    "directors": [{ "id": 123, "name": "Christopher Nolan" }],
    "actors": [{ "id": 456, "name": "Tom Hanks" }]
  },
  "stats": { "genreCount", "directorCount", "actorCount", "moviesWatched", "moviesLiked", "moviesDisliked" },
  "social": { "followerCount", "followingCount" },
  "recentMovies": [{ "id", "tmdbId", "title", "rating", "liked", "createdAt" }]
}
```

> `recentMovies` fusiona WatchedMovies y Reviews con `liked !== null`, deduplicados por `tmdbId`, ordenados por fecha, máx. 10.

### Personas — directores y actores

```
GET  /api/v1/search/people?q=...    Búsqueda TMDB (sin auth)
POST /api/v1/profile/people         [Auth] { personIds: number[], type: 'directors'|'actors' }
GET  /api/v1/profile/people         [Auth]  { directors: number[], actors: number[] }
```

### Películas vistas

```
GET    /api/v1/search/movies?q=...&type=movie|tv   Búsqueda TMDB (sin auth)
POST   /api/v1/profile/watched-movies              [Auth] { tmdbId, title, rating: '1'|'5' }
GET    /api/v1/profile/watched-movies              [Auth]  { movies, stats }
DELETE /api/v1/profile/watched-movies/:movieId     [Auth]
```

### Reseñas

```
GET  /api/v1/reviews?tmdbId=...     [Auth]  Reseñas de un título
POST /api/v1/reviews                [Auth]  Crear o editar reseña (upsert por userId+tmdbId)
Body: { tmdbId, title, contentType: 'movie'|'tv', rating: 1-5, liked: boolean|null, text }
```

### Reacciones a reseñas

```
POST   /api/v1/reviews/:reviewId/like   [Auth]  { value: 1 | -1 }
DELETE /api/v1/reviews/:reviewId/like   [Auth]  Quitar reacción
```

### Listas de películas

```
GET    /api/v1/lists                    [Auth]  Mis listas
POST   /api/v1/lists                    [Auth]  { name, description?, isPublic }
GET    /api/v1/lists/:listId            [Auth]  Detalle con ítems
PUT    /api/v1/lists/:listId            [Auth]  { name, description?, isPublic }
DELETE /api/v1/lists/:listId            [Auth]
POST   /api/v1/lists/:listId/items      [Auth]  { tmdbId, title, posterPath?, contentType }
DELETE /api/v1/lists/:listId/items/:tmdbId  [Auth]
```

### Social — usuarios

```
GET    /api/v1/users/search?q=...       [Auth]  Buscar usuarios por nombre/email
GET    /api/v1/users/:userId/profile    [Auth]  Perfil público
GET    /api/v1/users/:userId/reviews    [Auth]  Reseñas del usuario
GET    /api/v1/users/:userId/lists      [Auth]  Listas públicas del usuario
POST   /api/v1/users/:userId/follow     [Auth]  Seguir usuario
DELETE /api/v1/users/:userId/follow     [Auth]  Dejar de seguir
```

> Importante: la ruta `/users/search` debe declararse ANTES de `/users/:userId` para que no sea interceptada por el parámetro dinámico.

## Schema de Base de Datos

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  profile   UserProfile?
  watchedMovies   WatchedMovie[]
  recommendations Recommendation[]
  reviews         Review[]
  lists           MovieList[]
  following       Follow[] @relation("UserFollowing")
  followers       Follow[] @relation("UserFollowers")
}

model UserProfile {
  id                String   @id @default(cuid())
  userId            String   @unique
  favoriteGenres    Json     // number[]
  favoriteDirectors Json     // number[] (TMDB person IDs)
  favoriteActors    Json     // number[]
  displayName       String?
  birthDate         DateTime?
  country           String?
  language          String?
  avatarUrl         String?
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
  rating          Int?
  createdAt       DateTime @default(now())
}

model Review {
  id          String   @id @default(cuid())
  userId      String
  tmdbId      String
  title       String
  contentType String
  rating      Int      // 1–5
  liked       Boolean?
  text        String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  likes       ReviewLike[]
  @@unique([userId, tmdbId])
}

model ReviewLike {
  id       String @id @default(cuid())
  reviewId String
  userId   String
  value    Int    // 1 = like, -1 = dislike
  @@unique([reviewId, userId])
}

model MovieList {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  items       MovieListItem[]
}

model MovieListItem {
  id          String @id @default(cuid())
  listId      String
  tmdbId      String
  title       String
  posterPath  String?
  contentType String
  @@unique([listId, tmdbId])
}

model Follow {
  id          String   @id @default(cuid())
  followerId  String
  followingId String
  createdAt   DateTime @default(now())
  follower    User @relation("UserFollowing", fields: [followerId], references: [id])
  following   User @relation("UserFollowers", fields: [followingId], references: [id])
  @@unique([followerId, followingId])
}
```

## Migraciones (en orden)

```
20260516000000_init_postgresql
20260517000001_add_personal_info         (displayName, birthDate, country, language)
20260517000002_add_reviews               (Review table)
20260517000003_add_follows               (Follow table)
20260517000004_add_avatar                (avatarUrl en UserProfile)
20260517000005_add_review_likes          (ReviewLike table)
20260517000006_add_movie_lists           (MovieList + MovieListItem)
20260518000001_add_review_liked          (liked BOOLEAN en Review)
```

## Variables de Entorno

```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3001

DATABASE_URL=postgresql://...     # Azure Database for PostgreSQL

JWT_SECRET=...
JWT_EXPIRY=7d

GEMINI_API_KEY=AIza...            # Google AI Studio — free tier
TMDB_API_KEY=...                  # themoviedb.org — gratis

# Cloudinary (solo en Render como env vars, nunca en código)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

LLM_TIMEOUT_MS=30000              # Gemini 2.5-flash es un thinking model
TMDB_TIMEOUT_MS=5000
RECOMMENDATION_MAX_RETRIES=3
```

## Comandos

```bash
npm run dev          # tsx watch --env-file=.env.local (puerto 3000)
npm run build        # tsc → dist/
npm start            # node dist/index.js (Render usa este)
npm run db:studio    # Prisma Studio (GUI)
```

## Manejo de Errores

Todas las respuestas siguen el formato:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensaje legible"
  }
}
```

Códigos HTTP usados: `200`, `201`, `400`, `401`, `403`, `404`, `409`, `502`, `503`

## Notas de Implementación

- `dotenv.config({ path: '.env.local', override: true })` en `geminiService.ts` y `tmdbService.ts` porque `tsx watch --env-file` no propaga variables al child process en Windows
- `gemini-2.5-flash` no acepta `responseSchema` (SDK 0.24.x) — se usa `responseMimeType: 'application/json'` + instrucción en prompt; máx. `maxOutputTokens: 2048`
- El JSON de Gemini puede venir envuelto en `{ recommendation: {...} }` — se maneja con fallback en el parser
- `TMDB_API_KEY` sin configurar → validación TMDB omitida, recomendación sin póster/sinopsis
- Cloudinary: multer con `memoryStorage()`, sube buffer desde `req.file.buffer`
- `profileService.getProfile` fusiona WatchedMovies y Reviews por `tmdbId` en memoria usando un `Map`, manteniendo la entrada más reciente
