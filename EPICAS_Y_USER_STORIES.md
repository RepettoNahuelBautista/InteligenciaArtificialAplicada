# Motor de Recomendación Inteligente de Cine y Series (MVP)
## Épicas y User Stories para Azure DevOps

---

## ÉPICAS (6 total)

| ID | Épica | Descripción |
|----|-------|------------|
| EP-001 | Autenticación y Gestión de Perfil | Onboarding, autenticación y perfilado inicial del usuario |
| EP-002 | Captura de Contexto y Preferencias | Interfaz para capturar estado de ánimo y filtros actuales |
| EP-003 | Motor de Recomendación basado en IA | Integración con LLM y generación de recomendaciones justificadas |
| EP-004 | Integración de Catálogo y Streaming | Búsqueda en TMDB y mapeo de disponibilidad en JustWatch |
| EP-005 | Backend, Caché y Validación | APIs, persistencia, caché de metadatos y validación estructurada |
| EP-006 | Testing, Validación y Deployment | Pruebas de calidad, validación de criterios de éxito y deployment |

---

## ÉPICA 1: Autenticación y Gestión de Perfil (EP-001)

### US-001: Autenticación básica del usuario
**Como** usuario nuevo,  
**quiero** poder registrarme e iniciar sesión de forma segura,  
**para** acceder a mi perfil personalizado y guardar mis preferencias.

**Criterios de aceptación:**
```gherkin
Escenario: Registro exitoso
  Dado que soy un usuario nuevo en la aplicación
  Cuando completo el formulario de registro con email y contraseña
  Entonces se crea mi cuenta y se me redirige al onboarding

Escenario: Login exitoso
  Dado que soy un usuario registrado
  Cuando ingreso mis credenciales correctas
  Entonces accedo a la aplicación y permanezco autenticado

Escenario: Validación de campos
  Dado que intento registrarme
  Cuando dejo campos vacíos o uso email inválido
  Entonces veo mensajes de error claros
```

**Story Points:** 5  
**Prioridad MVP:** Crítica  
**Tareas técnicas:**
- Implementar autenticación (JWT o sesiones)
- Validación de entrada (email, contraseña fuerte)
- Base de datos de usuarios

---

### US-002: Onboarding - Captura de géneros favoritos
**Como** usuario nuevo,  
**quiero** seleccionar mis géneros favoritos durante el onboarding,  
**para** que el sistema entienda mis preferencias base.

**Criterios de aceptación:**
```gherkin
Escenario: Selección de géneros
  Dado que estoy en la pantalla de onboarding
  Cuando selecciono al menos 3 géneros de una lista predefinida
  Entonces puedo avanzar al siguiente paso

Escenario: Múltiple selección
  Dado que estoy seleccionando géneros
  Cuando hago clic en un género
  Entonces se marca como seleccionado con visual feedback

Escenario: Mínimo requerido
  Dado que intento avanzar sin seleccionar géneros
  Cuando hago clic en "Siguiente"
  Entonces veo un mensaje pidiendo seleccionar al menos 3 géneros
```

**Story Points:** 3  
**Prioridad MVP:** Crítica  
**Tareas técnicas:**
- UI con listado de géneros (películas/series)
- Persistencia de selección en base de datos
- Validación cliente y servidor

---

### US-003: Onboarding - Captura de directores y actores favoritos
**Como** usuario nuevo,  
**quiero** buscar y agregar mis directores y actores favoritos,  
**para** enriquecer mi perfil de preferencias.

**Criterios de aceptación:**
```gherkin
Escenario: Búsqueda de director
  Dado que estoy en la pantalla de directores/actores
  Cuando escribo el nombre de un director/actor
  Entonces veo un dropdown con sugerencias (búsqueda en TMDB)

Escenario: Agregar favorito
  Dado que veo un director/actor en las sugerencias
  Cuando hago clic en él
  Entonces se agrega a mi lista de favoritos

Escenario: Limitar cantidad
  Dado que intento agregar más de 15 directores/actores
  Cuando intento agregar uno más
  Entonces veo un mensaje informando el límite
```

**Story Points:** 5  
**Prioridad MVP:** Alta  
**Tareas técnicas:**
- Búsqueda en TMDB API (directores/actores)
- Caché de resultados
- Límite de selecciones en base de datos

---

### US-004: Onboarding - Evaluación de películas/series que ya vio
**Como** usuario nuevo,  
**quiero** calificar películas o series que ya he visto (like/dislike),  
**para** que el sistema entienda mejor mis gustos históricos.

**Criterios de aceptación:**
```gherkin
Escenario: Calificación de película
  Dado que veo una película sugerida en el onboarding
  Cuando hago clic en "Me gustó" o "No me gustó"
  Entonces se guarda mi calificación

Escenario: Búsqueda de títulos
  Dado que quiero calificar una película específica
  Cuando la busco en la interfaz
  Entonces veo resultados de TMDB con póster y año

Escenario: Skipear películas
  Dado que estoy calificando películas
  Cuando hago clic en "Siguiente" sin calificar la actual
  Entonces avanzo a la siguiente película
```

**Story Points:** 5  
**Prioridad MVP:** Alta  
**Tareas técnicas:**
- Búsqueda de películas/series en TMDB
- Almacenamiento de ratings del usuario
- Caché de títulos evaluados

---

### US-005: Finalizar onboarding y crear perfil
**Como** usuario nuevo,  
**quiero** completar el onboarding y ver mi perfil creado,  
**para** comenzar a usar el motor de recomendación.

**Criterios de aceptación:**
```gherkin
Escenario: Completar onboarding
  Dado que he completado todos los pasos (géneros, directores, películas)
  Cuando hago clic en "Crear perfil"
  Entonces se guarda todo y veo la pantalla principal

Escenario: Resumen de perfil
  Dado que completé el onboarding
  Cuando accedo a mi perfil
  Entonces veo resumen: [X géneros, Y directores, Z películas calificadas]

Escenario: Poder editar después
  Dado que estoy en la pantalla principal
  Cuando voy a configuración de perfil
  Entonces puedo agregar/quitar géneros, directores y películas
```

**Story Points:** 3  
**Prioridad MVP:** Alta  
**Tareas técnicas:**
- Transacción de guardado de perfil completo
- Validación de completitud
- Pantalla de resumen del perfil

---

## ÉPICA 2: Captura de Contexto y Preferencias (EP-002)

### US-006: Interfaz de captura de estado de ánimo
**Como** usuario,  
**quiero** seleccionar mi estado de ánimo actual de opciones predefinidas,  
**para** que las recomendaciones sean relevantes a lo que necesito en este momento.

**Criterios de aceptación:**
```gherkin
Escenario: Seleccionar estado de ánimo
  Dado que estoy en la pantalla principal
  Cuando veo botones de estados de ánimo (ej: "Misterio", "Para desconectar", "Llorar")
  Entonces puedo hacer clic en uno de ellos

Escenario: Un estado seleccionado
  Dado que hago clic en un estado de ánimo
  Cuando lo selecciono
  Entonces se marca visualmente como activo

Escenario: Cambiar estado
  Dado que tengo un estado seleccionado
  Cuando hago clic en otro
  Entonces se deselecciona el anterior y se marca el nuevo
```

**Story Points:** 3  
**Prioridad MVP:** Crítica  
**Tareas técnicas:**
- Botones de toggles/pills
- Almacenamiento temporal del contexto actual
- Estados predefinidos en base de datos

---

### US-007: Interfaz de filtros tradicionales
**Como** usuario,  
**quiero** aplicar filtros (duración, tipo: película/serie, año),  
**para** acotar aún más las recomendaciones a lo que busco.

**Criterios de aceptación:**
```gherkin
Escenario: Filtrar por tipo
  Dado que estoy en la pantalla de recomendaciones
  Cuando selecciono "Película" o "Serie"
  Entonces solo se recomiendan contenidos de ese tipo

Escenario: Filtrar por duración
  Dado que selecciono un rango de duración (ej: 90-120 min)
  Cuando aplico el filtro
  Entonces se excluyen películas fuera del rango

Escenario: Filtrar por año
  Dado que selecciono un rango de años (ej: 2020-2025)
  Cuando aplico el filtro
  Entonces se excluyen títulos fuera del rango

Escenario: Aplicar múltiples filtros
  Dado que selecciono tipo, duración y año simultáneamente
  Cuando hago clic en "Aplicar filtros"
  Entonces se combinan todas las restricciones
```

**Story Points:** 5  
**Prioridad MVP:** Alta  
**Tareas técnicas:**
- UI sliders para duración y año
- Dropdown/select para tipo
- Lógica de combinación de filtros
- Validación de rangos

---

### US-008: Vista previa de preferencias contextuales
**Como** usuario,  
**quiero** ver un resumen de mis preferencias actuales (estado, filtros) antes de solicitar recomendación,  
**para** validar que es lo que quiero.

**Criterios de aceptación:**
```gherkin
Escenario: Ver resumen de contexto
  Dado que he seleccionado estado de ánimo y filtros
  Cuando miro la pantalla de recomendación
  Entonces veo un resumen: "Buscando: [Estado], [Tipo], [Duración], [Año]"

Escenario: Modificar contexto
  Dado que veo el resumen
  Cuando hago clic en "Editar filtros"
  Entonces puedo cambiar cualquier parámetro

Escenario: Clearar todo
  Dado que tengo filtros aplicados
  Cuando hago clic en "Limpiar todo"
  Entonces vuelven a los valores por defecto
```

**Story Points:** 2  
**Prioridad MVP:** Media  
**Tareas técnicas:**
- Componente de resumen dinámico
- Botones de edición/limpiar
- Actualización en tiempo real

---

## ÉPICA 3: Motor de Recomendación basado en IA (EP-003)

### US-009: Integración con API de OpenAI (o Vertex AI)
**Como** usuario,  
**quiero** que el sistema use IA para generar recomendaciones personalizadas,  
**para** obtener sugerencias inteligentes basadas en mis gustos.

**Criterios de aceptación:**
```gherkin
Escenario: Llamada exitosa a LLM
  Dado que hago clic en "Recomendar"
  Cuando el backend envía mi perfil y contexto a la API de OpenAI
  Entonces recibo una respuesta JSON estructurada con recomendaciones

Escenario: Formato de respuesta
  Dado que la API responde
  Cuando parseo la respuesta
  Entonces contiene campos: [título, explicación, género, año]

Escenario: Manejo de errores
  Dado que la API no responde o falla
  Cuando se alcanza el timeout (>10s)
  Entonces se muestra un mensaje de error al usuario
```

**Story Points:** 8  
**Prioridad MVP:** Crítica  
**Tareas técnicas:**
- Configuración de credenciales API
- Implementación de llamadas a OpenAI/Vertex
- Manejo de timeouts y reintentos
- Structured Outputs (JSON response_format)

---

### US-010: Prompt engineering para recomendaciones personalizadas
**Como** usuario,  
**quiero** que la IA genere recomendaciones basadas en mi perfil específico y contexto actual,  
**para** obtener sugerencias realmente personalizadas.

**Criterios de aceptación:**
```gherkin
Escenario: Incluir perfil en prompt
  Dado que solicito una recomendación
  Cuando el backend construye el prompt
  Entonces incluye: [mis géneros favoritos, directores, actores, películas que me gustaron]

Escenario: Incluir contexto en prompt
  Dado que envío contexto (estado de ánimo, filtros)
  Cuando se construye el prompt
  Entonces incluye: [estado de ánimo, tipo de contenido, duración, año]

Escenario: Evitar alucinaciones
  Dado que la IA puede inventar películas
  Cuando se construye el prompt
  Entonces incluyo instrucción: "Recomienda solo películas/series reales existentes en TMDB"
```

**Story Points:** 5  
**Prioridad MVP:** Crítica  
**Tareas técnicas:**
- Template de prompt dinámico
- Inyección segura de variables del perfil
- Instrucciones anti-alucinación
- Testing de calidad de prompts

---

### US-011: Generación de explicación justificada
**Como** usuario,  
**quiero** que la IA explique por qué me recomienda algo ("Te recomendamos esto porque…"),  
**para** entender la lógica detrás de la recomendación.

**Criterios de aceptación:**
```gherkin
Escenario: Explicación clara
  Dado que recibo una recomendación
  Cuando leo la explicación
  Entonces es clara y menciona conexiones con mis gustos (ej: "Por tu amor a [Director X]")

Escenario: Múltiples razones
  Dado que hay varias razones para recomendar
  Cuando se genera la explicación
  Entonces menciona al menos 2-3 razones

Escenario: Formato texto estructurado
  Dado que la IA genera la explicación
  Cuando se envía al frontend
  Entonces está en texto claro, no en JSON crudo
```

**Story Points:** 3  
**Prioridad MVP:** Crítica  
**Tareas técnicas:**
- Post-procesamiento de respuesta LLM
- Transformación de JSON explicativo a texto legible
- Validación de coherencia de explicación

---

### US-012: Descartar recomendaciones inválidas
**Como** usuario,  
**quiero** que el sistema solo muestre recomendaciones que realmente existan,  
**para** no perder tiempo con películas inventadas.

**Criterios de aceptación:**
```gherkin
Escenario: Validación de existencia
  Dado que la IA sugiere un título
  Cuando el backend lo busca en TMDB
  Entonces si no existe, descarta la recomendación automáticamente

Escenario: Reintentar con otra recomendación
  Dado que la primera recomendación no existe
  Cuando se descarta
  Entonces el sistema solicita otra recomendación a la IA

Escenario: Máximo de reintentos
  Dado que se descartaron 3 recomendaciones inválidas
  Cuando se alcanza el límite
  Entonces se muestra error al usuario: "No se pudieron generar recomendaciones válidas"
```

**Story Points:** 5  
**Prioridad MVP:** Crítica  
**Tareas técnicas:**
- Búsqueda exacta en TMDB
- Lógica de reintentos
- Registro de alucinaciones para análisis

---

## ÉPICA 4: Integración de Catálogo y Streaming (EP-004)

### US-013: Búsqueda y enriquecimiento de datos en TMDB
**Como** usuario,  
**quiero** ver información completa sobre la película/serie recomendada (póster, sinopsis, año, calificación),  
**para** tomar una decisión informada.

**Criterios de aceptación:**
```gherkin
Escenario: Búsqueda exitosa en TMDB
  Dado que el backend tiene un título recomendado
  Cuando lo busca en TMDB
  Entonces obtiene: [id, póster, sinopsis, año, calificación, duración, tipo]

Escenario: Mostrar datos completos
  Dado que se obtienen datos de TMDB
  Cuando se renderiza en el frontend
  Entonces se muestra: [póster, título, año, sinopsis, calificación]

Escenario: Manejo de datos faltantes
  Dado que TMDB no retorna ciertos campos
  Cuando faltan datos
  Entonces se muestran placeholders o valores por defecto
```

**Story Points:** 5  
**Prioridad MVP:** Crítica  
**Tareas técnicas:**
- Integración TMDB API
- Manejo de errores 404
- Caché de metadatos
- Normalización de datos

---

### US-014: Mapeo de disponibilidad en plataformas de streaming
**Como** usuario,  
**quiero** ver en qué plataforma de streaming (Netflix, Max, Prime) puedo ver la recomendación,  
**para** saber si es accesible para mí.

**Criterios de aceptación:**
```gherkin
Escenario: Consultar disponibilidad en JustWatch
  Dado que tengo el id de película/serie
  Cuando consulto JustWatch API
  Entonces obtengo lista de plataformas disponibles

Escenario: Mostrar plataformas disponibles
  Dado que consulto disponibilidad
  Cuando se renderiza en frontend
  Entonces veo logos/nombres de plataformas (ej: Netflix, Max, Prime)

Escenario: Actualizar datos de plataformas
  Dado que JustWatch devuelve datos
  Cuando se cachean en base de datos
  Entonces se revalidan cada 24-48 horas para mantener precisión
```

**Story Points:** 5  
**Prioridad MVP:** Alta  
**Tareas técnicas:**
- Integración JustWatch API
- Mapping de plataformas por región
- Caché con expiración
- Sincronización periódica de disponibilidad

---

### US-015: Mostrar recomendación completa (película/serie + dónde ver)
**Como** usuario,  
**quiero** ver la recomendación final con toda la información necesaria en una pantalla,  
**para** tomar una decisión rápida.

**Criterios de aceptación:**
```gherkin
Escenario: Tarjeta de recomendación completa
  Dado que recibo una recomendación
  Cuando se renderiza
  Entonces veo: [póster, título, año, sinopsis, calificación, duración, género, plataformas]

Escenario: Explicación visible
  Dado que estoy viendo la recomendación
  Cuando leo la explicación
  Entonces veo "Te recomendamos esto porque: [razón]"

Escenario: Acciones en la tarjeta
  Dado que veo la recomendación
  Cuando hago clic en una plataforma
  Entonces se abre un enlace a la plataforma (opcional en MVP)
```

**Story Points:** 3  
**Prioridad MVP:** Crítica  
**Tareas técnicas:**
- Componente de tarjeta de recomendación
- Layout responsive
- Integración de datos TMDB + JustWatch
- Enlaces a plataformas externas

---

## ÉPICA 5: Backend, Caché y Validación (EP-005)

### US-016: Caché de metadatos de películas/series
**Como** sistema,  
**quiero** cachear metadatos de TMDB para reducir llamadas API,  
**para** mejorar latencia y evitar rate limits.

**Criterios de aceptación:**
```gherkin
Escenario: Cachear datos de TMDB
  Dado que consulto una película en TMDB
  Cuando obtengo los datos
  Entonces se guardan en caché (Redis o DB)

Escenario: Servir desde caché
  Dado que la misma película se consulta de nuevo
  Cuando verifico el caché
  Entonces obtiene datos en <100ms sin llamar a TMDB

Escenario: Invalidación de caché
  Dado que los datos están en caché
  Cuando pasan 30 días
  Entonces se invalida la entrada y se reconsulta TMDB
```

**Story Points:** 5  
**Prioridad MVP:** Media  
**Tareas técnicas:**
- Implementar Redis o SQLite caché
- TTL/expiración de entradas
- Hit rate monitoring
- Precarga de datos populares

---

### US-017: Validación estructurada de respuestas JSON del LLM
**Como** sistema,  
**quiero** validar que las respuestas del LLM sean JSON válido y estructurado,  
**para** evitar errores de parsing.

**Criterios de aceptación:**
```gherkin
Escenario: Validar JSON con Zod
  Dado que la IA retorna una respuesta
  Cuando intento parsearla con un schema Zod
  Entonces valida que cumpla estructura esperada

Escenario: Rechazar respuesta inválida
  Dado que la respuesta no cumple schema
  Cuando falla validación
  Entonces se registra el error y se solicita reintento a la IA

Escenario: Usar Structured Outputs
  Dado que uso OpenAI
  Cuando establezco "response_format: {"type": "json_schema", ...}"
  Entonces la API garantiza respuesta JSON válida
```

**Story Points:** 3  
**Prioridad MVP:** Alta  
**Tareas técnicas:**
- Instalación de Zod
- Definir schemas para respuestas IA
- Usar response_format en OpenAI
- Logging de validaciones fallidas

---

### US-018: Llamada secuencial: Perfil + Contexto → IA → TMDB → JustWatch
**Como** sistema,  
**quiero** ejecutar el flujo completo de recomendación en secuencia controlada,  
**para** garantizar datos consistentes y manejo de errores.

**Criterios de aceptación:**
```gherkin
Escenario: Flujo completo exitoso
  Dado que el usuario solicita recomendación
  Cuando se ejecuta: [Obtener perfil → Construir prompt → Llamar IA → Validar respuesta]
  Entonces obtiene título válido

Escenario: Búsqueda en TMDB
  Dado que obtengo título de IA
  Cuando lo busco en TMDB
  Entonces si existe, obtengo metadatos

Escenario: Búsqueda en JustWatch
  Dado que tengo el ID de TMDB
  Cuando consulto JustWatch
  Entonces obtengo plataformas disponibles

Escenario: Timing total
  Dado que inicia el flujo
  Cuando se completa todo
  Entonces toma menos de 7 segundos
```

**Story Points:** 8  
**Prioridad MVP:** Crítica  
**Tareas técnicas:**
- Orquestación de llamadas API
- Manejo de timeouts en cada paso
- Reintentos inteligentes
- Logging detallado
- Monitoring de latencia

---

### US-019: Persistencia de contexto y recomendaciones
**Como** usuario,  
**quiero** que mis recomendaciones se guarden,  
**para** poder ver mi historial y patrones de recomendaciones.

**Criterios de aceptación:**
```gherkin
Escenario: Guardar recomendación
  Dado que recibo una recomendación
  Cuando se completa el flujo
  Entonces se guarda en BD: [usuario_id, película_id, timestamp, contexto, explicación]

Escenario: Ver historial
  Dado que hago clic en "Mi historial"
  Cuando accedo a la pantalla
  Entonces veo lista de mis últimas 20 recomendaciones

Escenario: Marcar como "visto"
  Dado que veo una recomendación en historial
  Cuando hago clic en "Ya lo vi"
  Entonces se marca como visto y puedo agregar calificación
```

**Story Points:** 3  
**Prioridad MVP:** Media  
**Tareas técnicas:**
- Tabla de recomendaciones en BD
- Tabla de historial de usuario
- Índices para queries frecuentes
- Endpoint para obtener historial

---

## ÉPICA 6: Testing, Validación y Deployment (EP-006)

### US-020: Testing unitario de Prompt Engineering
**Como** ingeniero,  
**quiero** testear que los prompts generados incluyan correctamente perfil y contexto,  
**para** asegurar que no haya injecciones maliciosas o datos incompletos.

**Criterios de aceptación:**
```gherkin
Escenario: Test de inclusión de perfil
  Dado que tengo un perfil de usuario
  Cuando se construye el prompt
  Entonces verfico que contenga géneros, directores, actores, películas calificadas

Escenario: Test de inclusión de contexto
  Dado que tengo contexto (estado, filtros)
  Cuando se construye el prompt
  Entonces verfico que incluya estado de ánimo, tipo, duración, año

Escenario: Test de sanitización
  Dado que intento inyectar caracteres especiales en perfil
  Cuando se construye el prompt
  Entonces se escapeán correctamente o se rechazan
```

**Story Points:** 3  
**Prioridad MVP:** Media  
**Tareas técnicas:**
- Jest/Vitest para tests
- Fixtures de perfiles
- Validación de output de prompts
- Coverage >80%

---

### US-021: Testing de validación de respuestas LLM
**Como** ingeniero,  
**quiero** testear que validaciones Zod rechazan respuestas malformadas,  
**para** evitar crashes en producción.

**Criterios de aceptación:**
```gherkin
Escenario: Rechazar JSON inválido
  Dado que simulo respuesta LLM inválida
  Cuando intento validar con Zod
  Entonces falla y se captura el error

Escenario: Aceptar JSON válido
  Dado que tengo respuesta LLM bien formada
  Cuando valido con Zod
  Entonces pasa todas las reglas

Escenario: Edge cases
  Dado que testteo campos opcionales, nulos, strings vacíos
  Cuando valido
  Entonces maneja correctamente según schema
```

**Story Points:** 3  
**Prioridad MVP:** Media  
**Tareas técnicas:**
- Tests de validación
- Mocks de respuestas LLM
- Casos de error
- Cobertura de schema

---

### US-022: Integration test: Flujo completo E2E
**Como** ingeniero,  
**quiero** testear el flujo completo desde perfil hasta recomendación final,  
**para** garantizar que todos los pasos funcionan integrados.

**Criterios de aceptación:**
```gherkin
Escenario: Flujo E2E exitoso
  Dado que soy un usuario con perfil completo
  Cuando solicito una recomendación con contexto
  Entonces recibo un título válido con explicación y plataformas

Escenario: Timing E2E
  Dado que inicio el flujo
  Cuando se completa
  Entonces toma <7 segundos

Escenario: Manejo de errores E2E
  Dado que algún step falla (ej: TMDB timeout)
  Cuando ocurre el error
  Entonces se captura y se muestra error legible al usuario
```

**Story Points:** 5  
**Prioridad MVP:** Crítica  
**Tareas técnicas:**
- Tests con BD real o fixtures
- Mocks de APIs externas
- Medición de latencia
- Scenarios de error

---

### US-023: Validación de criterios de éxito del MVP
**Como** PM,  
**quiero** verificar que el producto cumpla los 3 criterios de éxito,  
**para** liberar el MVP con confianza.

**Criterios de aceptación:**
```gherkin
Escenario: Calidad de sugerencias
  Dado que tengo 10 usuarios de beta test
  Cuando cada uno genera 5 recomendaciones
  Entonces al menos 80% reporta que explicaciones tienen sentido

Escenario: Latencia aceptable
  Dado que ejecuto 50 flujos de recomendación
  Cuando mido tiempo total (click → renderizado)
  Entonces 95% toma <7 segundos

Escenario: Precisión de catálogo
  Dado que genero 100 recomendaciones
  Cuando verifico que existan en TMDB
  Entonces >95% son encontradas y tienen disponibilidad mapeada
```

**Story Points:** 5  
**Prioridad MVP:** Crítica  
**Tareas técnicas:**
- Script de testing de latencia
- Reporte de calidad de sugerencias
- Verificación manual de catálogo
- Dashboard de métricas

---

### US-024: Deployment a producción (hosting MVP)
**Como** DevOps,  
**quiero** desplegar la aplicación a un servidor accesible,  
**para** que beta testers puedan usar el MVP.

**Criterios de aceptación:**
```gherkin
Escenario: Aplicación disponible en URL pública
  Dado que se completa el desarrollo
  Cuando se despliega a producción
  Entonces es accesible en URL pública (ej: app.ejemplo.com)

Escenario: Configurar variables de entorno
  Dado que tengo credenciales de APIs (OpenAI, TMDB, JustWatch)
  Cuando se despliega
  Entonces se configuran securely como env vars

Escenario: Logs y monitoring
  Dado que está en producción
  Cuando ocurren errores
  Entonces se registran en logs y se puede monitorear
```

**Story Points:** 5  
**Prioridad MVP:** Crítica  
**Tareas técnicas:**
- Elegir hosting (Vercel, AWS, Azure, etc.)
- Configurar CI/CD
- Variables de entorno seguras
- Monitoring y alertas

---

## ROADMAP DE PRIORIZACIÓN (MVP)

### **SPRINT 1: Fundación (Semanas 1-2)**
| ID | User Story | Points |
|----|-----------|--------|
| US-001 | Autenticación básica | 5 |
| US-002 | Onboarding - Géneros | 3 |
| EP-005 (infra) | Setup backend, DB, APIs | 8 |

**Total:** 16 puntos

---

### **SPRINT 2: Perfilado Completo (Semanas 3-4)**
| ID | User Story | Points |
|----|-----------|--------|
| US-003 | Onboarding - Directores/Actores | 5 |
| US-004 | Onboarding - Películas vistas | 5 |
| US-005 | Finalizar onboarding | 3 |
| US-016 | Caché de metadatos | 5 |

**Total:** 18 puntos

---

### **SPRINT 3: Captura de Contexto (Semanas 5-6)**
| ID | User Story | Points |
|----|-----------|--------|
| US-006 | Estado de ánimo | 3 |
| US-007 | Filtros tradicionales | 5 |
| US-008 | Resumen de contexto | 2 |

**Total:** 10 puntos

---

### **SPRINT 4: Motor de IA (Semanas 7-9)**
| ID | User Story | Points |
|----|-----------|--------|
| US-009 | Integración OpenAI API | 8 |
| US-010 | Prompt engineering | 5 |
| US-011 | Explicación justificada | 3 |
| US-017 | Validación Zod | 3 |

**Total:** 19 puntos

---

### **SPRINT 5: Integración de Catálogo (Semanas 10-11)**
| ID | User Story | Points |
|----|-----------|--------|
| US-013 | TMDB enriquecimiento | 5 |
| US-014 | JustWatch disponibilidad | 5 |
| US-015 | Tarjeta completa | 3 |

**Total:** 13 puntos

---

### **SPRINT 6: Flujo Completo + Robustez (Semanas 12-13)**
| ID | User Story | Points |
|----|-----------|--------|
| US-012 | Descartar inválidas | 5 |
| US-018 | Orquestación flujo completo | 8 |
| US-019 | Persistencia + historial | 3 |

**Total:** 16 puntos

---

### **SPRINT 7: Testing y Validación (Semanas 14-15)**
| ID | User Story | Points |
|----|-----------|--------|
| US-020 | Testing unitario prompts | 3 |
| US-021 | Testing validación | 3 |
| US-022 | Integration test E2E | 5 |
| US-023 | Validación criterios éxito | 5 |

**Total:** 16 puntos

---

### **SPRINT 8: Deployment (Semana 16)**
| ID | User Story | Points |
|----|-----------|--------|
| US-024 | Deployment producción | 5 |

**Total:** 5 puntos

---

## RESUMEN FINAL

- **Total de User Stories:** 24
- **Total de Story Points:** 133
- **Épicas:** 6
- **Duración estimada MVP:** 16 semanas (4 meses)
- **Equipo recomendado:** 2-3 developers + 1 DevOps
- **Riesgos clave:**
  - Alucinaciones del LLM (mitigado en US-012, US-017)
  - Rate limits de APIs (mitigado en US-016, US-018)
  - Latencia >7s (validado en US-018, US-022, US-023)

---

## NOTAS PARA AZURE DEVOPS

1. **Import Format:** Copiar cada User Story como Work Item (Task type: User Story)
2. **Tags sugeridas:**
   - `MVP`
   - `épica:[EP-001/EP-002/...]`
   - `prioridad:crítica/alta/media`
3. **Links:** Vincular parent épicas con user stories
4. **Sprints:** Cargar en 8 sprints de 2 semanas cada uno
5. **Estimación:** Story Points en Fibonacci (1, 2, 3, 5, 8, 13...)

