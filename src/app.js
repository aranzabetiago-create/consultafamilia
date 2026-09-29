'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');

const { temas, temasPorId } = require('./temas');
const { Store, ESTADOS } = require('./store');
const { validarConsulta } = require('./validar');
const auth = require('./auth');

// Límite de pedidos por IP en una ventana de tiempo (en memoria).
function limitador({ ventanaMs, max }) {
  const hits = new Map();
  return (req, res, next) => {
    const ahora = Date.now();
    const lista = (hits.get(req.ip) || []).filter((t) => ahora - t < ventanaMs);
    if (lista.length >= max) {
      return res.status(429).json({ error: 'Demasiados intentos. Probá de nuevo en unos minutos.' });
    }
    lista.push(ahora);
    hits.set(req.ip, lista);
    next();
  };
}

function csvCelda(v) {
  const s = v === undefined || v === null ? '' : String(v);
  // Evita la inyección de fórmulas al abrir el CSV en una planilla.
  const seguro = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${seguro.replace(/"/g, '""')}"`;
}

function createApp({ dataDir, adminPassword, sessionSecret, secureCookies = false, estudioFile }) {
  if (!adminPassword) throw new Error('Falta ADMIN_PASSWORD');
  if (!sessionSecret || sessionSecret.length < 32) throw new Error('SESSION_SECRET debe tener al menos 32 caracteres');

  const store = new Store(dataDir);
  const estudio = JSON.parse(fs.readFileSync(estudioFile || path.join(__dirname, '..', 'config', 'estudio.json'), 'utf8'));
  const soloAdmin = auth.requerirAdmin(sessionSecret);

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback');
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'same-origin',
      'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; frame-ancestors 'none'",
    });
    next();
  });
  app.use(express.json({ limit: '32kb' }));

  // --- API pública ---

  app.get('/api/temas', (req, res) => res.json(temas));
  app.get('/api/estudio', (req, res) => res.json(estudio));

  app.post('/api/consultas', limitador({ ventanaMs: 60 * 60 * 1000, max: 10 }), async (req, res) => {
    // Campo trampa para bots: los humanos no lo ven ni lo completan.
    if (req.body && req.body.sitio_web) return res.status(201).json({ numero: '—' });

    const { errores, consulta } = validarConsulta(req.body);
    if (errores) return res.status(400).json({ errores });

    const nueva = await store.crear(consulta);
    const tema = temasPorId.get(nueva.tema);
    res.status(201).json({
      numero: nueva.numero,
      tema: { id: tema.id, titulo: tema.titulo, orientacion: tema.orientacion, documentacion: tema.documentacion },
      urgente: nueva.urgente,
    });
  });

  // --- Panel del abogado ---

  app.post('/api/admin/login', limitador({ ventanaMs: 15 * 60 * 1000, max: 10 }), (req, res) => {
    const password = req.body && req.body.password;
    if (!password || !auth.passwordValida(password, adminPassword)) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    res.set('Set-Cookie', auth.cookieSesion(auth.crearToken(sessionSecret), { secure: secureCookies }));
    res.json({ ok: true });
  });

  app.post('/api/admin/logout', (req, res) => {
    res.set('Set-Cookie', auth.cookieBorrada());
    res.json({ ok: true });
  });

  app.get('/api/admin/sesion', soloAdmin, (req, res) => res.json({ ok: true }));

  app.get('/api/admin/consultas', soloAdmin, (req, res) => {
    const { estado, tema, q } = req.query;
    const busqueda = typeof q === 'string' ? q.trim().toLowerCase() : '';
    const lista = store.listar().filter((c) => {
      if (estado && c.estado !== estado) return false;
      if (tema && c.tema !== tema) return false;
      if (busqueda) {
        const texto = [c.numero, c.contacto.nombre, c.contacto.telefono, c.contacto.email, c.relato]
          .join(' ').toLowerCase();
        if (!texto.includes(busqueda)) return false;
      }
      return true;
    });
    res.json({ estados: ESTADOS, consultas: lista });
  });

  app.get('/api/admin/consultas/:id', soloAdmin, (req, res) => {
    const c = store.obtener(req.params.id);
    if (!c) return res.status(404).json({ error: 'No encontrada' });
    res.json(c);
  });

  app.patch('/api/admin/consultas/:id', soloAdmin, async (req, res) => {
    const estado = req.body && req.body.estado;
    const nota = req.body && typeof req.body.nota === 'string' ? req.body.nota.trim().slice(0, 4000) : '';
    if (estado && !ESTADOS.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });
    const c = await store.actualizar(req.params.id, { estado, nota });
    if (!c) return res.status(404).json({ error: 'No encontrada' });
    res.json(c);
  });

  app.delete('/api/admin/consultas/:id', soloAdmin, async (req, res) => {
    const ok = await store.eliminar(req.params.id);
    if (!ok) return res.status(404).json({ error: 'No encontrada' });
    res.status(204).end();
  });

  app.get('/api/admin/export.csv', soloAdmin, (req, res) => {
    const filas = [['Número', 'Fecha', 'Estado', 'Tema', 'Urgente', 'Nombre', 'Teléfono', 'Email', 'Localidad',
      'Preferencia', 'Respuestas', 'Relato']];
    for (const c of store.listar()) {
      const tema = temasPorId.get(c.tema);
      filas.push([c.numero, c.creada, c.estado, tema ? tema.titulo : c.tema, c.urgente ? 'Sí' : 'No',
        c.contacto.nombre, c.contacto.telefono, c.contacto.email, c.contacto.localidad, c.contacto.preferencia,
        Object.entries(c.respuestas).map(([k, v]) => `${k}: ${v}`).join(' | '), c.relato]);
    }
    const csv = '﻿' + filas.map((f) => f.map(csvCelda).join(';')).join('\r\n');
    res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="consultas.csv"' });
    res.send(csv);
  });

  app.use('/api', (req, res) => res.status(404).json({ error: 'No encontrado' }));

  app.use(express.static(path.join(__dirname, '..', 'public'), { extensions: ['html'] }));

  return app;
}

module.exports = { createApp };
