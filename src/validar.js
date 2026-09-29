'use strict';

const { temasPorId } = require('./temas');

const PREFERENCIAS = ['WhatsApp', 'Llamada', 'Email'];
const MAX_RELATO = 4000;

function texto(v, max) {
  if (v === undefined || v === null) return '';
  return String(v).trim().slice(0, max);
}

// Valida y normaliza una consulta enviada desde el formulario público.
// Devuelve { errores: [...] } o { consulta: {...} } con solo los campos conocidos.
function validarConsulta(body) {
  const errores = [];
  const b = body && typeof body === 'object' ? body : {};

  const tema = temasPorId.get(b.tema);
  if (!tema) return { errores: ['Elegí un tema de consulta.'] };

  const respuestas = {};
  const entrada = b.respuestas && typeof b.respuestas === 'object' ? b.respuestas : {};
  for (const campo of tema.campos) {
    const valor = texto(entrada[campo.id], campo.max || 200);
    if (!valor) {
      if (campo.required) errores.push(`Completá: ${campo.label}`);
      continue;
    }
    if (campo.options && !campo.options.includes(valor)) {
      errores.push(`Opción inválida en: ${campo.label}`);
      continue;
    }
    respuestas[campo.id] = valor;
  }

  const contacto = {
    nombre: texto(b.nombre, 120),
    telefono: texto(b.telefono, 40),
    email: texto(b.email, 160),
    localidad: texto(b.localidad, 120),
    preferencia: texto(b.preferencia, 20),
  };
  if (!contacto.nombre) errores.push('Indicá tu nombre.');
  if (!contacto.telefono && !contacto.email) errores.push('Dejanos un teléfono o un email.');
  if (contacto.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contacto.email)) errores.push('El email no es válido.');
  if (contacto.telefono && !/^[0-9+()\s-]{6,}$/.test(contacto.telefono)) errores.push('El teléfono no es válido.');
  if (contacto.preferencia && !PREFERENCIAS.includes(contacto.preferencia)) contacto.preferencia = '';

  const relato = texto(b.relato, MAX_RELATO);
  if (relato.length < 20) errores.push('Contanos brevemente tu situación (al menos 20 caracteres).');

  if (b.consentimiento !== true) errores.push('Tenés que aceptar el tratamiento de tus datos para enviar la consulta.');

  if (errores.length) return { errores };

  const urgente = Boolean(tema.urgente);
  return {
    consulta: { tema: tema.id, respuestas, contacto, relato, urgente, consentimiento: new Date().toISOString() },
  };
}

module.exports = { validarConsulta, PREFERENCIAS, MAX_RELATO };
