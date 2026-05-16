# Backend API - Express + TypeScript

## Setup

```bash
cd apps/api
npm install
npm run db:push  # Initialize database
cp .env.example .env.local
npm run dev      # Runs on http://localhost:3000
```

## API Endpoints (US-001 to US-006)

### ✅ Authentication (US-001)

#### Register New User
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response (201):
{
  "success": true,
  "data": {
    "id": "cuid-123",
    "email": "user@example.com",
    "token": "eyJhbGc..."
  }
}
```

#### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response (200): Same as register
```

#### Get Current User
```bash
GET /api/v1/auth/me
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "userId": "cuid-123",
    "email": "user@example.com"
  }
}
```

### ✅ Genres (US-002)

#### Get Available Genres
```bash
GET /api/v1/genres?type=movie|tv
# type is optional, defaults to 'movie'

Response:
{
  "success": true,
  "data": [
    { "id": 28, "name": "Acción" },
    { "id": 12, "name": "Aventura" },
    ...
  ]
}
```

#### Save Genre Preferences
```bash
POST /api/v1/profile/genres
Authorization: Bearer <token>
Content-Type: application/json

{
  "selectedGenres": [28, 12, 16]  // min 3, max 15
}

Response (200):
{
  "success": true,
  "data": {
    "userId": "cuid-123",
    "favoriteGenres": [28, 12, 16]
  }
}
```

### ✅ People Search & Preferences (US-003)

#### Search People (Directors/Actors)
```bash
GET /api/v1/search/people?q=Steven+Spielberg
# Returns up to 10 results from TMDB

Response:
{
  "success": true,
  "data": [
    {
      "id": 488,
      "name": "Steven Spielberg",
      "department": "Directing"
    }
  ]
}
```

#### Save Person Preferences
```bash
POST /api/v1/profile/people
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "directors",  // or "actors"
  "selectedPersonIds": [488, 5]  // max 15
}

Response (200):
{
  "success": true,
  "data": {
    "userId": "cuid-123",
    "favoriteDirectors": [488, 5]
  }
}
```

#### Get Saved People
```bash
GET /api/v1/profile/people
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "directors": [488, 5],
    "actors": [3, 1]
  }
}
```

### ✅ Movies Search & Rating (US-004)

#### Search Movies
```bash
GET /api/v1/search/movies?q=Inception&type=movie
# Returns up to 15 results from TMDB

Response:
{
  "success": true,
  "data": [
    {
      "id": 27205,
      "tmdbId": 27205,
      "title": "Inception",
      "year": 2010,
      "poster_path": "/...",
      "overview": "...",
      "media_type": "movie"
    }
  ]
}
```

#### Rate a Movie
```bash
POST /api/v1/profile/watched-movies
Authorization: Bearer <token>
Content-Type: application/json

{
  "tmdbId": 27205,
  "title": "Inception",
  "rating": 5  // 1 = dislike, 5 = like
}

Response (201):
{
  "success": true,
  "data": {
    "id": "watch-123",
    "tmdbId": 27205,
    "rating": 5,
    "createdAt": "2026-05-16T..."
  }
}
```

#### Get Watched Movies
```bash
GET /api/v1/profile/watched-movies
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "watch-123",
      "tmdbId": 27205,
      "title": "Inception",
      "rating": 5,
      "createdAt": "2026-05-16T..."
    }
  ]
}
```

#### Remove Watched Movie
```bash
DELETE /api/v1/profile/watched-movies/:movieId
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": { "deleted": true }
}
```

### ✅ Profile (US-005)

#### Get Complete Profile with Stats
```bash
GET /api/v1/profile
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "userId": "cuid-123",
    "email": "user@example.com",
    "createdAt": "2026-05-15T...",
    "preferences": {
      "genres": [28, 12],
      "directors": [488],
      "actors": [3]
    },
    "stats": {
      "genreCount": 2,
      "directorCount": 1,
      "actorCount": 1,
      "moviesWatched": 5,
      "moviesLiked": 4,
      "moviesDisliked": 1
    },
    "recentMovies": [
      {
        "id": "watch-123",
        "tmdbId": 27205,
        "title": "Inception",
        "rating": 5,
        "createdAt": "2026-05-16T..."
      }
    ]
  }
}
```

### ✅ Moods (US-006)

#### Get Available Moods
```bash
GET /api/v1/moods

Response:
{
  "success": true,
  "data": [
    {
      "id": "mystery",
      "label": "Misterio",
      "emoji": "🕵️",
      "description": "Quiero intriga y suspense"
    },
    {
      "id": "relax",
      "label": "Desconectar",
      "emoji": "😎",
      "description": "Algo tranquilo y relajante"
    },
    ...
  ]
}
```

## Database Schema

Using Prisma with SQLite:

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  password TEXT,
  createdAt DATETIME,
  updatedAt DATETIME
);

-- User profiles
CREATE TABLE user_profiles (
  id TEXT PRIMARY KEY,
  userId TEXT UNIQUE REFERENCES users(id),
  favoriteGenres TEXT,        -- JSON array [28, 12, ...]
  favoriteDirectors TEXT,     -- JSON array [488, 5, ...]
  favoriteActors TEXT,        -- JSON array [3, 1, ...]
  createdAt DATETIME,
  updatedAt DATETIME
);

-- Watched movies
CREATE TABLE watched_movies (
  id TEXT PRIMARY KEY,
  userId TEXT REFERENCES users(id),
  tmdbId INTEGER,
  title TEXT,
  rating INTEGER (1 or 5),
  createdAt DATETIME,
  updatedAt DATETIME,
  UNIQUE(userId, tmdbId)
);
```

## Project Structure

```
apps/api/
├── src/
│   ├── controllers/       # Request handlers
│   │   ├── authController.ts
│   │   ├── genreController.ts
│   │   ├── personController.ts
│   │   ├── movieController.ts
│   │   ├── profileController.ts
│   │   └── moodController.ts
│   ├── services/         # Business logic
│   │   ├── authService.ts
│   │   ├── genreService.ts
│   │   ├── personService.ts
│   │   ├── movieService.ts
│   │   ├── profileService.ts
│   │   └── tmdbService.ts
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   ├── schemas/          # Zod validation
│   │   ├── genres.ts
│   │   ├── moods.ts
│   │   └── ...
│   ├── db/              # Prisma ORM
│   │   └── client.ts
│   ├── utils/           # Helpers
│   │   ├── logger.ts
│   │   ├── errors.ts
│   │   └── jwt.ts
│   └── index.ts         # Main entry point
├── tests/
│   ├── unit/            # Unit tests
│   └── integration/     # Integration tests
├── prisma/
│   ├── schema.prisma    # Data schema
│   └── migrations/      # Database migrations
└── package.json
```

## Environment Variables

See `.env.example` for all variables:

```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3001
DATABASE_URL=file:./dev.db
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRY=604800000  # 7 days in milliseconds
TMDB_API_KEY=your-tmdb-api-key
OPENAI_API_KEY=sk-...  # Required for US-009+
LOG_LEVEL=debug|info|warn|error
```

## Testing

```bash
# Run all tests
npm run test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Linting & Type Checking

```bash
npm run lint
npm run type-check
npm run type-check:watch
```

## Build & Production

```bash
npm run build
npm start  # Run from dist/
```

## Development Commands

```bash
# Format code
npm run format

# Check formats
npm run format:check

# Database management
npm run db:push          # Push schema to database
npm run db:studio       # Open Prisma Studio (GUI)
npm run db:migrate      # Create new migration
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly message",
    "details": { "field": "additional context" }
  },
  "timestamp": "2026-05-16T..."
}
```

Common HTTP Status Codes:
- `201` - Created (successful POST)
- `200` - OK (successful GET/PUT)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate email, etc)
- `500` - Internal Server Error

## Performance Notes

- TMDB searches are cached for 24 hours
- JWT tokens expire after 7 days
- Password validation: min 8 chars, uppercase, lowercase, number
- Rate limiting: Plan for production deployment
- Max results: People search = 10, Movies search = 15
```

---

**Implementado en ETAPA 1:** Autenticación básica (US-001)
