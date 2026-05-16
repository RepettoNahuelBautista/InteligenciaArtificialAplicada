# Frontend Web - React + Vite + TypeScript

## Setup

```bash
cd apps/web
npm install
cp .env.example .env.local
npm run dev
```

## Project Structure

```
apps/web/
├── src/
│   ├── pages/              # Full page components
│   │   ├── AuthPage.tsx   # Login/Register
│   │   └── HomePage.tsx   # Home dashboard
│   ├── components/        # Reusable components
│   │   └── Auth/
│   │       ├── LoginForm.tsx
│   │       └── RegisterForm.tsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.tsx      # Auth context hook
│   │   └── useAuthForm.ts   # Form logic
│   ├── api/              # API clients
│   │   └── apiClient.ts  # Axios setup
│   ├── styles/           # Global CSS
│   │   └── globals.css
│   ├── App.tsx          # Main router
│   └── main.tsx         # React DOM entry
├── index.html           # HTML template
├── vite.config.ts       # Vite config
└── tailwind.config.ts   # TailwindCSS config
```

## Pages & Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | AuthPage | Login/Register |
| `/home` | HomePage | Dashboard |
| `/onboarding` | (Coming Soon) | Profile setup |

## Components

### AuthPage
- Toggles between login and register forms
- Responsive design with gradient background

### LoginForm (US-001)
- Email + password validation
- Error handling
- Loading states

### RegisterForm (US-001)
- Email + password with requirements
- Password strength validation (8 char min, uppercase, lowercase, number)
- Error handling

## Hooks

### useAuth()
Global auth context hook for accessing:
- `user`: Current user info
- `token`: JWT token
- `setUser()`, `setToken()`: Update auth state
- `logout()`: Clear auth

### useAuthForm()
Form logic hook for login/register:
- `email`, `setEmail`: Email state
- `password`, `setPassword`: Password state
- `error`: Error message
- `isLoading`: Loading state
- `handleLogin()`, `handleRegister()`: Form handlers

## API Client

Axios instance with:
- Base URL from `VITE_API_BASE_URL`
- Auto JWT token injection in headers
- Auto logout on 401 responses

## Styling

Using TailwindCSS with custom colors:
- Primary: #6366f1 (Indigo)
- Secondary: #8b5cf6 (Purple)

## Development

```bash
# Start dev server (auto-opens browser)
npm run dev

# Build for production
npm run build

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
