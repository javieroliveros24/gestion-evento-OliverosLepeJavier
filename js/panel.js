'use strict';

/*
 * panel.js (se ejecuta dentro del iframe)
 * Recibe el resumen por postMessage, lo valida por completo y construye su
 * propio DOM. La página principal nunca accede a este documento.
 */

const ORIGEN_PANEL = location.origin;
const PATRON_ISO_PANEL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function esObjeto(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

function esEnteroNoNegativo(valor) {
  return Number.isInteger(valor) && valor >= 0;
}

/** Comprueba estructura, tipos y valores del mensaje antes de usarlo. */
function esResumenValido(datos) {
  if (!esObjeto(datos) || datos.tipo !== 'resumen-evento') {
    return false;
  }
  if (!esEnteroNoNegativo(datos.total) || !esObjeto(datos.modalidades)) {
    return false;
  }

  const presencial = datos.modalidades.presencial;
  const online = datos.modalidades.online;
  if (!esEnteroNoNegativo(presencial) || !esEnteroNoNegativo(online) || presencial + online !== datos.total) {
    return false;
  }

  if (datos.total === 0) {
    return datos.ultimoInscrito === null;
  }

  const ultimo = datos.ultimoInscrito;
  if (!esObjeto(ultimo) || typeof ultimo.nombre !== 'string' || typeof ultimo.fechaInscripcion !== 'string') {
    return false;
  }
  const longitud = ultimo.nombre.trim().length;
  if (longitud < 2 || longitud > 60 || !PATRON_ISO_PANEL.test(ultimo.fechaInscripcion)) {
    return false;
  }
  return !Number.isNaN(new Date(ultimo.fechaInscripcion).getTime());
}

/** Construye el contenido del panel a partir de un resumen ya validado. */
function pintarResumen(datos) {
  const contenedor = document.getElementById('contenido-panel');
  if (contenedor === null) {
    return;
  }
  contenedor.textContent = '';

  if (datos.total === 0) {
    const vacio = document.createElement('p');
    vacio.classList.add('sin-datos');
    vacio.textContent = 'Sin inscripciones';
    contenedor.append(vacio);
    return;
  }

  const lista = document.createElement('dl');
  lista.classList.add('lista-datos');
  const filas = [
    ['Total de inscritos', String(datos.total)],
    ['Presenciales', String(datos.modalidades.presencial)],
    ['Online', String(datos.modalidades.online)],
    ['Inscripción más reciente', `${datos.ultimoInscrito.nombre} (${new Date(datos.ultimoInscrito.fechaInscripcion).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })})`]
  ];

  for (const [termino, valor] of filas) {
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = termino;
    dd.textContent = valor;
    lista.append(dt, dd);
  }
  contenedor.append(lista);
}

window.addEventListener('message', function (evento) {
  if (evento.origin !== ORIGEN_PANEL) {
    return;
  }
  if (evento.source !== window.parent) {
    return;
  }
  if (!esResumenValido(evento.data)) {
    return; // mensajes inválidos: se ignoran sin tocar la interfaz
  }
  pintarResumen(evento.data);
});

// Con el receptor ya instalado, avisa a la página principal de que está listo.
if (window.parent !== window) {
  window.parent.postMessage({ tipo: 'panel-preparado' }, ORIGEN_PANEL);
}
