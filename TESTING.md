# 🚀 Guía de Testing Local - RecomiendaFilms MVP

## Requisitos Previos

- **Node.js 20+** ([Descargar](https://nodejs.org/))
- **npm 10+** (incluido con Node.js)
- **Git** (para clonar/actualizar el proyecto)

## Instalación Rápida (Primera Vez)

### 1️⃣ Setup Inicial

```bash
# Clonar/ir al proyecto
cd c:\Users\nahue\InteligenciaArtificialAplicada

# Instalar dependencias de todo (root + apps)
npm run install-all

# Esperar a que termine (puede tomar 2-3 minutos)
```

### 2️⃣ Configurar Backend

```bash
cd apps/api

# Crear archivo .env.local
cp .env.example .env.local

# Inicializar base de datos
npm run db:push

# Volver a raíz
cd ../..
```

### 3️⃣ Configurar Frontend

```bash
cd apps/web

# Crear archivo .env.local
cp .env.example .env.local

# Volver a raíz
cd ../..
```

## Ejecutar en Desarrollo

### Opción A: Ambos Servidores Simultáneamente (Recomendado)

```bash
npm run dev
```

Esto inicia:
- **Backend** en http://localhost:3000 ✅
- **Frontend** en http://localhost:3001 ✅

Espera a ver:
```
✓ api is running on http://localhost:3000
✓ web is running on http://localhost:3001
```

### Opción B: Servidores Separados (Terminal Multiple)

**Terminal 1 - Backend:**
```bash
cd apps/api && npm run dev
# Backend ready on port 3000
```

**Terminal 2 - Frontend:**
```bash
cd apps/web && npm run dev
# Frontend ready on port 3001
```

## Flujo de Prueba Completo (Manual)

### 🔐 1. Autenticación (US-001)

1. Abre http://localhost:3001 en tu navegador
2. Verás la página de **Login/Register**

**Registrarse (nuevo usuario):**
```
Email: test@example.com
Contraseña: SecurePass123
- 8+ caracteres ✓
- Mayúscula ✓
- Minúscula ✓
- Número ✓
```
3. Haz clic en "Registrarse"
4. Deberías ser redirigido automáticamente a `/onboarding`

**Login (si ya te registraste):**
```
Email: test@example.com
Contraseña: SecurePass123
```
5. Haz clic en "Iniciar sesión"
6. Ir a Dashboard

### 🎯 2. Onboarding (US-002 a US-005)

#### Paso 1: Seleccionar Géneros
- Elige **al menos 3 géneros** de películas o series
- El botón "Siguiente" está deshabilitado hasta seleccionar 3+
- Haz clic en "Siguiente" → Paso 2

#### Paso 2: Seleccionar Directores
- Escribe un nombre en la caja (ej: "Steven Spielberg")
- Verás resultados de TMDB con sugerencias
- Haz clic en un director para agregarlo (opcional)
- Máximo 15 directores
- Haz clic en "Siguiente" → Paso 3

#### Paso 3: Seleccionar Actores
- Mismo proceso que directores
- Busca actores (ej: "Tom Hanks")
- Agregalos a tu lista (opcional, máximo 15)
- Haz clic en "Siguiente" → Paso 4

#### Paso 4: Calificar Películas
- Escribe un título de película (ej: "Inception")
- Verás carátulas de TMDB
- Haz clic en 👍 (me gustó, rating 5) o 👎 (no me gustó, rating 1)
- Puedes calificar 0 o más películas
- Haz clic en "Siguiente" → Paso 5

#### Paso 5: Resumen del Perfil
- Ves un resumen: X géneros, Y directores, Z actores, W películas
- Botón "Comenzar" completa el onboarding
- Redirigido a `/home` (Dashboard)

### 📊 3. Ver Perfil (US-005)

1. En el Dashboard, haz clic en **"Mi Perfil"**
2. Deberías ver:
   - ✉️ Tu email
   - 📅 Fecha de registro
   - 📊 6 tarjetas de estadísticas (géneros, directores, actores, películas vistas, me gustó, no me gustó)
   - 🏷️ Tags con tus preferencias
   - 🎬 Últimas 5 películas que calificaste
   - 🔘 Botones "Volver" y "Editar perfil"

### 😎 4. Selector de Estado de Ánimo (US-006) ← NUEVO

1. En el Dashboard, haz clic en **"Obtener Recomendación"**
2. Deberías ver:
   - 🎯 Título: "¿Cuál es tu estado de ánimo hoy?"
   - 8️⃣ Botones de estados: Misterio 🕵️, Desconectar 😎, Llorar 😭, Reír 😂, Acción 💥, Amor 💕, Terror 👻, Inspiración ✨
   - Selecciona uno (se marca con borde púrpura y fondo)
   - Panel verde confirma tu selección
   - Botón "Obtener Recomendación" se activa
3. Haz clic en el botón (mostrado: "Próximamente - US-009" en alerta)
4. (US-009+ implementará las recomendaciones reales)

## Pruebas Rápidas (API Manual)

Si prefieres probar los endpoints directamente:

### Registrarse
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "cuid-...",
    "email": "test@example.com",
    "token": "eyJhbGc..."
  }
}
```

### Obtener Perfil Completo
```bash
curl -X GET http://localhost:3000/api/v1/profile \
  -H "Authorization: Bearer <token-aqui>"
```

### Obtener Moods
```bash
curl -X GET http://localhost:3000/api/v1/moods
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "mystery",
      "label": "Misterio",
      "emoji": "🕵️",
      "description": "Quiero intriga y suspense"
    },
    ...
  ]
}
```

## Solución de Problemas

### ❌ Error: "Cannot find module 'express'"
```bash
# Solución
cd apps/api && npm install
npm run dev
```

### ❌ Error: "Port 3000 already in use"
```bash
# Cambiar puerto en .env.local
PORT=3001

# O matar el proceso
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### ❌ Database error "SQLITE_CANTOPEN"
```bash
# Reinicializar BD
cd apps/api
rm dev.db  # Eliminar BD actual
npm run db:push  # Crear nueva
```

### ❌ Frontend muestra "Cannot connect to API"
- Verifica que backend está corriendo en http://localhost:3000
- Revisa que `.env.local` en frontend tiene: `VITE_API_BASE_URL=http://localhost:3000/api/v1`
- Abre DevTools (F12) → Network para ver qué URLs se están llamando

### ❌ Contraseña rechazada en registro
- Requiere: 8+ caracteres, MAYÚSCULA, minúscula, número
- Ej válida: `SecurePass123`
- Ej inválida: `password` (no número, no mayúscula)

## Logs Útiles

### Ver logs del backend
```bash
cd apps/api
npm run dev  # Ver output en terminal

# O revisar archivo (si está configurado)
tail -f logs/app.log
```

### Ver logs del frontend
```bash
# DevTools del navegador
F12 → Console → Busca "INFO", "ERROR", "WARN"
```

## Línea de Progreso Actual

```
✅ US-001: Autenticación (5 SP)
✅ US-002: Géneros (3 SP)
✅ US-003: Directores/Actores (5 SP)
✅ US-004: Películas vistas (5 SP)
✅ US-005: Perfil completo (3 SP)
🔄 US-006: Estado de ánimo (3 SP) ← AHORA
⏳ US-007-008: Filtros + Contexto (7 SP)
⏳ US-009-012: LLM + Validación (21 SP)
⏳ US-017-018: Orchestración (11 SP)
⏳ US-022: Testing E2E (5 SP)

TOTAL: 26/65 SP completados (40%)
```

## Siguientes Pasos

### Próxima User Story (US-007)
- Agregar filtros: duración (min-max), tipo (película/serie), año
- Nueva pantalla RecommendationFilters.tsx
- State management para filtros temporales

### Después (US-009 - Crítica)
- Integración con OpenAI API
- Prompt engineering para recomendaciones personalizadas
- Validación contra TMDB para evitar alucinaciones

## Contacto & Soporte

- **Issues locales:** Revisar logs en terminal
- **Documentación:** Ver `AGENTS.md` y `EPICAS_Y_USER_STORIES.md`
- **Backend API:** Ver `apps/api/README.md`
- **Frontend:** Ver `apps/web/README.md`

---

**Última actualización:** 16 de mayo, 2026  
**Versión:** MVP 1.0 (Sprint 1-2)  
**Status:** Abierto para pruebas locales ✅
