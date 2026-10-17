# Javier Oliveros Lepe
# Memoria Técnica y Documentación del Proyecto: Gestor de Participantes de un Evento

- **Asignatura:** Desarrollo Web en Entorno Cliente (DWEC)
- **Unidad Didáctica:** UD1 (Sesiones 1 a 7)
- **Curso Académico:** 2026-2027
- **Fecha Límite de Entrega:** Viernes 16 de Octubre de 2026 a las 23:59
- **Autor / Repositorio:** Proyecto entregado vía GitHub

---

## 1. Guía de Ejecución y Entorno de Desarrollo

Esta aplicación se ha desarrollado utilizando tecnologías estándar del entorno cliente: HTML5, CSS3 y JavaScript moderno en su versión ECMAScript 6+. Toda la lógica del sistema se ejecuta directamente en el navegador web del usuario, sin depender de entornos de ejecución en servidor como Node.js ni de frameworks externos.

### Instrucciones de Despliegue Local mediante Servidor HTTP
Debido a las políticas de seguridad del navegador relacionadas con la Política del Mismo Origen (Same-Origin Policy), el almacenamiento de cookies persistentes, la apertura de contexto mediante scripts y el intercambio de mensajes asíncronos con iframes a través de postMessage, la aplicación debe servirse obligatoriamente mediante el protocolo HTTP o HTTPS. Abrir directamente el documento index.html mediante el protocolo file:// provocará un bloqueo de seguridad por parte del navegador.

#### Opción Recomendada: Live Server en Visual Studio Code
1. Abrir la carpeta raíz del proyecto gestion-evento dentro del editor Visual Studio Code.
2. Hacer clic derecho sobre el archivo index.html en el explorador de archivos.
3. Seleccionar la opción "Open with Live Server".
4. El navegador predeterminado se abrirá automáticamente en la dirección de bucle local http://127.0.0.1:5500/index.html o http://localhost:5500/index.html.

#### Opción Alternativa: Servidor HTTP de Node.js (npx serve)
1. Abrir una terminal o consola de comandos en la ruta raíz del proyecto.
2. Ejecutar el comando: npx serve .
3. Copiar la dirección URL provista en la consola (habitualmente http://localhost:3000) e introducirla en la barra de direcciones del navegador.

---

## 2. Estructura y Arquitectura del Código Fuente

El proyecto se ha organizado siguiendo el principio de separación de responsabilidades. La estructura de archivos del repositorio es la siguiente:

- **index.html**: Documento principal que contiene la estructura semántica de la interfaz del usuario, los formularios de entrada, los contenedores de listados, el panel de estadísticas, el área de intercambio de datos JSON y el elemento iframe incrustado.
- **panel.html**: Documento independiente que se carga dentro del iframe de la página principal. Actúa como un cuadro de mandos con su propio contexto de ejecución y su propio DOM.
- **ayuda.html**: Documento emergente que se abre en un contexto de navegación secundario mediante scripts. Expone información diagnóstica sobre el entorno del navegador.
- **css/estilos.css**: Hoja de estilos encargada de la presentación visual, la disposición adaptable mediante Flexbox/Grid y las reglas de diseño para los temas visuales (claro y oscuro) y tamaños de tipografía.
- **js/logica.js**: Módulo que reúne exclusivamente las funciones puras de la lógica de negocio (validación de datos, generación de identificadores únicos y cálculo numérico de estadísticas). No lee ni modifica el DOM.
- **js/cookies.js**: Módulo encargado de gestionar el almacenamiento persistente en el navegador mediante document.cookie (lectura, escritura codificada y caducidad explícita).
- **js/preferencias.js**: Módulo que controla la carga y aplicación de los temas visuales y dimensiones de letra del usuario en función del almacenamiento de cookies.
- **js/panel.js**: Script que se ejecuta dentro de panel.html. Implementa la escucha de mensajes por postMessage y la renderización de su interfaz interna.
- **js/app.js**: Controlador principal de la interfaz. Coordina los eventos de usuario, interactúa con el DOM, invoca a las funciones de lógica y sincroniza los datos con el iframe.

---

## 3. Justificación y Análisis Técnico de Contenidos (Sesiones 1 a 7)

### Sesión 1: Arquitectura Web Navegador y Carga de Scripts
La aplicación responde al modelo cliente-servidor, donde el navegador actúa como cliente solicitando recursos y ejecutando código dentro de un entorno aislado de seguridad (sandbox). Para evitar el bloqueo del analizador HTML (HTML Parser) durante la descarga de los archivos JavaScript, todos los elementos script presentes en el documento index.html incorporan el atributo defer. Esto garantiza que la descarga del código se realice en paralelo al análisis del documento y que la ejecución se posponga hasta que el DOM esté completamente construido en memoria, evitando que selecciones como document.getElementById devuelvan valores nulos.

### Sesión 2: Declaraciones, Tipos Primitivos y Operadores
Se ha erradicado el uso de var debido a sus problemas de ámbito de función y comportamiento poco intuitivo ante el hoisting. En su lugar, se emplea const como primera opción para todos los identificadores que no requieren reasignación, expresando la inmutabilidad de la vinculación. Cuando una variable requiere cambiar su valor a lo largo del tiempo (como contadores y acumuladores), se declara explícitamente mediante let respetando el ámbito de bloque. Las operaciones aritméticas evitan conversiones no deseadas aplicando Number() a las entradas recibidas como texto desde los controles del formulario.

### Sesión 3: Conversiones, Operaciones Lógicas y Toma de Decisiones
Las comparaciones de igualdad utilizan de forma estricta el operador triple (===) y su desigualdad correspondiente (!==), evitando las conversiones implícitas de tipos que suceden con el operador doble (==). En las evaluaciones condicionales, se contemplan los valores falsy (0, cadena vacía, null, undefined, NaN y false) frente a los valores truthy. Cuando la aplicación debe diferenciar entre un valor omitido (null/undefined) y un valor numérico cero (0, considerado válido para la edad o experiencia), se aplica el operador de coalescencia nula (??) o comprobaciones explícitas en lugar del operador disyuntivo ordinario (||). Las estructuras de decisión incluyen bloques if/else para bifurcaciones complejas, un operador ternario para asignaciones condicionales simples de estatus y un bloque switch para contabilizar las tipologías de inscritos.

### Sesión 4: Control de Flujo Mediante Bucles
Para el procesamiento iterativo de datos se emplean diversas estructuras de repetición adaptadas a cada necesidad:
- Bucle for...of: Se utiliza para recorrer la colección de participantes en el cálculo de estadísticas y en la renderización del listado.
- Bucle do...while: Se aplica en la función de generación de identificadores aleatorios, asegurando que el código genere un número y compruebe su duplicidad al menos una vez, incluyendo un límite máximo de intentos para prevenir bucles infinitos.
- Instrucción continue: Dentro del cálculo de la experiencia media presencial, el bucle evalúa si la modalidad es online; de ser así, la instrucción continue salta inmediatamente a la siguiente iteración sin sumar los datos.
- Instrucción break: En la búsqueda del primer participante menor de edad dentro de la colección, una vez localizado el primer caso que cumple la condición, la instrucción break interrumpe inmediatamente el bucle for para optimizar el rendimiento.

### Sesión 5: Objetos Predefinidos de JavaScript y del Navegador
- Math: Utilizado mediante Math.random() y Math.floor() dentro de la fórmula de generación de números enteros comprendidos en el rango de 100000 a 999999.
- Date: Empleado para registrar el instante exacto de alta de cada participante en formato de texto estándar ISO (toISOString()) y para formatear la representación visual a la configuración regional española mediante toLocaleString('es-ES').
- JSON: Aplicado a través de JSON.stringify() para serializar la colección de objetos a texto plano y JSON.parse() para la importación. Las operaciones de lectura se envuelven en bloques try...catch para capturar errores de sintaxis y prevenir la caída de la aplicación.
- Objetos del Navegador: La ventana emergente de ayuda utiliza propiedades del entorno cliente como navigator.language (idioma del navegador), location.origin (origen del documento) y screen.width junto a screen.height (resolución del monitor).

### Sesión 6: Manipulación Dinámica del Modelo de Objetos del Documento (DOM)
La representación de los participantes en la interfaz se realiza mediante la creación explícita de nodos en memoria con document.createElement(). La inserción de información textual proveniente de entradas de usuario se realiza estrictamente a través de la propiedad textContent. Se ha descartado intencionadamente el uso de innerHTML para la renderización de datos con el objetivo de eliminar cualquier vector de ataque por Inyección de Código de Terceros (Cross-Site Scripting - XSS). La gestión de estilos se apoya en classList.add(), classList.remove() y classList.toggle(), mientras que la inclusión y eliminación de nodos en el documento visual se efectúa con append() y remove().

### Sesión 7: Contextos de Navegación, Mensajería y Cookies
- Ventanas Secundarias: La apertura de la ventana ayuda.html se realiza mediante window.open(), guardando la referencia devuelta en una variable global. Se evalúa la propiedad closed para evitar aperturas duplicadas y enfocar la ventana existente mediante focus(), permitiendo además su cierre controlado desde la ventana principal con window.close().
- Mensajería con Iframe: El intercambio de datos con el documento incrustado panel.html se realiza mediante postMessage. El receptor valida de forma estricta que evento.origin coincida con location.origin y que evento.source provenga del contexto esperado (window.parent o visor.contentWindow), rechazando mensajes anónimos o provenientes de orígenes no autorizados.
- API de Cookies: La persistencia de preferencias de interfaz (tema visual y dimensión de fuente) se gestiona asignando cadenas formateadas a document.cookie. Cada cookie incluye los atributos Path=/, SameSite=Lax, Secure (cuando la conexión es HTTPS) y una caducidad explícita Max-Age expresada en segundos (2592000 segundos para 30 días de duración). La eliminación de cookies se realiza reescribiendo la clave con el mismo ámbito y estableciendo Max-Age=0.

---

## 4. Casos de Prueba y Protocolo de Verificación

A continuación se detallan los procedimientos de prueba desarrollados para verificar el correcto funcionamiento de cada requisito de la práctica:

### Prueba de Validación de Formulario (Entradas Incorrectas)
- Procedimiento: En el formulario de alta de participantes, introducir el nombre " A " (un solo carácter tras eliminar espacios), la edad "-5" y la experiencia "12". Pulsar el botón de registro.
- Resultado Esperado: El script detiene el envío del formulario. En la sección de errores se muestran tres mensajes detallados indicando que el nombre debe tener entre 2 y 60 caracteres, la edad debe ser un entero entre 0 y 120, y la experiencia debe ser una cifra entre 0 y 10. No se crea ninguna tarjeta en el DOM ni se altera la colección en memoria.

### Prueba de Validación de Formulario (Límites Mínimos Válidos)
- Procedimiento: Introducir el nombre "Marta Gómez", edad "0", seleccionar tipo "estudiante", modalidad "online" y experiencia "0". Pulsar el botón de registro.
- Resultado Esperado: La aplicación acepta la entrada. Se genera un identificador único de 6 dígitos, la edad 0 es clasificada como menor de edad y se dibuja la tarjeta correspondiente. Se recalculan las estadísticas globales y se transmite el nuevo estado al iframe mediante postMessage. El formulario se limpia automáticamente.

### Prueba de Cancelación de Baja de Inscrito
- Procedimiento: Ubicar una tarjeta de participante existente en el listado y hacer clic en su botón "Eliminar". Cuando aparezca el cuadro de diálogo modal del navegador (confirm), hacer clic en "Cancelar".
- Resultado Esperado: La llamada a confirm() devuelve false. La tarjeta permanece intacta en el documento HTML, la colección en memoria no sufre modificaciones y las estadísticas se mantienen invariables.

### Prueba de Confirmación de Baja de Inscrito
- Procedimiento: Hacer clic en el botón "Eliminar" de una tarjeta y en el diálogo modal confirm hacer clic en "Aceptar".
- Resultado Esperado: La llamada a confirm() devuelve true. El elemento HTML correspondiente a la tarjeta es eliminado del DOM mediante la función remove(), el participante es filtrado del array en memoria y las estadísticas globales (totales, promedios y contadores) se actualizan inmediatamente.

### Prueba de Filtro de Búsqueda Sin Coincidencias
- Procedimiento: En el campo de búsqueda por nombre escribir "TextoInexistente" y en el selector de modalidad seleccionar "Online".
- Resultado Esperado: Todas las tarjetas del contenedor se ocultan. La aplicación remueve la clase de ocultación del elemento p con id msg-sin-coincidencias, informando visualmente al usuario de que no hay participantes que cumplan los criterios. El panel de estadísticas superior sigue mostrando los datos de la colección completa.

### Prueba de Importación de JSON Mal Formado
- Procedimiento: Pegar en el área de texto de datos el siguiente fragmento incompleto: [{"id": 100000, "nombre": "Prueba". Pulsar el botón "Importar JSON".
- Resultado Esperado: La función JSON.parse() lanza un error de sintaxis que es capturado por el bloque catch. Se muestra un mensaje de error explicativo en pantalla. La colección previa de participantes se conserva íntegramente en memoria sin sufrir ninguna pérdida parcial de datos.

### Prueba de Importación de JSON con Estructura Inválida
- Procedimiento: Pegar en el área de texto un objeto único en lugar de un array: {"id": 100000, "nombre": "Juan", "edad": 25, "tipo": "profesional", "modalidad": "presencial", "experiencia": 5, "fechaInscripcion": "2026-10-10T10:00:00.000Z"}. Pulsar "Importar JSON".
- Resultado Esperado: La validación detecta que la estructura no responde a un Array mediante Array.isArray(). Se interrumpe el proceso, se muestra el mensaje de error correspondiente y se mantiene intacto el estado previo.

### Prueba de Importación de Array Vacío
- Procedimiento: Pegar en el área de texto la cadena [] y pulsar "Importar JSON".
- Resultado Esperado: La aplicación vacía la colección de participantes. El listado de tarjetas se limpia, el panel de estadísticas pasa a mostrar "Sin datos" o valores en 0, y el iframe recibe la actualización mostrando el mensaje "Sin inscripciones".

### Prueba de Persistencia de Preferencias Mediante Cookies
- Procedimiento: Seleccionar en el formulario de preferencias el Tema "Oscuro" y el Tamaño de Letra "Grande". Pulsar "Guardar Preferencias". Verificar en las Herramientas de Desarrollo (F12 -> Pestaña Almacenamiento/Cookies) que existen dos entradas dwec_tema y dwec_tamano. Recargar la página mediante F5.
- Resultado Esperado: Al recargar, el script ejecuta cargarPreferenciasIniciales(), lee las cookies, aplica las clases body.oscuro y body.grande al documento y ajusta los valores seleccionados en los elementos select.

### Prueba de Manipulación de Cookies con Valores No Permitidos
- Procedimiento: Abrir F12 en el navegador, acceder a las cookies almacenadas y modificar manualmente el valor de dwec_tema introduciendo la cadena "tema_invalido". Recargar la página con F5.
- Resultado Esperado: La función de lectura evalúa la entrada y, al comprobar mediante un operador ternario que el valor no es estrictamente "oscuro", asigna la opción por defecto "claro", evitando la inyección de clases CSS no controladas.

---

## 5. Uso de Herramientas de Inteligencia Artificial y Análisis de Decisiones

Durante el desarrollo de la práctica se utilizó una Inteligencia Artificial como asistente de consulta técnica, generación de estructuras base y revisión de código.

### Decisiones de Diseño Tomadas a Partir de la Interacción con la IA:
1. **Separación de Funciones de Lógica e Interfaz:** La propuesta inicial sugería incluir la lectura del DOM dentro de las funciones de cálculo. Se decidió separar el código en módulos, aislando la lógica pura en logica.js para cumplir con las restricciones del enunciado.
2. **Eliminación del Uso de innerHTML:** Inicialmente la IA generó fragmentos de código que concatenaban cadenas HTML para construir las tarjetas. La propuesta fue rechazada y sustituida por el uso de document.createElement(), textContent y append() para prevenir riesgos de seguridad XSS.
3. **Mecanismo de Sincronización con el Iframe:** Se descartó el uso de temporizadores arbitrarios (setTimeout) para enviar datos al iframe. En su lugar, se implementó un protocolo de saludo donde el iframe notifica que su receptor está preparado (iframe-preparado) antes de que la página principal le envíe el primer paquete de datos.

---

## 6. Evidencias de Depuración e Inspección Técnicas

### Evidencia 1: Punto de Interrupción (Breakpoint) en la Pestaña Sources
- Configuración: Se ha colocado un punto de interrupción en la primera línea de la función validarParticipante(datos) dentro del archivo js/logica.js.
- Explicación Técnica: Al enviar el formulario de alta, la ejecución se detiene antes de procesar los datos. Al inspeccionar el panel Scope en DevTools, se observa que la propiedad edad recibida desde el control input de tipo number es de tipo String ("25"). Esto confirma la necesidad de realizar comprobaciones sobre cadenas vacías y aplicar conversiones explícitas con Number() antes de proceder a la validación matemática.

### Evidencia 2: Inspección de Red en la Pestaña Network
- Configuración: Registro de peticiones durante la carga inicial de la página.
- Explicación Técnica: La pestaña Network muestra la petición HTTP GET del recurso panel.html con un código de respuesta 200 OK y tipo de contenido text/html. Se verifica que todos los recursos estáticos (estilos CSS y archivos JavaScript externos con atributo defer) se cargan sin errores de tipo 404 ni bloqueos por políticas de orígenes cruzados.

---

## 7. Código Fuente Completo del Proyecto

A continuación se adjunta el código fuente íntegro de todos los archivos que componen la aplicación:

### Archivo: index.html
```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gestor de Participantes - Evento Tecnológico</title>
  <link rel="stylesheet" href="css/estilos.css">
  <script src="js/logica.js" defer></script>
  <script src="js/cookies.js" defer></script>
  <script src="js/preferencias.js" defer></script>
  <script src="js/app.js" defer></script>
</head>
<body>
  <header>
    <h1>Gestor de Participantes de Eventos</h1>
    <nav>
      <button id="btn-ayuda" type="button">Abrir Ayuda</button>
      <button id="btn-cerrar-ayuda" type="button">Cerrar Ayuda</button>
    </nav>
  </header>

  <main>
    <section class="caja-seccion">
      <h2>Preferencias Visuales</h2>
      <form id="form-preferencias">
        <label for="select-tema">Tema Visual:</label>
        <select id="select-tema">
          <option value="claro">Claro</option>
          <option value="oscuro">Oscuro</option>
        </select>

        <label for="select-tamano">Tamaño de Fuente:</label>
        <select id="select-tamano">
          <option value="normal">Normal</option>
          <option value="grande">Grande</option>
        </select>

        <button type="submit">Guardar Preferencias</button>
        <button id="btn-restablecer-pref" type="button">Restablecer</button>
      </form>
      <p id="msg-preferencias" role="status"></p>
    </section>

    <section class="caja-seccion">
      <h2>Alta de Participante</h2>
      <form id="form-alta" novalidate>
        <label for="nombre">Nombre Completo:</label>
        <input id="nombre" name="nombre" required>

        <label for="edad">Edad:</label>
        <input id="edad" type="number" name="edad" min="0" max="120" required>

        <label for="tipo">Tipo de Participante:</label>
        <select id="tipo" name="tipo">
          <option value="estudiante">Estudiante</option>
          <option value="profesional">Profesional</option>
          <option value="invitado">Invitado</option>
        </select>

        <label for="modalidad">Modalidad:</label>
        <select id="modalidad" name="modalidad">
          <option value="presencial">Presencial</option>
          <option value="online">Online</option>
        </select>

        <label for="experiencia">Años de Experiencia (0-10):</label>
        <input id="experiencia" type="number" step="0.1" name="experiencia" required>

        <button type="submit">Registrar Participante</button>
      </form>
      <div id="errores-alta" class="mensajes-error" role="alert"></div>
    </section>

    <section class="caja-seccion">
      <h2>Filtros y Búsqueda</h2>
      <input id="busqueda-nombre" placeholder="Buscar por nombre...">
      <select id="filtro-modalidad">
        <option value="todas">Todas las modalidades</option>
        <option value="presencial">Presencial</option>
        <option value="online">Online</option>
      </select>
    </section>

    <section class="caja-seccion">
      <h2>Listado de Inscritos</h2>
      <div id="contenedor-tarjetas"></div>
      <p id="msg-sin-coincidencias" class="oculto">No se encontraron participantes con los filtros seleccionados.</p>
    </section>

    <section class="caja-seccion">
      <h2>Estadísticas Globales</h2>
      <div id="panel-stats"></div>
    </section>

    <section class="caja-seccion">
      <h2>Intercambio de Datos (JSON)</h2>
      <textarea id="json-area" rows="6" placeholder="Pega o exporta el JSON aquí..."></textarea>
      <div>
        <button id="btn-exportar" type="button">Exportar JSON</button>
        <button id="btn-importar" type="button">Importar JSON</button>
      </div>
      <p id="msg-json-estado" role="status"></p>
    </section>

    <section class="caja-seccion">
      <h2>Panel del Evento (Iframe)</h2>
      <iframe id="iframe-panel" src="panel.html" title="Panel de Resumen del Evento"></iframe>
    </section>
  </main>
</body>
</html>