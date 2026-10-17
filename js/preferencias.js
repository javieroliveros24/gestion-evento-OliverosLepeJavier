    function aplicarPreferenciasVisuales(tema, tamano) {
    document.body.classList.toggle('oscuro', tema === 'oscuro');
    document.body.classList.toggle('grande', tamano === 'grande');
    }

    function cargarPreferenciasIniciales() {
    const temaGuardado = leerCookie('dwec_tema');
    const tamanoGuardado = leerCookie('dwec_tamano');

    const temaFinal = temaGuardado === 'oscuro' ? 'oscuro' : 'claro';
    const tamanoFinal = tamanoGuardado === 'grande' ? 'grande' : 'normal';

    const comboTema = document.getElementById('select-tema');
    const comboTamano = document.getElementById('select-tamano');

    if (comboTema) comboTema.value = temaFinal;
    if (comboTamano) comboTamano.value = tamanoFinal;

    aplicarPreferenciasVisuales(temaFinal, tamanoFinal);
    }