'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createApp } = require('../src/app');

let server;
let base;
let dataDir;

before(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-test-'));
  const app = createApp({ dataDir, adminPassword: 'secreta', sessionSecret: 'x'.repeat(32) });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
});

const consultaValida = {
  tema: 'alimentos',
  respuestas: { rol: 'Quiero reclamar alimentos', hijos: '2, de 5 y 9 años', cuota_actual: 'No hay cuota' },
  relato: 'El padre de mis hijos no aporta nada desde hace un año.',
  nombre: 'Ana Pérez',
  telefono: '2983 123456',
  consentimiento: true,
};

function post(url, body, headers = {}) {
  return fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
}

async function login() {
  const res = await post('/api/admin/login', { password: 'secreta' });
  assert.strictEqual(res.status, 200);
  return res.headers.get('set-cookie').split(';')[0];
}

test('lista los temas', async () => {
  const temas = await (await fetch(`${base}/api/temas`)).json();
  assert.ok(temas.find((t) => t.id === 'violencia'));
});

test('rechaza una consulta incompleta', async () => {
  const res = await post('/api/consultas', { tema: 'alimentos', respuestas: {}, consentimiento: false });
  assert.strictEqual(res.status, 400);
  const { errores } = await res.json();
  assert.ok(errores.length >= 3);
});

test('rechaza opciones que no existen', async () => {
  const res = await post('/api/consultas', { ...consultaValida, respuestas: { ...consultaValida.respuestas, rol: 'X' } });
  assert.strictEqual(res.status, 400);
});

test('crea una consulta y devuelve orientación', async () => {
  const res = await post('/api/consultas', consultaValida);
  assert.strictEqual(res.status, 201);
  const r = await res.json();
  assert.match(r.numero, /^\d{4}-0001$/);
  assert.ok(r.tema.documentacion.length > 0);
});

test('el panel exige sesión', async () => {
  assert.strictEqual((await fetch(`${base}/api/admin/consultas`)).status, 401);
  assert.strictEqual((await post('/api/admin/login', { password: 'mal' })).status, 401);
});

test('el abogado ve, actualiza y elimina consultas', async () => {
  const cookie = await login();
  const h = { Cookie: cookie, 'Content-Type': 'application/json' };

  const { consultas } = await (await fetch(`${base}/api/admin/consultas`, { headers: h })).json();
  assert.strictEqual(consultas.length, 1);
  const id = consultas[0].id;

  const upd = await fetch(`${base}/api/admin/consultas/${id}`, {
    method: 'PATCH', headers: h, body: JSON.stringify({ estado: 'contactada', nota: 'Llamé, entrevista el lunes' }),
  });
  const c = await upd.json();
  assert.strictEqual(c.estado, 'contactada');
  assert.strictEqual(c.notas.length, 1);

  const csv = await (await fetch(`${base}/api/admin/export.csv`, { headers: h })).text();
  assert.match(csv, /Ana Pérez/);

  assert.strictEqual((await fetch(`${base}/api/admin/consultas/${id}`, { method: 'DELETE', headers: h })).status, 204);
  assert.strictEqual((await fetch(`${base}/api/admin/consultas/${id}`, { headers: h })).status, 404);
});

test('las consultas de violencia se marcan como urgentes', async () => {
  const res = await post('/api/consultas', {
    ...consultaValida,
    tema: 'violencia',
    respuestas: { peligro: 'No', denuncia: 'Sí', medidas: 'No sé', menores: 'Sí' },
  });
  assert.strictEqual(res.status, 201);
  assert.strictEqual((await res.json()).urgente, true);
});
