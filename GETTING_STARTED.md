# Guía de Inicio Rápido — RecomiendaFilms

## IMPORTANTE: Lee Esto Primero

Este proyecto tiene **2 servidores** que deben estar ejecutándose simultáneamente:
- **Backend API** (puerto 3000)
- **Frontend Web** (puerto 3001)

Si solo abrís `localhost:3001` sin ejecutar `npm run dev`, **no va a funcionar**.

---

## Pre-Requisitos

### Node.js 20+
```bash
node --version
# Debe mostrar: v20.x.x o mayor
```
Si no lo tenés, descargalo de: https://nodejs.org/ (seleccioná LTS)

### npm 10+
```bash
npm --version
# Debe mostrar: 10.x.x o mayor
```

---

## Instalación (Una sola vez)

### Paso 1: Abrí PowerShell en la carpeta del proyecto

```
Carpeta: c:\Users\nahue\InteligenciaArtificialAplicada
```

### Paso 2: Instalá todas las dependencias

```bash
npm run install-all
```

Esto descarga todos los paquetes del monorepo. Tarda 2-5 minutos.

### Paso 3: Configurá el backend

```bash
cd apps/api
cp .env.example .env.local
```

Editá `.env.local` y completá las variables:

```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3001

DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

JWT_SECRET=una-clave-secreta-de-al-menos-32-caracteres
JWT_EXPIRY=7d

GEMINI_API_KEY=...    # aistudio.google.com/app/apikey (gratis)
TMDB_API_KEY=...      # themoviedb.org/settings/api (gratis)

LLM_TIMEOUT_MS=30000
TMDB_TIMEOUT_MS=5000
RECOMMENDATION_MAX_RETRIES=3
```

> Las variables de Cloudinary (avatar de perfil) solo son necesarias si querés probar la subida de fotos. Se configuran en Render para producción.

### Paso 4: Aplicá las migraciones de base de datos

```bash
npx prisma migrate deploy
cd ../..
```

### Paso 5: Configurá el frontend

```bash
cd apps/web
cp .env.example .env.local
# .env.local contiene:
# VITE_API_BASE_URL=http://localhost:3000/api/v1
cd ../..
```

---

## Ejecutar el Proyecto

```bash
npm run dev
```

Inicia backend (puerto 3000) y frontend (puerto 3001) en la misma terminal.

```
Backend: http://localhost:3000
Frontend: http://localhost:3001
```

Para detener: `Ctrl + C`

### Alternativa: dos terminales separadas

**Terminal 1 — Backend:**
```bash
cd apps/api
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd apps/web
npm run dev
```

---

## Flujo Completo de Uso

### 1. Autenticación

1. Abrí http://localhost:3001
2. **Registrarse:** email + contraseña (mín. 8 chars, 1 mayúscula, 1 número)  
   - El campo contraseña tiene el botón del ojito para mostrar/ocultar
3. Al registrarse → redirige a `/onboarding`
4. **Iniciar sesión:** con las mismas credenciales → redirige a `/home`

### 2. Onboarding (5 pasos)

| Paso | Qué hace |
|------|----------|
| 1 — Géneros | Elegir al menos 3 géneros |
| 2 — Directores | Buscar en TMDB, agregar favoritos |
| 3 — Actores | Buscar en TMDB, agregar favoritos |
| 4 — Películas vistas | Buscar y calificar con 👍/👎 |
| 5 — Resumen | Confirmar → redirige a `/home` |

### 3. Dashboard (`/home`)

Desde el Dashboard accedés a:

| Card | Ruta | Descripción |
|------|------|-------------|
| Mis Preferencias | `/onboarding` | Editar géneros, directores, actores |
| Ver Mi Perfil | `/profile` | Tu perfil completo |
| Obtener Recomendación | `/recommendation` | Motor IA |
| Historial | `/history` | Tus recomendaciones previas |
| Reseñas | `/reviews` | Escribir y leer reseñas |
| Buscar usuarios | `/users/search` | Encontrar y seguir otros usuarios |
| Mis Listas | `/lists` | Crear y gestionar listas de películas |

### 4. Recomendación IA

1. Seleccioná un estado de ánimo (8 opciones)
2. Configurá filtros opcionales: tipo, duración, año
3. Click "Obtener Recomendación"
4. Ves: póster, título, sinopsis, año, género, plataformas de streaming, explicación personalizada
5. Marcá como 👍/👎 → se guarda en historial
6. "Nueva recomendación" para volver a pedir

### 5. Perfil Propio (`/profile`)

- **Foto de perfil:** click en el círculo o en 📷 → sube a Cloudinary
- **Información personal:** nombre, fecha de nacimiento, país, idioma
- **Estadísticas:** géneros, directores, actores, películas vistas, gustadas, no gustadas
- **Seguidores/Seguidos:** click en las tarjetas → modal con lista y enlaces a perfiles
- **Películas Recientes:** últimas 10 entradas combinando películas calificadas y reseñas con 👍/👎

### 6. Reseñas (`/reviews`)

1. Buscá una película o serie
2. Seleccioná el título
3. Click "Dejar una reseña":
   - Elegí **👍 Me gustó** o **👎 No me gustó** (obligatorio)
   - Puntaje 1-5 estrellas (obligatorio)
   - Texto (mín. 1 char, máx. 2000)
4. La reseña aparece con el badge 👍/👎 y las estrellas
5. Cada reseña tiene botones **👍/👎** para que otros reaccionen
6. Click en el nombre/avatar del autor → perfil público
7. Solo podés tener una reseña por película/serie (editable)

### 7. Buscar Usuarios (`/users/search`)

1. Escribí nombre o email en el buscador
2. Los resultados muestran avatar, nombre y email
3. Click en un usuario → su perfil público

### 8. Perfil Público (`/users/:userId`)

- Avatar, nombre, fecha de membresía
- Botón Seguir / Dejar de seguir (optimistic update)
- Contadores de seguidores y seguidos
- Estadísticas, géneros favoritos
- Listas públicas del usuario
- Reseñas con 👍/👎 badge, estrellas y botones de reacción

### 9. Mis Listas (`/lists`)

1. Click "Nueva lista" → nombre, descripción, pública/privada
2. Click en una lista → detalle
3. **Como dueño:** buscá títulos para agregar, botón ✕ para quitar, editar/eliminar
4. **Vista pública (otro usuario):** solo lectura

---

## Verificar el Backend

```bash
# Health check
curl http://localhost:3000/health

# Obtener moods (sin auth)
curl http://localhost:3000/api/v1/moods
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
| `ERR_CONNECTION_REFUSED` | Backend no está corriendo — ejecutar `npm run dev` |

---

**Última actualización:** 18 de mayo de 2026
