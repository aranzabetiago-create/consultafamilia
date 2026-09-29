(function () {
  "use strict";

  const C = window.CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const form = $("#form");
  const TOTAL = 3;
  let paso = 1;

  const pendiente = (v) => !v || v === "A_COMPLETAR";

  // ---------- Volcar configuración en la página ----------
  $$("[data-config]").forEach((el) => { el.textContent = C[el.dataset.config] || ""; });
  $$("[data-si]").forEach((el) => { if (!C[el.dataset.si]) el.hidden = true; });
  if (C.honorario) $("#honorario-linea").hidden = false;
  if (pendiente(C.whatsapp) || pendiente(C.alias)) $("#aviso-config").hidden = false;
  $("#numero-visible").textContent = formatearNumero(C.whatsapp);

  const max = C.maxDescripcion || 1200;
  const desc = form.elements.descripcion;
  desc.maxLength = max;
  $("#max").textContent = max;
  desc.addEventListener("input", () => { $("#contador").textContent = desc.value.length; });

  // ---------- Campos condicionales ----------
  const mostrarSi = (nombre, valor, id) => {
    const actualizar = () => { $(id).hidden = form.elements[nombre].value !== valor; };
    $$(`[name="${nombre}"]`).forEach((r) => r.addEventListener("change", actualizar));
    actualizar();
  };
  mostrarSi("hijos", "Sí", "#campo-edades");
  mostrarSi("expediente", "Sí", "#campo-juzgado");
  form.elements.tema.addEventListener("change", (e) => {
    $("#alerta-violencia").hidden = !e.target.value.startsWith("Violencia");
  });

  // ---------- Navegación ----------
  $("#btn-siguiente").addEventListener("click", () => {
    if (!validar(paso)) return;
    irA(paso + 1);
  });
  $("#btn-atras").addEventListener("click", () => irA(paso - 1));

  function irA(n) {
    paso = Math.min(Math.max(n, 1), TOTAL);
    $$("[data-paso]").forEach((s) => { s.hidden = Number(s.dataset.paso) !== paso; });
    $$("[data-paso-ind]").forEach((li) => {
      const i = Number(li.dataset.pasoInd);
      li.classList.toggle("activo", i === paso);
      li.classList.toggle("hecho", i < paso);
    });
    $("#btn-atras").hidden = paso === 1;
    $("#btn-siguiente").hidden = paso === TOTAL;
    ocultarError();
    if (paso === TOTAL) prepararEnvio();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- Validación ----------
  function validar(n) {
    const seccion = $(`[data-paso="${n}"]`);
    let primero = null;
    $$("input, select, textarea", seccion).forEach((el) => {
      el.classList.remove("invalido");
      if (el.type === "radio" || el.closest("[hidden]")) return;
      const v = el.value.trim();
      let ok = true;
      if (el.required && !v) ok = false;
      else if (el.name === "dni" && v && !/^\d{7,8}$/.test(v.replace(/\./g, ""))) ok = false;
      else if (el.name === "telefono" && v && v.replace(/\D/g, "").length < 8) ok = false;
      else if (el.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) ok = false;
      if (!ok) { el.classList.add("invalido"); primero = primero || el; }
    });
    if (primero) {
      mostrarError("Revisá los campos marcados en rojo.");
      primero.focus();
      return false;
    }
    return true;
  }

  function mostrarError(t) { const e = $("#error"); e.textContent = t; e.hidden = false; }
  function ocultarError() { $("#error").hidden = true; }

  // ---------- Resumen ----------
  function datos() {
    const f = form.elements;
    const val = (n) => (f[n] ? f[n].value.trim() : "");
    return {
      nombre: val("nombre"), dni: val("dni").replace(/\./g, ""), telefono: val("telefono"),
      email: val("email"), localidad: val("localidad"), horario: val("horario") || "Indistinto",
      tema: val("tema"), descripcion: val("descripcion"), hijos: val("hijos"), edades: val("edades"),
      expediente: val("expediente"), juzgado: val("juzgado"), contraparte: val("contraparte"),
      urgencia: val("urgencia"),
    };
  }

  function armarResumen(d) {
    const l = [];
    l.push("*NUEVA CONSULTA — DERECHO DE FAMILIA*", "");
    l.push("*Datos personales*");
    l.push(`• Nombre: ${d.nombre}`, `• DNI: ${d.dni}`, `• Celular: ${d.telefono}`);
    if (d.email) l.push(`• Email: ${d.email}`);
    l.push(`• Localidad: ${d.localidad}`, `• Horario preferido: ${d.horario}`, "");
    l.push("*El caso*");
    l.push(`• Tema: ${d.tema}`, `• Urgencia: ${d.urgencia}`);
    l.push(`• Hijos/as menores: ${d.hijos}${d.hijos === "Sí" && d.edades ? ` (${d.edades})` : ""}`);
    l.push(`• Expediente o mediación: ${d.expediente}${d.expediente === "Sí" && d.juzgado ? ` — ${d.juzgado}` : ""}`);
    if (d.contraparte) l.push(`• Otra parte: ${d.contraparte}`);
    l.push("", "*Descripción*", d.descripcion, "");
    l.push("📎 Adjunto comprobante de transferencia.");
    return l.join("\n");
  }

  let resumenActual = "";
  function prepararEnvio() {
    resumenActual = armarResumen(datos());
    $("#resumen").textContent = resumenActual.replace(/\*/g, "");
    actualizarBotonWA();
  }

  const btnWA = $("#btn-whatsapp");
  const consentimiento = form.elements.consentimiento;
  consentimiento.addEventListener("change", actualizarBotonWA);

  function actualizarBotonWA() {
    const listo = consentimiento.checked && !pendiente(C.whatsapp);
    btnWA.classList.toggle("deshabilitado", !listo);
    btnWA.href = listo
      ? `https://wa.me/${String(C.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(resumenActual)}`
      : "#";
  }

  btnWA.addEventListener("click", (e) => {
    if (!consentimiento.checked) {
      e.preventDefault();
      mostrarError("Para enviar, marcá la casilla de consentimiento.");
      consentimiento.focus();
    } else if (pendiente(C.whatsapp)) {
      e.preventDefault();
      mostrarError("El número de WhatsApp todavía no está configurado.");
    } else {
      ocultarError();
    }
  });

  // ---------- Copiar ----------
  $$("[data-copiar]").forEach((b) =>
    b.addEventListener("click", () => copiar(C[b.dataset.copiar], "Alias copiado"))
  );
  $("#btn-copiar-resumen").addEventListener("click", () =>
    copiar(resumenActual.replace(/\*/g, ""), "Resumen copiado")
  );

  async function copiar(texto, msj) {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      const t = document.createElement("textarea");
      t.value = texto; document.body.appendChild(t); t.select();
      document.execCommand("copy"); t.remove();
    }
    toast(msj);
  }

  let tId;
  function toast(t) {
    const el = $("#toast");
    el.textContent = t; el.hidden = false;
    clearTimeout(tId); tId = setTimeout(() => { el.hidden = true; }, 1800);
  }

  function formatearNumero(n) {
    if (pendiente(n)) return "(a configurar)";
    const d = String(n).replace(/\D/g, "");
    // 549 + área + número  ->  +54 9 área número
    return d.startsWith("549") ? `+54 9 ${d.slice(3, 7)} ${d.slice(7)}` : `+${d}`;
  }
})();
