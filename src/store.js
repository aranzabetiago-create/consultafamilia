'use strict';

// Almacenamiento simple en un archivo JSON. Pensado para el volumen de un
// estudio jurídico: todas las operaciones se serializan y cada escritura es
// atómica (se escribe un archivo temporal y luego se renombra).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ESTADOS = ['nueva', 'en_analisis', 'contactada', 'cerrada'];

class Store {
  constructor(dataDir) {
    this.file = path.join(dataDir, 'consultas.json');
    fs.mkdirSync(dataDir, { recursive: true });
    this.data = this.#load();
    this.queue = Promise.resolve();
  }

  #load() {
    if (!fs.existsSync(this.file)) return { ultimoNumero: {}, consultas: [] };
    return JSON.parse(fs.readFileSync(this.file, 'utf8'));
  }

  #persist() {
    const tmp = `${this.file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, this.file);
  }

  // Ejecuta `fn` en exclusión mutua y persiste los cambios.
  #mutate(fn) {
    const run = this.queue.then(() => {
      const result = fn(this.data);
      this.#persist();
      return result;
    });
    this.queue = run.catch(() => {});
    return run;
  }

  crear(consulta) {
    return this.#mutate((data) => {
      const anio = new Date().getFullYear();
      const n = (data.ultimoNumero[anio] || 0) + 1;
      data.ultimoNumero[anio] = n;
      const nueva = {
        id: crypto.randomUUID(),
        numero: `${anio}-${String(n).padStart(4, '0')}`,
        creada: new Date().toISOString(),
        estado: 'nueva',
        notas: [],
        ...consulta,
      };
      data.consultas.push(nueva);
      return nueva;
    });
  }

  listar() {
    return [...this.data.consultas].sort((a, b) => b.creada.localeCompare(a.creada));
  }

  obtener(id) {
    return this.data.consultas.find((c) => c.id === id) || null;
  }

  actualizar(id, { estado, nota }) {
    return this.#mutate((data) => {
      const c = data.consultas.find((x) => x.id === id);
      if (!c) return null;
      if (estado) c.estado = estado;
      if (nota) c.notas.push({ fecha: new Date().toISOString(), texto: nota });
      c.actualizada = new Date().toISOString();
      return c;
    });
  }

  eliminar(id) {
    return this.#mutate((data) => {
      const i = data.consultas.findIndex((x) => x.id === id);
      if (i === -1) return false;
      data.consultas.splice(i, 1);
      return true;
    });
  }
}

module.exports = { Store, ESTADOS };
