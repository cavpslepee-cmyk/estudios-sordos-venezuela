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
        var otros = p.otros_titulos
          ? '<br><span class="texto-suave texto-chico">También: ' + esc(p.otros_titulos) + "</span>"
          : "";
        return "<tr>" +
          "<td>" + esc(p.apellidos) + ", " + esc(p.nombres) + "</td>" +
          "<td>" + esc(p.titulo_egreso) + otros + "</td>" +
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

  /* ---------------- Contenido editable de la portada ---------------- */

  /* Aplica el contenido guardado por el administrador (o los valores por
     defecto). Los textos planos se escapan; los campos marcados como HTML
     (texto de las tarjetas "Sobre este sitio" y leyendas de apoyos) se
     insertan tal cual, porque los redacta el propio admin. Las secciones
     dinámicas (videos, destacadas, noticias, resumen del censo, listado de
     egresados y contadores) NO se tocan aquí: las pintan otras funciones. */
  async function cargarContenidoInicio() {
    var c;
    try {
      c = await window.DB.obtenerContenidoInicio();
    } catch (e) {
      c = window.INICIO_CONTENIDO_DEFECTO || {};
    }
    if (!c) return;

    function ponTexto(id, valor) {
      var el = document.getElementById(id);
      if (el && valor !== undefined && valor !== null) el.textContent = valor;
    }
    function ponHtml(id, valor) {
      var el = document.getElementById(id);
      if (el && valor !== undefined && valor !== null) el.innerHTML = valor;
    }
    function ponImagen(id, url, alt) {
      var el = document.getElementById(id);
      if (!el) return;
      if (url) el.src = url;
      if (alt !== undefined && alt !== null) el.alt = alt;
    }

    /* Hero: título, subtítulo, imagen de fondo y botones de acción. El
       primer botón va resaltado (boton-claro) y el resto en contorno blanco,
       igual que el diseño original de la portada. */
    var h = c.hero || {};
    ponTexto("inicio-hero-titulo", h.titulo);
    ponTexto("inicio-hero-subtitulo", h.subtitulo);
    var media = document.getElementById("inicio-hero-media");
    if (media && h.imagen_url) media.style.backgroundImage = "url('" + h.imagen_url + "')";
    var acciones = document.getElementById("inicio-hero-acciones");
    if (acciones && Array.isArray(h.botones)) {
      acciones.innerHTML = h.botones.map(function (b, i) {
        if (!b || (!b.texto && !b.url)) return "";
        var clase = i === 0 ? "boton boton-claro" : "boton boton-contorno";
        var estilo = i === 0 ? "" : ' style="color:#fff;border-color:#fff"';
        return '<a class="' + clase + '"' + estilo + ' href="' + esc(b.url || "") + '">' +
          esc(b.texto || "") + "</a>";
      }).join("");
    }

    /* Teaser del seminario (su visibilidad la controla window.Sitio aparte). */
    var st = c.seminario_teaser || {};
    ponTexto("inicio-sem-insignia", st.insignia);
    ponTexto("inicio-sem-titulo", st.titulo);
    ponTexto("inicio-sem-texto", st.texto);
    ponImagen("inicio-sem-flyer", st.flyer_url, st.flyer_alt);
    var semBoton = document.getElementById("inicio-sem-boton");
    if (semBoton) {
      if (st.boton_texto !== undefined && st.boton_texto !== null) semBoton.textContent = st.boton_texto;
      if (st.boton_url) semBoton.href = st.boton_url;
    }

    /* Objetivo: título y párrafos. */
    var ob = c.objetivo || {};
    ponTexto("inicio-objetivo-titulo", ob.titulo);
    var obParrafos = document.getElementById("inicio-objetivo-parrafos");
    if (obParrafos && Array.isArray(ob.parrafos)) {
      obParrafos.innerHTML = ob.parrafos
        .filter(function (p) { return String(p || "").trim(); })
        .map(function (p) { return "<p>" + esc(p) + "</p>"; })
        .join("");
    }

    /* Encabezados de las secciones dinámicas. */
    var s = c.secciones || {};
    ponTexto("inicio-investigaciones-titulo", s.investigaciones_titulo);
    ponTexto("inicio-investigaciones-subtitulo", s.investigaciones_subtitulo);
    ponTexto("inicio-noticias-titulo", s.noticias_titulo);
    ponTexto("inicio-noticias-subtitulo", s.noticias_subtitulo);
    ponTexto("inicio-censo-titulo", s.censo_titulo);
    ponTexto("inicio-censo-subtitulo", s.censo_subtitulo);
    ponTexto("inicio-egresados-titulo", s.egresados_titulo);
    ponTexto("inicio-egresados-subtitulo", s.egresados_subtitulo);

    /* Figura del censo y sus dos tarjetas de llamado a la acción. La primera
       tarjeta usa el botón simple y las siguientes el botón navy, como el
       diseño original. */
    var cf = c.censo_figura || {};
    ponImagen("inicio-censo-imagen", cf.imagen_url, cf.imagen_alt);
    ponTexto("inicio-censo-caption", cf.caption);
    var censoTarjetas = document.getElementById("inicio-censo-tarjetas");
    if (censoTarjetas && Array.isArray(c.censo_tarjetas)) {
      censoTarjetas.innerHTML = c.censo_tarjetas.map(function (t, i) {
        if (!t) return "";
        var claseBoton = i === 0 ? "boton" : "boton boton-navy";
        var boton = (t.boton_texto || t.boton_url)
          ? '<div class="tarjeta-acciones"><a class="' + claseBoton + '" href="' +
            esc(t.boton_url || "") + '">' + esc(t.boton_texto || "") + "</a></div>"
          : "";
        return '<div class="tarjeta"><h3>' + esc(t.titulo || "") + "</h3>" +
          '<p class="tarjeta-texto">' + esc(t.texto || "") + "</p>" + boton + "</div>";
      }).join("");
    }

    /* Galería de imágenes de la comunidad. */
    var g = c.galeria || {};
    ponTexto("inicio-galeria-titulo", g.titulo);
    ponTexto("inicio-galeria-subtitulo", g.subtitulo);
    var galeria = document.getElementById("inicio-galeria");
    if (galeria && Array.isArray(g.items)) {
      galeria.innerHTML = g.items.map(function (it) {
        if (!it) return "";
        return '<figure class="figura">' +
          '<img src="' + esc(it.imagen_url || "") + '" alt="' + esc(it.imagen_alt || "") + '" loading="lazy">' +
          "<figcaption>" + esc(it.caption || "") + "</figcaption></figure>";
      }).join("");
    }

    /* Sobre este sitio: tarjetas con texto HTML y foto opcional. */
    var so = c.sobre || {};
    ponTexto("inicio-sobre-titulo", so.titulo);
    var sobreTarjetas = document.getElementById("inicio-sobre-tarjetas");
    if (sobreTarjetas && Array.isArray(so.tarjetas)) {
      sobreTarjetas.innerHTML = so.tarjetas.map(function (t) {
        if (!t) return "";
        var foto = t.imagen_url
          ? '<img class="tarjeta-foto" src="' + esc(t.imagen_url) + '" alt="' +
            esc(t.imagen_alt || "") + '" loading="lazy">'
          : "";
        return '<div class="tarjeta"><h3>' + esc(t.titulo || "") + "</h3>" + foto +
          '<p class="tarjeta-texto">' + (t.texto || "") + "</p></div>";
      }).join("");
    }

    /* Organizaciones que apoyan: logos con leyenda HTML. */
    var ap = c.apoyos || {};
    ponTexto("inicio-apoyos-titulo", ap.titulo);
    ponTexto("inicio-apoyos-subtitulo", ap.subtitulo);
    var apoyos = document.getElementById("inicio-apoyos");
    if (apoyos && Array.isArray(ap.items)) {
      apoyos.innerHTML = ap.items.map(function (it) {
        if (!it) return "";
        return '<figure class="figura apoyo">' +
          '<img src="' + esc(it.logo_url || "") + '" alt="' + esc(it.logo_alt || "") + '" loading="lazy">' +
          "<figcaption>" + (it.caption || "") + "</figcaption></figure>";
      }).join("");
    }

    /* Pie: descripción y contacto de recepción de trabajos. */
    var pie = c.pie || {};
    ponTexto("inicio-pie-descripcion", pie.descripcion);
    var contacto = document.getElementById("inicio-pie-contacto");
    if (contacto && (pie.contacto_texto || pie.contacto_correo)) {
      var correo = pie.contacto_correo || "";
      contacto.innerHTML = esc(pie.contacto_texto || "") + "<br>" +
        (correo ? '<a href="mailto:' + esc(correo) + '">' + esc(correo) + "</a>" : "");
    }
  }

  function iniciar() {
    cargarContenidoInicio();
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
