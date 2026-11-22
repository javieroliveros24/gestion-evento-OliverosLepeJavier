'use strict';

/*
 * cookies.js
 * Lectura, escritura y borrado de cookies. Los valores se codifican al guardar
 * y se descodifican al leer. Todo valor leído se considera no fiable y quien
 * lo use debe validarlo.
 */

/** Atributos comunes: el borrado debe usar exactamente el mismo ámbito que el guardado. */
function atributosCookie(maxAgeSegundos) {
  let atributos = `; Path=/; Max-Age=${maxAgeSegundos}; SameSite=Lax`;
  if (location.protocol === 'https:') {
    atributos += '; Secure';
  }
  return atributos;
}

/**
 * Devuelve el valor descodificado de la cookie o null si no existe, no se puede
 * descodificar o el navegador no permite acceder a las cookies.
 */
function leerCookie(nombre) {
  let cadena;
  try {
    cadena = document.cookie;
  } catch (error) {
    return null;
  }

  const prefijo = `${nombre}=`;
  const partes = cadena.split(';');

  for (const parte of partes) {
    const limpia = parte.trim();
    if (limpia.startsWith(prefijo)) {
      try {
        return decodeURIComponent(limpia.slice(prefijo.length));
      } catch (error) {
        return null; // valor alterado con una secuencia % inválida
      }
    }
  }
  return null;
}

/** Guarda una cookie durante el número de días indicado (Max-Age en segundos). */
function guardarCookie(nombre, valor, dias) {
  const segundos = Math.round(dias * 24 * 60 * 60);
  try {
    document.cookie = `${nombre}=${encodeURIComponent(valor)}${atributosCookie(segundos)}`;
  } catch (error) {
    // Cookies bloqueadas: la interfaz lo detectará al volver a leerlas.
  }
}

/** Elimina una cookie con Max-Age=0 y el mismo ámbito con el que se creó. */
function borrarCookie(nombre) {
  try {
    document.cookie = `${nombre}=${atributosCookie(0)}`;
  } catch (error) {
    // Cookies bloqueadas: no hay nada que borrar.
  }
}
