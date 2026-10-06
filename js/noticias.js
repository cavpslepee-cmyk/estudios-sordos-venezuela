/* Página pública de noticias: texto escrito, imagen o flyer y video. */
(function () {
  "use strict";

  var Util = window.Util;
  var esc = Util.esc;

  function parrafos(cuerpo) {
    return String(cuerpo || "").split(/\n+/).filter(function (linea) {
      return linea.trim() !== "";
    }).map(function (linea) {
      return "<p>" + esc(linea) + "</p>";
    }).join("");
  }

  function bloqueVideo(url, titulo) {
    var info = Util.normalizarUrlVideo(url);
    if (!info) return "";
    var tituloSeguro = esc(titulo || "Video de la noticia");
    if (info.tipo === "iframe") {
      return '<div class="reproductor"><iframe src="' + esc(info.url) + '" title="' + tituloSeguro + '" ' +
        'allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture" ' +
        'allowfullscreen loading="lazy"></iframe></div>';
    }
    if (info.tipo === "video") {
      return '<div class="reproductor"><video src="' + esc(info.url) + '" controls preload="metadata"></video></div>';
    }
    return '<p><a class="boton boton-contorno" href="' + esc(info.url) +
      '" target="_blank" rel="noopener noreferrer">Ver el video</a></p>';
  }

  function tarjetaNoticia(n) {
    var imagen = n.url_imagen
      ? '<figure class="figura noticia-imagen"><img src="' + esc(n.url_imagen) +
        '" alt="' + esc(n.texto_imagen || n.titulo) + '" loading="lazy"></figure>'
      : "";
    return '<article class="tarjeta noticia">' +
      '<p class="noticia-fecha">' + esc(Util.formatearFecha(n.fecha)) + "</p>" +
      "<h2>" + esc(n.titulo) + "</h2>" +
      imagen +
      '<div class="noticia-cuerpo">' + parrafos(n.cuerpo) + "</div>" +
      (n.url_video ? bloqueVideo(n.url_video, n.titulo) : "") +
      "</article>";
  }

  async function cargar() {
    var zona = document.getElementById("zona-noticias");
    try {
      var lista = await window.DB.listarNoticias();
      if (!lista.length) {
        zona.innerHTML = window.Sitio.mensajeVacio("Aún no hay noticias publicadas.");
        return;
      }
      zona.innerHTML = lista.map(tarjetaNoticia).join("");
    } catch (error) {
      zona.innerHTML = window.Sitio.mensajeError(error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", cargar);
  } else {
    cargar();
  }
})();
