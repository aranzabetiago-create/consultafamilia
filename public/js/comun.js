'use strict';

// Utilidades compartidas por las páginas públicas y el panel.

function el(tag, attrs, ...hijos) {
  const nodo = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') nodo.className = v;
    else if (k.startsWith('on')) nodo.addEventListener(k.slice(2), v);
    else nodo.setAttribute(k, v === true ? '' : v);
  }
  llenar(nodo, hijos, false);
  return nodo;
}

// Agrega (o reemplaza, si `reemplazar`) los hijos de `nodo`. Acepta arrays anidados
// y omite valores vacíos, para poder armar contenido condicional.
function llenar(nodo, hijos, reemplazar = true) {
  if (reemplazar) nodo.replaceChildren();
  for (const h of [hijos].flat(Infinity)) {
    if (h === undefined || h === null || h === false || h === '') continue;
    nodo.append(h instanceof Node ? h : document.createTextNode(String(h)));
  }
}

async function api(url, opciones = {}) {
  const res = await fetch(url, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', ...(opciones.headers || {}) },
    body: opciones.body !== undefined ? JSON.stringify(opciones.body) : undefined,
  });
  const datos = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error((datos && (datos.error || (datos.errores || []).join(' '))) || `Error ${res.status}`);
    err.status = res.status;
    err.datos = datos;
    throw err;
  }
  return datos;
}

async function cargarEstudio() {
  try {
    const e = await api('/api/estudio');
    document.querySelectorAll('[data-estudio=nombre]').forEach((n) => { n.textContent = e.nombre; });
    const pie = document.getElementById('pie');
    if (pie) {
      llenar(pie, [
        el('div', null, el('strong', null, e.profesional), e.matricula ? ` — ${e.matricula}` : ''),
        el('div', null, e.direccion),
        el('div', null,
          e.telefono ? `Tel.: ${e.telefono}` : '',
          e.email ? [' · ', el('a', { href: `mailto:${e.email}` }, e.email)] : ''),
        e.horario ? el('div', null, `Atención: ${e.horario}`) : '',
      ]);
    }
    return e;
  } catch {
    return null;
  }
}

cargarEstudio();
