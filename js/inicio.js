/* Página de inicio: contadores, videos, destacadas y censo. */
(function () {
  "use strict";

  var esc = window.Util.esc;

  async function cargarContadores() {
    window.Sitio.pintarContadorBreve(document.getElementById("contador-egresados"));
    try {
      var publicadas = await window.DB.listarInvestigaciones({});
      var el = document.getElementById("contador-investigaciones");
      if (el) el.textContent = String(publicadas.length);
    } catch (e) {
      var el2 = document.getElementById("contador-investigaciones");
      if (el2) el2.textContent = "—";
    }
  }

  async function cargarDestacadas() {
    var zona = document.getElementById("zona-destacadas");
    if (!zona) return;
    try {
      var lista = await window.DB.listarInvestigaciones({ limit: 6 });
      var destacadas = lista.filter(function (i) { return i.destacado; });
      var aMostrar = destacadas.length ? destacadas : lista.slice(0, 3);

      if (!aMostrar.length) {
        zona.outerHTML = window.Sitio.mensajeVacio(
          "Todavía no hay investigaciones publicadas. El administrador puede agregarlas desde el panel."
        );
        return;
      }
      zona.innerHTML = aMostrar.map(window.Sitio.tarjetaInvestigacion).join("");
    } catch (error) {
      zona.outerHTML = window.Sitio.mensajeError(error);
    }
  }

  async function cargarNoticiasBreves() {
    var zona = document.getElementById("zona-noticias-breves");
    if (!zona) return;
    try {
      var lista = await window.DB.listarNoticias();
      var recientes = lista.slice(0, 3);
      if (!recientes.length) {
        zona.innerHTML = '<p class="texto-suave">Aún no hay noticias publicadas.</p>';
        return;
      }
      zona.innerHTML = '<div class="rejilla">' + recientes.map(function (n) {
        var anticipo = String(n.cuerpo || "").split(/\n+/)[0] || "";
        if (anticipo.length > 180) anticipo = anticipo.slice(0, 177).trimEnd() + "…";
        return '<div class="tarjeta noticia-breve">' +
          '<p class="noticia-fecha">' + esc(window.Util.formatearFecha(n.fecha)) + "</p>" +
          '<h3><a href="noticias.html">' + esc(n.titulo) + "</a></h3>" +
          '<p class="tarjeta-texto">' + esc(anticipo) + "</p>" +
          "</div>";
      }).join("") + "</div>";
    } catch (error) {
      zona.innerHTML = window.Sitio.mensajeError(error);
    }
  }

  async function cargarEgresadosPublicos() {
    var zona = document.getElementById("zona-egresados-publicos");
    if (!zona) return;
    try {
      var personas = await window.DB.nombresPublicosEgresados();
      if (!personas.length) {
        zona.outerHTML = window.Sitio.mensajeVacio(
          "Aún no hay personas registradas que hayan autorizado mostrar su nombre. " +
          "Sé la primera en completar el censo."
        );
        return;
      }
      var filas = personas.map(function (p) {
        return "<tr>" +
          "<td>" + esc(p.apellidos) + ", " + esc(p.nombres) + "</td>" +
          "<td>" + esc(p.titulo_egreso) + "</td>" +
          "<td>" + esc(p.universidad) + "</td>" +
          "<td>" + esc(p.estado) + "</td>" +
          "<td>" + esc(p.anio_graduacion || "") + "</td>" +
          "</tr>";
      }).join("");

      zona.outerHTML =
        '<div class="tabla-envoltura" id="zona-egresados-publicos">' +
          "<table>" +
            "<caption>Personas sordas egresadas que autorizaron su publicación</caption>" +
            "<thead><tr>" +
              "<th scope=\"col\">Nombre</th><th scope=\"col\">Título</th>" +
              "<th scope=\"col\">Universidad</th><th scope=\"col\">Estado</th>" +
              "<th scope=\"col\">Año</th>" +
            "</tr></thead>" +
            "<tbody>" + filas + "</tbody>" +
          "</table>" +
        "</div>";
    } catch (error) {
      zona.outerHTML = window.Sitio.mensajeError(error);
    }
  }

  function iniciar() {
    cargarContadores();
    window.Sitio.pintarVideos(document.getElementById("zona-videos"));
    window.Sitio.pintarResumenCenso(document.getElementById("zona-resumen-censo"));
    cargarDestacadas();
    cargarNoticiasBreves();
    cargarEgresadosPublicos();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
