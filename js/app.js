    let participantes = [
    {
        id: 483721,
        nombre: "Ana García",
        edad: 17,
        tipo: "estudiante",
        modalidad: "presencial",
        experiencia: 4,
        fechaInscripcion: "2026-10-08T08:30:00.000Z"
    },
    {
        id: 100201,
        nombre: "Carlos Mendoza",
        edad: 29,
        tipo: "profesional",
        modalidad: "online",
        experiencia: 8.5,
        fechaInscripcion: "2026-10-09T10:15:00.000Z"
    },
    {
        id: 304958,
        nombre: "Elena Belmonte",
        edad: 45,
        tipo: "invitado",
        modalidad: "presencial",
        experiencia: 2,
        fechaInscripcion: "2026-10-10T14:00:00.000Z"
    }
    ];

    let ventanaAyuda = null;

    function crearTarjeta(p) {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'tarjeta-participante';
    tarjeta.dataset.id = p.id;

    const esMenor = p.edad < 18;
    tarjeta.classList.add(esMenor ? 'menor-edad' : 'mayor-edad');

    let expClasificacion = 'inicial';
    if (p.experiencia >= 4 && p.experiencia < 7) {
        expClasificacion = 'intermedia';
    } else if (p.experiencia >= 7) {
        expClasificacion = 'avanzada';
    }

    const h3 = document.createElement('h3');
    h3.textContent = p.nombre;

    const pInfo = document.createElement('p');
    const fechaObj = new Date(p.fechaInscripcion);
    const fechaEspanol = fechaObj.toLocaleString('es-ES');

    pInfo.textContent = `ID: ${p.id} | Edad: ${p.edad} (${esMenor ? 'Menor' : 'Mayor'}) | ` +
                        `Tipo: ${p.tipo} | Modalidad: ${p.modalidad} | ` +
                        `Exp: ${p.experiencia} (${expClasificacion}) | Fecha: ${fechaEspanol}`;

    const btnBorrar = document.createElement('button');
    btnBorrar.textContent = 'Eliminar';
    btnBorrar.type = 'button';
    btnBorrar.addEventListener('click', function () {
        const confirmar = confirm(`¿Está seguro de que desea eliminar a ${p.nombre}?`);
        if (confirmar) {
        participantes = participantes.filter(item => item.id !== p.id);
        actualizarAplicacionCompleta();
        }
    });

    tarjeta.append(h3, pInfo, btnBorrar);
    return tarjeta;
    }

    function renderizarListado() {
    const contenedor = document.getElementById('contenedor-tarjetas');
    const msgSinCoincidencias = document.getElementById('msg-sin-coincidencias');
    contenedor.textContent = '';

    const textoBusqueda = document.getElementById('busqueda-nombre').value.toLowerCase().trim();
    const filtroMod = document.getElementById('filtro-modalidad').value;

    let contVisibles = 0;

    for (const p of participantes) {
        const coincideNombre = p.nombre.toLowerCase().includes(textoBusqueda);
        const coincideModalidad = filtroMod === 'todas' || p.modalidad === filtroMod;

        if (coincideNombre && coincideModalidad) {
        contenedor.append(crearTarjeta(p));
        contVisibles++;
        }
    }

    if (contVisibles === 0) {
        msgSinCoincidencias.classList.remove('oculto');
    } else {
        msgSinCoincidencias.classList.add('oculto');
    }
    }

    function renderizarEstadisticas() {
    const stats = calcularEstadisticas(participantes);
    const contenedor = document.getElementById('panel-stats');
    contenedor.textContent = '';

    const ul = document.createElement('ul');

    const items = [
        `Total inscritos: ${stats.total} (Menores: ${stats.menores}, Mayores: ${stats.mayores})`,
        `Edad media: ${stats.edadMedia} | Mínima: ${stats.edadMinima} | Máxima: ${stats.edadMaxima}`,
        `Modalidades -> Presencial: ${stats.modalidades.presencial}, Online: ${stats.modalidades.online}`,
        `Tipos -> Estudiantes: ${stats.tipos.estudiante}, Profesionales: ${stats.tipos.profesional}, Invitados: ${stats.tipos.invitado}`,
        `Experiencia media (Presencial): ${stats.expMediaPresencial}`,
        `Primer menor de edad encontrado: ${stats.primerMenor}`
    ];

    for (const texto of items) {
        const li = document.createElement('li');
        li.textContent = texto;
        ul.append(li);
    }

    contenedor.append(ul);
    }

    function notificarIframe() {
    const iframe = document.getElementById('iframe-panel');
    if (!iframe || !iframe.contentWindow) return;

    const stats = calcularEstadisticas(participantes);

    let ultimoInscrito = null;
    if (participantes.length > 0) {
        ultimoInscrito = participantes[0];
        for (let i = 1; i < participantes.length; i++) {
        if (new Date(participantes[i].fechaInscripcion) > new Date(ultimoInscrito.fechaInscripcion)) {
            ultimoInscrito = participantes[i];
        }
        }
    }

    const mensajeData = {
        tipo: 'resumen-evento',
        total: stats.total,
        modalidades: stats.modalidades,
        ultimoInscrito: ultimoInscrito ? {
        nombre: ultimoInscrito.nombre,
        fecha: ultimoInscrito.fechaInscripcion
        } : null
    };

    iframe.contentWindow.postMessage(mensajeData, location.origin);
    }

    function actualizarAplicacionCompleta() {
    renderizarListado();
    renderizarEstadisticas();
    notificarIframe();
    }

    document.addEventListener('DOMContentLoaded', function () {
    cargarPreferenciasIniciales();

    const formAlta = document.getElementById('form-alta');
    formAlta.addEventListener('submit', function (evento) {
        evento.preventDefault();
        const contenedorErrores = document.getElementById('errores-alta');
        contenedorErrores.textContent = '';

        const datosFormulario = {
        nombre: document.getElementById('nombre').value,
        edad: document.getElementById('edad').value,
        tipo: document.getElementById('tipo').value,
        modalidad: document.getElementById('modalidad').value,
        experiencia: document.getElementById('experiencia').value
        };

        const resultadoVal = validarParticipante(datosFormulario);

        if (!resultadoVal.esValido) {
        for (const err of resultadoVal.errores) {
            const pErr = document.createElement('p');
            pErr.textContent = err;
            contenedorErrores.append(pErr);
        }
        return;
        }

        try {
        const nuevoParticipante = {
            id: generarId(participantes),
            nombre: datosFormulario.nombre.trim(),
            edad: Number(datosFormulario.edad),
            tipo: datosFormulario.tipo,
            modalidad: datosFormulario.modalidad,
            experiencia: Number(datosFormulario.experiencia),
            fechaInscripcion: new Date().toISOString()
        };

        participantes.push(nuevoParticipante);
        formAlta.reset();
        actualizarAplicacionCompleta();
        } catch (err) {
        const pErr = document.createElement('p');
        pErr.textContent = err.message;
        contenedorErrores.append(pErr);
        }
    });

    document.getElementById('busqueda-nombre').addEventListener('input', renderizarListado);
    document.getElementById('filtro-modalidad').addEventListener('change', renderizarListado);

    document.getElementById('btn-exportar').addEventListener('click', function () {
        const area = document.getElementById('json-area');
        area.value = JSON.stringify(participantes, null, 2);
    });

    document.getElementById('btn-importar').addEventListener('click', function () {
        const area = document.getElementById('json-area');
        const msgEstado = document.getElementById('msg-json-estado');
        msgEstado.textContent = '';

        try {
        const importados = JSON.parse(area.value);

        if (!Array.isArray(importados)) {
            throw new Error('El contenido JSON debe ser un array de objetos.');
        }

        const idsVistos = new Set();
        const participantesValidados = [];

        for (const p of importados) {
            if (!p || typeof p !== 'object') throw new Error('Elemento inválido en el array.');

            if (!Number.isInteger(p.id) || p.id < 100000 || p.id > 999999 || idsVistos.has(p.id)) {
            throw new Error(`ID ${p.id} no es válido o está duplicado.`);
            }
            idsVistos.add(p.id);

            if (typeof p.fechaInscripcion !== 'string' || Number.isNaN(Date.parse(p.fechaInscripcion))) {
            throw new Error(`Fecha ISO inválida para el participante ID ${p.id}`);
            }

            const val = validarParticipante(p);
            if (!val.esValido) {
            throw new Error(`Error en participante ID ${p.id}: ${val.errores.join(', ')}`);
            }

            participantesValidados.push({
            id: p.id,
            nombre: p.nombre.trim(),
            edad: Number(p.edad),
            tipo: p.tipo,
            modalidad: p.modalidad,
            experiencia: Number(p.experiencia),
            fechaInscripcion: p.fechaInscripcion
            });
        }

        participantes = participantesValidados;
        actualizarAplicacionCompleta();
        msgEstado.textContent = 'Importación realizada con éxito.';
        msgEstado.className = 'exito';
        } catch (error) {
        msgEstado.textContent = 'Error al importar JSON: ' + error.message;
        msgEstado.className = 'error';
        }
    });

    const formPref = document.getElementById('form-preferencias');
    formPref.addEventListener('submit', function (e) {
        e.preventDefault();
        const tema = document.getElementById('select-tema').value;
        const tamano = document.getElementById('select-tamano').value;
        const msgPref = document.getElementById('msg-preferencias');

        aplicarPreferenciasVisuales(tema, tamano);
        guardarCookie('dwec_tema', tema, 30);
        guardarCookie('dwec_tamano', tamano, 30);

        const guardadasOk = leerCookie('dwec_tema') === tema && leerCookie('dwec_tamano') === tamano;
        msgPref.textContent = guardadasOk 
        ? 'Preferencias aplicadas y guardadas correctamente.' 
        : 'Preferencias aplicadas (Las cookies están deshabilitadas).';
    });

    document.getElementById('btn-restablecer-pref').addEventListener('click', function () {
        borrarCookie('dwec_tema');
        borrarCookie('dwec_tamano');
        cargarPreferenciasIniciales();
        document.getElementById('msg-preferencias').textContent = 'Preferencias restablecidas por defecto.';
    });

    document.getElementById('btn-ayuda').addEventListener('click', function () {
        if (ventanaAyuda === null || ventanaAyuda.closed) {
        ventanaAyuda = window.open('ayuda.html', 'VentanaAyuda', 'width=500,height=400');
        if (ventanaAyuda === null) {
            alert('La apertura de la ventana fue bloqueada por el navegador.');
        }
        } else {
        ventanaAyuda.focus();
        }
    });

    document.getElementById('btn-cerrar-ayuda').addEventListener('click', function () {
        if (ventanaAyuda !== null && !ventanaAyuda.closed) {
        ventanaAyuda.close();
        ventanaAyuda = null;
        }
    });

    window.addEventListener('message', function (evento) {
        if (evento.origin !== location.origin) return;
        if (evento.data && evento.data.tipo === 'iframe-preparado') {
        notificarIframe();
        }
    });

    actualizarAplicacionCompleta();
    });