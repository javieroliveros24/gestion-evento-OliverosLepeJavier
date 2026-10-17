    // Guardamos el origen esperado (protocolo + host + puerto) a partir de la ubicación actual.
    // Al ejecutarse ambos en el mismo servidor local HTTP, location.origin coincide en ambas páginas.
    const origenEsperado = location.origin;

    /**
     * Escuchador global para interceptar los mensajes asíncronos enviados vía postMessage.
     */
    window.addEventListener('message', function (evento) {
    // 1. COMPROBACIÓN DE SEGURIDAD (Origen):
    // Verificamos que el mensaje provenga del mismo origen para prevenir ataques entre sitios.
    if (evento.origin !== origenEsperado) return;

    // 2. COMPROBACIÓN DE SEGURIDAD (Emisor):
    // Comprobamos que la ventana que envió el mensaje sea la ventana padre (la página principal).
    if (evento.source !== window.parent) return;

    // 3. VALIDACIÓN DE LA ESTRUCTURA DE DATOS:
    // Verificamos que los datos recibidos existan, sean un objeto y coincida el tipo de acción.
    const datos = evento.data;
    if (datos === null || typeof datos !== 'object') return;
    if (datos.tipo !== 'resumen-evento') return;

    // Localizamos el contenedor interno del iframe donde pintaremos los datos
    const contenedor = document.getElementById('contenido-panel');
    contenedor.textContent = ''; // Limpiamos el contenido previo de forma segura

    // Si no hay participantes registrados en la aplicación
    if (datos.total === 0) {
        contenedor.textContent = 'Sin inscripciones';
        return;
    }

    // 4. CONSTRUCCIÓN SEGURA DEL DOM DEL PANEL:
    // Creamos la lista y sus elementos con createElement() y textContent para no usar innerHTML.
    const ul = document.createElement('ul');

    // Elemento: Total de participantes
    const liTotal = document.createElement('li');
    liTotal.textContent = 'Total inscritos: ' + datos.total;

    // Elemento: Desglose por modalidad presencial
    const liPresencial = document.createElement('li');
    liPresencial.textContent = 'Presenciales: ' + datos.modalidades.presencial;

    // Elemento: Desglose por modalidad online
    const liOnline = document.createElement('li');
    liOnline.textContent = 'Online: ' + datos.modalidades.online;

    // Elemento: Participante con la fecha de inscripción más reciente
    const liReciente = document.createElement('li');
    if (datos.ultimoInscrito) {
        // Formateamos la fecha ISO recibida al formato local español
        const fechaObj = new Date(datos.ultimoInscrito.fecha);
        const fechaFormat = fechaObj.toLocaleString('es-ES');
        liReciente.textContent = 'Último alta: ' + datos.ultimoInscrito.nombre + ' (' + fechaFormat + ')';
    } else {
        liReciente.textContent = 'Último alta: Sin datos';
    }

    // Insertamos todos los ítems en la lista y la lista dentro del contenedor principal
    ul.append(liTotal, liPresencial, liOnline, liReciente);
    contenedor.append(ul);
    });

    /**
     * PROTOCOLO DE INICIALIZACIÓN:
     * Tan pronto como este script se carga e instala su receptor de mensajes,
     * avisa a la página principal (window.parent) de que está preparado para recibir datos.
     */
    window.parent.postMessage({ tipo: 'iframe-preparado' }, origenEsperado);