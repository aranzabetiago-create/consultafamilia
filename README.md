# Consulta Familia

Formulario web previo a la consulta en derecho de familia. El cliente carga sus datos y una breve descripción del caso. Luego ve el alias para transferir el valor de la consulta y envía todo por WhatsApp, con el comprobante adjunto.

## Cómo funciona

1. **Tus datos:** nombre, DNI, celular, email, localidad y horario preferido.
2. **Tu caso:** tema, descripción, hijos menores, expediente previo, otra parte y urgencia.
3. **Pago y envío:** resumen del caso, alias con botón para copiarlo y botón **Enviar por WhatsApp**, que abre el chat con la consulta ya redactada.

**Privacidad:** el sitio no guarda nada. No tiene servidor ni base de datos, y los datos viajan solo por el WhatsApp que envía el propio cliente.

## Configuración

Todo se configura en **`config.js`**: número de WhatsApp, alias, titular, honorario, etc. Mientras falte el número o el alias, la página muestra un aviso rojo arriba.

## Publicación (GitHub Pages)

1. En el repo, entrá a **Settings → Pages**.
2. En *Source*, elegí **Deploy from a branch**, rama `main` y carpeta `/ (root)`.
3. Guardá. En un par de minutos el sitio queda publicado en `https://aranzabetiago-create.github.io/consultafamilia/`.

## Archivos

| Archivo | Qué contiene |
|---|---|
| `index.html` | Estructura del formulario |
| `styles.css` | Estilos (adaptados a celular) |
| `app.js` | Pasos, validación, resumen y enlace a WhatsApp |
| `config.js` | Datos del estudio, WhatsApp y cuenta |
