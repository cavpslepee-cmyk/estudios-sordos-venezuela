/* Catálogo público de investigaciones con filtros por categoría y búsqueda. */
(function () {
  "use strict";

  var cfg = window.CONFIG;

  var estado = {
    categoria: window.Util.parametroUrl("categoria") || "",
    texto: window.Util.parametroUrl("q") || "",
    temporizador: null
  };

  function construirFiltros() {
    var contenedor = document.getElementById("filtros-categoria");
    if (!contenedor) return;

    cfg.CATEGORIAS_INVESTIGACION.forEach(function (cat) {
      var boton = document.createElement("button");
      boton.type = "button";
      boton.className = "filtro";
      boton.textContent = cat.etiqueta;
      boton.setAttribute("data-categoria", cat.valor);
      boton.setAttribute("aria-pressed", estado.categoria === cat.valor ? "true" : "false");
      boton.addEventListener("click", function () {
        estado.categoria = cat.valor;
        sincronizarFiltros();
        cargar();
      });
      contenedor.appendChild(boton);
    });

    var primero = contenedor.querySelector('.filtro[data-categoria=""]');
    if (primero) {
      primero.addEventListener("click", function () {
        estado.categoria = "";
        sincronizarFiltros();
        cargar();
      });
    }
    sincronizarFiltros();
  }

  function sincronizarFiltros() {
    document.querySelectorAll("#filtros-categoria .filtro").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-categoria") === estado.categoria ? "true" : "false");
    });
  }

  async function cargar() {
    var zona = document.getElementById("zona-resultados");
    var contador = document.getElementById("contador-resultados");
    if (!zona) return;

    zona.innerHTML = '<p class="cargando">Cargando investigaciones</p>';
    if (contador) contador.textContent = "";

    try {
      var lista = await window.DB.listarInvestigaciones({
        categoria: estado.categoria || null,
        texto: estado.texto || null
      });

      if (!lista.length) {
        zona.innerHTML = window.Sitio.mensajeVacio(
          "No se encontraron investigaciones con esos criterios. " +
          "Prueba con otra categoría o borra el texto de búsqueda."
        );
        if (contador) contador.textContent = "0 resultados";
        return;
      }

      if (contador) {
        var nombre = estado.categoria
          ? window.Util.categoriaInvestigacion(estado.categoria)
          : "todas las categorías";
        contador.textContent = lista.length + " resultado" + (lista.length === 1 ? "" : "s") +
          " en " + nombre.toLowerCase();
      }

      zona.innerHTML = lista.map(window.Sitio.tarjetaInvestigacion).join("");
    } catch (error) {
      zona.innerHTML = window.Sitio.mensajeError(error);
    }
  }

  function iniciar() {
    construirFiltros();

    var buscador = document.getElementById("buscador");
    if (buscador) {
      buscador.value = estado.texto;
      buscador.addEventListener("input", function () {
        window.clearTimeout(estado.temporizador);
        estado.temporizador = window.setTimeout(function () {
          estado.texto = buscador.value.trim();
          cargar();
        }, 350);
      });
      buscador.addEventListener("search", function () {
        estado.texto = buscador.value.trim();
        cargar();
      });
    }

    cargar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
