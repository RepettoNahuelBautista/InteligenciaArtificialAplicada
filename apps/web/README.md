# Frontend Web — React + Vite + TypeScript

## Setup

```bash
cd apps/web
npm install
cp .env.example .env.local
npm run dev   # http://localhost:3001
```

## Páginas y Rutas

| Ruta | Componente | US | Descripción |
|------|-----------|-----|------------|
| `/` | `AuthPage` | US-001 | Login / Registro |
| `/home` | `HomePage` | US-005 | Dashboard con accesos a funciones |
| `/onboarding` | `OnboardingFlow` | US-002–005 | Setup de perfil en 5 pasos |
| `/profile` | `ProfilePage` | US-005 | Estadísticas + preferencias con nombres reales |
| `/recommendation` | `RecommendationPage` | US-006–013 | Mood + filtros → recomendación IA |

Todas las rutas privadas están envueltas en `<ProtectedRoute>` que espera al contexto de auth antes de redirigir (evita race condition con localStorage).

## Estructura de Archivos

```
src/
├── pages/
│   ├── AuthPage.tsx              # Login/Registro
│   ├── HomePage.tsx              # Dashboard
│   ├── ProfilePage.tsx           # Perfil completo
│   └── RecommendationPage.tsx    # Form de contexto + resultado
│
├── components/
│   ├── Auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── Onboarding/
│   │   ├── OnboardingFlow.tsx    # Wizard de 5 pasos
│   │   ├── GenreSelector.tsx
│   │   ├── PersonSelector.tsx    # Directores y actores (con debounce)
│   │   └── MovieRater.tsx        # Buscar y calificar películas
│   ├── Recommendation/
│   │   ├── FilterPanel.tsx       # Pills: tipo/duración/época
│   │   ├── ContextSummary.tsx    # Chips del contexto actual
│   │   └── RecommendationCard.tsx # Resultado: póster + info + explicación
│   ├── MoodSelector.tsx          # 8 moods (componente controlado)
│   └── ProtectedRoute.tsx        # Guard de rutas privadas
│
├── hooks/
│   ├── useAuth.tsx               # Contexto global de sesión
│   ├── useAuthForm.ts            # Login/register con validación
│   ├── useProfile.ts             # GET /profile
│   ├── useOnboarding.ts          # Estado del wizard + guardado
│   ├── useMoodSelector.ts        # GET /moods (solo fetch)
│   ├── useRecommendationContext.ts # Estado: mood + filtros + resumen
│   ├── useRecommendation.ts      # POST /recommendations → result
│   ├── usePersonSelector.ts      # Búsqueda TMDB con debounce 350ms
│   └── useMovieRater.ts          # Búsqueda + rating con debounce 350ms
│
├── api/
│   └── apiClient.ts              # Axios con auth automático
│
└── schemas/
    └── genres.ts                 # MOVIE_GENRES, TV_GENRES, GENRE_MAP, getGenreName()
```

## Flujo de Recomendación (RecommendationPage)

```
RecommendationPage
├── Vista "formulario"
│   ├── MoodSelector          → useRecommendationContext.toggleMood()
│   ├── FilterPanel           → toggleContentType / toggleDuration / toggleYear
│   ├── ContextSummary        → getSummaryItems() — chips del contexto
│   └── Botón "Obtener"       → fetchRecommendation(context)
│
└── Vista "resultado" (cuando result != null)
    └── RecommendationCard    → póster TMDB + título + año + genre + overview + explanation
```

## Hooks principales

### `useRecommendationContext`
Maneja el estado completo del formulario de recomendación:
- `context`: `{ moodId, contentType, duration, year }`
- `toggleMood(mood)`, `toggleContentType()`, `toggleDuration()`, `toggleYear()`
- `clearFilters()` — limpia solo filtros, mantiene mood
- `clearAll()` — resetea todo
- `isReady` — `true` cuando hay mood seleccionado
- `getSummaryItems()` — array de strings para los chips del resumen

### `useRecommendation`
Llama al backend y maneja el estado del resultado:
- `fetchRecommendation(context)` → POST `/recommendations`
- `result: RecommendationResult | null`
- `loading`, `error`
- `clear()` — vuelve al formulario

### `usePersonSelector`
Búsqueda de directores/actores con debounce:
- Carga preferencias guardadas desde `GET /profile` (devuelve nombres reales)
- Debounce de 350ms antes de llamar a TMDB
- `useEffect` sobre `selectedPersons` para notificar al padre (evita closure stale)

### `useAuth`
Contexto global de sesión:
- `user`, `token`, `isLoading`
- `login()`, `register()`, `logout()`
- Persiste en `localStorage`

## Variables de Entorno

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## Comandos

```bash
npm run dev          # Servidor de desarrollo con HMR (puerto 3001)
npm run build        # Build de producción → dist/
npm run preview      # Previsualizar build local
npm run lint         # ESLint
```

## Notas de Implementación

- **`ProtectedRoute`**: usa `localStorage` como fallback para el instante post-login antes de que React actualice el contexto de auth (evita race condition)
- **`PersonSelector`**: no usa `disabled={isSearching}` — usar disabled causa pérdida de foco en cada búsqueda; el spinner se muestra dentro del input sin bloquearlo
- **Género en perfil**: `getGenreName(id)` busca en `GENRE_MAP` combinado de películas y series
- **Nombres de personas en perfil**: `ProfilePage` usa los datos de `GET /profile` que ya incluye `{ id, name }` resueltos desde TMDB
- **`RecommendationCard`**: imágenes de póster desde `https://image.tmdb.org/t/p/w500{posterPath}`
