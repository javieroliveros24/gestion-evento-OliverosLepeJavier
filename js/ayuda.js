'use strict';

/* ayuda.js: rellena los datos descriptivos del navegador y permite cerrar la ventana. */

document.addEventListener('DOMContentLoaded', function () {
  const datos = [
    ['dato-idioma', navigator.language],
    ['dato-origen', location.origin],
    ['dato-pantalla', `${screen.width} × ${screen.height} píxeles`]
  ];

  for (const [id, valor] of datos) {
    const elemento = document.getElementById(id);
    if (elemento !== null) {
      elemento.textContent = valor;
    }
  }

  const botonCerrar = document.getElementById('btn-cerrar');
  if (botonCerrar !== null) {
    botonCerrar.addEventListener('click', function () {
      window.close();
    });
  }
});
