'use strict';

(async () => {
  const form = document.getElementById('form');
  const pasos = [...form.querySelectorAll('.paso')];
  const btnAtras = document.getElementById('atras');
  const btnSiguiente = document.getElementById('siguiente');
  const btnEnviar = document.getElementById('enviar');
  const errores = document.getElementById('errores');
  const progreso = document.getElementById('progreso');
  let paso = 1;
  let temas = [];

  try {
    temas = await api('/api/temas');
  } catch {
    errores.textContent = 'No se pudieron cargar los temas. Recargá la página.';
    return;
  }

  const inicial = new URLSearchParams(location.search).get('tema');
  document.getElementById('opciones-tema').replaceChildren(...temas.map((t) => el('label', { class: 'opcion-tema' },
    el('input', { type: 'radio', name: 'tema', value: t.id, checked: t.id === inicial }),
    el('strong', null, t.titulo),
    el('span', null, t.resumen),
  )));

  const temaElegido = () => temas.find((t) => t.id === (form.elements.tema.value || ''));

  function campoTema(c) {
    const id = `r_${c.id}`;
    let control;
    if (c.type === 'select') {
      control = el('select', { id, name: id, required: c.required },
        el('option', { value: '' }, 'Elegí una opción'),
        c.options.map((o) => el('option', null, o)));
    } else {
      control = el('input', { type: 'text', id, name: id, maxlength: c.max, placeholder: c.placeholder, required: c.required });
    }
    return el('div', { class: 'campo' }, el('label', { for: id }, c.label, c.required ? '' : ' (opcional)'), control);
  }

  function prepararPaso2() {
    const t = temaElegido();
    document.getElementById('titulo-tema').textContent = t.titulo;
    document.getElementById('alerta-violencia').hidden = !t.urgente;
    const cont = document.getElementById('campos-tema');
    // Solo se regeneran los campos si cambió el tema, para no perder lo ya completado.
    if (cont.dataset.tema !== t.id) {
      cont.replaceChildren(...t.campos.map(campoTema));
      cont.dataset.tema = t.id;
    }
  }

  function validarPaso(n) {
    if (n === 1) return temaElegido() ? [] : ['Elegí un tema.'];
    const faltan = [];
    for (const input of pasos[n - 1].querySelectorAll('[required]')) {
      if (input.type === 'checkbox' ? !input.checked : !input.value.trim()) {
        const label = form.querySelector(`label[for="${input.id}"]`);
        faltan.push(`Completá: ${label ? label.textContent.replace(' (opcional)', '') : input.name}`);
      }
    }
    if (n === 2 && form.elements.relato.value.trim().length < 20) {
      faltan.push('Contanos un poco más sobre tu situación (al menos 20 caracteres).');
    }
    if (n === 3 && !form.elements.telefono.value.trim() && !form.elements.email.value.trim()) {
      faltan.push('Dejanos un teléfono o un email.');
    }
    return [...new Set(faltan)];
  }

  function mostrar(n) {
    paso = n;
    pasos.forEach((p, i) => p.classList.toggle('activo', i === n - 1));
    btnAtras.hidden = n === 1;
    btnSiguiente.hidden = n === pasos.length;
    btnEnviar.hidden = n !== pasos.length;
    progreso.textContent = `Paso ${n} de ${pasos.length}`;
    errores.textContent = '';
    const primero = pasos[n - 1].querySelector('input:not([type=radio]), select, textarea');
    if (n > 1 && primero) primero.focus();
  }

  btnSiguiente.addEventListener('click', () => {
    const faltan = validarPaso(paso);
    if (faltan.length) { errores.textContent = faltan.join(' '); return; }
    if (paso === 1) prepararPaso2();
    mostrar(paso + 1);
  });
  btnAtras.addEventListener('click', () => mostrar(paso - 1));

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const faltan = validarPaso(3);
    if (faltan.length) { errores.textContent = faltan.join(' '); return; }

    const t = temaElegido();
    const respuestas = {};
    for (const c of t.campos) respuestas[c.id] = form.elements[`r_${c.id}`].value;
    const f = form.elements;
    const body = {
      tema: t.id, respuestas, relato: f.relato.value,
      nombre: f.nombre.value, telefono: f.telefono.value, email: f.email.value,
      localidad: f.localidad.value, preferencia: f.preferencia.value,
      consentimiento: f.consentimiento.checked, sitio_web: f.sitio_web.value,
    };

    btnEnviar.disabled = true;
    try {
      const r = await api('/api/consultas', { method: 'POST', body });
      mostrarResultado(r);
    } catch (err) {
      errores.textContent = err.message;
      btnEnviar.disabled = false;
    }
  });

  function mostrarResultado(r) {
    form.hidden = true;
    const res = document.getElementById('resultado');
    llenar(res, [
      el('h2', null, '¡Recibimos tu consulta!'),
      el('p', null, 'Tu número de consulta es ', el('strong', null, r.numero),
        '. Guardalo por si necesitás comunicarte con nosotros.'),
      r.urgente ? el('div', { class: 'alerta' },
        el('strong', null, 'Si estás en peligro, no esperes nuestra respuesta: llamá al 911.'),
        ' Línea 144 (24 hs).') : '',
      r.tema ? [
        el('h2', null, `Orientación general: ${r.tema.titulo}`),
        r.tema.orientacion.map((p) => el('p', null, p)),
        el('h3', null, 'Documentación para tener a mano en la entrevista'),
        el('ul', null, r.tema.documentacion.map((d) => el('li', null, d))),
      ] : '',
      el('div', { class: 'aviso' }, 'Esta información es general y no reemplaza el asesoramiento sobre tu caso concreto.'),
      el('p', null, el('a', { class: 'boton secundario', href: '/' }, 'Volver al inicio')),
    ]);
    res.hidden = false;
    res.scrollIntoView();
  }

  if (inicial && temaElegido()) {
    prepararPaso2();
    mostrar(2);
  } else {
    mostrar(1);
  }
})();
