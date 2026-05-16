# 🎬 GUÍA DE INICIO RÁPIDO - RecomiendaFilms (Paso a Paso)

## ⚠️ IMPORTANTE: Lee Esto Primero

Este proyecto tiene **2 servidores** que DEBEN estar ejecutándose simultáneamente:
- **Backend API** (puerto 3000)
- **Frontend Web** (puerto 3001)

Si solo abres `localhost:3001` sin ejecutar `npm run dev`, **NO FUNCIONARÁ**.

---

## 📋 CHECKLIST PRE-REQUISITOS

Antes de comenzar, verifica que tengas instalado:

### ✅ Node.js 20+
```bash
node --version
# Debe mostrar: v20.x.x o mayor
```

Si NO lo tienes, descarga de: https://nodejs.org/ (selecciona LTS)

### ✅ npm 10+
```bash
npm --version
# Debe mostrar: 10.x.x o mayor
```

Si NO funciona, reinstala Node.js (npm viene incluido)

### ✅ Git (Opcional pero recomendado)
```bash
git --version
# Debe mostrar: git version x.x.x
```

---

## 🚀 INSTALACIÓN (Una sola vez)

### Paso 1: Abre PowerShell en la carpeta del proyecto

```
Carpeta: c:\Users\nahue\InteligenciaArtificialAplicada
```

**Cómo hacerlo:**
1. Abre el Explorador de Archivos
2. Ve a: `C:\Users\nahue\InteligenciaArtificialAplicada`
3. Haz clic derecho en el área vacía
4. Selecciona: **"Abrir en Terminal"** o **"Abrir PowerShell aquí"**

Si no ves esa opción:
```
Haz clic en "Archivo" → "Abrir Windows PowerShell" → "Abrir Windows PowerShell como administrador"
Copia: cd c:\Users\nahue\InteligenciaArtificialAplicada
Pega y presiona Enter
```

### Paso 2: Instalar todas las dependencias

```bash
npm run install-all
```

**Qué hará:**
- Descargará +500MB de paquetes
- Tardará 2-5 minutos
- Verás barras de progreso

**Esperado ver al final:**
```
✓ All dependencies installed successfully
```

Si hay errores, espera y repite el comando.

### Paso 3: Inicializar la base de datos

```bash
cd apps/api
npm run db:push
```

**Qué hará:**
- Crea base de datos SQLite local
- Crea tablas para usuarios, películas, etc.
- Tarda 10 segundos

**Esperado ver:**
```
✓ Generated Prisma Client
✓ Database push successful
```

### Paso 4: Volver a la carpeta raíz

```bash
cd ../..
```

**Verificación:**
```bash
# Deberías estar en c:\Users\nahue\InteligenciaArtificialAplicada
# Comprueba con:
pwd  # PowerShell: Get-Location
# Debe mostrar: c:\Users\nahue\InteligenciaArtificialAplicada
```

---

## ▶️ EJECUTAR EL PROYECTO (Cada vez que quieras usar)

### Opción A: Automático (Recomendado) ⭐

Desde la carpeta raíz:

```bash
npm run dev
```

**Qué hará:**
1. Inicia Backend en puerto 3000
2. Inicia Frontend en puerto 3001
3. Ambos en la MISMA terminal

**Esperado ver (después de 15 segundos):**
```
✓ api is running on http://localhost:3000
✓ web is running on http://localhost:3001
```

⏸️ **Para detener:** Presiona `Ctrl + C`

---

### Opción B: Manual (2 terminales separadas)

Si el método automático falla:

**Terminal 1 - Backend:**
```bash
cd apps/api
npm run dev
```

Espera a ver:
```
Server running on port 3000
```

**Terminal 2 - Frontend (nueva terminal PowerShell):**
```bash
cd apps/web
npm run dev
```

Espera a ver:
```
Local: http://localhost:3001
```

---

## 🌐 ACCEDER A LA APLICACIÓN

### En tu navegador (después de ver "running on")

1. **Opción A: Haz clic aquí** (automático)
   - El navegador debería abrirse automáticamente en http://localhost:3001

2. **Opción B: Manual**
   - Copia esta URL en la barra del navegador:
   ```
   http://localhost:3001
   ```
   - Presiona Enter

### ✅ Debería ver: Página de Login/Register con fondos degradados

Si ves un error:
- Verifica que `npm run dev` está ejecutándose
- Espera 30 segundos más (a veces tarda)
- Recarga la página (F5)

---

## 👤 PRUEBA 1: REGISTRARSE

1. En la página de login, verás dos opciones: **Iniciar sesión** | **Registrarse**
2. Haz clic en **Registrarse**
3. Completa el formulario:
   ```
   Email:      test@example.com
   Contraseña: SecurePass123
   ```
4. Haz clic en **"Registrarse"**
5. **Espera 3 segundos** - Serás redirigido automáticamente al Onboarding

✅ **Si funciona:** Verás la página "Onboarding - Paso 1 de 5"

❌ **Si NO funciona:**
- Abre DevTools: `F12` → Pestaña **Network**
- Busca si hay errores en rojo
- Comparte el error en la consola

---

## 🎯 PRUEBA 2: ONBOARDING (5 PASOS)

### Paso 1: Seleccionar Géneros (3+ requeridos)

1. Verás botones de géneros: Acción, Aventura, Drama, etc.
2. Haz clic en **al menos 3 géneros** (cambian a color púrpura)
3. Haz clic en **"Siguiente"**

✅ **Si funciona:** Vas al Paso 2

### Paso 2: Seleccionar Directores (Opcional)

1. Verás campo de texto: "Busca un director..."
2. Escribe: **"Steven Spielberg"** (sin comillas)
3. Espera 1-2 segundos (busca en TMDB)
4. Haz clic en su nombre en el dropdown
5. Se agrega como chip (puedes agregar hasta 15)
6. Haz clic en **"Siguiente"** (sin agregar nada también funciona)

✅ **Si funciona:** Vas al Paso 3

### Paso 3: Seleccionar Actores (Opcional)

1. Mismo proceso que directores
2. Escribe: **"Tom Hanks"**
3. Haz clic en su nombre
4. Haz clic en **"Siguiente"**

✅ **Si funciona:** Vas al Paso 4

### Paso 4: Calificar Películas (Opcional)

1. Verás campo: "Busca una película..."
2. Escribe: **"Inception"**
3. Espera 1-2 segundos (busca en TMDB)
4. Haz clic en la película
5. Verás la carátula y dos botones: **👍 (me gustó)** | **👎 (no me gustó)**
6. Haz clic en uno de ellos
7. Haz clic en **"Siguiente"**

✅ **Si funciona:** Vas al Paso 5

### Paso 5: Resumen

1. Verás un resumen: "Completaste el onboarding con X géneros, Y directores, Z actores"
2. Haz clic en **"Comenzar"**
3. Serás redirigido al Dashboard

✅ **Si funciona:** Ves la página de inicio con 4 tarjetas

---

## 🏠 PRUEBA 3: DASHBOARD

Deberías ver 4 tarjetas:

1. **Completar Perfil** (Onboarding) - Click para repetir
2. **Ver Mi Perfil** - Click para ver estadísticas
3. **Obtener Recomendación** ← **NUEVA (US-006)** - Click para selector de mood
4. **Historial** (Próximamente)

---

## 📊 PRUEBA 4: VER PERFIL

1. Haz clic en **"Mi Perfil"** (tarjeta azul)
2. Deberías ver:
   - Tu email en la parte superior
   - **6 tarjetas de estadísticas** (géneros, directores, actores, películas vistas, me gustó, no me gustó)
   - **Tags** con tus preferencias
   - **Últimas 5 películas** que calificaste
3. Haz clic en **"Volver al inicio"** para regresar

✅ **Si funciona:** Todo está configurado correctamente

---

## 😎 PRUEBA 5: SELECTOR DE ESTADO DE ÁNIMO (US-006)

1. En el Dashboard, haz clic en **"Obtener Recomendación"**
2. Deberías ver una página con el título: **"¿Cuál es tu estado de ánimo hoy?"**
3. Verás **8 botones** con emojis:
   ```
   🕵️ Misterio    😎 Desconectar    😭 Llorar      😂 Reír
   💥 Acción       💕 Amor           👻 Terror      ✨ Inspiración
   ```
4. Haz clic en uno (se marcará con borde púrpura)
5. Un panel verde confirmará tu selección
6. Botón **"Obtener Recomendación"** se activa
7. Haz clic (mostrará: "Próximamente - US-009")

✅ **Si funciona:** Mood selector está funcionando

---

## 🔌 VERIFICAR APIs (Técnico)

Si algo no funciona, verifica que las APIs respondan:

### 1. Backend está vivo
```
Abre en navegador: http://localhost:3000/health

Deberías ver:
{"status":"ok","timestamp":"2026-05-16T..."}
```

### 2. Obtener moods (sin autenticación)
```
Abre en navegador: http://localhost:3000/api/v1/moods

Deberías ver:
{
  "success": true,
  "data": [
    {
      "id": "mystery",
      "label": "Misterio",
      "emoji": "🕵️",
      ...
    },
    ...
  ]
}
```

Si ves un error JSON, **Backend no está corriendo**. Vuelve a ejecutar:
```bash
npm run dev
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### ❌ "ERR! code ENOENT"
**Causa:** Faltan dependencias

**Solución:**
```bash
npm run install-all
npm run db:push
```

### ❌ "Port 3000 is already in use"
**Causa:** Otro proceso usa el puerto

**Solución Windows:**
```bash
# Buscar proceso en puerto 3000
netstat -ano | findstr :3000

# Eliminar proceso (reemplaza <PID> con el número)
taskkill /PID <PID> /F

# Luego:
npm run dev
```

### ❌ "SQLITE_CANTOPEN: unable to open database file"
**Causa:** Base de datos no inicializada

**Solución:**
```bash
cd apps/api
npm run db:push
cd ../..
npm run dev
```

### ❌ "Cannot GET /api/v1/moods"
**Causa:** Backend no está corriendo

**Solución:**
```bash
# Verifica que npm run dev está ejecutándose
# En la terminal, deberías ver:
# ✓ Server running on port 3000

# Si no lo ves, presiona Ctrl+C y ejecuta:
npm run dev
```

### ❌ "Frontend muestra 'Cannot connect to API'"
**Causa:** Frontend y Backend no están conectados

**Solución:**
1. Verifica que Backend está en http://localhost:3000/health ✅
2. Verifica que Frontend tiene `.env.local` con:
   ```
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   ```
3. Recarga el navegador (F5)

### ❌ "Network error in DevTools"
**Causa:** CORS blocked o Backend caído

**Solución:**
1. Abre DevTools: F12 → Pestaña **Console**
2. Busca el error (en rojo)
3. Si dice "http://localhost:3000", asegúrate que Backend está ejecutándose
4. Si dice "ERR_CONNECTION_REFUSED", Backend NO está corriendo

---

## 📞 TABLA DE PUERTOS

| Servicio | Puerto | URL | Para qué |
|----------|--------|-----|----------|
| Backend | 3000 | http://localhost:3000 | API REST |
| Frontend | 3001 | http://localhost:3001 | Interfaz web |
| Health Check | 3000 | http://localhost:3000/health | Verificar si Backend está vivo |

---

## 🎬 FLUJO VISUAL COMPLETO

```
1. Abre PowerShell
   ↓
2. Ejecuta: npm run dev
   ↓
3. Espera a ver "running on http://localhost:3001"
   ↓
4. Navegador abre automáticamente http://localhost:3001
   ↓
5. Verás Login/Register
   ↓
6. Registra: test@example.com / SecurePass123
   ↓
7. Onboarding 5 pasos (géneros → directores → actores → películas → resumen)
   ↓
8. Dashboard con 4 tarjetas
   ↓
9. Prueba cada tarjeta: Perfil, Onboarding, Recomendación
   ↓
10. En Recomendación, selecciona un mood 😎
    ↓
11. ✅ ¡Funciona!
```

---

## 📊 ESTADO ACTUAL DEL PROYECTO

```
✅ US-001: Autenticación
✅ US-002: Géneros
✅ US-003: Directores/Actores
✅ US-004: Películas vistas
✅ US-005: Perfil
✅ US-006: Mood Selector ← AHORA AQUÍ

Próximo: US-007 (Filtros de duración, año, tipo)

Total: 26/65 SP completados (40%)
```

---

## 🆘 SI AÚN NO FUNCIONA

1. **Abre DevTools:** F12
2. **Ve a Console:** Busca errores en rojo
3. **Copia el error completo**
4. **Comparte el error en el código**

Errores comunes:
- `ERR_CONNECTION_REFUSED` → Backend no está corriendo
- `CORS error` → Backend CORS no configurado (verifica `.env.local`)
- `404 /api/v1/...` → Endpoint no existe

---

**¡Listo! Ahora deberías poder usar la aplicación completa.** 🎉

Si algo sigue sin funcionar, avísame exactamente qué error ves en DevTools (F12 → Console).
