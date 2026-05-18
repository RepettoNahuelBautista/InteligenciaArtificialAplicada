# Guía de Testing Local — RecomiendaFilms

## Requisitos Previos

- **Node.js 20+** ([Descargar](https://nodejs.org/))
- **npm 10+** (incluido con Node.js)
- **Git**

## Instalación Rápida (Primera Vez)

```bash
cd c:\Users\nahue\InteligenciaArtificialAplicada

# Instalar dependencias de todo (root + apps)
npm run install-all
```

## Configurar Backend

```bash
cd apps/api
cp .env.example .env.local
# Completar DATABASE_URL, JWT_SECRET, GEMINI_API_KEY, TMDB_API_KEY, etc.

# Aplicar migraciones
npx prisma migrate deploy

cd ../..
```

## Configurar Frontend

```bash
cd apps/web
cp .env.example .env.local
# VITE_API_BASE_URL=http://localhost:3000/api/v1
cd ../..
```

## Ejecutar en Desarrollo

```bash
# Ambos servidores simultáneos (recomendado)
npm run dev
# Backend → http://localhost:3000
# Frontend → http://localhost:3001
```

---

## Flujo de Prueba Completo (Manual)

### 1. Autenticación

1. Abrir http://localhost:3001
2. **Registrarse:** email + contraseña (mín. 8 chars, 1 mayúscula, 1 número)
   - El campo contraseña tiene icono de ojito para mostrar/ocultar
3. Al registrarse → redirige a `/onboarding`
4. **Iniciar sesión:** con las mismas credenciales → redirige a `/home`

---

### 2. Onboarding

| Paso | Qué hace |
|------|----------|
| 1 — Géneros | Elegir al menos 3 géneros (películas o series) |
| 2 — Directores | Buscar en TMDB, agregar favoritos (máx. 15) |
| 3 — Actores | Buscar en TMDB, agregar favoritos (máx. 15) |
| 4 — Películas vistas | Buscar y calificar con 👍/👎 |
| 5 — Resumen | Confirmar y crear perfil → redirige a `/home` |

---

### 3. Home

Desde el Dashboard podés acceder a:

| Card | Ruta | Descripción |
|------|------|-------------|
| Mis Preferencias | `/onboarding` | Editar géneros, directores, actores |
| Ver Mi Perfil | `/profile` | Tu perfil completo con estadísticas |
| Obtener Recomendación | `/recommendation` | Motor IA |
| Historial | `/history` | Tus recomendaciones previas |
| Reseñas | `/reviews` | Escribir y leer reseñas de películas/series |
| Buscar usuarios | `/users/search` | Encontrar y seguir otros usuarios |
| Mis Listas | `/lists` | Crear y gestionar listas de películas |

---

### 4. Recomendación IA

1. Seleccionar un estado de ánimo (8 opciones)
2. Configurar filtros opcionales: tipo, duración, año
3. Click "Obtener Recomendación"
4. Ver: póster, título, sinopsis, año, género, plataformas de streaming, explicación personalizada
5. Marcar como 👍/👎 → se guarda en historial
6. Botón "Nueva recomendación" para volver a pedir

---

### 5. Perfil Propio (`/profile`)

- **Foto de perfil:** click en el círculo o en 📷 → sube a Cloudinary
- **Información personal:** nombre, fecha de nacimiento, país, idioma
- **Estadísticas:** géneros, directores, actores, películas vistas, gustadas, no gustadas
- **Seguidores/Seguidos:** click en las tarjetas → modal con lista y enlaces a perfiles
- **Películas Recientes:** últimas 10 entradas combinando películas calificadas **y** reseñas con 👍/👎
- **Preferencias:** géneros, directores y actores favoritos

---

### 6. Reseñas (`/reviews`)

1. Buscar una película o serie (TMDB)
2. Seleccionar el título
3. Click "Dejar una reseña":
   - Elegir **👍 Me gustó** o **👎 No me gustó** (obligatorio)
   - Puntaje 1-5 estrellas (obligatorio)
   - Texto (mín. 1 char, máx. 2000)
4. La reseña aparece en la lista con el badge 👍/👎 y las estrellas
5. Cada reseña tiene botones **👍/👎** para que otros usuarios reaccionen (like/dislike de la reseña)
6. Click en el nombre/avatar del autor → perfil público del usuario
7. Sólo se puede tener una reseña por película/serie (editable)

---

### 7. Buscar Usuarios (`/users/search`)

1. Escribir nombre o email en el buscador (debounce 350ms)
2. Los resultados muestran avatar, nombre y email
3. Click en un usuario → su perfil público

---

### 8. Perfil Público (`/users/:userId`)

- **Avatar, nombre, fecha de membresía**
- **Botón Seguir / Dejar de seguir** (optimistic update)
- **Contadores de seguidores y seguidos**
- **Estadísticas** del usuario
- **Géneros favoritos**
- **Listas públicas** del usuario (click para ver detalle)
- **Reseñas** del usuario con 👍/👎 badge, estrellas, texto y botones de reacción
- Botón ← Volver respeta el origen (reseñas, búsqueda de usuarios, historial)

---

### 9. Mis Listas (`/lists`)

1. Click "Nueva lista" → formulario: nombre, descripción, pública/privada
2. La lista aparece con nombre, estado y conteo de títulos
3. Click en una lista → detalle

#### Detalle de lista (`/lists/:listId`)

- **Si sos el dueño:**
  - Buscador de películas/series para agregar
  - Botón ✕ para quitar cada título
  - Botón "Editar" → formulario inline
  - Botón "Eliminar" → confirm dialog
- **Si no sos el dueño (lista pública):** solo lectura

---

## Pruebas de API Rápidas

```bash
# Registrarse
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"SecurePass123"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"SecurePass123"}'

# Perfil (con token)
curl http://localhost:3000/api/v1/profile \
  -H "Authorization: Bearer <token>"

# Reseñas de una película
curl "http://localhost:3000/api/v1/reviews?tmdbId=27205" \
  -H "Authorization: Bearer <token>"
```

---

## Solución de Problemas

| Error | Solución |
|-------|----------|
| `Cannot find module 'express'` | `cd apps/api && npm install` |
| `Port 3000 already in use` | `netstat -ano \| findstr :3000` → `taskkill /PID X /F` |
| `Prisma migration error` | `cd apps/api && npx prisma migrate deploy` |
| Frontend sin conexión a API | Verificar que `VITE_API_BASE_URL` apunte al backend correcto |
| Contraseña rechazada | Requiere: 8+ chars, mayúscula, número |
| Avatar no sube | Verificar variables `CLOUDINARY_*` en backend |

---

## Estado de Implementación

```
NÚCLEO MVP
✅ US-001  Autenticación JWT (register/login)         5 SP
✅ US-002  Onboarding géneros                          3 SP
✅ US-003  Onboarding directores/actores               5 SP
✅ US-004  Onboarding películas vistas (like/dislike)  5 SP
✅ US-005  Perfil completo con estadísticas            3 SP
✅ US-006  Selector de estado de ánimo (8 moods)      3 SP
✅ US-007  Filtros: tipo / duración / año              5 SP
✅ US-008  Resumen de contexto antes de recomendar     2 SP
✅ US-009  Integración LLM (Gemini 2.5 Flash)         8 SP
✅ US-010  Prompt engineering personalizado           5 SP
✅ US-011  Explicación justificada                    3 SP
✅ US-012  Anti-alucinaciones + reintentos TMDB       5 SP
✅ US-013  Enriquecimiento TMDB (póster, sinopsis)    5 SP
✅ US-014  Plataformas streaming (TMDB Watch Prov.)   5 SP
✅ US-015  Tarjeta de recomendación completa          3 SP
✅ US-019  Historial de recomendaciones               3 SP
✅ US-024  Deployment (Render + Vercel)               5 SP

FEATURES SOCIALES (Post-MVP)
✅ Perfil personal ampliado (nombre, foto, fecha, país)
✅ Foto de perfil (Cloudinary, redonda, en perfil y reseñas)
✅ Seguir / dejar de seguir usuarios
✅ Búsqueda de usuarios por nombre/email
✅ Seguidores y seguidos (modal con lista y enlaces)
✅ Perfil público de usuario (stats, géneros, listas, reseñas)
✅ Reseñas: crear / editar (1 por usuario por título)
✅ Reseñas: campo liked (👍/👎 obligatorio)
✅ Reseñas: reacciones de otros usuarios (like/dislike)
✅ Listas de películas (públicas/privadas, CRUD completo)
✅ Listas visibles en perfil público
✅ Películas Recientes fusiona WatchedMovies + reseñas con liked

PENDIENTE
⏳ US-016  Caché TMDB en BD (evitar repetir llamadas)  5 SP
⏳ US-022  Integration tests E2E                       5 SP
⏳ US-023  Validación criterios de éxito MVP           5 SP
```

**Total completado:** ~120 SP estimados  
**Última actualización:** 18 de mayo, 2026  
**URLs de producción:**
- Frontend: https://inteligencia-artificial-aplicada-we.vercel.app
- Backend: https://inteligenciaartificialaplicada.onrender.com
