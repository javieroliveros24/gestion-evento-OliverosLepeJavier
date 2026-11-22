'use strict';

/*
 * logica.js
 * Lógica de negocio pura: validación, generación de identificadores,
 * clasificaciones y estadísticas. NINGUNA función de este archivo lee ni
 * modifica el DOM: reciben los datos por parámetro y devuelven un resultado.
 */

const TIPOS_VALIDOS = ['estudiante', 'profesional', 'invitado'];
const MODALIDADES_VALIDAS = ['presencial', 'online'];
const ID_MINIMO = 100000;
const ID_MAXIMO = 999999;
const MAX_INTENTOS_ID = 1000;

// Solo dígitos con parte decimal opcional separada por punto.
// Rechaza "18abc", "1e1", "0x10", "-5" o "Infinity" antes de llamar a Number.
const PATRON_NUMERO = /^\d+(\.\d+)?$/;

// Formato exacto que produce Date.prototype.toISOString().
const PATRON_FECHA_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/**
 * Convierte un valor no fiable en número de forma explícita.
 * - number: se devuelve tal cual (los rangos y NaN/Infinity se comprueban después).
 * - string: se comprueba primero que no esté vacía y que tenga formato numérico.
 * - cualquier otro tipo (null, boolean, array, objeto): NaN.
 */
function convertirNumero(valor) {
  if (typeof valor === 'number') {
    return valor;
  }
  if (typeof valor !== 'string') {
    return NaN;
  }
  const texto = valor.trim();
  if (texto === '' || !PATRON_NUMERO.test(texto)) {
    return NaN;
  }
  return Number(texto);
}

/**
 * Valida los datos de un participante (formulario o JSON).
 * Devuelve { esValido, errores, participante }:
 * - errores: objeto con un mensaje por cada campo incorrecto.
 * - participante: datos normalizados (nombre sin espacios extremos, números
 *   convertidos) o null si hay errores.
 */
function validarParticipante(datos) {
  if (datos === null || typeof datos !== 'object' || Array.isArray(datos)) {
    return {
      esValido: false,
      errores: { general: 'Los datos del participante no son un objeto.' },
      participante: null
    };
  }

  const errores = {};

  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
  if (nombre.length < 2 || nombre.length > 60) {
    errores.nombre = 'El nombre debe tener entre 2 y 60 caracteres.';
  }

  const edad = convertirNumero(datos.edad);
  if (!Number.isFinite(edad) || !Number.isInteger(edad) || edad < 0 || edad > 120) {
    errores.edad = 'La edad debe ser un número entero entre 0 y 120.';
  }

  const tipo = typeof datos.tipo === 'string' ? datos.tipo : '';
  if (!TIPOS_VALIDOS.includes(tipo)) {
    errores.tipo = 'El tipo debe ser estudiante, profesional o invitado.';
  }

  const modalidad = typeof datos.modalidad === 'string' ? datos.modalidad : '';
  if (!MODALIDADES_VALIDAS.includes(modalidad)) {
    errores.modalidad = 'La modalidad debe ser presencial u online.';
  }

  const experiencia = convertirNumero(datos.experiencia);
  if (!Number.isFinite(experiencia) || experiencia < 0 || experiencia > 10) {
    errores.experiencia = 'La experiencia debe ser un número entre 0 y 10 (use punto para los decimales).';
  }

  const esValido = Object.keys(errores).length === 0;
  return {
    esValido: esValido,
    errores: errores,
    participante: esValido ? { nombre, edad, tipo, modalidad, experiencia } : null
  };
}

/** Indica si un valor es un identificador entero dentro del rango permitido. */
function esIdValido(id) {
  return Number.isInteger(id) && id >= ID_MINIMO && id <= ID_MAXIMO;
}

/**
 * Comprueba que un texto sea una fecha ISO real (formato toISOString) y no
 * algo que Date.parse acepte por tolerancia, como "10/08/2026" o "2026".
 * La conversión de ida y vuelta descarta fechas imposibles como el 31 de febrero.
 */
function esFechaIsoValida(texto) {
  if (typeof texto !== 'string' || !PATRON_FECHA_ISO.test(texto)) {
    return false;
  }
  const fecha = new Date(texto);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString() === texto;
}

/**
 * Genera un identificador entero entre 100000 y 999999 que no exista en la
 * colección. Repite con do...while un máximo de MAX_INTENTOS_ID veces para no
 * bloquear nunca la pestaña. Devuelve null si no lo consigue.
 */
function generarId(participantes) {
  let intentos = 0;
  let candidato;
  let repetido;

  do {
    candidato = Math.floor(Math.random() * (ID_MAXIMO - ID_MINIMO + 1)) + ID_MINIMO;
    repetido = false;
    for (const participante of participantes) {
      if (participante.id === candidato) {
        repetido = true;
        break;
      }
    }
    intentos++;
  } while (repetido && intentos < MAX_INTENTOS_ID);

  return repetido ? null : candidato;
}

/**
 * Valida una colección completa recibida por JSON. Solo devuelve participantes
 * si TODOS los elementos son correctos (no hay importaciones parciales).
 * Devuelve { esValido, error, participantes }.
 */
function validarColeccion(datos) {
  if (!Array.isArray(datos)) {
    return { esValido: false, error: 'El JSON debe ser un array de participantes.', participantes: null };
  }

  const camposTexto = ['nombre', 'tipo', 'modalidad', 'fechaInscripcion'];
  const camposNumero = ['id', 'edad', 'experiencia'];
  const idsVistos = new Set();
  const resultado = [];

  for (let i = 0; i < datos.length; i++) {
    const elemento = datos[i];
    const posicion = `Elemento ${i + 1}`;

    if (elemento === null || typeof elemento !== 'object' || Array.isArray(elemento)) {
      return { esValido: false, error: `${posicion}: no es un objeto.`, participantes: null };
    }

    for (const campo of camposTexto) {
      if (typeof elemento[campo] !== 'string') {
        return { esValido: false, error: `${posicion}: el campo "${campo}" debe ser texto.`, participantes: null };
      }
    }
    for (const campo of camposNumero) {
      if (typeof elemento[campo] !== 'number') {
        return { esValido: false, error: `${posicion}: el campo "${campo}" debe ser numérico.`, participantes: null };
      }
    }

    if (!esIdValido(elemento.id)) {
      return { esValido: false, error: `${posicion}: el id debe ser un entero entre ${ID_MINIMO} y ${ID_MAXIMO}.`, participantes: null };
    }
    if (idsVistos.has(elemento.id)) {
      return { esValido: false, error: `${posicion}: el id ${elemento.id} está repetido.`, participantes: null };
    }
    if (!esFechaIsoValida(elemento.fechaInscripcion)) {
      return { esValido: false, error: `${posicion}: la fecha de inscripción no es una fecha ISO válida.`, participantes: null };
    }

    const validacion = validarParticipante(elemento);
    if (!validacion.esValido) {
      const mensajes = Object.values(validacion.errores).join(' ');
      return { esValido: false, error: `${posicion}: ${mensajes}`, participantes: null };
    }

    idsVistos.add(elemento.id);
    resultado.push({
      id: elemento.id,
      nombre: validacion.participante.nombre,
      edad: validacion.participante.edad,
      tipo: validacion.participante.tipo,
      modalidad: validacion.participante.modalidad,
      experiencia: validacion.participante.experiencia,
      fechaInscripcion: elemento.fechaInscripcion
    });
  }

  return { esValido: true, error: '', participantes: resultado };
}

/** Clasificación por edad: 'menor' (< 18) o 'mayor'. */
function clasificarEdad(edad) {
  return edad < 18 ? 'menor' : 'mayor';
}

/** Clasificación de la experiencia: inicial [0, 4), intermedia [4, 7), avanzada [7, 10]. */
function clasificarExperiencia(experiencia) {
  if (experiencia < 4) {
    return 'inicial';
  } else if (experiencia < 7) {
    return 'intermedia';
  } else {
    return 'avanzada';
  }
}

/**
 * Calcula las estadísticas sobre la colección COMPLETA mediante bucles,
 * contadores y acumuladores (sin reduce). Las medias y extremos se devuelven
 * como números, o null cuando no hay datos; el formato lo decide la interfaz.
 */
function calcularEstadisticas(participantes) {
  const estadisticas = {
    total: 0,
    menores: 0,
    mayores: 0,
    edadMedia: null,
    edadMinima: null,
    edadMaxima: null,
    modalidades: { presencial: 0, online: 0 },
    tipos: { estudiante: 0, profesional: 0, invitado: 0 },
    experienciaMediaPresencial: null,
    primerMenor: null
  };

  let sumaEdades = 0;

  for (const participante of participantes) {
    estadisticas.total++;
    sumaEdades += participante.edad;

    if (clasificarEdad(participante.edad) === 'menor') {
      estadisticas.menores++;
    } else {
      estadisticas.mayores++;
    }

    if (estadisticas.edadMinima === null || participante.edad < estadisticas.edadMinima) {
      estadisticas.edadMinima = participante.edad;
    }
    if (estadisticas.edadMaxima === null || participante.edad > estadisticas.edadMaxima) {
      estadisticas.edadMaxima = participante.edad;
    }

    if (participante.modalidad === 'presencial') {
      estadisticas.modalidades.presencial++;
    } else {
      estadisticas.modalidades.online++;
    }

    switch (participante.tipo) {
      case 'estudiante':
        estadisticas.tipos.estudiante++;
        break;
      case 'profesional':
        estadisticas.tipos.profesional++;
        break;
      case 'invitado':
        estadisticas.tipos.invitado++;
        break;
    }
  }

  if (estadisticas.total > 0) {
    estadisticas.edadMedia = sumaEdades / estadisticas.total;
  }

  // Experiencia media de los presenciales: continue omite a los online.
  let sumaExperiencia = 0;
  let presenciales = 0;
  for (const participante of participantes) {
    if (participante.modalidad === 'online') {
      continue;
    }
    sumaExperiencia += participante.experiencia;
    presenciales++;
  }
  estadisticas.experienciaMediaPresencial = presenciales > 0 ? sumaExperiencia / presenciales : null;

  // Primer menor de edad en el orden de la colección: break al encontrarlo.
  for (let i = 0; i < participantes.length; i++) {
    if (clasificarEdad(participantes[i].edad) === 'menor') {
      estadisticas.primerMenor = participantes[i].nombre;
      break;
    }
  }

  return estadisticas;
}

/**
 * Prepara el mensaje que se envía al panel del iframe: total, cantidades por
 * modalidad y participante con la fecha de inscripción más reciente.
 */
function crearResumenPanel(participantes) {
  const estadisticas = calcularEstadisticas(participantes);
  let masReciente = null;
  let instanteMasReciente = -Infinity;

  for (const participante of participantes) {
    const instante = new Date(participante.fechaInscripcion).getTime();
    if (instante > instanteMasReciente) {
      instanteMasReciente = instante;
      masReciente = participante;
    }
  }

  return {
    tipo: 'resumen-evento',
    total: estadisticas.total,
    modalidades: {
      presencial: estadisticas.modalidades.presencial,
      online: estadisticas.modalidades.online
    },
    ultimoInscrito: masReciente === null
      ? null
      : { nombre: masReciente.nombre, fechaInscripcion: masReciente.fechaInscripcion }
  };
}

/** Normaliza un texto para buscar: sin espacios extremos, sin tildes y en minúsculas. */
function normalizarTexto(texto) {
  return texto.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Indica si un participante cumple la búsqueda por nombre y el filtro de modalidad. */
function cumpleFiltros(participante, busqueda, modalidad) {
  const coincideNombre = normalizarTexto(participante.nombre).includes(normalizarTexto(busqueda));
  const coincideModalidad = modalidad === 'todas' || participante.modalidad === modalidad;
  return coincideNombre && coincideModalidad;
}
