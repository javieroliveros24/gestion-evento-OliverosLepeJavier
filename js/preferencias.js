'use strict';

/*
 * preferencias.js
 * Tema (claro/oscuro) y tamaño de letra (normal/grande) guardados en dos
 * cookies independientes durante 30 días.
 */

const COOKIE_TEMA = 'dwec_tema';
const COOKIE_TAMANO = 'dwec_tamano';
const TEMA_POR_DEFECTO = 'claro';
const TAMANO_POR_DEFECTO = 'normal';
const DIAS_PREFERENCIAS = 30;

/** Devuelve el tema si es una opción válida; si no, el tema por defecto. */
function normalizarTema(valor) {
  switch (valor) {
    case 'claro':
    case 'oscuro':
      return valor;
    default:
      return TEMA_POR_DEFECTO;
  }
}

/** Devuelve el tamaño si es una opción válida; si no, el tamaño por defecto. */
function normalizarTamano(valor) {
  return valor === 'normal' || valor === 'grande' ? valor : TAMANO_POR_DEFECTO;
}

/** Aplica las clases al <body> y sincroniza los desplegables del formulario. */
function aplicarPreferencias(tema, tamano) {
  document.body.classList.toggle('oscuro', tema === 'oscuro');
  document.body.classList.toggle('grande', tamano === 'grande');

  const selectorTema = document.getElementById('select-tema');
  const selectorTamano = document.getElementById('select-tamano');
  if (selectorTema !== null) {
    selectorTema.value = tema;
  }
  if (selectorTamano !== null) {
    selectorTamano.value = tamano;
  }
}

/** Lee las cookies al cargar la página, valida los valores y los aplica. */
function cargarPreferenciasIniciales() {
  const tema = normalizarTema(leerCookie(COOKIE_TEMA));
  const tamano = normalizarTamano(leerCookie(COOKIE_TAMANO));
  aplicarPreferencias(tema, tamano);
}

/**
 * Aplica las preferencias y trata de guardarlas. Devuelve true si al volver a
 * leer las cookies contienen exactamente lo guardado.
 */
function guardarPreferencias(temaElegido, tamanoElegido) {
  const tema = normalizarTema(temaElegido);
  const tamano = normalizarTamano(tamanoElegido);
  aplicarPreferencias(tema, tamano);

  guardarCookie(COOKIE_TEMA, tema, DIAS_PREFERENCIAS);
  guardarCookie(COOKIE_TAMANO, tamano, DIAS_PREFERENCIAS);

  return leerCookie(COOKIE_TEMA) === tema && leerCookie(COOKIE_TAMANO) === tamano;
}

/**
 * Elimina ambas cookies y aplica los valores predeterminados. Devuelve true si
 * al volver a leerlas ya no existen.
 */
function restablecerPreferencias() {
  borrarCookie(COOKIE_TEMA);
  borrarCookie(COOKIE_TAMANO);
  aplicarPreferencias(TEMA_POR_DEFECTO, TAMANO_POR_DEFECTO);

  return leerCookie(COOKIE_TEMA) === null && leerCookie(COOKIE_TAMANO) === null;
}
