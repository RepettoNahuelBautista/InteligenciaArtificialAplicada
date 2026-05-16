# Backend API - Express + TypeScript

## Setup

```bash
cd apps/api
npm install
npm run db:push  # Initialize database
cp .env.example .env.local
npm run dev
```

## API Endpoints

### Authentication (US-001)

#### Register
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response:
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

Response: (same as register)
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
  favoriteGenres TEXT,        -- JSON array
  favoriteDirectors TEXT,     -- JSON array
  favoriteActors TEXT,        -- JSON array
  createdAt DATETIME,
  updatedAt DATETIME
);
```

## Project Structure

```
apps/api/
├── src/
│   ├── controllers/       # Request handlers
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   ├── schemas/          # Zod validation
│   ├── db/              # Prisma ORM
│   ├── utils/           # Helpers (logger, errors, jwt)
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

See `.env.example` for all variables. Key ones:

- `NODE_ENV`: development | production
- `PORT`: Server port (default 3000)
- `DATABASE_URL`: SQLite connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `CORS_ORIGIN`: Frontend URL for CORS

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
```

## Linting & Type Checking

```bash
npm run lint
npm run type-check
```

## Build & Production

```bash
npm run build
npm start  # Run from dist/
```

---

**Implementado en ETAPA 1:** Autenticación básica (US-001)
