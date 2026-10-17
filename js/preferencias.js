    /**
     * Aplica o retira las clases CSS del body según las opciones seleccionadas.
     * Utiliza el método toggle() con un segundo parámetro booleano para mayor seguridad:
     * si la condición es true añade la clase, si es false la elimina.
     */
    function aplicarPreferenciasVisuales(tema, tamano) {
    // Si el tema es 'oscuro', añade la clase 'oscuro' al <body>; de lo contrario, la quita.
    document.body.classList.toggle('oscuro', tema === 'oscuro');
    
    // Si el tamaño es 'grande', añade la clase 'grande' al <body>; de lo contrario, la quita.
    document.body.classList.toggle('grande', tamano === 'grande');
    }

    /**
     * Recupera las preferencias guardadas en las cookies al cargar la página.
     * Si no existen cookies previa o contienen datos no válidos, aplica los valores por defecto.
     */
    function cargarPreferenciasIniciales() {
    // Intentamos leer las dos cookies independientes mediante la función de cookies.js
    const temaGuardado = leerCookie('dwec_tema');
    const tamanoGuardado = leerCookie('dwec_tamano');

    // Validamos el valor recuperado con un operador ternario:
    // Si el valor de la cookie es estrictamente 'oscuro' lo mantenemos, si no, usamos 'claro' por defecto.
    const temaFinal = temaGuardado === 'oscuro' ? 'oscuro' : 'claro';
    
    // Lo mismo para el tamaño: solo aceptamos 'grande', cualquier otro valor o null vuelve a 'normal'.
    const tamanoFinal = tamanoGuardado === 'grande' ? 'grande' : 'normal';

    // Sincronizamos los desplegables (<select>) del formulario para que reflejen la opción activa
    const comboTema = document.getElementById('select-tema');
    const comboTamano = document.getElementById('select-tamano');

    if (comboTema) comboTema.value = temaFinal;
    if (comboTamano) comboTamano.value = tamanoFinal;

    // Aplicamos los cambios visuales en el DOM con los valores validados
    aplicarPreferenciasVisuales(temaFinal, tamanoFinal);
    }