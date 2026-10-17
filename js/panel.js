    const origenEsperado = location.origin;

    window.addEventListener('message', function (evento) {
    if (evento.origin !== origenEsperado) return;
    if (evento.source !== window.parent) return;

    const datos = evento.data;
    if (datos === null || typeof datos !== 'object') return;
    if (datos.tipo !== 'resumen-evento') return;

    const contenedor = document.getElementById('contenido-panel');
    contenedor.textContent = '';

    if (datos.total === 0) {
        contenedor.textContent = 'Sin inscripciones';
        return;
    }

    const ul = document.createElement('ul');

    const liTotal = document.createElement('li');
    liTotal.textContent = 'Total inscritos: ' + datos.total;

    const liPresencial = document.createElement('li');
    liPresencial.textContent = 'Presenciales: ' + datos.modalidades.presencial;

    const liOnline = document.createElement('li');
    liOnline.textContent = 'Online: ' + datos.modalidades.online;

    const liReciente = document.createElement('li');
    if (datos.ultimoInscrito) {
        const fechaObj = new Date(datos.ultimoInscrito.fecha);
        const fechaFormat = fechaObj.toLocaleString('es-ES');
        liReciente.textContent = 'Último alta: ' + datos.ultimoInscrito.nombre + ' (' + fechaFormat + ')';
    } else {
        liReciente.textContent = 'Último alta: Sin datos';
    }

    ul.append(liTotal, liPresencial, liOnline, liReciente);
    contenedor.append(ul);
    });

    window.parent.postMessage({ tipo: 'iframe-preparado' }, origenEsperado);