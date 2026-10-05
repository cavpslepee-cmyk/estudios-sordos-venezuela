/* Diccionario de Lengua de Señas Venezolana: buscador y filtros. */
(function () {
  "use strict";

  var Util = window.Util;
  var esc = Util.esc;

  var estado = {
    texto: Util.parametroUrl("q") || "",
    categoria: Util.parametroUrl("area") || "",
    soloRecientes: Util.parametroUrl("recientes") === "1",
    temporizador: null
  };

  function tarjetaSenia(senia) {
    var inicial = esc(String(senia.palabra || "?").trim().charAt(0).toUpperCase());

    var media;
    if (senia.url_imagen) {
      media = '<div class="senia-media"><img src="' + esc(senia.url_imagen) +
              '" alt="Seña de ' + esc(senia.palabra) + '" loading="lazy"></div>';
    } else {
      media = '<div class="senia-media"><span class="letra-inicial" aria-hidden="true">' + inicial + "</span></div>";
    }

    var insignias = [];
    if (senia.categoria) insignias.push('<span class="insignia">' + esc(senia.categoria) + "</span>");
    if (senia.acuniada_recientemente) {
      insignias.push(
        '<span class="insignia insignia-nueva">Acuñada recientemente' +
        (senia.fecha_acuniada ? " · " + esc(Util.formatearFecha(senia.fecha_acuniada)) : "") +
        "</span>"
      );
    }

    var pie = [];
    if (senia.url_video) {
      pie.push(
        '<a class="boton boton-chico" href="' + esc(senia.url_video) +
        '" target="_blank" rel="noopener noreferrer">Ver el video de la seña</a>'
      );
    }
    if (senia.sinonimos) {
      pie.push('<span class="texto-chico texto-suave">También: ' + esc(senia.sinonimos) + "</span>");
    }

    return '<article class="senia">' + media +
      '<div class="senia-cuerpo">' +
        '<h2 class="senia-palabra">' + esc(senia.palabra) + "</h2>" +
        (insignias.length ? '<div class="senia-pie">' + insignias.join("") + "</div>" : "") +
        (senia.descripcion ? '<p class="senia-descripcion">' + esc(senia.descripcion) + "</p>" : "") +
        (senia.fuente ? '<p class="texto-chico texto-suave" style="margin:0">Fuente: ' + esc(senia.fuente) + "</p>" : "") +
        (pie.length ? '<div class="senia-pie">' + pie.join("") + "</div>" : "") +
      "</div>" +
    "</article>";
  }

  async function llenarCategorias() {
    var select = document.getElementById("filtro-categoria-senia");
    if (!select) return;
    try {
      var categorias = await window.DB.listarCategoriasSenias();
      select.innerHTML = '<option value="">Todas las áreas</option>' +
        categorias.map(function (c) {
          return '<option value="' + esc(c) + '"' + (estado.categoria === c ? " selected" : "") + ">" + esc(c) + "</option>";
        }).join("");
    } catch (e) {
      /* Sin categorías: el filtro queda con la opción "Todas las áreas" */
    }
  }

  async function cargar() {
    var zona = document.getElementById("zona-senias");
    var contador = document.getElementById("contador-senias");
    if (!zona) return;

    zona.innerHTML = '<p class="cargando">Cargando el diccionario</p>';
    if (contador) contador.textContent = "";

    try {
      var lista = await window.DB.listarSenias({
        texto: estado.texto || null,
        categoria: estado.categoria || null,
        soloRecientes: estado.soloRecientes
      });

      if (!lista.length) {
        zona.innerHTML = window.Sitio.mensajeVacio(
          "No se encontró ninguna seña con esos criterios. " +
          "Prueba escribiendo solo una parte de la palabra o quitando los filtros."
        );
        if (contador) contador.textContent = "0 señas";
        return;
      }

      var recientes = lista.filter(function (s) { return s.acuniada_recientemente; }).length;
      if (contador) {
        contador.textContent = lista.length + " seña" + (lista.length === 1 ? "" : "s") +
          (recientes ? " · " + recientes + " acuñada" + (recientes === 1 ? "" : "s") + " recientemente" : "");
      }

      zona.innerHTML = lista.map(tarjetaSenia).join("");
    } catch (error) {
      zona.innerHTML = window.Sitio.mensajeError(error);
    }
  }

  function iniciar() {
    var buscador = document.getElementById("buscador-senia");
    var selectCategoria = document.getElementById("filtro-categoria-senia");
    var checkbox = document.getElementById("solo-recientes");

    if (buscador) {
      buscador.value = estado.texto;
      buscador.addEventListener("input", function () {
        window.clearTimeout(estado.temporizador);
        estado.temporizador = window.setTimeout(function () {
          estado.texto = buscador.value.trim();
          cargar();
        }, 300);
      });
    }

    if (selectCategoria) {
      selectCategoria.addEventListener("change", function () {
        estado.categoria = selectCategoria.value;
        cargar();
      });
    }

    if (checkbox) {
      checkbox.checked = estado.soloRecientes;
      checkbox.addEventListener("change", function () {
        estado.soloRecientes = checkbox.checked;
        cargar();
      });
    }

    llenarCategorias().then(cargar);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
