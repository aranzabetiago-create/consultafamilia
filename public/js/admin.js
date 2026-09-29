'use strict';

(async () => {
  const ESTADO_TEXTO = {
    nueva: 'Nueva', en_analisis: 'En análisis', contactada: 'Contactada', cerrada: 'Cerrada',
  };
  const fecha = (iso) => new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

  const $ = (id) => document.getElementById(id);
  let temas = [];
  let seleccion = null;

  async function iniciar() {
    try {
      await api('/api/admin/sesion');
    } catch {
      $('login').hidden = false;
      return;
    }
    $('login').hidden = true;
    $('app').hidden = false;
    $('exportar').hidden = false;
    $('salir').hidden = false;
    temas = await api('/api/temas');
    $('f-tema').append(...temas.map((t) => el('option', { value: t.id }, t.titulo)));
    $('f-estado').append(...Object.entries(ESTADO_TEXTO).map(([v, t]) => el('option', { value: v }, t)));
    await cargarLista();
  }

  // Convierte un teléfono argentino a formato internacional para wa.me (54 9 + área + número).
  // No resuelve el "15" de los celulares escritos con código de área: se muestra igual el número.
  function numeroWhatsApp(tel) {
    let d = (tel || '').replace(/[^0-9]/g, '');
    if (!d) return '';
    if (d.startsWith('54')) return d;
    d = d.replace(/^0/, '');
    return `549${d}`;
  }

  const tituloTema = (id) => (temas.find((t) => t.id === id) || { titulo: id }).titulo;

  async function cargarLista() {
    const params = new URLSearchParams();
    if ($('f-estado').value) params.set('estado', $('f-estado').value);
    if ($('f-tema').value) params.set('tema', $('f-tema').value);
    if ($('buscar').value.trim()) params.set('q', $('buscar').value.trim());
    const { consultas } = await api(`/api/admin/consultas?${params}`);
    $('contador').textContent = `${consultas.length} consulta${consultas.length === 1 ? '' : 's'}`;
    $('lista').replaceChildren(...consultas.map((c) => el('li', null,
      el('button', { type: 'button', 'aria-current': c.id === seleccion ? 'true' : 'false', onclick: () => verDetalle(c.id) },
        el('div', null,
          c.urgente ? el('span', { class: 'etiqueta urgente' }, 'Urgente') : '',
          el('span', { class: 'etiqueta' }, ESTADO_TEXTO[c.estado] || c.estado),
          el('strong', null, c.contacto.nombre)),
        el('div', { class: 'meta' }, `${c.numero} · ${tituloTema(c.tema)} · ${fecha(c.creada)}`)),
    )));
  }

  async function verDetalle(id) {
    seleccion = id;
    const c = await api(`/api/admin/consultas/${encodeURIComponent(id)}`);
    const tema = temas.find((t) => t.id === c.tema);
    const etiquetaCampo = (k) => ((tema && tema.campos.find((f) => f.id === k)) || { label: k }).label;
    const wa = numeroWhatsApp(c.contacto.telefono);

    const selEstado = el('select', { 'aria-label': 'Estado' },
      Object.entries(ESTADO_TEXTO).map(([v, t]) => el('option', { value: v, selected: v === c.estado }, t)));
    selEstado.addEventListener('change', async () => {
      await api(`/api/admin/consultas/${encodeURIComponent(id)}`, { method: 'PATCH', body: { estado: selEstado.value } });
      await cargarLista();
    });

    const nota = el('textarea', { 'aria-label': 'Nueva nota interna', placeholder: 'Nota interna (no la ve el cliente)' });
    const btnNota = el('button', { type: 'button', class: 'boton secundario' }, 'Agregar nota');
    btnNota.addEventListener('click', async () => {
      if (!nota.value.trim()) return;
      await api(`/api/admin/consultas/${encodeURIComponent(id)}`, { method: 'PATCH', body: { nota: nota.value } });
      await verDetalle(id);
    });

    const btnBorrar = el('button', { type: 'button', class: 'boton peligro' }, 'Eliminar consulta');
    btnBorrar.addEventListener('click', async () => {
      if (!confirm(`¿Eliminar definitivamente la consulta ${c.numero}? No se puede deshacer.`)) return;
      await api(`/api/admin/consultas/${encodeURIComponent(id)}`, { method: 'DELETE' });
      seleccion = null;
      $('detalle').textContent = 'Consulta eliminada.';
      await cargarLista();
    });

    llenar($('detalle'), [
      el('h2', null, `${c.numero} — ${tituloTema(c.tema)}`),
      c.urgente ? el('div', { class: 'alerta' }, el('strong', null, 'Consulta marcada como urgente (violencia familiar).')) : '',
      el('div', { class: 'campo' }, el('label', null, 'Estado'), selEstado),
      el('h3', null, 'Contacto'),
      el('dl', { class: 'datos' },
        el('dt', null, 'Nombre'), el('dd', null, c.contacto.nombre),
        el('dt', null, 'Teléfono'), el('dd', null, c.contacto.telefono || '—',
          wa ? [' · ', el('a', { href: `https://wa.me/${wa}`, target: '_blank', rel: 'noopener' }, 'WhatsApp')] : ''),
        el('dt', null, 'Email'), el('dd', null, c.contacto.email ? el('a', { href: `mailto:${c.contacto.email}` }, c.contacto.email) : '—'),
        el('dt', null, 'Localidad'), el('dd', null, c.contacto.localidad || '—'),
        el('dt', null, 'Prefiere'), el('dd', null, c.contacto.preferencia || 'Indistinto'),
        el('dt', null, 'Recibida'), el('dd', null, fecha(c.creada)),
      ),
      Object.keys(c.respuestas).length ? [
        el('h3', null, 'Respuestas'),
        el('dl', { class: 'datos' }, Object.entries(c.respuestas).map(([k, v]) => [el('dt', null, etiquetaCampo(k)), el('dd', null, v)])),
      ] : '',
      el('h3', null, 'Relato'),
      el('p', { class: 'relato' }, c.relato),
      el('h3', null, 'Notas internas'),
      c.notas.length ? c.notas.map((n) => el('div', { class: 'nota' }, el('time', null, fecha(n.fecha)), n.texto)) : el('p', null, 'Sin notas.'),
      el('div', { class: 'campo' }, nota),
      el('div', { class: 'acciones' }, btnNota, btnBorrar),
    ]);
    await cargarLista();
  }

  $('form-login').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    $('error-login').textContent = '';
    try {
      await api('/api/admin/login', { method: 'POST', body: { password: $('password').value } });
      $('password').value = '';
      await iniciar();
    } catch (err) {
      $('error-login').textContent = err.message;
    }
  });

  $('salir').addEventListener('click', async (ev) => {
    ev.preventDefault();
    await api('/api/admin/logout', { method: 'POST' });
    location.reload();
  });

  let espera;
  $('buscar').addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(cargarLista, 250); });
  $('f-estado').addEventListener('change', cargarLista);
  $('f-tema').addEventListener('change', cargarLista);

  await iniciar();
})();
