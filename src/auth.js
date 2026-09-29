'use strict';

// Autenticación del panel: una sola contraseña de administrador y una cookie
// firmada con HMAC que expira a las 12 horas.

const crypto = require('crypto');

const COOKIE = 'cf_sesion';
const DURACION_MS = 12 * 60 * 60 * 1000;

function sha256(s) {
  return crypto.createHash('sha256').update(String(s)).digest();
}

function passwordValida(intento, esperada) {
  return crypto.timingSafeEqual(sha256(intento), sha256(esperada));
}

function firmar(valor, secreto) {
  return crypto.createHmac('sha256', secreto).update(valor).digest('base64url');
}

function crearToken(secreto) {
  const expira = String(Date.now() + DURACION_MS);
  return `${expira}.${firmar(expira, secreto)}`;
}

function tokenValido(token, secreto) {
  if (typeof token !== 'string') return false;
  const [expira, firma] = token.split('.');
  if (!expira || !firma) return false;
  const esperada = firmar(expira, secreto);
  if (firma.length !== esperada.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(esperada))) return false;
  return Number(expira) > Date.now();
}

function leerCookie(req, nombre) {
  const header = req.headers.cookie || '';
  for (const parte of header.split(';')) {
    const [k, ...v] = parte.trim().split('=');
    if (k === nombre) return decodeURIComponent(v.join('='));
  }
  return null;
}

function cookieSesion(token, { secure }) {
  const attrs = [`${COOKIE}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Strict',
    `Max-Age=${DURACION_MS / 1000}`];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}

function cookieBorrada() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

function requerirAdmin(secreto) {
  return (req, res, next) => {
    if (tokenValido(leerCookie(req, COOKIE), secreto)) return next();
    res.status(401).json({ error: 'No autorizado' });
  };
}

module.exports = {
  COOKIE, passwordValida, crearToken, tokenValido, leerCookie, cookieSesion, cookieBorrada, requerirAdmin,
};
