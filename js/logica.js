    /**
     * Valida los datos recibidos desde un formulario, JSON o cookie.
     * Devuelve un objeto con la validez global y los mensajes de error por campo.
     */
    function validarParticipante(datos) {
    const errores = [];

    // 1. Nombre: entre 2 y 60 caracteres tras aplicar trim()
    const nombreLimpio = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
    if (nombreLimpio.length < 2 || nombreLimpio.length > 60) {
        errores.push('El nombre debe tener entre 2 y 60 caracteres.');
    }

    // 2. Edad: no vacía, numérico, entero, finito y entre 0 y 120 (0 es válida)
    const esEdadTextoVacio = typeof datos.edad === 'string' && datos.edad.trim() === '';
    const edadNum = Number(datos.edad);
    if (esEdadTextoVacio || !Number.isInteger(edadNum) || edadNum < 0 || edadNum > 120) {
        errores.push('La edad debe ser un número entero entre 0 y 120.');
    }

    // 3. Tipos validos "estudiante", "profesional" o "invitado"
    const tiposValidos = ['estudiante', 'profesional', 'invitado'];
    if (!tiposValidos.includes(datos.tipo)) {
        errores.push('El tipo de participante no es válido.');
    }

    // 4. Modalidad: únicamente "presencial" u "online"
    const modalidadesValidas = ['presencial', 'online'];
    if (!modalidadesValidas.includes(datos.modalidad)) {
        errores.push('La modalidad debe ser presencial u online.');
    }

    // 5. Experiencia: numérico, finito, entre 0 y 10 (se admiten decimales)
    const esExpTextoVacio = typeof datos.experiencia === 'string' && datos.experiencia.trim() === '';
    const expNum = Number(datos.experiencia);
    if (esExpTextoVacio || Number.isNaN(expNum) || !Number.isFinite(expNum) || expNum < 0 || expNum > 10) {
        errores.push('La experiencia debe ser un valor numérico entre 0 y 10.');
    }

    return {
        esValido: errores.length === 0,
        errores: errores
    };
    }

    /**
     * Genera un ID entero aleatorio entre 100000 y 999999 garantizando que no esté duplicado.
     * Utiliza un bucle do...while con límite de seguridad de intentos para evitar bloqueos.
     */
    function generarId(participantes) {
    let nuevoId;
    let existe;
    let intentos = 0;
    const maxIntentos = 1000;

    do {
        nuevoId = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
        
        existe = false;
        for (let i = 0; i < participantes.length; i++) {
        if (participantes[i].id === nuevoId) {
            existe = true;
            break;
        }
        }
        intentos++;
    } while (existe && intentos < maxIntentos);

    if (intentos >= maxIntentos) {
        throw new Error('No se pudo generar un ID único en el rango permitido.');
    }

    return nuevoId;
    }

    /**
     * Recorre la colección de participantes para calcular agregaciones estadísticas.
     * Sin usar Array.prototype.reduce().
     */
    function calcularEstadisticas(participantes) {
    if (!participantes || participantes.length === 0) {
        return {
        total: 0,
        menores: 0,
        mayores: 0,
        edadMedia: 'Sin datos',
        edadMinima: 'Sin datos',
        edadMaxima: 'Sin datos',
        modalidades: { presencial: 0, online: 0 },
        tipos: { estudiante: 0, profesional: 0, invitado: 0 },
        expMediaPresencial: 'Sin datos',
        primerMenor: 'Ninguno'
        };
    }

    let total = participantes.length;
    let menores = 0;
    let mayores = 0;
    let sumaEdad = 0;
    let edadMin = Infinity;
    let edadMax = -Infinity;

    const modalidades = { presencial: 0, online: 0 };
    const tipos = { estudiante: 0, profesional: 0, invitado: 0 };

    let sumaExpPresencial = 0;
    let contPresencial = 0;

    for (const p of participantes) {
        sumaEdad += p.edad;
        if (p.edad < edadMin) edadMin = p.edad;
        if (p.edad > edadMax) edadMax = p.edad;

        if (p.edad < 18) {
        menores++;
        } else {
        mayores++;
        }

        if (modalidades[p.modalidad] !== undefined) {
        modalidades[p.modalidad]++;
        }

        switch (p.tipo) {
        case 'estudiante':
            tipos.estudiante++;
            break;
        case 'profesional':
            tipos.profesional++;
            break;
        case 'invitado':
            tipos.invitado++;
            break;
        }

        if (p.modalidad === 'online') {
        continue;
        }
        sumaExpPresencial += p.experiencia;
        contPresencial++;
    }

    let primerMenor = 'Ninguno';
    for (let i = 0; i < participantes.length; i++) {
        if (participantes[i].edad < 18) {
        primerMenor = participantes[i].nombre;
        break;
        }
    }

    const edadMediaCalculada = (sumaEdad / total).toFixed(2);
    const expPresencialCalculada = contPresencial > 0 
        ? (sumaExpPresencial / contPresencial).toFixed(2) 
        : 'Sin datos';

    return {
        total,
        menores,
        mayores,
        edadMedia: edadMediaCalculada,
        edadMinima: edadMin,
        edadMaxima: edadMax,
        modalidades,
        tipos,
        expMediaPresencial: expPresencialCalculada,
        primerMenor
    };
    }