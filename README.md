# ConsultaFamilia

App web para recibir consultas sobre **derecho de familia**, pensada para un estudio jurídico de Adolfo Gonzales Chaves (PBA).

- **Para el público:** página con información general por tema (con citas del CCyC y normativa bonaerense) y un formulario de consulta guiado en 3 pasos. Al enviarla, la persona recibe un número de consulta, orientación general y la lista de documentación para llevar a la entrevista.
- **Para el abogado:** panel privado en `/admin` para ver las consultas, filtrarlas, cambiar su estado (nueva, en análisis, contactada, cerrada), agregar notas internas, abrir WhatsApp o email, eliminarlas (derecho de supresión, Ley 25.326) y exportarlas a CSV.

Temas incluidos: cuota alimentaria, cuidado personal y comunicación, divorcio, unión convivencial, violencia familiar (marcada como urgente, con las líneas 911, 144 y 102), filiación y "otra consulta".

## Requisitos

Node.js 22.9 o superior.

## Uso

```bash
npm install
cp .env.example .env    # completá ADMIN_PASSWORD y SESSION_SECRET
npm start               # http://localhost:3000  (panel: /admin)
npm test
```

## Personalización

- **Datos del estudio** (nombre, matrícula, domicilio, teléfono, email, horario): `config/estudio.json`. Se muestran en el pie de todas las páginas.
- **Temas, preguntas, orientación y documentación:** `src/temas.js`. Los textos de orientación son información general: revisalos con tu criterio profesional antes de publicar.

## Datos

Las consultas se guardan en `data/consultas.json` (configurable con `DATA_DIR`), un archivo que solo puede leer el usuario del servidor. Esa carpeta está excluida de git. Hacé copias de seguridad periódicas.

## Versión de demostración

`node scripts/build-demo.js` genera `demo/index.html`: la app completa en un solo archivo, sin servidor. Las consultas quedan guardadas solo en el navegador de quien la abre, y la contraseña del panel es `demo`. Sirve para mostrar la app, no para recibir consultas reales.

## Producción

Publicala detrás de HTTPS (por ejemplo, con Caddy o Nginx como proxy) y definí `NODE_ENV=production` para que la cookie de sesión sea `Secure`.
