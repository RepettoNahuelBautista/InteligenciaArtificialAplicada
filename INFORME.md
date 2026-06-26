# INFORME TÉCNICO — RecomiendaFilms
## Motor de Recomendación de Cine con IA Generativa

**Proyecto:** RecomiendaFilms  
**Materia:** Inteligencia Artificial Aplicada  
**Estado:** Versión Final  
**Producción:** https://inteligencia-artificial-aplicada-we.vercel.app

---

## 1. ¿Qué problema resuelve la aplicación?

Los usuarios de plataformas de streaming (Netflix, Prime, Max, etc.) pierden tiempo navegando catálogos extensos sin saber qué ver. El problema no es la falta de contenido, sino la falta de orientación personalizada.

**RecomiendaFilms** resuelve esto con tres propuestas de valor:

| Propuesta | Descripción |
|-----------|-------------|
| **Personalización** | La recomendación considera el historial de gustos del usuario: géneros, directores, actores y películas calificadas |
| **Justificación** | La IA explica *por qué* recomienda cada título ("Te recomendamos esto porque amás a Nolan y estás de humor para misterio") |
| **Disponibilidad real** | Solo recomienda contenido que realmente existe y está disponible en plataformas de streaming en Argentina |

El flujo completo: el usuario indica su estado de ánimo y filtros (tipo, duración, año) → el sistema combina eso con su perfil → la IA genera una recomendación → se valida contra TMDB → se muestra con plataformas disponibles.

---

## 2. ¿Qué parte del sistema es "inteligente"?

### Motor de Recomendación (núcleo IA)

El componente central inteligente es el **servicio de recomendación** (`apps/api/src/services/`), que orquesta el siguiente pipeline:

```
Perfil del usuario (DB)
    +
Contexto de sesión (mood + filtros)
    ↓
[Prompt Engineering]  ← instrucciones anti-alucinación, perfil completo, idioma español argentino
    ↓
Google Gemini 2.5 Flash  ← genera título + explicación personalizada
    ↓
Validación TMDB  ← si el título no existe, descarta y reintenta (máx. 3 veces)
    ↓
TMDB Watch Providers  ← enriquece con plataformas disponibles en AR
    ↓
Respuesta enriquecida al frontend
```

### Qué hace la IA específicamente

1. **Recibe** un prompt estructurado con perfil + contexto
2. **Genera** un título real de película/serie y una explicación personalizada en lenguaje natural
3. **Se autocorrige**: si la IA "alucina" un título inexistente, el sistema lo detecta vía TMDB y pide una nueva recomendación automáticamente

### Generación de avatares con IA

La aplicación usa **Azure AI Foundry con FLUX.2-pro** para generar avatares de perfil personalizados mediante IA generativa de imágenes. El proceso de llegar a este proveedor involucró descartar múltiples alternativas (ver Problemas 9 y 10).

### Narración en voz alta

La explicación personalizada que genera la IA para cada recomendación puede narrarse en voz alta usando **Azure Cognitive Services Speech** (voz `es-AR-ElenaNeural`). El endpoint `/api/v1/narrate` recibe el texto, lo convierte a SSML, llama a la API de Azure TTS y devuelve el audio como MP3 directamente al navegador.

### Chat conversacional sobre cine (IA)

La aplicación incluye un **asistente de chat especializado en cine y series** (`/api/v1/chat`), también impulsado por **Gemini 2.5 Flash**. A diferencia del motor de recomendación (que genera una recomendación puntual), este chat es conversacional: mantiene el historial de la sesión y responde preguntas libres sobre películas, actores, directores, géneros, premios y plataformas de streaming.

El sistema tiene una restricción de dominio explícita mediante `systemInstruction`: si el usuario pregunta sobre cualquier tema ajeno al mundo audiovisual, la IA responde con un mensaje fijo negándose a contestar. Esto mantiene al asistente enfocado y evita respuestas off-topic.

```
Usuario pregunta sobre cine/series
    ↓
Gemini 2.5 Flash (con historial de sesión + systemInstruction restrictiva)
    ↓
Respuesta en español argentino con soporte de Markdown
    ↓
Renderizado con parser de Markdown propio en el frontend (ChatPage)
```

---

## 3. ¿Qué modelo o API se utilizó?

| Componente | Tecnología | Rol |
|-----------|-----------|-----|
| **LLM principal** | Google Gemini 2.5 Flash (`@google/generative-ai ^0.24.1`), con fallback a Flash-Lite | Generar recomendaciones justificadas |
| **Catálogo y validación** | TMDB API (The Movie Database) — datos en `es-AR` | Búsqueda, metadatos, pósters, watch providers |
| **Generación de avatares** | Azure AI Foundry / FLUX.2-pro (`blacksharkfoundry-ia2026`) | Avatares de usuario generados por IA |
| **Narración TTS** | Azure Cognitive Services Speech — voz `es-AR-ElenaNeural` | Leer en voz alta la explicación de la recomendación |
| **Base de datos** | PostgreSQL en Azure | Persistencia de perfiles, reseñas, listas |
| **Almacenamiento de imágenes** | Cloudinary | Subida y gestión de fotos de perfil |

### ¿Por qué Gemini y no OpenAI?

El AGENTS.md original fue diseñado con OpenAI GPT-4o-mini. Durante el desarrollo se cambió a **Google Gemini 2.5 Flash** por una razón pragmática: **costo**. Gemini ofrece un free tier más generoso para el volumen de requests del MVP, mientras que OpenAI implicaba costos desde el primer request.

El cambio introdujo un desafío técnico: **Gemini 2.5 Flash es un modelo "thinking"** (con cadena de razonamiento interna), lo que aumenta la latencia. Se ajustó `LLM_TIMEOUT_MS=30000` y se implementó strip de code blocks en la respuesta para parsear el JSON correctamente. Además se agregó un **extractor de llaves balanceadas** para manejar respuestas con texto adicional alrededor del JSON, y un **fallback automático a `gemini-2.5-flash-lite`** cuando el modelo principal devuelve errores de quota.

---

## 4. ¿Cómo intervino la IA en cada etapa del SDLC?

### Etapa 1 — Análisis e Ideación (Gemini — modo Ask)

Se utilizó **Google Gemini en modo conversacional (Ask)** para transformar una idea cruda en un brief técnico claro. La dinámica fue: Gemini hacía preguntas que disparaban decisiones de diseño que el equipo todavía no había tomado.

Preguntas que planteó Gemini:
- ¿El sistema recomienda una sola película o una lista?
- ¿Qué pesa más: el historial o el estado de ánimo actual?
- ¿La disponibilidad en streaming es obligatoria o un plus?
- ¿Cómo manejamos películas que el LLM inventa?

El resultado fue un brief estructurado con propuesta de valor, usuarios objetivo, restricciones técnicas y criterios de éxito medibles.

---

### Etapa 2 — Descomposición en Épicas y User Stories (Gemini)

Con el brief como input, se le pidió a Gemini que **descomponga el proyecto en Épicas y User Stories** listas para cargar en Azure DevOps, con formato estándar (Como / quiero / para) y criterios de aceptación en Gherkin.

El resultado fueron **7 épicas y 31 user stories** que cubren desde autenticación hasta features sociales:

| Épica | Descripción |
|-------|-------------|
| EP-001 | Autenticación y Gestión de Perfil |
| EP-002 | Captura de Contexto y Preferencias |
| EP-003 | Motor de Recomendación basado en IA |
| EP-004 | Integración de Catálogo y Streaming |
| EP-005 | Backend, Caché y Validación |
| EP-006 | Testing, Validación y Deployment |
| EP-007 | Features Sociales (Post-MVP) |

El documento resultante es `EPICAS_Y_USER_STORIES.md`.

---

### Etapa 3 — Carga automática en Azure DevOps (MCP + Script)

Para subir las user stories a Azure DevOps como Work Items **sin hacerlo manualmente**, se configuró el **MCP (Model Context Protocol) de Azure DevOps** dentro del entorno de desarrollo.

Luego se desarrolló el script `import_ado.js` que:
1. Parsea `EPICAS_Y_USER_STORIES.md` automáticamente
2. Obtiene un token de acceso vía Azure CLI (`az account get-access-token`)
3. Crea cada Épica en ADO via REST API
4. Crea cada User Story vinculada a su Épica padre (relación jerárquica)

```
Organización ADO: BlackShark2026
Proyecto ADO:     AppRecomendadoraV2
```

Resultado: **6 épicas y ~25 user stories** cargadas automáticamente en Azure DevOps como work items con título, descripción y criterios de aceptación.

---

### Etapa 4 — Planificación Iterativa (GitHub Copilot)

Con las user stories ya en ADO, se utilizó **GitHub Copilot** (con las instrucciones del proyecto en `copilot-instructions.md`) para diseñar un plan iterativo e incremental en 3 etapas:

- **ETAPA 1 — MVP mínimo**: Auth + onboarding + motor IA básico (sin UI pulida)
- **ETAPA 2 — MVP demoable**: App usable end-to-end con tarjeta de recomendación completa
- **ETAPA 3 — Producto completo**: Features sociales, listas, reseñas, perfil público

---

### Etapa 5 — Implementación del MVP (GitHub Copilot → Claude)

**GitHub Copilot** comenzó la implementación siguiendo las user stories de ADO. Implementó las primeras US del MVP (auth, estructura base del proyecto, configuración inicial).

**Sin embargo, Copilot se quedó sin contexto/tokens** tras implementar solo una fracción del MVP, dejando el proyecto a mitad de camino.

A partir de ese punto, el desarrollo continuó con **Claude (Anthropic)**, que tomó el proyecto desde donde Copilot lo dejó y completó:

- Todo el motor de recomendación con Gemini
- Integración TMDB completa (búsqueda, validación, watch providers)
- Onboarding de 5 pasos
- Perfil de usuario con estadísticas
- Features sociales completas (reviews, listas, follows, búsqueda de usuarios)
- Foto de perfil con Cloudinary
- Generación de avatares con IA (AI Horde)
- Deployment a producción (Vercel + Render + Azure PostgreSQL)

---

### Resumen del SDLC con IA

```
IDEACIÓN          → Gemini (modo Ask)          → Brief técnico claro
PLANIFICACIÓN     → Gemini                     → Épicas + User Stories (Gherkin)
GESTIÓN           → MCP ADO + import_ado.js    → Work Items en Azure DevOps
DISEÑO ITERATIVO  → GitHub Copilot             → Plan MVP en 3 etapas
IMPLEMENTACIÓN    → GitHub Copilot (parcial)   → Primeras US del MVP
IMPLEMENTACIÓN    → Claude (Anthropic)         → MVP completo + features sociales
DEPLOYMENT        → Claude                     → Vercel + Render + Azure
```

---

## 5. ¿Con qué problemas se encontraron?

### Problema 1 — Copilot se quedó sin tokens a mitad del MVP

**Situación:** GitHub Copilot fue el primer agente de implementación. Procesó las user stories de ADO y comenzó a construir el proyecto, pero **agotó su contexto disponible** antes de terminar el MVP mínimo. El proyecto quedó con la estructura base pero sin funcionalidad completa.

**Solución:** Se migró el desarrollo a **Claude (Anthropic)** con plan pago, que continuó el trabajo desde el estado dejado por Copilot y completó el 100% del MVP y luego las features sociales.

---

### Problema 2 — Cambio de LLM: OpenAI → Gemini por costo

**Situación:** El diseño original (reflejado en AGENTS.md) planificaba usar **OpenAI GPT-4o-mini**. Al momento de implementar, el costo de OpenAI resultó inviable para un MVP académico con llamadas frecuentes durante desarrollo.

**Solución:** Se reemplazó por **Google Gemini 2.5 Flash**, que tiene free tier amplio. El cambio implicó adaptar el servicio LLM y descubrir que Gemini 2.5 Flash es un modelo "thinking" (más lento). Se ajustó el timeout a 30 segundos.

---

### Problema 3 — Alucinaciones del LLM

**Situación:** Gemini ocasionalmente inventaba títulos de películas que no existen en TMDB (mezclaba nombres reales con directores o años incorrectos).

**Solución implementada:**
- Validación obligatoria contra TMDB antes de mostrar cualquier recomendación
- Si el título no existe → reintentar automáticamente (hasta 3 veces)
- Prompt con instrucciones anti-alucinación explícitas
- Logging de todas las alucinaciones detectadas

```
0 películas inventadas llegan al usuario en producción
```

---

### Problema 4 — Respuesta JSON inconsistente de Gemini

**Situación:** A diferencia de OpenAI que tiene `response_format: json_schema`, Gemini a veces devolvía el JSON envuelto en bloques de código markdown (` ```json ... ``` `), rompiendo el parsing.

**Solución:** Se implementó un paso de limpieza que hace strip de los code fences antes de parsear el JSON, y se limitó `maxOutputTokens: 2048` para evitar respuestas demasiado largas.

---

### Problema 5 — Routing SPA en Vercel (404 en recarga)

**Situación:** Al deployar el frontend React en Vercel, recargar cualquier ruta directa (ej: `/profile`, `/recommendation`) devolvía 404 porque Vercel intentaba servir ese path como archivo estático.

**Solución:** Se agregó el archivo `vercel.json` con rewrite de todas las rutas a `index.html` para que React Router maneje la navegación en el cliente.

---

### Problema 6 — Timezone en fechas de nacimiento

**Situación:** Las fechas de cumpleaños se desplazaban un día al guardar. Por ejemplo, "15/05/1995" se guardaba como "14/05/1995" por la conversión UTC.

**Solución:** Se forzó el parsing con hora del mediodía para evitar el shift de timezone:
```typescript
new Date(dateStr.slice(0, 10) + 'T12:00:00')
```

---

### Problema 7 — Race condition de autenticación en ProtectedRoute

**Situación:** Al recargar la página, `ProtectedRoute` verificaba el estado de auth antes de que el contexto terminara de cargarse, redirigiendo al login incluso con sesión válida.

**Solución:** Se agregó un fallback en `localStorage` para que el estado inicial se lea sincrónicamente, evitando el flash de redirección.

---

### Problema 9 — Generación de avatares: colapso del ecosistema de APIs gratuitas de imagen

**Situación:** La funcionalidad de generación de avatares a partir de texto requería un servicio de text-to-image. A lo largo del desarrollo se intentaron **cinco proveedores distintos**, todos con fallas diferentes:

| Proveedor | Resultado | Causa |
|-----------|-----------|-------|
| **Pollinations.ai** | HTTP 402 Payment Required | Pasó a ser de pago |
| **HuggingFace FLUX.1-schnell** | Error de red (`fetch failed`) | `api-inference.huggingface.co` está bloqueado/inaccesible desde Render |
| **HuggingFace SDXL** | Mismo `fetch failed` | Mismo dominio bloqueado en Render |
| **Gemini image generation** | Fallo inmediato | `gemini-2.0-flash-preview-image-generation` fue eliminado el 14/11/2025; los modelos nuevos no tienen free tier |
| **AI Horde (clave anónima)** | Timeout >110s | Prioridad mínima en la cola comunitaria sin cuenta registrada |

**Diagnóstico clave:** El problema con HuggingFace no era el modelo ni el token — era que el servidor de Render directamente no puede resolver el DNS de `api-inference.huggingface.co`. El error `fetch failed` (error de red a nivel sistema) fue determinante para descartar toda la infraestructura de HuggingFace.

**Solución final:** **AI Horde** (aihorde.net) con clave de cuenta registrada gratuita:
- Red de GPUs comunitaria completamente gratuita
- Con una cuenta registrada la prioridad sube y el tiempo baja a ~30-60 segundos
- El servidor de Render sí puede alcanzar `aihorde.net`

**Bug adicional descubierto:** Una vez que AI Horde funcionó, apareció un nuevo error: `Failed to parse URL from [datos base64]`. El campo `img` de la respuesta de AI Horde, cuando se configura `r2: false`, **devuelve la imagen directamente como base64**, no como una URL. El código intentaba hacer `fetch()` sobre esos datos. El fix fue usar el base64 directamente: `data:image/webp;base64,{img}`.

**Aprendizajes:**
1. Siempre surfacear el error real al cliente durante debugging (no un mensaje genérico) — cada iteración con error genérico retrasó el diagnóstico
2. Verificar conectividad de red desde el servidor de producción antes de asumir que un error es de credenciales o modelo
3. El ecosistema de generación de imágenes gratuita se deterioró significativamente entre 2024 y 2026

---

### Problema 8 — TMDB API Key no detectada en runtime

**Situación:** La key de TMDB se leía correctamente en desarrollo pero Render no la tenía configurada, devolviendo errores 401 silenciosos.

**Solución:** Se implementó un check en startup del servidor que verifica la presencia de todas las API keys críticas y falla rápido con mensaje claro si alguna falta.

---

### Problema 10 — ElevenLabs TTS reemplazado por Azure Cognitive Services

**Situación:** La funcionalidad de narración de recomendaciones se implementó inicialmente con **ElevenLabs**. Al momento de integrar, ElevenLabs presentaba problemas de acceso o requería plan pago para el volumen de requests necesario en producción.

**Solución:** Se reemplazó por **Azure Cognitive Services Speech**. La voz `es-AR-ElenaNeural` (español argentino) resultó natural y de alta calidad. El flujo: el backend obtiene un token efímero de Azure, construye el SSML, llama a la API TTS y retorna el MP3 directamente al cliente. Sin cambios en la interfaz de usuario.

---

### Problema 11 — AI Horde reemplazado por Azure AI Foundry (FLUX.2-pro)

**Situación:** AI Horde (solución final del Problema 9) funcionaba pero con limitaciones: ~30-60 segundos de espera mínima incluso con cuenta registrada, dependencia de disponibilidad de GPUs comunitarias y calidad variable.

**Solución:** Se migró a **Azure AI Foundry** con el modelo **FLUX.2-pro** (Black Forest Labs). Deployment en la organización `blacksharkfoundry-ia2026`. Tiempo de respuesta: ~10-30 segundos. Calidad consistentemente superior. El endpoint devuelve la imagen como `b64_json` que el frontend muestra como preview antes de que el usuario confirme guardarla.

---

### Problema 12 — JSON incompleto o rodeado de texto en respuestas de Gemini

**Situación:** A pesar del strip de code fences (Problema 4), Gemini a veces devolvía texto introductorio antes del JSON (`"Aquí está mi recomendación: {...}"`) o la respuesta se cortaba en medio del objeto. Ambos casos rompían el `JSON.parse()`.

**Solución implementada en dos capas:**
1. **Extractor de llaves balanceadas:** busca el primer `{` en la respuesta y recorre carácter por carácter manteniendo un contador de profundidad, extrayendo el substring que forma un objeto JSON completo.
2. **Múltiples candidatos:** si hay más de un posible bloque JSON, intenta parsear cada uno hasta encontrar uno válido con los campos esperados.
3. **Fallback de modelo:** si Gemini 2.5 Flash devuelve error de quota, reintenta automáticamente con `gemini-2.5-flash-lite`.

---

## 6. Stack Técnico Final

| Capa | Tecnología |
|------|-----------|
| **Backend** | Express 4.18 + TypeScript 5.3 + Prisma 5.13 |
| **Base de datos** | PostgreSQL en Azure |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **Validación** | Zod 3.23 |
| **LLM** | Google Gemini 2.5 Flash (con fallback a Flash-Lite en quota errors) |
| **TTS** | Azure Cognitive Services Speech — voz `es-AR-ElenaNeural` |
| **Generación de avatares** | Azure AI Foundry / FLUX.2-pro (Black Forest Labs) |
| **Fotos de perfil** | Cloudinary (subida manual) |
| **Frontend** | React 18 + Vite 5 + TailwindCSS 3.3 + React Router 6.20 + Framer Motion |
| **Tema** | Modo claro/oscuro con ThemeContext + toggle sol/luna |
| **APIs externas** | TMDB (catálogo + watch providers, datos en `es-AR`) |
| **Hosting frontend** | Vercel (CI/CD automático desde `main`) |
| **Hosting backend** | Render (free tier, ~30s cold start) |
| **DB cloud** | Azure Database for PostgreSQL |
| **CI/CD** | Render + Vercel — build automático en push a `main` |
| **Gestión de proyecto** | Azure DevOps (épicas + user stories) |

---

## 7. Estado Final del Proyecto

### Completado

| ID / Feature | Descripción |
|---|---|
| US-001 | Autenticación JWT (register/login) |
| US-002 a 004 | Onboarding completo (géneros, personas, películas vistas) |
| US-005 | Perfil con estadísticas y edición |
| US-006 a 008 | Selector de ánimo, filtros, resumen de contexto |
| US-009 a 012 | Motor IA con Gemini, prompt engineering, anti-alucinaciones |
| US-013 a 015 | Integración TMDB, watch providers, tarjeta completa |
| US-019 | Historial de recomendaciones |
| US-024 | Deployment a producción |
| US-025 a 031 | Features sociales (follows, búsqueda, reseñas, listas, foto de perfil) |
| Nueva interfaz | Rediseño completo con modo claro/oscuro, slides de tendencias, frosted-glass, fondo beige |
| TTS narración | Endpoint `/api/v1/narrate` con Azure Cognitive Services (`es-AR-ElenaNeural`) |
| TMDB en español | Metadatos, sinopsis y géneros obtenidos en `es-AR` |
| Azure AI Foundry | Generación de avatares con FLUX.2-pro, reemplaza AI Horde |
| Parser Gemini mejorado | Balanced-brace extractor + múltiples candidatos + fallback a Flash-Lite |
| Chat IA sobre cine | Asistente conversacional con Gemini 2.5 Flash, historial de sesión y restricción de dominio a cine/series (`/api/v1/chat`) |
| Sistema de mensajería privada | Conversaciones 1:1 entre usuarios: historial persistente, marcado de lectura, contador de no leídos |
| ChatWidget | Widget de chat flotante accesible desde cualquier pantalla sin interrumpir la navegación; abre mini-ventanas de conversación |
| ConversationPage | Vista de conversación individual con scroll automático al último mensaje |
| MessagesPage | Bandeja de entrada con lista de conversaciones ordenadas por actividad reciente y preview del último mensaje |
| Sistema de notificaciones | `NotificationBell` con badges en tiempo real para nuevos seguidores y mensajes no leídos; endpoint `/api/v1/notifications/followers` + `/api/v1/messages/unread-count` |

---

*Última actualización: 26 de junio de 2026*
