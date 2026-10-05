/* Formulario del censo de profesionales sordos egresados. */
(function () {
  "use strict";

  var cfg = window.CONFIG;
  var Util = window.Util;

  var formulario, aviso, botonEnviar, listaTitulos, contadorTitulos = 0;

  /* ------------------------- Listas desplegables ------------------------- */

  function llenarEstados() {
    var select = document.getElementById("estado");
    cfg.ESTADOS_VENEZUELA.forEach(function (estado) {
      var opcion = document.createElement("option");
      opcion.value = estado;
      opcion.textContent = estado;
      select.appendChild(opcion);
    });
  }

  function llenarCategorias() {
    var select = document.getElementById("categoria_egreso");
    cfg.CATEGORIAS_EGRESO.forEach(function (cat) {
      var opcion = document.createElement("option");
      opcion.value = cat.valor;
      opcion.textContent = cat.etiqueta;
      select.appendChild(opcion);
    });

    select.addEventListener("change", function () {
      var elegida = cfg.CATEGORIAS_EGRESO.filter(function (c) { return c.valor === select.value; })[0];
      document.getElementById("nivel").value = elegida
        ? (elegida.nivel === "PREGRADO" ? "Pregrado" : "Postgrado")
        : "Se determina automáticamente";
    });
  }

  /* ------------------------- Títulos adicionales ------------------------- */

  function crearBloqueTitulo() {
    contadorTitulos++;
    var n = contadorTitulos;

    var bloque = document.createElement("div");
    bloque.className = "repetidor-elemento";
    bloque.setAttribute("data-indice", n);

    bloque.innerHTML =
      '<div class="repetidor-cabecera">' +
        "<strong>Título adicional " + n + "</strong>" +
        '<button type="button" class="boton-quitar" data-quitar>Quitar</button>' +
      "</div>" +
      '<div class="campo">' +
        '<label for="titulo-extra-' + n + '">Título obtenido</label>' +
        '<input type="text" id="titulo-extra-' + n + '" data-campo="titulo" maxlength="180" placeholder="Ejemplo: Maestría en Educación">' +
      "</div>" +
      '<div class="fila">' +
        '<div class="campo">' +
          '<label for="universidad-extra-' + n + '">Universidad</label>' +
          '<input type="text" id="universidad-extra-' + n + '" data-campo="universidad" maxlength="160">' +
        "</div>" +
        '<div class="campo">' +
          '<label for="anio-extra-' + n + '">Año</label>' +
          '<input type="number" id="anio-extra-' + n + '" data-campo="anio_graduacion" min="1950" max="2100" step="1">' +
        "</div>" +
        '<div class="campo">' +
          '<label for="categoria-extra-' + n + '">Categoría</label>' +
          '<select id="categoria-extra-' + n + '" data-campo="categoria_egreso">' +
            '<option value="">No aplica</option>' +
          "</select>" +
        "</div>" +
      "</div>";

    var selectCategoria = bloque.querySelector('[data-campo="categoria_egreso"]');
    cfg.CATEGORIAS_EGRESO.forEach(function (cat) {
      var opcion = document.createElement("option");
      opcion.value = cat.valor;
      opcion.textContent = cat.etiqueta;
      selectCategoria.appendChild(opcion);
    });

    bloque.querySelector("[data-quitar]").addEventListener("click", function () {
      bloque.remove();
      renumerarTitulos();
    });

    return bloque;
  }

  function renumerarTitulos() {
    var bloques = listaTitulos.querySelectorAll(".repetidor-elemento");
    bloques.forEach(function (bloque, i) {
      bloque.querySelector(".repetidor-cabecera strong").textContent = "Título adicional " + (i + 1);
    });
    contadorTitulos = bloques.length;
  }

  function leerTitulosAdicionales() {
    var resultado = [];
    listaTitulos.querySelectorAll(".repetidor-elemento").forEach(function (bloque) {
      var titulo = Util.texto(bloque.querySelector('[data-campo="titulo"]').value);
      if (!titulo) return;

      var anio = bloque.querySelector('[data-campo="anio_graduacion"]').value;
      var categoria = bloque.querySelector('[data-campo="categoria_egreso"]').value;
      var elegida = cfg.CATEGORIAS_EGRESO.filter(function (c) { return c.valor === categoria; })[0];

      resultado.push({
        titulo: titulo,
        universidad: Util.texto(bloque.querySelector('[data-campo="universidad"]').value) || null,
        anio_graduacion: anio ? Number(anio) : null,
        categoria_egreso: categoria || null,
        nivel: elegida ? elegida.nivel : null
      });
    });
    return resultado;
  }

  /* ------------------------- Validación ------------------------- */

  function marcarError(nombre, mensaje) {
    var campo = formulario.querySelector('[name="' + nombre + '"]');
    var destino = formulario.querySelector('[data-error-para="' + nombre + '"]');
    if (destino) {
      destino.textContent = mensaje;
      destino.hidden = false;
    }
    if (campo && campo.type !== "radio") {
      var contenedor = campo.closest(".campo");
      if (contenedor) contenedor.classList.add("campo-invalido");
      campo.setAttribute("aria-invalid", "true");
    }
    return campo;
  }

  function limpiarErrores() {
    formulario.querySelectorAll(".mensaje-error").forEach(function (el) {
      el.hidden = true;
      el.textContent = "";
    });
    formulario.querySelectorAll(".campo-invalido").forEach(function (el) {
      el.classList.remove("campo-invalido");
    });
    formulario.querySelectorAll('[aria-invalid]').forEach(function (el) {
      el.removeAttribute("aria-invalid");
    });
  }

  function validar() {
    limpiarErrores();
    var primerInvalido = null;
    var anioActual = new Date().getFullYear();

    function exigir(nombre, mensaje) {
      var campo = formulario.querySelector('[name="' + nombre + '"]');
      var valor = campo && campo.type === "radio"
        ? (formulario.querySelector('[name="' + nombre + '"]:checked') || {}).value
        : Util.texto(campo && campo.value);
      if (!valor) { primerInvalido = primerInvalido || marcarError(nombre, mensaje); return false; }
      return true;
    }

    exigir("nombres", "Escribe tus nombres.");
    exigir("apellidos", "Escribe tus apellidos.");
    exigir("estado", "Selecciona el estado donde resides.");
    exigir("universidad", "Indica la universidad donde te graduaste.");
    exigir("titulo_egreso", "Escribe el título que obtuviste.");
    exigir("categoria_egreso", "Selecciona tu categoría de egreso.");

    var anio = formulario.querySelector('[name="anio_graduacion"]');
    var valorAnio = Number(anio.value);
    if (!anio.value) {
      primerInvalido = primerInvalido || marcarError("anio_graduacion", "Indica tu año de graduación.");
    } else if (!valorAnio || valorAnio < 1950 || valorAnio > anioActual) {
      primerInvalido = primerInvalido || marcarError(
        "anio_graduacion", "Escribe un año entre 1950 y " + anioActual + "."
      );
    }

    var experiencia = formulario.querySelector('[name="anios_experiencia"]');
    if (experiencia.value === "" || Number(experiencia.value) < 0 || Number(experiencia.value) > 70) {
      primerInvalido = primerInvalido || marcarError(
        "anios_experiencia", "Indica tus años de experiencia (entre 0 y 70)."
      );
    }

    var email = formulario.querySelector('[name="email"]');
    if (!Util.texto(email.value)) {
      primerInvalido = primerInvalido || marcarError("email", "Escribe tu correo electrónico.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(Util.texto(email.value))) {
      primerInvalido = primerInvalido || marcarError("email", "Ese correo no tiene un formato válido.");
    }

    if (!formulario.querySelector('[name="ha_realizado_investigacion"]:checked')) {
      primerInvalido = primerInvalido || marcarError(
        "ha_realizado_investigacion", "Indica si has realizado trabajo de investigación."
      );
    }

    return primerInvalido === null ? null : primerInvalido;
  }

  /* ------------------------- Envío ------------------------- */

  function leerFormulario() {
    var categoria = formulario.querySelector('[name="categoria_egreso"]').value;
    var elegida = cfg.CATEGORIAS_EGRESO.filter(function (c) { return c.valor === categoria; })[0];

    return {
      nombres: Util.texto(formulario.querySelector('[name="nombres"]').value),
      apellidos: Util.texto(formulario.querySelector('[name="apellidos"]').value),
      cedula: Util.texto(formulario.querySelector('[name="cedula"]').value) || null,
      universidad: Util.texto(formulario.querySelector('[name="universidad"]').value),
      carrera: Util.texto(formulario.querySelector('[name="carrera"]').value) || null,
      titulo_egreso: Util.texto(formulario.querySelector('[name="titulo_egreso"]').value),
      categoria_egreso: categoria,
      nivel: elegida ? elegida.nivel : null,
      anio_graduacion: Number(formulario.querySelector('[name="anio_graduacion"]').value),
      estado: formulario.querySelector('[name="estado"]').value,
      anios_experiencia: Number(formulario.querySelector('[name="anios_experiencia"]').value || 0),
      telefono: Util.texto(formulario.querySelector('[name="telefono"]').value) || null,
      email: Util.texto(formulario.querySelector('[name="email"]').value),
      ha_realizado_investigacion: formulario.querySelector('[name="ha_realizado_investigacion"]:checked').value === "si",
      autoriza_publicar_nombre: formulario.querySelector('[name="autoriza_publicar_nombre"]').checked,
      comentarios: Util.texto(formulario.querySelector('[name="comentarios"]').value) || null
    };
  }

  async function enviar(evento) {
    evento.preventDefault();
    Util.limpiarAviso(aviso);

    var invalido = validar();
    if (invalido) {
      Util.aviso(aviso, "error", "Revisa los campos marcados en rojo antes de enviar.");
      if (invalido.focus) invalido.focus();
      return;
    }

    botonEnviar.disabled = true;
    botonEnviar.textContent = "Enviando…";

    try {
      await window.DB.registrarCenso(leerFormulario(), leerTitulosAdicionales());

      formulario.reset();
      document.getElementById("nivel").value = "Se determina automáticamente";
      listaTitulos.innerHTML = "";
      contadorTitulos = 0;

      Util.aviso(
        aviso, "exito",
        "¡Gracias! Tu registro quedó guardado y ya forma parte del conteo de profesionales sordos egresados."
      );
      window.scrollTo({ top: aviso.offsetTop - 120, behavior: "smooth" });
    } catch (error) {
      Util.aviso(aviso, "error", "No se pudo guardar tu registro: " + error.message);
    } finally {
      botonEnviar.disabled = false;
      botonEnviar.textContent = "Enviar mi registro al censo";
    }
  }

  /* ------------------------- Arranque ------------------------- */

  function iniciar() {
    formulario = document.getElementById("formulario-censo");
    aviso = document.getElementById("aviso-formulario");
    botonEnviar = document.getElementById("boton-enviar-censo");
    listaTitulos = document.getElementById("lista-titulos-adicionales");

    llenarEstados();
    llenarCategorias();

    document.getElementById("agregar-titulo").addEventListener("click", function () {
      listaTitulos.appendChild(crearBloqueTitulo());
    });

    formulario.addEventListener("submit", enviar);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
