# Frontend Web - React + Vite + TypeScript

## Setup

```bash
cd apps/web
npm install
cp .env.example .env.local
npm run dev
```

**🌐 Frontend runs on:** http://localhost:3001

## Project Structure

```
apps/web/
├── src/
│   ├── pages/                    # Full page components
│   │   ├── AuthPage.tsx         # Login/Register (US-001)
│   │   ├── HomePage.tsx         # Dashboard (US-005+)
│   │   ├── OnboardingFlow.tsx   # 5-step onboarding (US-002 to US-005)
│   │   ├── ProfilePage.tsx      # User profile with stats (US-005)
│   │   └── RecommendationPage.tsx # Mood selector (US-006)
│   ├── components/              # Reusable components
│   │   ├── Auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── Onboarding/
│   │   │   ├── OnboardingFlow.tsx
│   │   │   ├── GenreSelector.tsx
│   │   │   ├── PersonSelector.tsx
│   │   │   ├── MovieRater.tsx
│   │   │   └── ProfileSummary.tsx
│   │   └── MoodSelector.tsx      # Mood buttons (US-006)
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts           # Auth context (US-001)
│   │   ├── useOnboarding.ts     # Onboarding state (US-002-005)
│   │   ├── useGenreSelector.ts  # Genre selection (US-002)
│   │   ├── usePersonSelector.ts # Person search (US-003)
│   │   ├── useMovieRater.ts     # Movie rating (US-004)
│   │   ├── useProfile.ts        # Profile data (US-005)
│   │   └── useMoodSelector.ts   # Mood selection (US-006)
│   ├── api/                     # API clients
│   │   └── apiClient.ts         # Axios setup with auth
│   ├── styles/                  # Global CSS
│   │   └── globals.css          # TailwindCSS imports
│   ├── App.tsx                  # Main router
│   └── main.tsx                 # React DOM entry
├── index.html                   # HTML template
├── vite.config.ts              # Vite config
├── tailwind.config.ts          # TailwindCSS config
└── tsconfig.json               # TypeScript config
```

## Pages & Routes

| Route | Component | US | Status | Description |
|-------|-----------|-----|--------|-------------|
| `/` | AuthPage | US-001 | ✅ | Login/Register |
| `/home` | HomePage | US-005+ | ✅ | Dashboard with action cards |
| `/onboarding` | OnboardingFlow | US-002-005 | ✅ | 5-step profile setup |
| `/profile` | ProfilePage | US-005 | ✅ | User profile with stats |
| `/recommendation` | RecommendationPage | US-006 | ✅ | Mood selector |

## Components Overview

### AuthPage (US-001)
- Toggle between login and register
- Responsive gradient background
- Form validation

### OnboardingFlow (US-002 to US-005)
5-step wizard:
1. **GenreSelector** - Pick 3-15 genres (movies/series)
2. **PersonSelector** - Add favorite directors
3. **PersonSelector** - Add favorite actors
4. **MovieRater** - Rate 0+ movies with 👍/👎
5. **ProfileSummary** - Review profile, click "Comenzar"

### ProfilePage (US-005)
- 📊 Stats grid (6 colored cards)
- 🏷️ Preferences display (genres, directors, actors)
- 🎬 Recent 5 movies with ratings
- 🔗 Links to edit/home

### RecommendationPage (US-006)
- 🎯 MoodSelector component with 8 moods
- 📊 Profile summary panel
- 💡 Feature teaser
- 🎬 "Obtener Recomendación" button (next: US-009)

### MoodSelector (US-006)
- 8 mood buttons with emoji + description
- Visual feedback on selection
- Responsive grid layout (2-4 columns)

## Hooks

### useAuth()
Global auth context:
- `user`: { id, email }
- `token`: JWT token string
- `login()`, `register()`: Auth methods
- `logout()`: Clear session
- Auto-persists to localStorage

### useOnboarding()
Onboarding flow state:
- `step`: Current step (1-5)
- `nextStep()`, `prevStep()`: Navigation
- `completeOnboarding()`: Finish flow

### useGenreSelector()
Genre selection:
- `selectedGenres`: Chosen genre IDs
- `genres`: Available genres
- `toggleGenre()`: Add/remove genre
- `isValid`: Check min 3 genres

### usePersonSelector()
Person search & selection:
- `selectedPersons`: Chosen people
- `searchResults`: TMDB search results
- `handleSearch()`: Query TMDB
- `togglePerson()`: Add/remove person

### useMovieRater()
Movie search & rating:
- `searchResults`: TMDB search results
- `currentMovie`: Selected movie
- `ratedCount`: Number of rated movies
- `selectMovie()`, `rateMovie()`: Actions

### useProfile()
Profile data fetching:
- `profile`: UserProfileComplete
- `loading`, `error`: States
- `refetch()`: Reload profile

### useMoodSelector()
Mood selection:
- `moods`: Available moods
- `selectedMood`: Chosen mood
- `loading`, `error`: States
- `selectMood()`, `clearMood()`: Actions

## API Client

`apiClient.ts` - Axios instance with:
- Base URL: `VITE_API_BASE_URL` (default: http://localhost:3000/api/v1)
- Auto JWT injection in `Authorization: Bearer` header
- Auto logout on 401 responses
- Consistent error handling

## Styling

**TailwindCSS** with custom theme:
```javascript
// tailwind.config.ts
colors: {
  primary: '#6366f1',    // Indigo
  secondary: '#8b5cf6'   // Purple
}
```

Gradient backgrounds:
- Auth page: indigo → purple
- Home page: indigo → purple
- Component cards: glassmorphism effect (backdrop blur + border)

## Development

```bash
# Start dev server
npm run dev
# Runs on http://localhost:3001 with HMR

# Build for production
npm run build
# Output in dist/

# Preview production build locally
npm run preview

# Type checking
npm run type-check
npm run type-check:watch

# Linting
npm run lint
npm run format
```

## Environment Variables

Create `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## Testing (Future)

```bash
npm run test          # Vitest unit tests
npm run test:ui       # Vitest UI
npm run test:e2e      # Playwright E2E (requires npm run dev)
```

## Key Features Implemented (US-001 to US-006)

### ✅ Implemented
- User registration with password strength validation
- JWT-based authentication with auto-login persistence
- 5-step onboarding flow with multi-type selection
- Profile display with comprehensive statistics
- Mood selector with 8 contextual moods
- TMDB API integration for searches
- Responsive mobile-first design

### ⏳ Next (US-007+)
- Filter selectors (duration, year, type)
- Context summary panel
- LLM-powered recommendations
- Recommendation results page with explanation
- Movie/series streaming availability (JustWatch)

## Performance Notes

- React Query caching (future implementation)
- Lazy loading of pages via React Router
- TailwindCSS purging in production
- Optimized TMDB image loading
- JWT token refresh mechanism (future)

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_ENV=development
```

## Building

```bash
npm run build
# Output: dist/

npm run preview
# Serve locally: http://localhost:4173
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

**Implementado en ETAPA 1:** Autenticación básica (US-001)
