/* =====================================================================
   UTILIDADES COMPARTIDAS — ESTUDIOS SORDOS DE VENEZUELA
   Interfaz, avisos, formateo, contador de egresados y videos de portada.
   ===================================================================== */

(function () {
  "use strict";

  var cfg = window.CONFIG;

  /* ------------------------- Utilidades ------------------------- */

  /* Escapa texto antes de insertarlo en HTML. Usar SIEMPRE con datos
     que vengan de la base de datos, para evitar inyección de HTML. */
  function esc(valor) {
    if (valor === null || valor === undefined) return "";
    return String(valor)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function texto(valor) {
    return String(valor === null || valor === undefined ? "" : valor).trim();
  }

  function etiquetaDe(lista, valor, porDefecto) {
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].valor === valor) return lista[i].etiqueta;
    }
    return porDefecto || valor || "";
  }

  function categoriaInvestigacion(valor) {
    return etiquetaDe(cfg.CATEGORIAS_INVESTIGACION, valor, valor);
  }

  function estadoInvestigacion(valor) {
    return etiquetaDe(cfg.ESTADOS_INVESTIGACION, valor, valor);
  }

  function claseEstado(valor) {
    return "insignia-" + String(valor || "").toLowerCase();
  }

  function formatearFecha(valor) {
    if (!valor) return "";
    var f = new Date(valor);
    if (isNaN(f.getTime())) return "";
    return f.toLocaleDateString("es-VE", { year: "numeric", month: "long", day: "numeric" });
  }

  function parametroUrl(nombre) {
    return new URLSearchParams(window.location.search).get(nombre);
  }

  function aviso(contenedor, tipo, mensaje) {
    if (!contenedor) return;
    contenedor.className = "aviso aviso-" + (tipo || "");
    contenedor.innerHTML = "<p>" + esc(mensaje) + "</p>";
    contenedor.hidden = false;
    contenedor.setAttribute("role", tipo === "error" ? "alert" : "status");
    if (tipo === "exito") {
      window.setTimeout(function () { contenedor.hidden = true; }, 9000);
    }
  }

  function limpiarAviso(contenedor) {
    if (!contenedor) return;
    contenedor.hidden = true;
    contenedor.innerHTML = "";
  }

  /* Convierte enlaces de YouTube / Vimeo al formato incrustable. */
  function normalizarUrlVideo(url) {
    var u = texto(url);
    if (!u) return null;

    var m;
    m = u.match(/(?:youtube\.com\/watch\?[^#]*v=|youtube\.com\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    if (m) return { tipo: "iframe", url: "https://www.youtube.com/embed/" + m[1] };

    m = u.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/);
    if (m) return { tipo: "iframe", url: "https://www.youtube.com/embed/" + m[1] };

    m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return { tipo: "iframe", url: "https://player.vimeo.com/video/" + m[1] };

    if (/\.(mp4|webm|ogg|ogv|mov)(\?|$)/i.test(u)) return { tipo: "video", url: u };

    /* Enlaces desconocidos se abren aparte en vez de romperse en el reproductor */
    return { tipo: "enlace", url: u };
  }

  /* ------------------------- Interfaz general ------------------------- */

  function marcarPaginaActiva() {
    var ruta = window.location.pathname.split("/").pop() || "index.html";
    var enlaces = document.querySelectorAll(".navegacion a[data-pagina]");
    enlaces.forEach(function (a) {
      if (a.getAttribute("data-pagina") === ruta) a.setAttribute("aria-current", "page");
    });
  }

  function menuMovil() {
    var boton = document.querySelector(".boton-menu");
    var nav = document.querySelector(".navegacion");
    if (!boton || !nav) return;
    boton.addEventListener("click", function () {
      var abierto = nav.classList.toggle("abierta");
      boton.setAttribute("aria-expanded", abierto ? "true" : "false");
      boton.textContent = abierto ? "✕ Cerrar" : "☰ Menú";
    });
  }

  function controlTamanoTexto() {
    var boton = document.querySelector("[data-accion='texto']");
    if (!boton) return;
    try {
      if (localStorage.getItem("esv_texto_grande") === "1") {
        document.body.classList.add("texto-grande");
        boton.textContent = "A− Texto normal";
      }
    } catch (e) { /* almacenamiento no disponible */ }
    boton.addEventListener("click", function () {
      var grande = document.body.classList.toggle("texto-grande");
      boton.textContent = grande ? "A− Texto normal" : "A+ Texto grande";
      try { localStorage.setItem("esv_texto_grande", grande ? "1" : "0"); } catch (e) {}
    });
  }

  function avisoModoDemo() {
    if (window.DB && window.DB.usaSupabase()) return;
    var avisoExiste = document.querySelector("[data-aviso-demo]");
    if (!avisoExiste) return;
    avisoExiste.hidden = false;
  }

  function anioEnElPie() {
    document.querySelectorAll("[data-anio-actual]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ------------------------- Contador de egresados ------------------------- */

  async function pintarResumenCenso(contenedor) {
    if (!contenedor) return;
    contenedor.innerHTML = '<p class="cargando">Consultando el registro de egresados</p>';
    try {
      var r = await window.DB.resumenCenso();
      var total = Number(r.total_egresados || 0);
      var conInv = Number(r.con_investigacion || 0);
      var pregrado = Number((r.por_nivel || {}).PREGRADO || 0);
      var postgrado = Number((r.por_nivel || {}).POSTGRADO || 0);

      contenedor.innerHTML =
        '<div class="tarjetas-contador">' +
          tarjeta(total, "Egresados registrados") +
          tarjeta(conInv, "Con trabajo de investigación") +
          tarjeta(pregrado, "Pregrado") +
          tarjeta(postgrado, "Postgrado") +
        "</div>" +
        '<p class="texto-suave texto-chico" style="margin-top:1rem">' +
          "Esta cantidad se actualiza automáticamente cada vez que una persona sorda " +
          "egresada completa el formulario del censo." +
        "</p>";
    } catch (e) {
      contenedor.innerHTML =
        '<div class="aviso aviso-alerta"><p>No se pudo consultar el registro en este momento. ' +
        esc(e.message) + "</p></div>";
    }
  }

  function tarjeta(numero, etiqueta) {
    return '<div class="tarjeta-contador"><strong>' + esc(numero) + "</strong><span>" + esc(etiqueta) + "</span></div>";
  }

  /* Dibuja el total grande en la franja del encabezado de la portada. */
  async function pintarContadorBreve(elemento) {
    if (!elemento) return;
    try {
      var r = await window.DB.resumenCenso();
      elemento.textContent = String(Number(r.total_egresados || 0));
    } catch (e) {
      elemento.textContent = "—";
    }
  }

  /* ------------------------- Videos de portada ------------------------- */

  async function pintarVideos(contenedor) {
    if (!contenedor) return;
    contenedor.innerHTML = '<p class="cargando">Cargando videos</p>';
    try {
      var videos = await window.DB.listarVideos(false);
      if (!videos.length) {
        contenedor.innerHTML =
          '<div class="reproductor"><div class="reproductor-sin-video">' +
          "<p>Aún no hay videos publicados.<br>El administrador puede agregarlos desde el panel.</p>" +
          "</div></div>";
        return;
      }
      var actual = 0;
      contenedor.innerHTML =
        '<div class="reproductor" id="reproductor-portada"></div>' +
        '<div class="lista-videos" role="group" aria-label="Lista de videos disponibles"></div>';

      function pintarReproductor() {
        var v = videos[actual];
        var caja = document.getElementById("reproductor-portada");
        var info = normalizarUrlVideo(v.url);
        var tituloSeguro = esc(v.titulo || "Video");

        if (info && info.tipo === "iframe") {
          caja.innerHTML =
            '<iframe src="' + esc(info.url) + '" title="' + tituloSeguro + '" ' +
            'allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture" ' +
            'allowfullscreen loading="lazy"></iframe>';
        } else if (info && info.tipo === "video") {
          caja.innerHTML = '<video src="' + esc(info.url) + '" controls preload="metadata"></video>';
        } else if (info && info.tipo === "enlace") {
          caja.innerHTML =
            '<div class="reproductor-sin-video"><p><strong>' + tituloSeguro + "</strong><br>" +
            esc(v.descripcion || "") + '<br><a class="boton boton-claro" style="margin-top:1rem" ' +
            'href="' + esc(info.url) + '" target="_blank" rel="noopener noreferrer">Ver el video</a></p></div>';
        } else {
          caja.innerHTML =
            '<div class="reproductor-sin-video"><p><strong>' + tituloSeguro + "</strong><br>" +
            esc(v.descripcion || "El administrador aún no ha cargado el archivo de este video.") + "</p></div>";
        }

        var cabecera = document.getElementById("titulo-video-activo");
        if (cabecera) cabecera.textContent = v.titulo || "";
        var detalle = document.getElementById("descripcion-video-activo");
        if (detalle) detalle.textContent = v.descripcion || "";

        document.querySelectorAll(".lista-videos button").forEach(function (b, i) {
          b.setAttribute("aria-pressed", i === actual ? "true" : "false");
        });
      }

      var lista = contenedor.querySelector(".lista-videos");
      videos.forEach(function (v, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = v.titulo || ("Video " + (i + 1));
        b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
        b.addEventListener("click", function () { actual = i; pintarReproductor(); });
        lista.appendChild(b);
      });

      pintarReproductor();
    } catch (e) {
      contenedor.innerHTML =
        '<div class="aviso aviso-alerta"><p>No se pudieron cargar los videos. ' + esc(e.message) + "</p></div>";
    }
  }

  /* ------------------------- Tarjeta de investigación ------------------------- */

  function recortar(valor, maximo) {
    var t = texto(valor);
    if (t.length <= maximo) return t;
    return t.slice(0, maximo).replace(/\s+\S*$/, "") + "…";
  }

  function tarjetaInvestigacion(inv) {
    var partes = [];
    partes.push('<article class="tarjeta">');

    partes.push(
      '<div class="tarjeta-meta">' +
        '<span class="insignia insignia-categoria">' + esc(categoriaInvestigacion(inv.categoria)) + "</span>" +
        (inv.anio ? '<span>' + esc(inv.anio) + "</span>" : "") +
        (inv.destacado ? '<span class="insignia">Destacado</span>' : "") +
      "</div>"
    );

    partes.push("<h3>" + esc(inv.titulo) + "</h3>");
    partes.push('<p class="tarjeta-meta"><span>Autor: ' + esc(inv.autor) + "</span></p>");

    if (inv.universidad) {
      partes.push('<p class="tarjeta-meta"><span>' + esc(inv.universidad) + "</span></p>");
    }

    if (inv.resumen) {
      partes.push('<p class="tarjeta-texto">' + esc(recortar(inv.resumen, 240)) + "</p>");
    }

    var acciones = [];
    if (inv.url_pdf) {
      acciones.push(
        '<a class="boton boton-chico" href="' + esc(inv.url_pdf) +
        '" target="_blank" rel="noopener noreferrer">Leer el PDF</a>'
      );
    }
    if (inv.url_externa) {
      acciones.push(
        '<a class="boton boton-chico boton-contorno" href="' + esc(inv.url_externa) +
        '" target="_blank" rel="noopener noreferrer">Ver la publicación</a>'
      );
    }
    if (acciones.length) {
      partes.push('<div class="tarjeta-acciones">' + acciones.join("") + "</div>");
    }

    partes.push("</article>");
    return partes.join("");
  }

  function mensajeVacio(textoVacio) {
    return '<div class="vacio"><p>' + esc(textoVacio) + "</p></div>";
  }

  function mensajeError(error) {
    return '<div class="aviso aviso-error"><p>No se pudo cargar la información. ' +
           esc(error && error.message ? error.message : error) + "</p></div>";
  }

  /* ------------------------- Arranque ------------------------- */

  var CLAVE_VISITA_CONTADA = "esv_visita_contada";

  async function iniciarContadorVisitas() {
    var elementos = document.querySelectorAll("[data-contador-visitas]");
    if (!elementos.length) return;

    var pagina = window.location.pathname.split("/").pop() || "index.html";
    if (pagina !== "admin.html" && !localStorage.getItem(CLAVE_VISITA_CONTADA)) {
      localStorage.setItem(CLAVE_VISITA_CONTADA, "1");
      try {
        await window.DB.registrarVisita(pagina);
      } catch (e) {
        localStorage.removeItem(CLAVE_VISITA_CONTADA);
      }
    }

    try {
      var total = await window.DB.totalVisitas();
      elementos.forEach(function (el) { el.textContent = String(total); });
    } catch (e) {
      elementos.forEach(function (el) { el.textContent = "—"; });
    }
  }

  function inicializar() {
    marcarPaginaActiva();
    menuMovil();
    controlTamanoTexto();
    avisoModoDemo();
    anioEnElPie();
    iniciarContadorVisitas();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializar);
  } else {
    inicializar();
  }

  window.Util = {
    esc: esc,
    texto: texto,
    etiquetaDe: etiquetaDe,
    categoriaInvestigacion: categoriaInvestigacion,
    estadoInvestigacion: estadoInvestigacion,
    claseEstado: claseEstado,
    formatearFecha: formatearFecha,
    parametroUrl: parametroUrl,
    aviso: aviso,
    limpiarAviso: limpiarAviso,
    normalizarUrlVideo: normalizarUrlVideo
  };

  window.Sitio = {
    pintarResumenCenso: pintarResumenCenso,
    pintarContadorBreve: pintarContadorBreve,
    pintarVideos: pintarVideos,
    tarjeta: tarjeta,
    tarjetaInvestigacion: tarjetaInvestigacion,
    mensajeVacio: mensajeVacio,
    mensajeError: mensajeError
  };
})();
