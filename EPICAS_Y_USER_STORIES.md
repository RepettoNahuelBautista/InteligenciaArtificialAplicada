# RecomiendaFilms — Épicas y User Stories

---

## ÉPICAS

| ID | Épica | Estado |
|----|-------|--------|
| EP-001 | Autenticación y Gestión de Perfil | ✅ Completada |
| EP-002 | Captura de Contexto y Preferencias | ✅ Completada |
| EP-003 | Motor de Recomendación basado en IA | ✅ Completada |
| EP-004 | Integración de Catálogo y Streaming | ✅ Completada |
| EP-005 | Backend, Caché y Validación | ✅ Parcial (caché pendiente) |
| EP-006 | Testing, Validación y Deployment | ✅ Parcial (tests E2E pendientes) |
| EP-007 | Features Sociales | ✅ Completada (Post-MVP) |

---

## ÉPICA 1 — Autenticación y Gestión de Perfil (EP-001) ✅

### US-001: Autenticación básica ✅
**Como** usuario nuevo, **quiero** registrarme e iniciar sesión, **para** acceder a mi perfil personalizado.

**Implementado:** JWT (register/login/me). Validación Zod. Contraseña con ojito show/hide. Hash bcrypt.

---

### US-002: Onboarding — Géneros ✅
**Como** usuario nuevo, **quiero** seleccionar mis géneros favoritos, **para** personalizar recomendaciones.

**Implementado:** Lista de géneros TMDB, mínimo 3, persistencia en DB.

---

### US-003: Onboarding — Directores y actores ✅
**Como** usuario nuevo, **quiero** agregar directores/actores favoritos, **para** enriquecer mi perfil.

**Implementado:** Búsqueda en TMDB con debounce, máx. 15 por categoría.

---

### US-004: Onboarding — Películas vistas ✅
**Como** usuario nuevo, **quiero** calificar películas con 👍/👎, **para** que el sistema entienda mis gustos.

**Implementado:** Buscar en TMDB, rating 5 (like) o 1 (dislike), tabla `watched_movies`.

---

### US-005: Perfil completo ✅
**Como** usuario, **quiero** ver mi perfil con estadísticas, **para** entender mis preferencias.

**Implementado:** ProfilePage con 6 tarjetas de stats, géneros/directores/actores, películas recientes. Edición de nombre, fecha de nacimiento, país, idioma. Foto de perfil (Cloudinary). Seguidores/seguidos. Películas recientes fusiona WatchedMovies y reseñas con liked.

---

## ÉPICA 2 — Captura de Contexto y Preferencias (EP-002) ✅

### US-006: Estado de ánimo ✅
8 moods: Misterio, Desconectar, Llorar, Reír, Acción, Amor, Terror, Inspiración.

### US-007: Filtros ✅
Tipo (película/serie), duración (min/max), año mínimo. Pills togglables.

### US-008: Resumen de contexto ✅
Resumen visible antes de pedir recomendación.

---

## ÉPICA 3 — Motor de Recomendación basado en IA (EP-003) ✅

### US-009: Integración LLM ✅
Gemini 2.5 Flash (`@google/generative-ai`). Prompt en español argentino. Timeout configurable (`LLM_TIMEOUT_MS`).

### US-010: Prompt engineering ✅
Incluye géneros, directores, actores, películas calificadas del perfil + mood + filtros de sesión. Instrucciones anti-alucinación explícitas.

### US-011: Explicación justificada ✅
Campo `explanation` con razones personalizadas ("por tu amor a X director...").

### US-012: Anti-alucinaciones ✅
Hasta 3 reintentos. Validación contra TMDB. Funciona sin TMDB key (sin póster/sinopsis).

---

## ÉPICA 4 — Integración de Catálogo y Streaming (EP-004) ✅

### US-013: Enriquecimiento TMDB ✅
Póster, sinopsis, año, calificación, duración.

### US-014: Plataformas de streaming ✅
TMDB Watch Providers API (reemplaza JustWatch). Íconos y nombres por región.

### US-015: Tarjeta de recomendación completa ✅
Póster, título, año, sinopsis, género, plataformas, explicación IA. Botones 👍/👎 para guardar en historial.

### US-019: Historial de recomendaciones ✅
`HistoryPage` con últimas recomendaciones. Muestra plataformas y badges de calificación.

---

## ÉPICA 5 — Backend, Caché y Validación (EP-005)

### US-016: Caché de metadatos TMDB ⏳
Guardar en DB metadatos de TMDB para reducir llamadas API. Pendiente.

### US-017: Validación JSON del LLM ✅
Zod schemas para respuestas Gemini. Strip de code blocks markdown. Fallback de genre.

### US-018: Orquestación flujo completo ✅
Perfil → Gemini → TMDB → persistir recomendación. Manejo de errores y reintentos.

---

## ÉPICA 6 — Testing, Validación y Deployment (EP-006)

### US-022: Integration tests E2E ⏳
Tests con Vitest. Pendiente de implementar.

### US-023: Validación de criterios de éxito ⏳
Beta testing formal. Métricas de latencia y calidad de sugerencias. Pendiente.

### US-024: Deployment a producción ✅
- **Frontend:** Vercel — https://inteligencia-artificial-aplicada-we.vercel.app
- **Backend:** Render — https://inteligenciaartificialaplicada.onrender.com
- **DB:** Azure PostgreSQL
- CI/CD automático desde rama `main`

---

## ÉPICA 7 — Features Sociales (EP-007) ✅ Post-MVP

### US-025: Seguir / dejar de seguir usuarios ✅
**Como** usuario, **quiero** seguir a otros usuarios, **para** estar al tanto de sus opiniones.

Modelo `Follow`. Botón en perfil público con optimistic update. Contadores de seguidores/seguidos.

---

### US-026: Búsqueda de usuarios ✅
**Como** usuario, **quiero** buscar por nombre o email, **para** encontrar personas conocidas.

`UserSearchPage` con debounce 350ms, avatar, nombre, email. Ruta `/users/search`.

---

### US-027: Perfil público de usuario ✅
**Como** usuario, **quiero** ver el perfil de otro usuario, **para** conocer sus gustos y reseñas.

`PublicProfilePage` muestra: avatar, stats, géneros favoritos, listas públicas, reseñas con reacciones. Botón seguir/dejar de seguir. Navegación ← inteligente (vuelve al origen: reseñas, búsqueda, etc.).

---

### US-028: Foto de perfil ✅
**Como** usuario, **quiero** subir una foto de perfil, **para** que otros me reconozcan.

Cloudinary. multer memory storage. Círculo en perfil propio, reseñas y búsqueda de usuarios.

---

### US-029: Reseñas de películas y series ✅
**Como** usuario, **quiero** escribir reseñas de lo que vi, **para** compartir mi opinión.

Una reseña por usuario por título (upsert). Campos: `liked` (👍/👎, obligatorio), rating (1-5 estrellas), texto (máx. 2000 chars). Editables. Aparecen en perfil público del autor.

---

### US-030: Reacciones a reseñas ✅
**Como** usuario, **quiero** darle like o dislike a las reseñas de otros, **para** expresar acuerdo o desacuerdo.

Modelo `ReviewLike`. Botones 👍/👎 con contadores. Optimistic update. Toggle (click en activo lo quita).

---

### US-031: Listas de películas ✅
**Como** usuario, **quiero** crear listas de películas/series, **para** organizar y compartir mis colecciones.

Modelos `MovieList` + `MovieListItem`. CRUD completo. Listas públicas/privadas. Añadir por búsqueda TMDB. Ver listas de otros en su perfil público.

---

## MODELO DE DATOS (estado actual)

```
User
  ├── UserProfile (displayName, birthDate, country, language, avatarUrl)
  ├── WatchedMovie[] (tmdbId, title, rating 1|5)
  ├── Recommendation[]
  ├── Review[] (tmdbId, title, rating 1-5, liked bool, text)
  │     └── ReviewLike[] (userId, value 1|-1)
  ├── MovieList[]
  │     └── MovieListItem[] (tmdbId, title, posterPath, contentType)
  ├── Follow[] "UserFollowing"
  └── Follow[] "UserFollowers"
```

---

## ENDPOINTS API (completo)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Registro |
| POST | `/auth/login` | No | Login |
| GET | `/auth/me` | Sí | Usuario actual |
| GET | `/genres` | No | Lista géneros |
| POST | `/profile/genres` | Sí | Guarda géneros |
| GET | `/moods` | No | Lista moods |
| POST | `/recommendations` | Sí | Genera recomendación IA |
| GET | `/recommendations` | Sí | Historial de recomendaciones |
| GET | `/profile` | Sí | Perfil completo |
| PUT | `/profile/personal` | Sí | Editar info personal |
| POST | `/profile/avatar` | Sí | Subir foto de perfil |
| GET | `/profile/followers` | Sí | Mis seguidores |
| GET | `/profile/following` | Sí | A quienes sigo |
| GET | `/search/people` | No | Buscar actores/directores |
| POST | `/profile/people` | Sí | Guarda directores/actores |
| GET | `/profile/people` | Sí | Lista directores/actores |
| GET | `/search/movies` | No | Buscar películas/series |
| POST | `/profile/watched-movies` | Sí | Califica película |
| GET | `/profile/watched-movies` | Sí | Lista películas vistas |
| DELETE | `/profile/watched-movies/:id` | Sí | Elimina calificación |
| GET | `/reviews` | Sí | Reseñas de un título (`?tmdbId=`) |
| POST | `/reviews` | Sí | Crear/editar reseña |
| POST | `/reviews/:reviewId/like` | Sí | Reaccionar a reseña |
| DELETE | `/reviews/:reviewId/like` | Sí | Quitar reacción |
| GET | `/lists` | Sí | Mis listas |
| POST | `/lists` | Sí | Crear lista |
| GET | `/lists/:listId` | Sí | Detalle de lista |
| PUT | `/lists/:listId` | Sí | Editar lista |
| DELETE | `/lists/:listId` | Sí | Eliminar lista |
| POST | `/lists/:listId/items` | Sí | Agregar ítem a lista |
| DELETE | `/lists/:listId/items/:tmdbId` | Sí | Quitar ítem de lista |
| GET | `/users/search` | Sí | Buscar usuarios |
| GET | `/users/:userId/profile` | Sí | Perfil público |
| GET | `/users/:userId/reviews` | Sí | Reseñas de un usuario |
| GET | `/users/:userId/lists` | Sí | Listas públicas de usuario |
| POST | `/users/:userId/follow` | Sí | Seguir usuario |
| DELETE | `/users/:userId/follow` | Sí | Dejar de seguir |

---

## ROADMAP COMPLETADO

| Sprint | User Stories | Estado |
|--------|-------------|--------|
| 1 — Fundación | US-001, US-002, infra | ✅ |
| 2 — Perfilado | US-003, US-004, US-005 | ✅ |
| 3 — Contexto | US-006, US-007, US-008 | ✅ |
| 4 — Motor IA | US-009, US-010, US-011, US-017 | ✅ |
| 5 — Catálogo | US-013, US-014, US-015 | ✅ |
| 6 — Flujo completo | US-012, US-018, US-019 | ✅ |
| 7 — Deployment | US-024 | ✅ |
| 8 — Social | US-025 a US-031 | ✅ |

## PENDIENTE

| ID | Descripción | SP | Prioridad |
|----|------------|-----|----------|
| US-016 | Caché de metadatos TMDB en DB | 5 | Media |
| US-022 | Integration tests E2E (Vitest) | 5 | Crítica |
| US-023 | Validación criterios de éxito | 5 | Crítica |

---

**Última actualización:** 18 de mayo, 2026
