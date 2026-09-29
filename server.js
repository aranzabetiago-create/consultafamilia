'use strict';

const path = require('path');
const { createApp } = require('./src/app');

const app = createApp({
  dataDir: process.env.DATA_DIR || path.join(__dirname, 'data'),
  adminPassword: process.env.ADMIN_PASSWORD,
  sessionSecret: process.env.SESSION_SECRET,
  secureCookies: process.env.NODE_ENV === 'production',
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`ConsultaFamilia escuchando en http://localhost:${port}`);
});
