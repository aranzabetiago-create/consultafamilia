'use strict';

// Genera una versión de demostración de la app en un único archivo HTML, sin
// servidor: las llamadas a /api/* se atienden en el navegador y las consultas
// se guardan solo en ese navegador. Sirve para mostrar la app, no para recibir
// consultas reales.
//
// Uso: node scripts/build-demo.js [archivo-de-salida]   (por defecto demo/index.html)

const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const leer = (p) => fs.readFileSync(path.join(raiz, p), 'utf8');
const salida = path.resolve(process.argv[2] || path.join(raiz, 'demo', 'index.html'));

// --- CSS: mismo estilo que la app, con el modo oscuro también controlable por data-theme ---
let css = leer('public/css/estilos.css');
const oscuro = css.match(/@media \(prefers-color-scheme: dark\) \{\s*:root \{([\s\S]*?)\}\s*\}/);
if (!oscuro) throw new Error('No se encontró el bloque de modo oscuro en estilos.css');
css = css.replace(oscuro[0],
  `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {${oscuro[1]}}\n}\n:root[data-theme="dark"] {${oscuro[1]}}`);
css += `
.demo-aviso { background: var(--accent-soft); border-bottom: 1px solid var(--border); font-size: .9rem; }
.demo-aviso .contenedor { padding-block: 8px; }
header.sitio nav a[aria-current="page"] { font-weight: 700; text-decoration: underline; }
#exportar { display: none !important; }
.vista { display: none; }
.vista.activa { display: block; }
.barra-panel { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap; }
`;

// --- Módulos del servidor que se reutilizan tal cual en el navegador ---
const modulo = (nombre, archivo) => `'${nombre}': function (module, exports, require) {\n${leer(archivo)}\n}`;
const modulos = `{\n${modulo('./temas', 'src/temas.js')},\n${modulo('./validar', 'src/validar.js')}\n}`;
const estudio = leer('config/estudio.json');

// --- Scripts de las páginas, con los ajustes que requiere una sola página ---
const reemplazar = (texto, buscar, nuevo) => {
  if (!texto.includes(buscar)) throw new Error(`No se encontró: ${buscar}`);
  return texto.replace(buscar, nuevo);
};
let admin = leer('public/js/admin.js');
// El visor de claude.ai no muestra confirm(): la confirmación se hace con un segundo toque.
admin = reemplazar(admin,
  "if (!confirm(`¿Eliminar definitivamente la consulta ${c.numero}? No se puede deshacer.`)) return;",
  "if (btnBorrar.dataset.confirmar !== '1') { btnBorrar.dataset.confirmar = '1'; btnBorrar.textContent = 'Tocá de nuevo para eliminar'; return; }");
admin = reemplazar(admin, 'location.reload();', 'demoSalirPanel();');

const shim = `
'use strict';
(() => {
  const fuentes = ${modulos};
  const cache = {};
  function requerir(nombre) {
    if (!cache[nombre]) {
      const module = { exports: {} };
      cache[nombre] = module;
      fuentes[nombre](module, module.exports, requerir);
    }
    return cache[nombre].exports;
  }
  const { temas, temasPorId } = requerir('./temas');
  const { validarConsulta } = requerir('./validar');
  const estudio = ${estudio};
  const ESTADOS = ['nueva', 'en_analisis', 'contactada', 'cerrada'];
  const CLAVE = 'consultafamilia-demo';
  const PASSWORD = 'demo';

  const hace = (dias, hora) => { const d = new Date(); d.setDate(d.getDate() - dias); d.setHours(hora, 15, 0, 0); return d.toISOString(); };
  function ejemplos() {
    const anio = new Date().getFullYear();
    return [
      { id: 'ej-1', numero: anio + '-0001', creada: hace(3, 10), estado: 'contactada', tema: 'alimentos', urgente: false,
        respuestas: { rol: 'Quiero reclamar alimentos', hijos: '2 hijos, de 6 y 10 años', cuota_actual: 'Hay un acuerdo informal', cumplimiento: 'Se paga en parte o con atraso', trabajo_otro: 'Empleado rural en un campo de la zona' },
        contacto: { nombre: 'Ejemplo: Carla R.', telefono: '2983 000000', email: '', localidad: 'Adolfo Gonzales Chaves', preferencia: 'WhatsApp' },
        relato: 'Desde que nos separamos el padre de mis hijos pasa una cuota de palabra, pero hace tres meses que paga menos de la mitad y con atraso.',
        notas: [{ fecha: hace(2, 12), texto: 'Ejemplo de nota interna: entrevista el jueves, pedir partidas y comprobantes de gastos escolares.' }] },
      { id: 'ej-2', numero: anio + '-0002', creada: hace(1, 18), estado: 'nueva', tema: 'divorcio', urgente: false,
        respuestas: { modalidad: 'Ambos', acuerdo: 'Acuerdo parcial', hijos_menores: 'No', bienes: 'Sí', fecha_matrimonio: '2009' },
        contacto: { nombre: 'Ejemplo: Martín S.', telefono: '', email: 'ejemplo@ejemplo.com', localidad: 'Adolfo Gonzales Chaves', preferencia: 'Email' },
        relato: 'Queremos divorciarnos de común acuerdo. Tenemos una casa y un auto y no nos ponemos de acuerdo sobre la casa.',
        notas: [] },
    ];
  }

  let memoria = null;
  function cargar() {
    if (memoria) return memoria;
    try { memoria = JSON.parse(localStorage.getItem(CLAVE)); } catch { memoria = null; }
    if (!memoria || !Array.isArray(memoria.consultas)) memoria = { siguiente: 3, consultas: ejemplos() };
    return memoria;
  }
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(memoria)); } catch { /* sin almacenamiento: queda en memoria */ } }
  let sesion = false;

  const responder = (status, datos) => new Response(datos === null ? null : JSON.stringify(datos),
    { status, headers: { 'Content-Type': 'application/json' } });

  async function atender(url, metodo, body) {
    const u = new URL(url, 'https://demo.local');
    const ruta = u.pathname;
    const db = cargar();
    if (ruta === '/api/temas') return responder(200, temas);
    if (ruta === '/api/estudio') return responder(200, estudio);
    if (ruta === '/api/consultas' && metodo === 'POST') {
      if (body && body.sitio_web) return responder(201, { numero: '—' });
      const { errores, consulta } = validarConsulta(body);
      if (errores) return responder(400, { errores });
      const nueva = { id: 'c-' + Date.now(), numero: new Date().getFullYear() + '-' + String(db.siguiente++).padStart(4, '0'),
        creada: new Date().toISOString(), estado: 'nueva', notas: [], ...consulta };
      db.consultas.push(nueva);
      guardar();
      const t = temasPorId.get(nueva.tema);
      return responder(201, { numero: nueva.numero, urgente: nueva.urgente,
        tema: { id: t.id, titulo: t.titulo, orientacion: t.orientacion, documentacion: t.documentacion } });
    }
    if (ruta === '/api/admin/login') {
      if (!body || body.password !== PASSWORD) return responder(401, { error: 'Contraseña incorrecta' });
      sesion = true;
      return responder(200, { ok: true });
    }
    if (ruta === '/api/admin/logout') { sesion = false; return responder(200, { ok: true }); }
    if (ruta.startsWith('/api/admin/') && !sesion) return responder(401, { error: 'No autorizado' });
    if (ruta === '/api/admin/sesion') return responder(200, { ok: true });
    if (ruta === '/api/admin/consultas') {
      const estado = u.searchParams.get('estado'); const tema = u.searchParams.get('tema');
      const q = (u.searchParams.get('q') || '').toLowerCase();
      const lista = [...db.consultas].sort((a, b) => b.creada.localeCompare(a.creada)).filter((c) =>
        (!estado || c.estado === estado) && (!tema || c.tema === tema) &&
        (!q || [c.numero, c.contacto.nombre, c.contacto.telefono, c.contacto.email, c.relato].join(' ').toLowerCase().includes(q)));
      return responder(200, { estados: ESTADOS, consultas: lista });
    }
    const m = ruta.match(/^\\/api\\/admin\\/consultas\\/([^/]+)$/);
    if (m) {
      const id = decodeURIComponent(m[1]);
      const i = db.consultas.findIndex((c) => c.id === id);
      if (i === -1) return responder(404, { error: 'No encontrada' });
      const c = db.consultas[i];
      if (metodo === 'GET') return responder(200, c);
      if (metodo === 'DELETE') { db.consultas.splice(i, 1); guardar(); return responder(204, null); }
      if (metodo === 'PATCH') {
        if (body.estado && !ESTADOS.includes(body.estado)) return responder(400, { error: 'Estado inválido' });
        if (body.estado) c.estado = body.estado;
        const nota = typeof body.nota === 'string' ? body.nota.trim().slice(0, 4000) : '';
        if (nota) c.notas.push({ fecha: new Date().toISOString(), texto: nota });
        guardar();
        return responder(200, c);
      }
    }
    return responder(404, { error: 'No encontrado' });
  }

  const fetchOriginal = window.fetch.bind(window);
  window.fetch = (url, opciones = {}) => {
    if (typeof url === 'string' && url.startsWith('/api/')) {
      let body = null;
      try { body = opciones.body ? JSON.parse(opciones.body) : null; } catch { body = null; }
      return atender(url, (opciones.method || 'GET').toUpperCase(), body);
    }
    return fetchOriginal(url, opciones);
  };
})();
`;

const router = `
'use strict';
function demoSalirPanel() {
  document.getElementById('login').hidden = false;
  document.getElementById('app').hidden = true;
  document.getElementById('salir').hidden = true;
  document.getElementById('f-tema').length = 1;
  document.getElementById('f-estado').length = 1;
  document.getElementById('detalle').textContent = 'Elegí una consulta para ver el detalle.';
}
(() => {
  const vistas = ['inicio', 'consulta', 'panel'];
  function reiniciarFormulario() {
    const form = document.getElementById('form');
    if (!form.hidden) return;
    form.reset();
    form.hidden = false;
    document.getElementById('resultado').hidden = true;
    document.getElementById('enviar').disabled = false;
    const atras = document.getElementById('atras');
    while (!atras.hidden) atras.click();
  }
  function ir(vista, tema) {
    if (!vistas.includes(vista)) vista = 'inicio';
    if (vista === 'consulta') reiniciarFormulario();
    document.querySelectorAll('.vista').forEach((v) => v.classList.toggle('activa', v.id === 'vista-' + vista));
    document.querySelectorAll('[data-ir]').forEach((a) => a.setAttribute('aria-current', a.dataset.ir === vista ? 'page' : 'false'));
    if (tema) {
      const radio = document.querySelector('input[name=tema][value="' + tema + '"]');
      const atras = document.getElementById('atras');
      while (!atras.hidden) atras.click();
      if (radio) { radio.checked = true; document.getElementById('siguiente').click(); }
    }
    if (location.hash.slice(1) !== vista) history.replaceState(null, '', '#' + vista);
    window.scrollTo(0, 0);
  }
  // Los enlaces internos de la app (/, /consulta, /consulta?tema=…) se resuelven dentro de la página.
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (a.dataset.ir) { ev.preventDefault(); ir(a.dataset.ir); return; }
    if (href === '/') { ev.preventDefault(); ir('inicio'); return; }
    if (href.startsWith('/consulta')) {
      ev.preventDefault();
      ir('consulta', new URLSearchParams(href.split('?')[1] || '').get('tema'));
    }
  });
  ir(location.hash.slice(1) || 'inicio');
})();
`;

// --- Contenido de las tres páginas, reunido en vistas ---
const cuerpo = (archivo) => {
  const html = leer(archivo);
  return html.slice(html.indexOf('<main'), html.indexOf('</main>') + '</main>'.length)
    .replace(/<main[^>]*>/, '').replace('</main>', '');
};

const html = `<title>ConsultaFamilia</title>
<style>
${css}
</style>
<div class="demo-aviso" role="note">
  <div class="contenedor"><strong>Versión de demostración.</strong> Las consultas que envíes se guardan solo en este navegador y no le llegan a nadie. Contraseña del panel: <strong>demo</strong>.</div>
</div>
<header class="sitio">
  <div class="contenedor">
    <a class="marca" href="#inicio" data-ir="inicio" data-estudio="nombre">Consultas de Familia</a>
    <nav>
      <a href="#inicio" data-ir="inicio">Inicio</a>
      <a href="#consulta" data-ir="consulta">Hacer una consulta</a>
      <a href="#panel" data-ir="panel">Panel del abogado</a>
    </nav>
  </div>
</header>
<main class="contenedor">
  <section class="vista" id="vista-inicio">${cuerpo('public/index.html')}</section>
  <section class="vista" id="vista-consulta">${cuerpo('public/consulta.html')}</section>
  <section class="vista" id="vista-panel">
    <div class="barra-panel"><h1>Panel de consultas</h1><a href="#" id="salir" hidden>Salir</a><a href="#" id="exportar" hidden>Exportar</a></div>
    ${cuerpo('public/admin.html')}
  </section>
</main>
<footer class="sitio">
  <div class="contenedor" id="pie"></div>
</footer>
<script>${shim}</script>
<script>${leer('public/js/comun.js')}</script>
<script>${leer('public/js/inicio.js')}</script>
<script>${leer('public/js/consulta.js')}</script>
<script>${admin}</script>
<script>${router}</script>
`;

fs.mkdirSync(path.dirname(salida), { recursive: true });
fs.writeFileSync(salida, html);
console.log(`Demo generada en ${salida} (${Math.round(html.length / 1024)} KB)`);
