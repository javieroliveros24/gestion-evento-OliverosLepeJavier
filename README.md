# Gestor de participantes de un evento

**Autor:** Javier Oliveros Lepe
**Módulo:** Desarrollo Web en Entorno Cliente (DWEC) · Unidad didáctica 1 (sesiones 1 a 7) · Curso 2026-2027

Aplicación cliente (HTML, CSS y JavaScript sin frameworks) para gestionar las inscripciones de un evento tecnológico: altas y bajas de participantes, búsqueda y filtro, estadísticas, exportación e importación JSON, panel resumen en un iframe comunicado por `postMessage`, preferencias guardadas en cookies y ventana de ayuda.

---

## Índice

1. [Ejecución por HTTP](#1-ejecución-por-http)
2. [Estructura del proyecto](#2-estructura-del-proyecto)
3. [Cómo se ha realizado cada funcionalidad](#3-cómo-se-ha-realizado-cada-funcionalidad)
4. [Casos de prueba](#4-casos-de-prueba)
5. [Contenidos aplicados de las sesiones 1 a 7](#5-contenidos-aplicados-de-las-sesiones-1-a-7)
6. [Evidencias de depuración y de red](#6-evidencias-de-depuración-y-de-red)
7. [Uso de la inteligencia artificial](#7-uso-de-la-inteligencia-artificial)

---

## 1. Ejecución por HTTP

La aplicación **no debe abrirse con `file://`**: con ese esquema el origen es `null`, así que `postMessage` con un `targetOrigin` concreto no funciona y las cookies no se guardan. Hay que servir la carpeta con un servidor HTTP de archivos estáticos, de modo que `index.html`, `panel.html` y `ayuda.html` compartan host y puerto (mismo origen).

Cualquiera de estas opciones sirve, ejecutada en la carpeta raíz del proyecto:

| Opción | Comando / acción | Dirección |
|---|---|---|
| Python 3 | `python3 -m http.server 8000` | http://localhost:8000/ |
| Node.js | `npx serve .` | la que indique la consola (normalmente http://localhost:3000/) |
| VS Code | Extensión Live Server → clic derecho en `index.html` → *Open with Live Server* | http://127.0.0.1:5500/index.html |

No hay lógica de servidor: el servidor solo entrega archivos; todo se ejecuta en el navegador.

---

## 2. Estructura del proyecto

```text
gestion-evento/
├── index.html          Página principal: formularios, listado, estadísticas, JSON, iframe y preferencias
├── panel.html          Panel resumen que se carga dentro del iframe
├── ayuda.html          Ventana de ayuda abierta con window.open
├── css/
│   └── estilos.css     Estilos comunes, temas claro/oscuro (variables CSS), tamaño grande, Grid y Flexbox
└── js/
    ├── logica.js       Lógica pura (sin DOM): validación, ids, clasificaciones, estadísticas, filtros, resumen del panel
    ├── cookies.js      leerCookie, guardarCookie, borrarCookie
    ├── preferencias.js Validación y aplicación de tema y tamaño; guardado y restablecimiento
    ├── app.js          Interfaz de la página principal: eventos, DOM, JSON, postMessage, ventana de ayuda
    ├── panel.js        Receptor de mensajes del iframe y construcción de su DOM
    └── ayuda.js        Datos del navegador en la ventana de ayuda
```

Separación de responsabilidades: `logica.js` contiene **solo** funciones que reciben datos por parámetro y devuelven un resultado (`validarParticipante`, `generarId`, `calcularEstadisticas`, `validarColeccion`, `crearResumenPanel`…). No usan `document` ni `window`, por lo que se pueden probar desde la consola con datos inventados. Todo el acceso al DOM está en `app.js`, `preferencias.js`, `panel.js` y `ayuda.js`.

---

## 3. Cómo se ha realizado cada funcionalidad

### 3.1 Datos en memoria

- **Archivo:** `js/app.js` (variable `participantes`).
- Colección declarada con `let` (se reasigna al importar) y tres participantes de ejemplo con edades (17, 29, 45), tipos (estudiante, profesional, invitado) y modalidades distintas. No se conserva al recargar, tal como pide el enunciado.

### 3.2 Alta y validación

- **Archivos:** `js/logica.js` → `convertirNumero`, `validarParticipante`, `generarId`; `js/app.js` → `gestionarAlta`, `mostrarErroresFormulario`, `limpiarErroresFormulario`.
- `validarParticipante(datos)` trata los datos como no fiables:
  - Nombre: `trim()` y longitud entre 2 y 60.
  - Edad y experiencia: `convertirNumero` comprueba primero el tipo y que la cadena no esté vacía, después aplica un patrón de solo dígitos (rechaza `"18abc"`, `"1e1"`, `"0x10"`, `null`, `true`…) y por último convierte con `Number`. Edad: `Number.isInteger` y rango 0–120 (0 es válido). Experiencia: `Number.isFinite` y rango 0–10 con decimales.
  - Tipo y modalidad: solo los valores de las listas `TIPOS_VALIDOS` y `MODALIDADES_VALIDAS`.
  - Devuelve `{ esValido, errores, participante }`, con un mensaje por campo y los datos ya normalizados.
- Los campos numéricos del formulario son `type="text"` con `inputmode`, para que la validación dependa del JavaScript y no de los atributos HTML (el formulario tiene `novalidate`).
- Si hay errores, `mostrarErroresFormulario` los escribe **junto a cada campo** y en un **resumen visible**, marca los controles con `aria-invalid` y no toca los valores escritos. Si el alta es correcta, se genera el id, la fecha con `new Date().toISOString()`, se limpia el formulario y se actualizan el listado, las estadísticas y el panel.
- `generarId(participantes)` usa `Math.random()` dentro de un `do...while` limitado a 1000 intentos; un `for...of` con `break` comprueba si el candidato ya existe. Si se agotan los intentos devuelve `null` (nunca bloquea la pestaña) y la interfaz muestra un error.

### 3.3 Clasificación

- **Archivo:** `js/logica.js` → `clasificarEdad` (ternario: menor si `< 18`), `clasificarExperiencia` (`if/else if/else`: inicial `[0, 4)`, intermedia `[4, 7)`, avanzada `[7, 10]`).

### 3.4 Listado (tarjetas)

- **Archivo:** `js/app.js` → `crearTarjeta`, `crearFilaDato`, `renderizarListado`, `actualizarAvisoListado`.
- Cada tarjeta es un `<article>` creado con `createElement`, rellenado con `textContent` y montado con `append`; no se usa `innerHTML`.
- Estados representados con `classList` (`menor-edad`/`mayor-edad`, `experiencia-…`, `modalidad-…`) y atributos `data-id`, `data-edad`, `data-experiencia`. Muestra todos los datos, las dos clasificaciones y la fecha en formato español con `toLocaleString('es-ES', …)`.

### 3.5 Bajas

- **Archivo:** `js/app.js` → `gestionarClicEnListado`, `borrarParticipante`.
- Un único receptor en el contenedor (delegación de eventos) detecta el botón con `closest`. Se pide confirmación con `confirm`; si se cancela no cambia nada.
- Si se acepta, el participante se quita de la colección con `splice` y **solo su tarjeta** se elimina con `tarjeta.remove()`; las demás tarjetas no se vuelven a crear. Después se recalculan las estadísticas y se avisa al panel.

### 3.6 Búsqueda y filtro

- **Archivos:** `js/logica.js` → `normalizarTexto`, `cumpleFiltros`; `js/app.js` → `renderizarListado`, `actualizarAvisoListado`.
- `normalizarTexto` usa métodos de `String` (`trim`, `normalize('NFD')`, `replace`, `toLowerCase`) para que la búsqueda no distinga mayúsculas ni tildes. Se combina con el filtro de modalidad. Si no hay coincidencias se muestra un aviso, y otro distinto si la lista está vacía (se cuentan las tarjetas con `querySelectorAll`).

### 3.7 Estadísticas

- **Archivos:** `js/logica.js` → `calcularEstadisticas`; `js/app.js` → `renderizarEstadisticas`, `formatearMedia`.
- Se calculan siempre sobre la colección completa con bucles, contadores y acumuladores (sin `reduce`): total, menores y mayores, edad media, mínima y máxima, cantidades por modalidad y por tipo (`switch`).
- La experiencia media presencial se calcula en un recorrido propio que usa `continue` para saltar los participantes online. El primer menor se busca con un `for` que termina con `break`.
- Las medias y extremos se devuelven como **números** (o `null` si no hay datos). La interfaz las formatea: `toFixed(2)` para las medias y "Sin datos" cuando el valor es `null`, así que nunca aparece `NaN` ni `Infinity`.

### 3.8 Exportación e importación JSON

- **Archivos:** `js/logica.js` → `validarColeccion`, `esIdValido`, `esFechaIsoValida`; `js/app.js` → `exportarJson`, `importarJson`.
- Exportar: `JSON.stringify(participantes, null, 2)` en el área de texto.
- Importar: `JSON.parse` dentro de `try/catch` (el JSON mal formado muestra un mensaje comprensible). `validarColeccion` comprueba que sea un array y que cada elemento sea un objeto con los siete campos y **sus tipos** (texto o número), un id entero en rango y no repetido, una fecha ISO real (formato de `toISOString` y comprobación de ida y vuelta, que rechaza `"10/08/2026"`, `"2026"` o el 31 de febrero) y los mismos rangos que el formulario.
- La colección solo se sustituye si **todos** los elementos son válidos. Una importación válida (incluido `[]`) actualiza tarjetas, estadísticas y panel.

### 3.9 Panel del evento (iframe y postMessage)

- **Archivos:** `index.html` (iframe con `title` descriptivo), `panel.html`, `js/panel.js` → `esResumenValido`, `pintarResumen`; `js/logica.js` → `crearResumenPanel`; `js/app.js` → `recibirMensajeDelPanel`, `enviarResumenAlPanel`.
- Protocolo:
  1. `panel.js` instala su receptor `message` y después envía `{ tipo: 'panel-preparado' }` a `window.parent` con `targetOrigin = location.origin`.
  2. La página principal (cuyo receptor se instala en cuanto se ejecuta `app.js`) comprueba `origin`, que `source` sea `iframe.contentWindow` y que el mensaje tenga exactamente esa estructura. Entonces marca el panel como preparado y le envía el resumen.
  3. Cada alta, baja o importación vuelve a enviar el resumen. El `targetOrigin` es siempre `location.origin`, nunca `"*"`.
- El panel comprueba `origin`, que `source` sea `window.parent`, y la estructura, los tipos y los valores (enteros no negativos, presenciales + online = total, nombre válido, fecha ISO) **antes** de tocar su DOM. Los mensajes inválidos se ignoran sin errores. El panel construye su propio DOM; la página principal nunca accede a su contenido. Sin participantes muestra "Sin inscripciones".

### 3.10 Preferencias con cookies

- **Archivos:** `js/cookies.js` → `leerCookie`, `guardarCookie`, `borrarCookie`, `atributosCookie`; `js/preferencias.js` → `normalizarTema`, `normalizarTamano`, `aplicarPreferencias`, `cargarPreferenciasIniciales`, `guardarPreferencias`, `restablecerPreferencias`; `js/app.js` → `gestionarGuardarPreferencias`, `gestionarRestablecerPreferencias`.
- Dos cookies independientes, `dwec_tema` y `dwec_tamano`, con `Path=/`, `SameSite=Lax`, `Max-Age=2592000` (30 días en segundos) y `Secure` si la página se sirve por HTTPS. Los valores se codifican con `encodeURIComponent` y se descodifican con `decodeURIComponent` dentro de `try/catch`.
- Al cargar, los valores se validan (`switch` en `normalizarTema`); si faltan o son inválidos se aplican tema claro y tamaño normal.
- Al guardar, las preferencias se aplican primero (funcionan durante la visita aunque las cookies estén bloqueadas) y luego **se comprueba leyendo** si se han guardado. Restablecer borra ambas con `Max-Age=0` y el mismo ámbito, aplica los valores predeterminados y **comprueba leyendo** que ya no existen.

### 3.11 Ventana de ayuda

- **Archivos:** `ayuda.html`, `js/ayuda.js`; `js/app.js` → `abrirAyuda`, `cerrarAyuda`.
- `window.open` guarda la referencia en `ventanaAyuda`. Si sigue abierta (`!ventanaAyuda.closed`) se reutiliza con `focus()`; "Cerrar ayuda" la cierra desde la página principal. Si `window.open` devuelve `null` (bloqueada), se muestra un aviso en la página.
- La ayuda explica el uso de la aplicación y muestra `navigator.language`, `location.origin` y `screen.width × screen.height` solo como información descriptiva.

---

## 4. Casos de prueba

Todas las pruebas se hacen en el navegador con la aplicación servida por HTTP (apartado 1), partiendo de una carga limpia de la página (3 participantes de ejemplo). Para "recargar limpio" basta con pulsar F5.

### 4.1 Alta y validación

| Id | Pasos y datos de entrada | Resultado esperado |
|---|---|---|
| A1 | Nombre `" A "`, edad `18abc`, experiencia `12`, pulsar **Inscribir participante** | Tres errores junto a sus campos y en el resumen rojo; los campos quedan marcados y conservan lo escrito; siguen 3 tarjetas y las estadísticas no cambian |
| A2 | Nombre `Pepe`, edad vacía, experiencia `5` | Error en edad; no se añade nadie |
| A3 | Nombre `Pepe`, edad `17.5`, experiencia `5` | Error "La edad debe ser un número entero entre 0 y 120"; no se añade nadie |
| A4 | Nombre `Pepe`, edad `121` / experiencia `10.1` / experiencia `7,5` (cada uno por separado) | Error en el campo correspondiente; no se añade nadie |
| A5 | Nombre `"  Marta Gómez  "`, edad `0`, tipo estudiante, modalidad online, experiencia `0` | Se añade la tarjeta "Marta Gómez" (sin espacios extremos), menor de edad, experiencia inicial, id de 6 dígitos y fecha actual en español. El formulario se limpia, aparece "Marta Gómez se ha inscrito con el id …", las estadísticas pasan a 4 con **edad mínima 0** y el panel a 4 inscritos |
| A6 | Nombre `Luis`, edad `30`, experiencia `7.5` | Se añade con experiencia "avanzada" |
| A7 | En la consola: `validarParticipante({nombre:'Ana', edad:null, tipo:'invitado', modalidad:'online', experiencia:true})` | `esValido: false` con errores en edad y experiencia (null y booleanos no se aceptan como números) |
| A8 | En la consola: `Math.random = () => 0; generarId([{id:100000}])` (recargar después) | Devuelve `null` tras 1000 intentos sin bloquear la pestaña |

### 4.2 Listado y bajas

| Id | Pasos y datos de entrada | Resultado esperado |
|---|---|---|
| B1 | Observar la tarjeta de Ana García | Muestra id 483721, 17 años (menor de edad), estudiante, presencial, experiencia 4 (intermedia), "8 de octubre de 2026 a las 10:30" (hora peninsular), borde naranja. En Elements: `class="tarjeta-participante menor-edad experiencia-intermedia modalidad-presencial"` y `data-id="483721"` |
| B2 | **Dar de baja** en Ana García → **Cancelar** | No cambia nada: 3 tarjetas y las mismas estadísticas |
| B3 | **Dar de baja** en Ana García → **Aceptar** | Desaparece solo esa tarjeta (en Elements las otras dos son los mismos nodos), las estadísticas pasan a 2, el primer menor pasa a "No hay ningún menor de edad" y el panel a 2 inscritos |
| B4 | Dar de baja a todos aceptando | Aviso "No hay participantes inscritos." y estadísticas "Sin datos" |

### 4.3 Búsqueda y filtro

| Id | Pasos y datos de entrada | Resultado esperado |
|---|---|---|
| C1 | Buscar `ELENA` | Solo Elena Belmonte |
| C2 | Buscar `garcia` (sin tilde) | Solo Ana García |
| C3 | Buscar `e` y modalidad **Presencial** | Solo Elena Belmonte (Carlos y Ana no cumplen las dos condiciones) |
| C4 | Buscar `zzz` | Ninguna tarjeta y aviso "Ningún participante coincide con la búsqueda y el filtro." |
| C5 | Con el filtro de C4 activo, mirar las estadísticas | Siguen mostrando 3 participantes (colección completa) |

### 4.4 Estadísticas

| Id | Pasos y datos de entrada | Resultado esperado |
|---|---|---|
| D1 | Carga inicial | Total 3; menores 1; mayores 2; edad media 30.33; mínima 17; máxima 45; presenciales 2; online 1; estudiantes 1, profesionales 1, invitados 1; experiencia media presencial 3.00 ((4 + 2) / 2, se omite a Carlos, que es online); primer menor Ana García |
| D2 | Importar `[]` (ver E6) | Total 0; edad media, mínima, máxima y experiencia presencial "Sin datos"; primer menor "No hay ningún menor de edad"; ningún `NaN` ni `Infinity` |
| D3 | Importar solo participantes online (p. ej. JSON de E7 con modalidad `online` en ambos) | Experiencia media presencial "Sin datos" |

### 4.5 JSON

En todos los casos de error el mensaje termina en "No se ha cambiado nada." y siguen las mismas tarjetas.

| Id | Datos pegados en el área de texto → **Importar** | Resultado esperado |
|---|---|---|
| E1 | **Exportar** | Aparece el array de 3 participantes con sangría |
| E2 | `[{"id": 100000, "nombre": "Prueba"` (JSON mal formado) | "El texto no es JSON válido (…)" |
| E3 | `{"id": 100000}` (no es un array) | "El JSON debe ser un array de participantes." |
| E4 | El JSON de E7 con `"edad": "30"` en el segundo elemento | "Elemento 2: el campo "edad" debe ser numérico." No hay importación parcial: tampoco entra el primer elemento |
| E5 | El JSON de E7 cambiando el id del segundo a `200000` / a `99` / la fecha a `"10/08/2026"` / la edad a `200` (por separado) | Error de id repetido / id fuera de rango / fecha ISO inválida / rango de edad |
| E6 | `[]` | "Importados 0 participantes.", sin tarjetas, aviso de lista vacía, estadísticas "Sin datos" y panel "Sin inscripciones" |
| E7 | `[{"id":200000,"nombre":"Lucía Pérez","edad":30,"tipo":"invitado","modalidad":"online","experiencia":3,"fechaInscripcion":"2026-10-01T10:00:00.000Z"},{"id":200001,"nombre":"Raúl Ortiz","edad":16,"tipo":"estudiante","modalidad":"presencial","experiencia":6.5,"fechaInscripcion":"2026-10-02T09:00:00.000Z"}]` | "Importados 2 participantes."; 2 tarjetas; estadísticas y panel actualizados (más reciente: Raúl Ortiz) |

### 4.6 Panel del evento y mensajes

| Id | Pasos y datos de entrada | Resultado esperado |
|---|---|---|
| F1 | Carga inicial | El panel muestra total 3, presenciales 2, online 1 e inscripción más reciente "Elena Belmonte (10 de octubre de 2026 a las 16:00)" |
| F2 | Hacer un alta, una baja o una importación | El panel se actualiza solo |
| F3 | Mensaje rechazado en el panel. En la consola de la página principal: `document.getElementById('iframe-panel').contentWindow.postMessage({tipo:'resumen-evento', total:'hola'}, location.origin)` | El panel no cambia y no aparece ningún error en la consola |
| F4 | Igual que F3 con `{tipo:'resumen-evento', total:2, modalidades:{presencial:1, online:0}, ultimoInscrito:null}` (las cantidades no suman el total) | Se ignora sin cambios |
| F5 | Mensaje rechazado en la principal: `window.postMessage({tipo:'panel-preparado'}, location.origin)` | Se ignora porque `source` es la propia ventana y no el iframe (se puede comprobar con un punto de interrupción en `recibirMensajeDelPanel`: retorna en la comprobación de `source`) |
| F6 | En Elements, comprobar el `<iframe>` | Tiene `title="Panel resumen del evento: …"` |

### 4.7 Preferencias y cookies

| Id | Pasos y datos de entrada | Resultado esperado |
|---|---|---|
| G1 | Tema **Oscuro**, tamaño **Grande** → **Guardar preferencias** | Se aplican al momento; mensaje "Preferencias aplicadas y guardadas durante 30 días."; en DevTools → Application → Cookies aparecen `dwec_tema=oscuro` y `dwec_tamano=grande` con Path `/`, SameSite `Lax` y caducidad a 30 días |
| G2 | Recargar (F5) | Se mantienen tema oscuro y letra grande, y los desplegables muestran esas opciones |
| G3 | Cookies alteradas: en Application editar `dwec_tema` a `<script>` y `dwec_tamano` a `%E0%A4%A`; recargar | Tema claro y tamaño normal, sin errores en consola |
| G4 | Cookies ausentes: borrar ambas en Application; recargar | Tema claro y tamaño normal |
| G5 | Con preferencias guardadas, pulsar **Restablecer** | Mensaje "Cookies eliminadas. Se aplica tema claro y tamaño normal."; las cookies desaparecen de Application |
| G6 | Cookies bloqueadas: en Chrome, icono del candado → Configuración del sitio → bloquear cookies; recargar y guardar oscuro | Se aplica el tema oscuro y el mensaje indica que solo dura esta visita |

### 4.8 Ayuda

| Id | Pasos y datos de entrada | Resultado esperado |
|---|---|---|
| H1 | **Abrir ayuda** | Se abre `ayuda.html` en una ventana nueva con las instrucciones, el idioma, el origen (p. ej. `http://localhost:8000`) y la resolución de pantalla |
| H2 | Con la ayuda abierta, pulsar otra vez **Abrir ayuda** | No se abre otra ventana: se enfoca la existente y aparece "La ayuda ya estaba abierta." |
| H3 | **Cerrar ayuda** | La ventana se cierra; si se pulsa otra vez aparece "La ayuda no está abierta." |
| H4 | Bloquear ventanas emergentes para el sitio (candado → Configuración del sitio → Ventanas emergentes: Bloquear) y pulsar **Abrir ayuda** | Aviso "El navegador ha bloqueado la ventana de ayuda…" |

---

## 5. Contenidos aplicados de las sesiones 1 a 7

### Sesión 1 · Arquitectura cliente-servidor y carga de scripts

- **Cliente-servidor:** el navegador (cliente) pide por HTTP `index.html` al servidor estático; al analizarlo pide la hoja de estilos, los scripts y `panel.html` (iframe), que a su vez pide su CSS y `panel.js` (ver la evidencia de red). El servidor solo entrega archivos; validación, cálculos y DOM se ejecutan en el cliente.
- **Carga del script:** los cuatro scripts de `index.html` llevan `defer`. Se descargan en paralelo sin bloquear el análisis del HTML y se ejecutan **en orden** (`logica.js` → `cookies.js` → `preferencias.js` → `app.js`) cuando el DOM está completo y antes de `DOMContentLoaded`. Ese orden importa: `app.js` usa funciones de los anteriores. La inicialización se registra con `DOMContentLoaded`, y además se comprueba que existan los elementos (`obtenerElementos` y comprobaciones `!== null`).

### Sesión 2 · Variables, tipos, ámbitos y hoisting

- Solo `const` y `let`; no hay `var`.
- **Ámbitos:** las declaraciones de nivel superior de scripts clásicos comparten el ámbito global (por eso `app.js` ve `TIPOS_VALIDOS` o `validarParticipante` de `logica.js`). `let` y `const` tienen ámbito de bloque: la `i` de cada `for` solo existe dentro del bucle. Los receptores de eventos son clausuras que acceden a `participantes` y `ventanaAyuda`.
- **Hoisting:** las declaraciones `function` se elevan completas. Por eso, al principio de `app.js`, `window.addEventListener('message', recibirMensajeDelPanel)` puede usar una función declarada más abajo. `let` y `const` también se elevan, pero quedan en la *zona muerta temporal* hasta su línea: usar `participantes` antes de su declaración lanzaría `ReferenceError` (con `var` daría `undefined` sin avisar).
- Tipos primitivos (`string`, `number`, `boolean`, `null`, `undefined`) y comprobaciones con `typeof` y `Array.isArray` en toda la validación.

### Sesión 3 · Conversiones, operadores y decisiones

- **Conversiones explícitas:** los valores del formulario y de las cookies llegan como texto; se comprueba la cadena vacía y el formato antes de usar `Number`, y nunca se depende de conversiones implícitas. Siempre `===` y `!==`.
- **Truthy y falsy:** son falsy `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined` y `NaN`; todo lo demás es truthy. Por eso no se escribe `if (!edad)`: la edad `0` es válida y sería falsy. Se usan comparaciones explícitas (`=== null`, `texto === ''`, `Number.isFinite`).
- **`||` frente a `??`:** `a || b` devuelve `b` si `a` es *falsy*; `a ?? b` solo si `a` es `null` o `undefined`. En `renderizarEstadisticas` se usa `e.edadMinima ?? 'Sin datos'`: si la edad mínima es 0, `||` mostraría "Sin datos" por error, mientras que `??` muestra 0 y solo pone "Sin datos" cuando el valor es `null`.
- **Decisiones reales:** `if/else` en `clasificarExperiencia` y `actualizarAvisoListado`; ternario en `clasificarEdad`, `formatearMedia` y `generarId`; `switch` en el conteo por tipo (`calcularEstadisticas`) y en la validación del tema (`normalizarTema`).

### Sesión 4 · Bucles

- `for` clásico: búsqueda del primer menor con `break`; localización del índice al borrar con `break`; recorrido de la colección en `validarColeccion`.
- `for...of`: estadísticas, renderizado, filtros, cookies, mensajes de error.
- `do...while`: `generarId`, con límite de `MAX_INTENTOS_ID` para no bloquear nunca la pestaña.
- `continue`: experiencia media presencial (salta a los online). `break`: primer menor, comprobación de id repetido y búsqueda del índice a borrar.

### Sesión 5 · Objetos predefinidos

- `String`: `trim`, `normalize`, `replace`, `toLowerCase`, `includes`, `startsWith`, `slice`, `split`.
- `Number`: `Number()`, `Number.isInteger`, `Number.isFinite`, `Number.isNaN`, `toFixed(2)`.
- `Math`: `Math.random` y `Math.floor` (ids), `Math.round` (segundos de la cookie).
- `Date`: `new Date().toISOString()` al inscribir, `toLocaleString('es-ES', …)` al mostrar, `getTime` para comparar y validar.
- `JSON`: `stringify` (exportar) y `parse` dentro de `try/catch` (importar).
- `navigator.language`, `location.origin`, `screen.width` y `screen.height` en la ayuda (solo descriptivos).

### Sesión 6 · DOM

- Selección: `getElementById` (elementos fijos), `querySelector` (span de error de un campo concreto, control con `[name=…]`, primer campo inválido para enfocarlo), `querySelectorAll` (limpiar todos los errores y `aria-invalid`, contar las tarjetas visibles).
- Creación con `createElement`, `textContent` y `append`; eliminación con `remove()`; estados con `classList` (`add`, `remove`, `toggle`) y atributos (`dataset`, `setAttribute`, `removeAttribute`). Eventos `submit`, `click`, `input`, `change`, `message` y `DOMContentLoaded`; `preventDefault` en los formularios; delegación de eventos con `closest`.

### Sesión 7 · Ventanas, iframes, mensajería, cookies y restricciones entre orígenes

- Ventanas (`window.open`, `closed`, `focus`, `close`), iframe con `postMessage`, y cookies con sus atributos (apartados 3.9 a 3.11).
- **Restricciones entre orígenes:** un origen es la terna esquema + host + puerto. La *política del mismo origen* impide que una página lea el DOM, las cookies o el almacenamiento de otro origen. `postMessage` es el canal seguro entre contextos: el emisor fija `targetOrigin` para que el mensaje solo se entregue a ese origen (con `"*"` cualquiera podría recibirlo), y el receptor comprueba `event.origin` y `event.source` porque cualquier ventana puede enviarle mensajes. Aunque aquí todas las páginas son del mismo origen, la página principal no rellena el iframe directamente, como pide el enunciado. `SameSite=Lax` evita que las cookies viajen en peticiones de otros sitios (salvo navegaciones de nivel superior) y `Secure` las limita a HTTPS. Con `file://` el origen es opaco (`null`), por eso la práctica se sirve por HTTP.

---

## 6. Evidencias de depuración y de red

> Las capturas se guardan en la carpeta `docs/`. Los datos descritos debajo son los que se observan al reproducir los pasos.

### 6.1 Punto de interrupción (Sources)

![Punto de interrupción en validarParticipante](docs/breakpoint.png)

- **Pasos:** DevTools → Sources → `js/logica.js` → punto de interrupción en la primera línea de `validarParticipante` (la que empieza por `if (datos === null`). En el formulario: nombre `Luis`, edad `18abc`, experiencia `5` → **Inscribir participante**.
- **Qué se observa:** la ejecución se detiene en `validarParticipante`; la pila (*Call Stack*) es `validarParticipante` ← `gestionarAlta`. En *Scope* `datos` vale `{nombre: "Luis", edad: "18abc", tipo: "estudiante", modalidad: "presencial", experiencia: "5"}`: todos los valores llegan como **texto**. En la consola del depurador, `Number(datos.edad)` devuelve `NaN`.
- **Explicación:** confirma que los datos del formulario no son fiables y no son números. Avanzando con *Step over* hasta `const edad = convertirNumero(datos.edad)` se ve que `edad` vale `NaN` porque el patrón rechaza `"18abc"`, y que se añade `errores.edad`.

### 6.2 Petición en la pestaña Network

![Peticiones en la pestaña Network](docs/network.png)

- **Pasos:** DevTools → Network → marcar *Disable cache* → recargar `index.html`.
- **Qué se observa:** todas las peticiones son `GET` con estado `200`: `index.html` (text/html), `css/estilos.css` (text/css), `js/logica.js`, `js/cookies.js`, `js/preferencias.js`, `js/app.js` (text/javascript), `panel.html` (text/html, iniciador: el iframe) y `js/panel.js`. Sin *Disable cache*, la segunda petición de `estilos.css` (la del iframe) aparece como `304 Not Modified` porque el navegador reutiliza su copia.
- **Explicación:** muestra el modelo cliente-servidor del apartado 5: el servidor solo entrega archivos estáticos del mismo origen (`localhost:8000`). No hay errores 404 ni peticiones a otros orígenes. Las altas, bajas, importaciones y mensajes **no generan peticiones**, porque todo ocurre en el navegador.

---

> El enlace debe ser el de *Compartir* (`/share/…`), no el de la barra de direcciones (`/app/…`), porque ese solo lo puede abrir el propietario.

### Decisiones tomadas con ayuda de la IA

| Consulta (chat) | Propuesta de la IA | Decisión y motivo |
|---|---|---|
| Gemini: estructura de los archivos | Calcular estadísticas leyendo el DOM | **Descartada.** La lógica se aisló en `logica.js` con funciones que reciben parámetros, como exige el enunciado; así se pueden probar desde la consola |
| Gemini: generación de tarjetas | Concatenar HTML con `innerHTML` | **Descartada** por el riesgo de XSS con nombres introducidos por el usuario; se usan `createElement`, `textContent` y `append` |
| Gemini: envío del resumen al iframe | Usar `setTimeout` para esperar al iframe | **Descartada.** Se implementó el aviso `panel-preparado`: el iframe avisa cuando su receptor ya está instalado |
| Claude: revisión con pruebas en el navegador | Detectó que `Number(null)` es `0` y que se aceptaban `null`, `true` y `"30"` en el JSON | **Aceptada.** Se añadió `convertirNumero` (comprueba el tipo, la cadena vacía y el formato antes de `Number`) y la comprobación de tipos en `validarColeccion` |
| Claude: revisión | `Date.parse` acepta `"10/08/2026"` y `"2026"` | **Aceptada.** `esFechaIsoValida` exige el formato de `toISOString` y la comprobación de ida y vuelta |
| Claude: revisión | El panel vaciaba su contenido y lanzaba `TypeError` con mensajes incompletos; la principal no comprobaba `source` | **Aceptada.** `esResumenValido` valida todo antes de tocar el DOM; `recibirMensajeDelPanel` comprueba `source === iframe.contentWindow` y la estructura exacta |
| Claude: revisión | Faltaban `querySelector` y `querySelectorAll`; la baja volvía a pintar todo el listado | **Aceptada.** Se usan para los errores por campo y para contar las tarjetas; la baja usa `tarjeta.remove()` |
| Claude: revisión | Las medias se devolvían como texto con `toFixed` | **Aceptada.** `calcularEstadisticas` devuelve números o `null` y la interfaz formatea |
| Claude: revisión | Con `type="number"`, Chrome no deja escribir `18abc` y Firefox entrega una cadena vacía, así que ese caso no llegaba nunca a la validación JavaScript | **Aceptada.** Edad y experiencia pasan a `type="text"` con `inputmode`, y la validación depende solo de JavaScript |
