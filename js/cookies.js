    /**
     * Lee y descodifica una cookie concreta por su nombre.
     * Devuelve null si no existe o si falla la descodificación.
     */
    function leerCookie(nombre) {
    const prefijo = nombre + '=';
    const partes = document.cookie.split(';');

    for (let i = 0; i < partes.length; i++) {
        const parte = partes[i].trim();
        if (parte.startsWith(prefijo)) {
        try {
            return decodeURIComponent(parte.slice(prefijo.length));
        } catch (error) {
            return null;
        }
        }
    }
    return null;
    }

    /**
     * Guarda una cookie con valor codificado, duración en días y ámbito de sitio completo.
     */
    function guardarCookie(nombre, valor, dias) {
    const segundos = Math.floor(dias * 24 * 60 * 60);
    let atributos = '; Path=/; Max-Age=' + segundos + '; SameSite=Lax';

    if (location.protocol === 'https:') {
        atributos += '; Secure';
    }

    document.cookie = nombre + '=' + encodeURIComponent(valor) + atributos;
    }

    /**
     * Borra una cookie estableciendo Max-Age=0 sobre el mismo ámbito de creación.
     */
    function borrarCookie(nombre) {
    let atributos = '; Path=/; Max-Age=0; SameSite=Lax';

    if (location.protocol === 'https:') {
        atributos += '; Secure';
    }

    document.cookie = nombre + '=' + atributos;
    }