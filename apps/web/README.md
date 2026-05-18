# Frontend Web — React + Vite + TypeScript

## Setup

```bash
cd apps/web
npm install
cp .env.example .env.local
# VITE_API_BASE_URL=http://localhost:3000/api/v1
npm run dev   # http://localhost:3001
```

## Páginas y Rutas

| Ruta | Componente | Descripción |
|------|-----------|------------|
| `/` | `AuthPage` | Login / Registro (con show/hide contraseña) |
| `/home` | `HomePage` | Dashboard con 7 cards de acceso |
| `/onboarding` | `OnboardingFlow` | Setup de perfil en 5 pasos |
| `/profile` | `ProfilePage` | Perfil propio con estadísticas, foto, seguidores, películas recientes |
| `/recommendation` | `RecommendationPage` | Mood + filtros → recomendación IA |
| `/history` | `HistoryPage` | Historial de recomendaciones anteriores |
| `/reviews` | `ReviewsPage` | Reseñas de películas/series (buscar, crear, reaccionar) |
| `/lists` | `MovieListsPage` | Mis listas de películas (crear, ver) |
| `/lists/:listId` | `MovieListDetailPage` | Detalle de lista (agregar/quitar títulos, editar, eliminar) |
| `/users/search` | `UserSearchPage` | Buscar usuarios por nombre o email |
| `/users/:userId` | `PublicProfilePage` | Perfil público: stats, listas, reseñas, seguir/dejar de seguir |

> Todas las rutas privadas están envueltas en `<ProtectedRoute>`.  
> Orden importa: `/users/search` debe estar declarada ANTES de `/users/:userId` en el router.

## Estructura de Archivos

```
src/
├── pages/
│   ├── AuthPage.tsx                # Login/Registro
│   ├── HomePage.tsx                # Dashboard (7 cards)
│   ├── ProfilePage.tsx             # Perfil propio
│   ├── RecommendationPage.tsx      # Motor de recomendación IA
│   ├── HistoryPage.tsx             # Historial de recomendaciones
│   ├── ReviewsPage.tsx             # Reseñas de películas/series
│   ├── MovieListsPage.tsx          # Mis listas
│   ├── MovieListDetailPage.tsx     # Detalle de lista
│   ├── UserSearchPage.tsx          # Búsqueda de usuarios
│   └── PublicProfilePage.tsx       # Perfil público de otro usuario
│
├── components/
│   ├── Auth/
│   │   ├── LoginForm.tsx           # Con show/hide contraseña
│   │   └── RegisterForm.tsx        # Con show/hide contraseña
│   ├── Onboarding/
│   │   ├── OnboardingFlow.tsx      # Wizard de 5 pasos
│   │   ├── GenreSelector.tsx
│   │   ├── PersonSelector.tsx      # Directores/actores con debounce
│   │   └── MovieRater.tsx          # Buscar y calificar películas
│   ├── Recommendation/
│   │   ├── FilterPanel.tsx         # Pills: tipo/duración/época
│   │   ├── ContextSummary.tsx      # Chips del contexto actual
│   │   └── RecommendationCard.tsx  # Resultado: póster + info + explicación + plataformas
│   ├── MoodSelector.tsx            # 8 moods (componente controlado)
│   └── ProtectedRoute.tsx          # Guard de rutas privadas
│
├── hooks/
│   ├── useAuth.tsx                 # Contexto global de sesión
│   ├── useAuthForm.ts              # Login/register con validación
│   ├── useProfile.ts               # GET /profile
│   ├── useOnboarding.ts            # Estado del wizard + guardado
│   ├── useMoodSelector.ts          # GET /moods
│   ├── useRecommendationContext.ts # Estado: mood + filtros + resumen
│   ├── useRecommendation.ts        # POST /recommendations → result
│   ├── usePersonSelector.ts        # Búsqueda TMDB con debounce 350ms
│   ├── useMovieRater.ts            # Búsqueda + rating con debounce 350ms
│   └── useReviews.ts               # CRUD reseñas + likeReview (optimistic update)
│
├── api/
│   └── apiClient.ts                # Axios con auth automático
│
└── schemas/
    └── genres.ts                   # MOVIE_GENRES, TV_GENRES, GENRE_MAP, getGenreName()
```

## Hooks principales

### `useAuth`
Contexto global de sesión:
- `user`, `token`, `isLoading`
- `login()`, `register()`, `logout()`
- Persiste en `localStorage`. `ProtectedRoute` usa localStorage como fallback para evitar race condition post-login.

### `useProfile`
Carga el perfil completo del usuario autenticado:
- `profile: UserProfileComplete | null`, `loading`, `error`, `refetch()`
- `recentMovies` incluye `liked: boolean | null` (fusión de WatchedMovies + Reviews del backend)

### `useReviews`
Gestiona reseñas de un título específico:
- `reviews: ReviewItem[]`, `myReview`, `loading`
- `upsertReview(payload)` — crea o edita (1 por usuario por título)
- `likeReview(reviewId, value: 1 | -1 | null)` — reacción con optimistic update
- `ReviewItem` incluye: `liked`, `likeCount`, `dislikeCount`, `userLike`, `author.avatarUrl`

### `useRecommendationContext`
Estado del formulario de recomendación:
- `context`: `{ moodId, contentType, duration, year }`
- `toggleMood()`, `toggleContentType()`, `toggleDuration()`, `toggleYear()`
- `clearFilters()`, `clearAll()`, `isReady`, `getSummaryItems()`

### `useRecommendation`
Llama al backend y maneja el resultado:
- `fetchRecommendation(context)` → POST `/recommendations`
- `result: RecommendationResult | null`, `loading`, `error`, `clear()`

### `usePersonSelector`
Búsqueda de directores/actores con debounce:
- Carga preferencias guardadas desde `GET /profile` (devuelve nombres reales)
- Debounce de 350ms antes de llamar a TMDB
- `useEffect` sobre `selectedPersons` para notificar al padre (evita stale closure)

## Flujo de Recomendación

```
RecommendationPage
├── Vista "formulario"
│   ├── MoodSelector          → useRecommendationContext.toggleMood()
│   ├── FilterPanel           → toggleContentType / toggleDuration / toggleYear
│   ├── ContextSummary        → getSummaryItems()
│   └── Botón "Obtener"       → fetchRecommendation(context)
│
└── Vista "resultado"
    └── RecommendationCard    → póster + título + año + género + sinopsis + plataformas + explicación IA
```

## Flujo de Reseñas (ReviewsPage)

```
ReviewsPage
├── Buscador de títulos (TMDB, debounce)
├── Lista de reseñas del título seleccionado
│   └── ReviewCard
│       ├── Avatar + nombre del autor (→ perfil público)
│       ├── Badge 👍/👎 (liked)
│       ├── Estrellas (rating 1-5)
│       ├── Texto de la reseña
│       └── Botones 👍/👎 de reacción (solo para otros usuarios)
└── Formulario de tu reseña
    ├── Selector 👍/👎 (obligatorio)
    ├── Rating 1-5 estrellas (obligatorio)
    └── Textarea (1-2000 chars)
```

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

## Convenciones

- **Optimistic updates:** follow/unfollow, likes en reseñas, quitar ítems de lista
- **Navegación inteligente:** `PublicProfilePage` usa `location.state.from` para el botón ← (vuelve al origen: reseñas, búsqueda, historial, etc.)
- **Avatares:** círculo con `object-cover`, fallback a inicial del nombre cuando no hay `avatarUrl`
- **Fechas:** `new Date(dateStr.slice(0,10) + 'T12:00:00')` para evitar shift de timezone en birthDate
- **Route order:** `/users/search` declarada antes de `/users/:userId` en App.tsx
