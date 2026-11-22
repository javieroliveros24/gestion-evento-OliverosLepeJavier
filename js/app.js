'use strict';

/*
 * app.js
 * Código de interfaz: eventos, lectura y escritura del DOM, comunicación con
 * el iframe y con la ventana de ayuda. Usa las funciones puras de logica.js.
 */

const ORIGEN_APP = location.origin;

let participantes = [
  {
    id: 483721,
    nombre: 'Ana García',
    edad: 17,
    tipo: 'estudiante',
    modalidad: 'presencial',
    experiencia: 4,
    fechaInscripcion: '2026-10-08T08:30:00.000Z'
  },
  {
    id: 100201,
    nombre: 'Carlos Mendoza',
    edad: 29,
    tipo: 'profesional',
    modalidad: 'online',
    experiencia: 8.5,
    fechaInscripcion: '2026-10-09T10:15:00.000Z'
  },
  {
    id: 304958,
    nombre: 'Elena Belmonte',
    edad: 45,
    tipo: 'invitado',
    modalidad: 'presencial',
    experiencia: 2,
    fechaInscripcion: '2026-10-10T14:00:00.000Z'
  }
];

let ventanaAyuda = null;
let panelPreparado = false;
let ui = null; // referencias a los elementos del DOM, se rellena al iniciar

// El receptor se instala en cuanto se ejecuta este script (antes de
// DOMContentLoaded) para no perder el aviso "panel-preparado" del iframe.
window.addEventListener('message', recibirMensajeDelPanel);
document.addEventListener('DOMContentLoaded', iniciarAplicacion);

/* ---------- Utilidades de formato ---------- */

/** Fecha ISO -> texto en formato español, p. ej. "8 de octubre de 2026, 10:30". */
function formatearFecha(iso) {
  return new Date(iso).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' });
}

/** Medias con dos decimales; "Sin datos" cuando no hay valor (nunca NaN). */
function formatearMedia(valor) {
  return valor === null ? 'Sin datos' : valor.toFixed(2);
}

/** Muestra un mensaje de estado con su clase (exito, error o info). */
function mostrarMensaje(elemento, texto, clase) {
  elemento.textContent = texto;
  elemento.classList.remove('exito', 'error', 'info');
  elemento.classList.add(clase);
}

/* ---------- Inicio ---------- */

/** Busca todos los elementos necesarios; devuelve null si falta alguno. */
function obtenerElementos() {
  const ids = {
    formAlta: 'form-alta',
    resumenErrores: 'resumen-errores',
    msgAlta: 'msg-alta',
    estadisticas: 'panel-estadisticas',
    busqueda: 'busqueda-nombre',
    filtroModalidad: 'filtro-modalidad',
    msgListado: 'msg-listado',
    contenedor: 'contenedor-tarjetas',
    jsonArea: 'json-area',
    btnExportar: 'btn-exportar',
    btnImportar: 'btn-importar',
    msgJson: 'msg-json',
    iframe: 'iframe-panel',
    formPreferencias: 'form-preferencias',
    btnRestablecer: 'btn-restablecer',
    msgPreferencias: 'msg-preferencias',
    btnAyuda: 'btn-ayuda',
    btnCerrarAyuda: 'btn-cerrar-ayuda',
    msgAyuda: 'msg-ayuda'
  };

  const encontrados = {};
  for (const clave of Object.keys(ids)) {
    const elemento = document.getElementById(ids[clave]);
    if (elemento === null) {
      console.warn(`No se encuentra el elemento #${ids[clave]}; la aplicación no se inicia.`);
      return null;
    }
    encontrados[clave] = elemento;
  }
  return encontrados;
}

function iniciarAplicacion() {
  cargarPreferenciasIniciales();

  ui = obtenerElementos();
  if (ui === null) {
    return;
  }

  ui.formAlta.addEventListener('submit', gestionarAlta);
  ui.contenedor.addEventListener('click', gestionarClicEnListado);
  ui.busqueda.addEventListener('input', renderizarListado);
  ui.filtroModalidad.addEventListener('change', renderizarListado);
  ui.btnExportar.addEventListener('click', exportarJson);
  ui.btnImportar.addEventListener('click', importarJson);
  ui.formPreferencias.addEventListener('submit', gestionarGuardarPreferencias);
  ui.btnRestablecer.addEventListener('click', gestionarRestablecerPreferencias);
  ui.btnAyuda.addEventListener('click', abrirAyuda);
  ui.btnCerrarAyuda.addEventListener('click', cerrarAyuda);

  actualizarTodo();
}

/** Tras un alta o una importación: listado, estadísticas y panel. */
function actualizarTodo() {
  renderizarListado();
  renderizarEstadisticas();
  enviarResumenAlPanel();
}

/* ---------- Alta ---------- */

function limpiarErroresFormulario() {
  for (const span of ui.formAlta.querySelectorAll('.error-campo')) {
    span.textContent = '';
  }
  for (const control of ui.formAlta.querySelectorAll('[aria-invalid="true"]')) {
    control.removeAttribute('aria-invalid');
  }
  ui.resumenErrores.textContent = '';
  ui.resumenErrores.classList.add('oculto');
}

/** Muestra cada error junto a su campo y en un resumen visible. */
function mostrarErroresFormulario(errores) {
  const lista = document.createElement('ul');

  for (const campo of Object.keys(errores)) {
    const span = ui.formAlta.querySelector(`[data-error-de="${campo}"]`);
    const control = ui.formAlta.querySelector(`[name="${campo}"]`);
    if (span !== null) {
      span.textContent = errores[campo];
    }
    if (control !== null) {
      control.setAttribute('aria-invalid', 'true');
    }
    const item = document.createElement('li');
    item.textContent = errores[campo];
    lista.append(item);
  }

  const titulo = document.createElement('p');
  titulo.textContent = 'No se ha inscrito al participante. Revise estos datos:';
  ui.resumenErrores.append(titulo, lista);
  ui.resumenErrores.classList.remove('oculto');

  const primerInvalido = ui.formAlta.querySelector('[aria-invalid="true"]');
  if (primerInvalido !== null) {
    primerInvalido.focus();
  }
}

function gestionarAlta(evento) {
  evento.preventDefault();
  limpiarErroresFormulario();
  ui.msgAlta.textContent = '';

  // Los valores del formulario llegan siempre como texto y no son fiables.
  const datos = {
    nombre: ui.formAlta.elements.nombre.value,
    edad: ui.formAlta.elements.edad.value,
    tipo: ui.formAlta.elements.tipo.value,
    modalidad: ui.formAlta.elements.modalidad.value,
    experiencia: ui.formAlta.elements.experiencia.value
  };

  const validacion = validarParticipante(datos);
  if (!validacion.esValido) {
    mostrarErroresFormulario(validacion.errores); // los valores escritos se conservan
    return;
  }

  const id = generarId(participantes);
  if (id === null) {
    mostrarMensaje(ui.msgAlta, 'No se ha podido generar un identificador libre. Inténtelo de nuevo.', 'error');
    return;
  }

  const nuevo = {
    id: id,
    nombre: validacion.participante.nombre,
    edad: validacion.participante.edad,
    tipo: validacion.participante.tipo,
    modalidad: validacion.participante.modalidad,
    experiencia: validacion.participante.experiencia,
    fechaInscripcion: new Date().toISOString()
  };

  participantes.push(nuevo);
  ui.formAlta.reset();
  actualizarTodo();
  mostrarMensaje(ui.msgAlta, `${nuevo.nombre} se ha inscrito con el id ${nuevo.id}.`, 'exito');
  ui.formAlta.elements.nombre.focus();
}

/* ---------- Listado y bajas ---------- */

function crearFilaDato(lista, termino, valor) {
  const dt = document.createElement('dt');
  const dd = document.createElement('dd');
  dt.textContent = termino;
  dd.textContent = valor;
  lista.append(dt, dd);
}

/** Crea la tarjeta de un participante con createElement, textContent y append. */
function crearTarjeta(participante) {
  const claseEdad = clasificarEdad(participante.edad);
  const nivel = clasificarExperiencia(participante.experiencia);
  const textoEdad = claseEdad === 'menor' ? 'Menor de edad' : 'Mayor de edad';

  const tarjeta = document.createElement('article');
  tarjeta.classList.add(
    'tarjeta-participante',
    claseEdad === 'menor' ? 'menor-edad' : 'mayor-edad',
    `experiencia-${nivel}`,
    `modalidad-${participante.modalidad}`
  );
  tarjeta.dataset.id = String(participante.id);
  tarjeta.dataset.edad = claseEdad;
  tarjeta.dataset.experiencia = nivel;

  const titulo = document.createElement('h3');
  titulo.textContent = participante.nombre;

  const etiquetas = document.createElement('p');
  etiquetas.classList.add('etiquetas');
  const etiquetaEdad = document.createElement('span');
  etiquetaEdad.classList.add('etiqueta', `etiqueta-${claseEdad}`);
  etiquetaEdad.textContent = textoEdad;
  const etiquetaNivel = document.createElement('span');
  etiquetaNivel.classList.add('etiqueta', `etiqueta-${nivel}`);
  etiquetaNivel.textContent = `Experiencia ${nivel}`;
  etiquetas.append(etiquetaEdad, etiquetaNivel);

  const datos = document.createElement('dl');
  datos.classList.add('lista-datos');
  crearFilaDato(datos, 'Id', String(participante.id));
  crearFilaDato(datos, 'Edad', `${participante.edad} años (${textoEdad.toLowerCase()})`);
  crearFilaDato(datos, 'Tipo', participante.tipo);
  crearFilaDato(datos, 'Modalidad', participante.modalidad);
  crearFilaDato(datos, 'Experiencia', `${participante.experiencia} (${nivel})`);
  crearFilaDato(datos, 'Inscripción', formatearFecha(participante.fechaInscripcion));

  const boton = document.createElement('button');
  boton.type = 'button';
  boton.classList.add('peligro');
  boton.dataset.accion = 'borrar';
  boton.textContent = 'Dar de baja';
  boton.setAttribute('aria-label', `Dar de baja a ${participante.nombre}`);

  tarjeta.append(titulo, etiquetas, datos, boton);
  return tarjeta;
}

/** Vuelve a pintar las tarjetas que cumplen la búsqueda y el filtro. */
function renderizarListado() {
  const busqueda = ui.busqueda.value;
  const modalidad = ui.filtroModalidad.value;

  ui.contenedor.textContent = '';
  for (const participante of participantes) {
    if (cumpleFiltros(participante, busqueda, modalidad)) {
      ui.contenedor.append(crearTarjeta(participante));
    }
  }
  actualizarAvisoListado();
}

/** Informa de lista vacía o de búsqueda sin coincidencias. */
function actualizarAvisoListado() {
  const visibles = ui.contenedor.querySelectorAll('.tarjeta-participante').length;

  if (participantes.length === 0) {
    ui.msgListado.textContent = 'No hay participantes inscritos.';
    ui.msgListado.classList.remove('oculto');
  } else if (visibles === 0) {
    ui.msgListado.textContent = 'Ningún participante coincide con la búsqueda y el filtro.';
    ui.msgListado.classList.remove('oculto');
  } else {
    ui.msgListado.textContent = '';
    ui.msgListado.classList.add('oculto');
  }
}

/** Delegación de eventos: un único receptor para todos los botones de baja. */
function gestionarClicEnListado(evento) {
  const boton = evento.target.closest('button[data-accion="borrar"]');
  if (boton === null) {
    return;
  }
  const tarjeta = boton.closest('.tarjeta-participante');
  if (tarjeta === null) {
    return;
  }
  borrarParticipante(Number(tarjeta.dataset.id), tarjeta);
}

function borrarParticipante(id, tarjeta) {
  let indice = -1;
  for (let i = 0; i < participantes.length; i++) {
    if (participantes[i].id === id) {
      indice = i;
      break;
    }
  }
  if (indice === -1) {
    return;
  }

  const nombre = participantes[indice].nombre;
  if (!confirm(`¿Seguro que quiere dar de baja a ${nombre}?`)) {
    return; // cancelar no cambia nada
  }

  participantes.splice(indice, 1); // quita solo ese dato de la colección
  tarjeta.remove();                // y solo su tarjeta del DOM
  actualizarAvisoListado();
  renderizarEstadisticas();
  enviarResumenAlPanel();
}

/* ---------- Estadísticas ---------- */

function renderizarEstadisticas() {
  const e = calcularEstadisticas(participantes);
  ui.estadisticas.textContent = '';

  crearFilaDato(ui.estadisticas, 'Total de participantes', String(e.total));
  crearFilaDato(ui.estadisticas, 'Menores de edad', String(e.menores));
  crearFilaDato(ui.estadisticas, 'Mayores de edad', String(e.mayores));
  crearFilaDato(ui.estadisticas, 'Edad media', formatearMedia(e.edadMedia));
  // ?? y no ||: una edad mínima de 0 años es un dato válido y || la convertiría en "Sin datos".
  crearFilaDato(ui.estadisticas, 'Edad mínima', String(e.edadMinima ?? 'Sin datos'));
  crearFilaDato(ui.estadisticas, 'Edad máxima', String(e.edadMaxima ?? 'Sin datos'));
  crearFilaDato(ui.estadisticas, 'Presenciales', String(e.modalidades.presencial));
  crearFilaDato(ui.estadisticas, 'Online', String(e.modalidades.online));
  crearFilaDato(ui.estadisticas, 'Estudiantes', String(e.tipos.estudiante));
  crearFilaDato(ui.estadisticas, 'Profesionales', String(e.tipos.profesional));
  crearFilaDato(ui.estadisticas, 'Invitados', String(e.tipos.invitado));
  crearFilaDato(ui.estadisticas, 'Experiencia media presencial', formatearMedia(e.experienciaMediaPresencial));
  crearFilaDato(ui.estadisticas, 'Primer menor de edad', e.primerMenor ?? 'No hay ningún menor de edad');
}

/* ---------- JSON ---------- */

function exportarJson() {
  ui.jsonArea.value = JSON.stringify(participantes, null, 2);
  mostrarMensaje(ui.msgJson, `Exportados ${participantes.length} participantes.`, 'info');
}

function importarJson() {
  let datos;
  try {
    datos = JSON.parse(ui.jsonArea.value);
  } catch (error) {
    mostrarMensaje(ui.msgJson, `El texto no es JSON válido (${error.message}). No se ha cambiado nada.`, 'error');
    return;
  }

  const resultado = validarColeccion(datos);
  if (!resultado.esValido) {
    mostrarMensaje(ui.msgJson, `${resultado.error} No se ha cambiado nada.`, 'error');
    return;
  }

  participantes = resultado.participantes;
  actualizarTodo();
  mostrarMensaje(ui.msgJson, `Importados ${participantes.length} participantes.`, 'exito');
}

/* ---------- Panel en iframe (postMessage) ---------- */

/** Solo acepta el aviso "panel-preparado" del propio iframe y del mismo origen. */
function recibirMensajeDelPanel(evento) {
  const iframe = document.getElementById('iframe-panel');
  if (iframe === null) {
    return;
  }
  if (evento.origin !== ORIGEN_APP) {
    return;
  }
  if (evento.source !== iframe.contentWindow) {
    return;
  }

  const datos = evento.data;
  if (datos === null || typeof datos !== 'object' || Array.isArray(datos)) {
    return;
  }
  if (Object.keys(datos).length !== 1 || datos.tipo !== 'panel-preparado') {
    return;
  }

  panelPreparado = true;
  enviarResumenAlPanel();
}

/** Envía el resumen al panel con un targetOrigin concreto (nunca "*"). */
function enviarResumenAlPanel() {
  if (!panelPreparado) {
    return; // se enviará cuando el panel avise de que está listo
  }
  const iframe = document.getElementById('iframe-panel');
  if (iframe === null || iframe.contentWindow === null) {
    return;
  }
  iframe.contentWindow.postMessage(crearResumenPanel(participantes), ORIGEN_APP);
}

/* ---------- Preferencias ---------- */

function gestionarGuardarPreferencias(evento) {
  evento.preventDefault();
  const tema = document.getElementById('select-tema').value;
  const tamano = document.getElementById('select-tamano').value;

  const guardadas = guardarPreferencias(tema, tamano);
  if (guardadas) {
    mostrarMensaje(ui.msgPreferencias, 'Preferencias aplicadas y guardadas durante 30 días.', 'exito');
  } else {
    mostrarMensaje(ui.msgPreferencias, 'Preferencias aplicadas solo durante esta visita: el navegador no ha guardado las cookies.', 'info');
  }
}

function gestionarRestablecerPreferencias() {
  const borradas = restablecerPreferencias();
  if (borradas) {
    mostrarMensaje(ui.msgPreferencias, 'Cookies eliminadas. Se aplica tema claro y tamaño normal.', 'exito');
  } else {
    mostrarMensaje(ui.msgPreferencias, 'Se aplica tema claro y tamaño normal, pero las cookies no se han podido eliminar.', 'error');
  }
}

/* ---------- Ventana de ayuda ---------- */

function abrirAyuda() {
  if (ventanaAyuda !== null && !ventanaAyuda.closed) {
    ventanaAyuda.focus(); // se reutiliza la ventana abierta
    mostrarMensaje(ui.msgAyuda, 'La ayuda ya estaba abierta.', 'info');
    return;
  }

  ventanaAyuda = window.open('ayuda.html', 'ayuda-gestor', 'width=640,height=680');
  if (ventanaAyuda === null) {
    mostrarMensaje(ui.msgAyuda, 'El navegador ha bloqueado la ventana de ayuda. Permita las ventanas emergentes para este sitio.', 'error');
  } else {
    ui.msgAyuda.textContent = '';
  }
}

function cerrarAyuda() {
  if (ventanaAyuda !== null && !ventanaAyuda.closed) {
    ventanaAyuda.close();
    mostrarMensaje(ui.msgAyuda, 'Ayuda cerrada.', 'info');
  } else {
    mostrarMensaje(ui.msgAyuda, 'La ayuda no está abierta.', 'info');
  }
  ventanaAyuda = null;
}
