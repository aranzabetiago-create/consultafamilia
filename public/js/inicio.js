'use strict';

(async () => {
  const cont = document.getElementById('temas');
  try {
    const temas = await api('/api/temas');
    cont.replaceChildren(...temas.map((t) => el('details', { class: 'tema', id: t.id },
      el('summary', null, t.titulo),
      el('p', null, t.resumen),
      t.orientacion.map((p) => el('p', null, p)),
      el('h3', null, 'Documentación útil'),
      el('ul', null, t.documentacion.map((d) => el('li', null, d))),
      el('p', null, el('a', { class: 'boton secundario', href: `/consulta?tema=${t.id}` }, 'Consultar sobre este tema')),
    )));
  } catch {
    cont.textContent = 'No se pudieron cargar los temas. Recargá la página.';
  }
})();
