/* =====================================================================
   SEMINARIO — INSCRIPCIÓN Y POSTULACIÓN DE PONENCIAS
   =====================================================================
   Maneja la planilla de inscripción de seminario.html: muestra el
   módulo de ponentes solo si la persona postula, valida los campos y
   guarda a través de window.DB (Supabase o modo demostración).
   ===================================================================== */

(function () {
  "use strict";

  var formulario, aviso, botonEnviar, moduloPonente, campoDiapositivas;
  var TAMANIO_MAXIMO = 15 * 1024 * 1024; /* 15 MB, igual que el límite del bucket */
  var TIPOS_PERMITIDOS = [
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ];

  function valorRadio(nombre) {
    var marcado = formulario.querySelector('[name="' + nombre + '"]:checked');
    return marcado ? marcado.value : "";
  }

  function texto(id) {
    var campo = document.getElementById(id);
    return campo ? String(campo.value || "").trim() : "";
  }

  function limpiarErrores() {
    formulario.querySelectorAll(".campo-invalido").forEach(function (el) {
      el.classList.remove("campo-invalido");
    });
    formulario.querySelectorAll(".conjunto-opciones-invalido").forEach(function (el) {
      el.classList.remove("conjunto-opciones-invalido");
    });
  }

  function esPonente() {
    return valorRadio("rol") === "PONENTE";
  }

  function validar() {
    limpiarErrores();

    if (!texto("sem-nombres")) {
      marcarCampo("sem-nombres");
      return "Escribe tus nombres y apellidos tal como aparecerán en el certificado.";
    }
    var documento = texto("sem-documento");
    if (!documento) {
      marcarCampo("sem-documento");
      return "Escribe tu cédula de identidad o pasaporte.";
    }
    var email = texto("sem-email");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      marcarCampo("sem-email");
      return "Escribe un correo electrónico válido: ahí llegará tu certificado digital.";
    }
    if (!valorRadio("condicion")) { marcarGrupo("condicion"); return "Indica tu condición o identidad."; }
    if (!valorRadio("perfil")) { marcarGrupo("perfil"); return "Indica tu nivel de formación o afiliación."; }
    if (!valorRadio("modalidad")) { marcarGrupo("modalidad"); return "Elige si participas presencial o virtualmente."; }
    if (!valorRadio("accesibilidad")) { marcarGrupo("accesibilidad"); return "Indica si requieres alguna adaptación lingüística."; }
    if (!valorRadio("rol")) { marcarGrupo("rol"); return "Elige si participas como asistente o como ponente."; }

    if (esPonente()) {
      if (!texto("sem-titulo-ponencia")) {
        marcarCampo("sem-titulo-ponencia");
        return "Escribe el título de tu investigación o experiencia pedagógica.";
      }
      if (!texto("sem-eje")) {
        marcarCampo("sem-eje");
        return "Elige el eje temático al que postula tu ponencia.";
      }
      var video = texto("sem-video");
      if (!/^https?:\/\/.+\..+/.test(video)) {
        marcarCampo("sem-video");
        return "Pega el enlace de tu video resumen en LSV (YouTube, Drive o Vimeo).";
      }
      var archivo = campoDiapositivas.files[0];
      if (!archivo) {
        marcarCampo("sem-diapositivas");
        return "Adjunta tus diapositivas en PDF o PPTX.";
      }
      if (TIPOS_PERMITIDOS.indexOf(archivo.type) === -1) {
        marcarCampo("sem-diapositivas");
        return "Las diapositivas deben ser un archivo PDF o PPTX.";
      }
      if (archivo.size > TAMANIO_MAXIMO) {
        marcarCampo("sem-diapositivas");
        return "El archivo pesa más de 15 MB. Comprime las diapositivas o sube un enlace en su lugar.";
      }
    }
    return null;
  }

  function marcarCampo(id) {
    var campo = document.getElementById(id);
    if (!campo) return;
    var caja = campo.closest(".campo");
    if (caja) caja.classList.add("campo-invalido");
    campo.setAttribute("aria-invalid", "true");
  }

  function marcarGrupo(nombre) {
    var campo = formulario.querySelector('[name="' + nombre + '"]');
    var caja = campo && campo.closest(".conjunto-opciones");
    if (caja) caja.classList.add("conjunto-opciones-invalido");
  }

  function leerFormulario() {
    return {
      nombres_apellidos: texto("sem-nombres"),
      documento: texto("sem-documento"),
      email: emailMinusculas(),
      telefono: texto("sem-telefono") || null,
      pais: texto("sem-pais") || null,
      ciudad: texto("sem-ciudad") || null,
      condicion: valorRadio("condicion"),
      perfil: valorRadio("perfil"),
      modalidad: valorRadio("modalidad"),
      accesibilidad: valorRadio("accesibilidad"),
      rol: valorRadio("rol"),
      titulo_ponencia: esPonente() ? texto("sem-titulo-ponencia") : null,
      eje_tematico: esPonente() ? texto("sem-eje") : null,
      enlace_video: esPonente() ? texto("sem-video") : null
    };
  }

  function emailMinusculas() {
    return texto("sem-email").toLowerCase();
  }

  async function enviar(evento) {
    evento.preventDefault();
    aviso.hidden = true;

    var error = validar();
    if (error) {
      Util.aviso(aviso, "error", error);
      window.scrollTo({ top: aviso.offsetTop - 120, behavior: "smooth" });
      return;
    }

    var datos = leerFormulario();
    var archivo = esPonente() ? (campoDiapositivas.files[0] || null) : null;

    botonEnviar.disabled = true;
    botonEnviar.textContent = archivo ? "Subiendo diapositivas y enviando…" : "Enviando mi inscripción…";

    try {
      await window.DB.registrarInscripcionSeminario(datos, archivo);
      formulario.reset();
      moduloPonente.hidden = true;
      limpiarErrores();
      Util.aviso(
        aviso, "exito",
        "¡Inscripción registrada con éxito! Gracias por formar parte del I Seminario Nacional " +
        "de Actualización Pedagógica en LSV. " +
        (datos.modalidad === "PRESENCIAL"
          ? "Presenta tu comprobante digital o cédula el día del evento en la mesa de acreditación."
          : "Suscríbete y activa las notificaciones en nuestro canal de YouTube @ElprofesorSordoLepee.")
      );
      window.scrollTo({ top: aviso.offsetTop - 120, behavior: "smooth" });
    } catch (e) {
      var esDuplicado = /duplicate key|ux_seminario_documento|ya existe una inscripci/i.test(e.message || "");
      Util.aviso(aviso, "error", esDuplicado
        ? "Ya existe una inscripción con ese documento. Si necesitas corregir tus datos, " +
          "escribe a cavpslepee@gmail.com."
        : "No se pudo guardar tu inscripción: " + e.message);
    } finally {
      botonEnviar.disabled = false;
      botonEnviar.textContent = "Enviar mi inscripción";
    }
  }

  function sincronizarModuloPonente() {
    moduloPonente.hidden = !esPonente();
  }

  function iniciar() {
    formulario = document.getElementById("formulario-seminario");
    if (!formulario) return;
    aviso = document.getElementById("aviso-seminario");
    botonEnviar = document.getElementById("boton-inscribir");
    moduloPonente = document.getElementById("modulo-ponente");
    campoDiapositivas = document.getElementById("sem-diapositivas");

    formulario.querySelectorAll('[name="rol"]').forEach(function (radio) {
      radio.addEventListener("change", sincronizarModuloPonente);
    });
    formulario.addEventListener("submit", enviar);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
