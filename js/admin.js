/* Panel de administración: investigaciones, videos, diccionario y censo. */
(function () {
  "use strict";

  var cfg = window.CONFIG;
  var Util = window.Util;
  var esc = Util.esc;

  function $(id) { return document.getElementById(id); }

  function valor(nombre, raiz) {
    var campo = (raiz || document).querySelector('[name="' + nombre + '"]');
    return campo ? campo.value : "";
  }

  function textoDe(nombre, raiz) {
    return Util.texto(valor(nombre, raiz));
  }

  function numeroDe(nombre, raiz) {
    var v = textoDe(nombre, raiz);
    return v === "" ? null : Number(v);
  }

  function marcado(nombre, raiz) {
    var campo = (raiz || document).querySelector('[name="' + nombre + '"]');
    return campo ? campo.checked : false;
  }

  function llenarSelect(select, opciones, valorActual) {
    select.innerHTML = opciones.map(function (o) {
      var valorOpcion = typeof o === "string" ? o : o.valor;
      var etiqueta = typeof o === "string" ? o : o.etiqueta;
      return '<option value="' + esc(valorOpcion) + '"' +
             (valorActual === valorOpcion ? " selected" : "") + ">" + esc(etiqueta) + "</option>";
    }).join("");
  }

  /* =====================================================================
     ACCESO
     ===================================================================== */

  function mostrarZona(conSesion) {
    $("zona-acceso").hidden = conSesion;
    $("zona-panel").hidden = !conSesion;
    $("barra-sesion").hidden = !conSesion;
    $("modo-conexion").textContent = window.DB.usaSupabase()
      ? "conectado a Supabase"
      : "modo demostración (datos solo en este navegador)";
  }

  async function revisarSesion() {
    var sesion = await window.DB.sesionActual();
    if (sesion) {
      $("correo-sesion").textContent = sesion.email;
      mostrarZona(true);
      await cargarTodo();
    } else {
      mostrarZona(false);
    }
    return !!sesion;
  }

  function iniciarAcceso() {
    if (!window.DB.usaSupabase()) {
      $("nota-demo-acceso").textContent =
        "En modo demostración puedes entrar con cualquier correo y contraseña para probar el panel. " +
        "Cuando conectes Supabase, deberás crear tu usuario en Authentication -> Add user.";
    }

    $("formulario-acceso").addEventListener("submit", async function (evento) {
      evento.preventDefault();
      var aviso = $("aviso-acceso");
      Util.limpiarAviso(aviso);

      var correo = textoDe("correo");
      var contrasena = valor("contrasena");
      if (!correo || !contrasena) {
        Util.aviso(aviso, "error", "Escribe tu correo y tu contraseña.");
        return;
      }

      $("boton-entrar").disabled = true;
      try {
        var sesion = await window.DB.iniciarSesion(correo, contrasena);
        $("correo-sesion").textContent = sesion.email;
        mostrarZona(true);
        await cargarTodo();
      } catch (error) {
        Util.aviso(aviso, "error", "No se pudo iniciar sesión: " + error.message);
      } finally {
        $("boton-entrar").disabled = false;
      }
    });

    $("boton-cerrar-sesion").addEventListener("click", async function () {
      await window.DB.cerrarSesion();
      window.location.reload();
    });
  }

  /* =====================================================================
     PESTAÑAS
     ===================================================================== */

  function iniciarPestanyas() {
    var pestanyas = Array.prototype.slice.call(document.querySelectorAll(".pestanya"));

    function activar(boton) {
      pestanyas.forEach(function (b) {
        var activa = b === boton;
        b.setAttribute("aria-selected", activa ? "true" : "false");
        b.tabIndex = activa ? 0 : -1;
        $(b.getAttribute("data-panel")).hidden = !activa;
      });
      boton.focus();
    }

    pestanyas.forEach(function (boton, indice) {
      boton.addEventListener("click", function () { activar(boton); });
      boton.addEventListener("keydown", function (evento) {
        var salto = null;
        if (evento.key === "ArrowRight") salto = (indice + 1) % pestanyas.length;
        if (evento.key === "ArrowLeft") salto = (indice - 1 + pestanyas.length) % pestanyas.length;
        if (salto !== null) { evento.preventDefault(); activar(pestanyas[salto]); }
      });
    });
  }

  /* =====================================================================
     INVESTIGACIONES
     ===================================================================== */

  function prepararFormularioInvestigacion() {
    llenarSelect($("inv-categoria"), cfg.CATEGORIAS_INVESTIGACION, "EDUCACION");
    llenarSelect($("inv-estado"), cfg.ESTADOS_INVESTIGACION, "PENDIENTE");

    $("boton-nueva-investigacion").addEventListener("click", limpiarFormularioInvestigacion);
    $("boton-cancelar-investigacion").addEventListener("click", limpiarFormularioInvestigacion);
    $("formulario-investigacion").addEventListener("submit", guardarInvestigacion);
  }

  function limpiarFormularioInvestigacion() {
    $("formulario-investigacion").reset();
    $("inv-id").value = "";
    $("inv-estado").value = "PENDIENTE";
    $("inv-orden").value = "0";
    $("titulo-formulario-investigacion").textContent = "Agregar una investigación";
    $("boton-cancelar-investigacion").hidden = true;
    $("boton-guardar-investigacion").textContent = "Guardar la investigación";
  }

  function editarInvestigacion(inv) {
    $("inv-id").value = inv.id;
    $("inv-titulo").value = inv.titulo || "";
    $("inv-autor").value = inv.autor || "";
    $("inv-anio").value = inv.anio || "";
    $("inv-categoria").value = inv.categoria || "EDUCACION";
    $("inv-universidad").value = inv.universidad || "";
    $("inv-resumen").value = inv.resumen || "";
    $("inv-url-pdf").value = inv.url_pdf || "";
    $("inv-url-externa").value = inv.url_externa || "";
    $("inv-estado").value = inv.estado || "PENDIENTE";
    $("inv-orden").value = inv.orden == null ? 0 : inv.orden;
    $("inv-destacado").checked = !!inv.destacado;
    $("inv-archivo").value = "";

    $("titulo-formulario-investigacion").textContent = "Editando: " + inv.titulo;
    $("boton-cancelar-investigacion").hidden = false;
    $("boton-guardar-investigacion").textContent = "Actualizar la investigación";
    window.scrollTo({ top: $("formulario-investigacion").offsetTop - 120, behavior: "smooth" });
  }

  async function guardarInvestigacion(evento) {
    evento.preventDefault();
    var aviso = $("aviso-investigaciones");
    Util.limpiarAviso(aviso);

    var titulo = textoDe("titulo");
    var autor = textoDe("autor");
    if (!titulo || !autor) {
      Util.aviso(aviso, "error", "El título y el autor son obligatorios.");
      return;
    }

    var boton = $("boton-guardar-investigacion");
    boton.disabled = true;
    boton.textContent = "Guardando…";

    try {
      var urlPdf = textoDe("url_pdf") || null;
      var archivo = $("inv-archivo").files[0];

      if (archivo) {
        Util.aviso(aviso, "", "Subiendo el archivo PDF…");
        urlPdf = await window.DB.subirPdf(archivo);
      }

      var registro = {
        titulo: titulo,
        autor: autor,
        anio: numeroDe("anio"),
        categoria: valor("categoria"),
        universidad: textoDe("universidad") || null,
        resumen: textoDe("resumen") || null,
        url_pdf: urlPdf,
        url_externa: textoDe("url_externa") || null,
        estado: valor("estado"),
        destacado: marcado("destacado"),
        orden: numeroDe("orden") || 0
      };

      var id = $("inv-id").value;
      if (id) registro.id = id;

      await window.DB.guardarInvestigacion(registro);
      Util.aviso(aviso, "exito", id ? "Investigación actualizada." : "Investigación agregada.");
      limpiarFormularioInvestigacion();
      await cargarInvestigaciones();
    } catch (error) {
      Util.aviso(aviso, "error", error.message);
    } finally {
      boton.disabled = false;
      boton.textContent = $("inv-id").value ? "Actualizar la investigación" : "Guardar la investigación";
    }
  }

  async function cambiarEstadoInvestigacion(inv, nuevoEstado) {
    var aviso = $("aviso-investigaciones");
    try {
      await window.DB.guardarInvestigacion({ id: inv.id, estado: nuevoEstado });
      Util.aviso(aviso, "exito", "«" + inv.titulo + "» ahora está " + Util.estadoInvestigacion(nuevoEstado) + ".");
      await cargarInvestigaciones();
    } catch (error) {
      Util.aviso(aviso, "error", error.message);
    }
  }

  async function eliminarInvestigacion(inv) {
    if (!window.confirm("¿Eliminar definitivamente «" + inv.titulo + "»?")) return;
    var aviso = $("aviso-investigaciones");
    try {
      await window.DB.eliminarInvestigacion(inv.id);
      Util.aviso(aviso, "exito", "Investigación eliminada.");
      await cargarInvestigaciones();
    } catch (error) {
      Util.aviso(aviso, "error", error.message);
    }
  }

  async function cargarInvestigaciones() {
    var zona = $("lista-investigaciones");
    zona.innerHTML = '<p class="cargando">Cargando</p>';
    try {
      var lista = await window.DB.listarInvestigaciones({ todas: true });
      $("total-investigaciones").textContent = lista.length + " registro" + (lista.length === 1 ? "" : "s");

      if (!lista.length) {
        zona.innerHTML = window.Sitio.mensajeVacio("No hay investigaciones registradas todavía.");
        return;
      }

      var filas = lista.map(function (inv) {
        var acciones =
          '<button class="boton boton-chico boton-contorno" type="button" data-accion="editar" data-id="' + esc(inv.id) + '">Editar</button>' +
          (inv.estado === "PUBLICADO"
            ? '<button class="boton boton-chico boton-contorno" type="button" data-accion="despublicar" data-id="' + esc(inv.id) + '">Quitar del sitio</button>'
            : '<button class="boton boton-chico" type="button" data-accion="publicar" data-id="' + esc(inv.id) + '">Publicar</button>') +
          '<button class="boton boton-chico boton-peligro" type="button" data-accion="eliminar" data-id="' + esc(inv.id) + '">Eliminar</button>';

        return "<tr>" +
          "<td><strong>" + esc(inv.titulo) + "</strong><br><span class=\"texto-suave texto-chico\">" + esc(inv.autor) + "</span></td>" +
          "<td>" + esc(Util.categoriaInvestigacion(inv.categoria)) + "</td>" +
          "<td>" + esc(inv.anio || "—") + "</td>" +
          '<td><span class="insignia ' + esc(Util.claseEstado(inv.estado)) + '">' + esc(Util.estadoInvestigacion(inv.estado)) + "</span></td>" +
          "<td>" + (inv.destacado ? "Sí" : "No") + "</td>" +
          '<td class="acciones">' + acciones + "</td>" +
          "</tr>";
      }).join("");

      zona.innerHTML =
        '<div class="tabla-envoltura"><table>' +
          "<thead><tr>" +
            '<th scope="col">Trabajo</th><th scope="col">Categoría</th><th scope="col">Año</th>' +
            '<th scope="col">Estado</th><th scope="col">Destacado</th><th scope="col">Acciones</th>' +
          "</tr></thead><tbody>" + filas + "</tbody></table></div>";

      var mapa = {};
      lista.forEach(function (i) { mapa[i.id] = i; });

      zona.querySelectorAll("button[data-accion]").forEach(function (boton) {
        var inv = mapa[boton.getAttribute("data-id")];
        if (!inv) return;
        boton.addEventListener("click", function () {
          var accion = boton.getAttribute("data-accion");
          if (accion === "editar") editarInvestigacion(inv);
          if (accion === "publicar") cambiarEstadoInvestigacion(inv, "PUBLICADO");
          if (accion === "despublicar") cambiarEstadoInvestigacion(inv, "APROBADO");
          if (accion === "eliminar") eliminarInvestigacion(inv);
        });
      });
    } catch (error) {
      zona.innerHTML = window.Sitio.mensajeError(error);
    }
  }

  /* =====================================================================
     NOTICIAS
     ===================================================================== */
  var urlImagenNoticiaActual = "";

  function prepararFormularioNoticia() {
    $("boton-nueva-noticia").addEventListener("click", limpiarFormularioNoticia);
    $("boton-cancelar-noticia").addEventListener("click", limpiarFormularioNoticia);
    $("formulario-noticia").addEventListener("submit", guardarNoticia);
  }

  function limpiarFormularioNoticia() {
    $("formulario-noticia").reset();
    $("not-id").value = "";
    urlImagenNoticiaActual = "";
    $("ayuda-imagen-noticia").innerHTML =
      'Se guarda en el bucket <code>noticias</code> de Supabase Storage y queda de lectura pública.';
    $("titulo-formulario-noticia").textContent = "Publicar una noticia";
    $("boton-guardar-noticia").textContent = "Publicar la noticia";
    $("boton-cancelar-noticia").hidden = true;
  }

  function editarNoticia(noticia) {
    limpiarFormularioNoticia();
    $("not-id").value = noticia.id;
    $("not-titulo").value = noticia.titulo || "";
    $("not-fecha").value = noticia.fecha || "";
    $("not-cuerpo").value = noticia.cuerpo || "";
    $("not-texto-imagen").value = noticia.texto_imagen || "";
    $("not-url-video").value = noticia.url_video || "";
    urlImagenNoticiaActual = noticia.url_imagen || "";
    if (urlImagenNoticiaActual) {
      $("ayuda-imagen-noticia").textContent =
        "Esta noticia ya tiene imagen o flyer. Solo se reemplazará si subes un archivo nuevo.";
    }
    $("titulo-formulario-noticia").textContent = "Editando: " + noticia.titulo;
    $("boton-guardar-noticia").textContent = "Actualizar la noticia";
    $("boton-cancelar-noticia").hidden = false;
    window.scrollTo({ top: $("formulario-noticia").offsetTop - 120, behavior: "smooth" });
  }

  async function guardarNoticia(evento) {
    evento.preventDefault();
    var aviso = $("aviso-noticias");
    Util.limpiarAviso(aviso);

    var formulario = $("formulario-noticia");
    var titulo = textoDe("titulo", formulario);
    var cuerpo = textoDe("cuerpo", formulario);
    if (!titulo || !cuerpo) {
      Util.aviso(aviso, "error", "El título y el texto de la noticia son obligatorios.");
      return;
    }

    var boton = $("boton-guardar-noticia");
    boton.disabled = true;
    boton.textContent = "Guardando…";

    try {
      var urlImagen = urlImagenNoticiaActual || null;
      var archivoImagen = $("not-archivo-imagen").files[0];
      if (archivoImagen) {
        Util.aviso(aviso, "", "Subiendo la imagen o el flyer…");
        urlImagen = await window.DB.subirImagenNoticia(archivoImagen);
      }

      var urlVideo = textoDe("url_video", formulario) || null;
      var archivoVideo = $("not-archivo-video").files[0];
      if (archivoVideo) {
        Util.aviso(aviso, "", "Subiendo el archivo de video…");
        urlVideo = await window.DB.subirVideoNoticia(archivoVideo);
      }

      var registro = {
        titulo: titulo,
        cuerpo: cuerpo,
        fecha: textoDe("fecha", formulario) || new Date().toISOString().slice(0, 10),
        url_imagen: urlImagen,
        texto_imagen: textoDe("texto_imagen", formulario) || null,
        url_video: urlVideo
      };

      var id = $("not-id").value;
      if (id) registro.id = id;

      await window.DB.guardarNoticia(registro);
      Util.aviso(aviso, "exito", id ? "Noticia actualizada." : "Noticia publicada.");
      limpiarFormularioNoticia();
      await cargarNoticias();
    } catch (error) {
      Util.aviso(aviso, "error", error.message);
    } finally {
      boton.disabled = false;
      boton.textContent = $("not-id").value ? "Actualizar la noticia" : "Publicar la noticia";
    }
  }

  async function eliminarNoticiaAdmin(noticia) {
    if (!window.confirm("¿Eliminar definitivamente la noticia «" + noticia.titulo + "»?")) return;
    var aviso = $("aviso-noticias");
    try {
      await window.DB.eliminarNoticia(noticia.id);
      Util.aviso(aviso, "exito", "Noticia eliminada.");
      await cargarNoticias();
    } catch (error) {
      Util.aviso(aviso, "error", error.message);
    }
  }

  async function cargarNoticias() {
    var zona = $("lista-noticias");
    zona.innerHTML = '<p class="cargando">Cargando</p>';
    try {
      var lista = await window.DB.listarNoticias();
      $("total-noticias").textContent = lista.length + " noticia" + (lista.length === 1 ? "" : "s");

      if (!lista.length) {
        zona.innerHTML = window.Sitio.mensajeVacio("No hay noticias publicadas todavía.");
        return;
      }

      var filas = lista.map(function (n) {
        var medios = [];
        if (n.url_imagen) medios.push("imagen");
        if (n.url_video) medios.push("video");
        var acciones =
          '<button class="boton boton-chico boton-contorno" type="button" data-accion="editar" data-id="' + esc(n.id) + '">Editar</button>' +
          '<button class="boton boton-chico boton-peligro" type="button" data-accion="eliminar" data-id="' + esc(n.id) + '">Eliminar</button>';

        return "<tr>" +
          "<td>" + esc(Util.formatearFecha(n.fecha)) + "</td>" +
          "<td><strong>" + esc(n.titulo) + "</strong></td>" +
          "<td>" + (medios.length ? esc(medios.join(" y ")) : "Solo texto") + "</td>" +
          '<td class="acciones">' + acciones + "</td>" +
          "</tr>";
      }).join("");

      zona.innerHTML =
        '<div class="tabla-envoltura"><table>' +
          "<thead><tr>" +
            '<th scope="col">Fecha</th><th scope="col">Título</th>' +
            '<th scope="col">Medios</th><th scope="col">Acciones</th>' +
          "</tr></thead><tbody>" + filas + "</tbody></table></div>";

      var mapa = {};
      lista.forEach(function (n) { mapa[n.id] = n; });

      zona.querySelectorAll("button[data-accion]").forEach(function (boton) {
        var noticia = mapa[boton.getAttribute("data-id")];
        if (!noticia) return;
        boton.addEventListener("click", function () {
          var accion = boton.getAttribute("data-accion");
          if (accion === "editar") editarNoticia(noticia);
          if (accion === "eliminar") eliminarNoticiaAdmin(noticia);
        });
      });
    } catch (error) {
      zona.innerHTML = window.Sitio.mensajeError(error);
    }
  }

  /* =====================================================================
     VIDEOS DE PORTADA
     ===================================================================== */

  function prepararFormularioVideo() {
    $("boton-nuevo-video").addEventListener("click", limpiarFormularioVideo);
    $("boton-cancelar-video").addEventListener("click", limpiarFormularioVideo);
    $("formulario-video").addEventListener("submit", guardarVideo);
  }

  function limpiarFormularioVideo() {
    $("formulario-video").reset();
    $("vid-id").value = "";
    $("vid-activo").checked = true;
    $("vid-orden").value = "0";
    $("titulo-formulario-video").textContent = "Agregar un video a la portada";
    $("boton-cancelar-video").hidden = true;
  }

  function editarVideo(video) {
    $("vid-id").value = video.id;
    $("vid-titulo").value = video.titulo || "";
    $("vid-descripcion").value = video.descripcion || "";
    $("vid-url").value = video.url || "";
    $("vid-orden").value = video.orden == null ? 0 : video.orden;
    $("vid-activo").checked = video.activo !== false;
    $("titulo-formulario-video").textContent = "Editando: " + video.titulo;
    $("boton-cancelar-video").hidden = false;
    window.scrollTo({ top: $("formulario-video").offsetTop - 120, behavior: "smooth" });
  }

  async function guardarVideo(evento) {
    evento.preventDefault();
    var aviso = $("aviso-videos");
    Util.limpiarAviso(aviso);

    var titulo = textoDe("titulo", $("formulario-video"));
    var url = textoDe("url", $("formulario-video"));
    if (!titulo || !url) {
      Util.aviso(aviso, "error", "El título y el enlace del video son obligatorios.");
      return;
    }

    try {
      var registro = {
        titulo: titulo,
        descripcion: textoDe("descripcion", $("formulario-video")) || null,
        url: url,
        activo: marcado("activo", $("formulario-video")),
        orden: Number(textoDe("orden", $("formulario-video")) || 0)
      };
      var id = $("vid-id").value;
      if (id) registro.id = id;

      await window.DB.guardarVideo(registro);
      Util.aviso(aviso, "exito", id ? "Video actualizado." : "Video agregado a la portada.");
      limpiarFormularioVideo();
      await cargarVideos();
    } catch (error) {
      Util.aviso(aviso, "error", error.message);
    }
  }

  async function eliminarVideo(video) {
    if (!window.confirm("¿Eliminar el video «" + video.titulo + "»?")) return;
    var aviso = $("aviso-videos");
    try {
      await window.DB.eliminarVideo(video.id);
      Util.aviso(aviso, "exito", "Video eliminado.");
      await cargarVideos();
    } catch (error) {
      Util.aviso(aviso, "error", error.message);
    }
  }

  async function alternarVideo(video) {
    var aviso = $("aviso-videos");
    try {
      await window.DB.guardarVideo({ id: video.id, activo: video.activo === false });
      await cargarVideos();
      Util.aviso(aviso, "exito", video.activo === false ? "Video activado en la portada." : "Video ocultado de la portada.");
    } catch (error) {
      Util.aviso(aviso, "error", error.message);
    }
  }

  async function cargarVideos() {
    var zona = $("lista-videos");
    zona.innerHTML = '<p class="cargando">Cargando</p>';
    try {
      var lista = await window.DB.listarVideos(true);
      if (!lista.length) {
        zona.innerHTML = window.Sitio.mensajeVacio("No hay videos registrados. Agrega el primero con el formulario.");
        return;
      }

      var filas = lista.map(function (v) {
        return "<tr>" +
          "<td><strong>" + esc(v.titulo) + "</strong><br><span class=\"texto-suave texto-chico\">" + esc(v.descripcion || "") + "</span></td>" +
          '<td class="texto-chico"><a href="' + esc(v.url) + '" target="_blank" rel="noopener noreferrer">' + esc(v.url) + "</a></td>" +
          "<td>" + (v.orden == null ? "—" : esc(v.orden)) + "</td>" +
          "<td>" + (v.activo === false ? '<span class="insignia">Oculto</span>' : '<span class="insignia insignia-publicado">Visible</span>') + "</td>" +
          '<td class="acciones">' +
            '<button class="boton boton-chico boton-contorno" type="button" data-accion="editar" data-id="' + esc(v.id) + '">Editar</button>' +
            '<button class="boton boton-chico boton-contorno" type="button" data-accion="alternar" data-id="' + esc(v.id) + '">' + (v.activo === false ? "Mostrar" : "Ocultar") + "</button>" +
            '<button class="boton boton-chico boton-peligro" type="button" data-accion="eliminar" data-id="' + esc(v.id) + '">Eliminar</button>' +
          "</td>" +
          "</tr>";
      }).join("");

      zona.innerHTML =
        '<div class="tabla-envoltura"><table>' +
          "<thead><tr><th scope=\"col\">Título</th><th scope=\"col\">Enlace</th>" +
          '<th scope="col">Orden</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead>' +
          "<tbody>" + filas + "</tbody></table></div>";

      var mapa = {};
      lista.forEach(function (v) { mapa[v.id] = v; });

      zona.querySelectorAll("button[data-accion]").forEach(function (boton) {
        var video = mapa[boton.getAttribute("data-id")];
        if (!video) return;
        boton.addEventListener("click", function () {
          var accion = boton.getAttribute("data-accion");
          if (accion === "editar") editarVideo(video);
          if (accion === "alternar") alternarVideo(video);
          if (accion === "eliminar") eliminarVideo(video);
        });
      });
    } catch (error) {
      zona.innerHTML = window.Sitio.mensajeError(error);
    }
  }

  /* =====================================================================
     DICCIONARIO
     ===================================================================== */

  function prepararFormularioSenia() {
    $("boton-nueva-senia").addEventListener("click", limpiarFormularioSenia);
    $("boton-cancelar-senia").addEventListener("click", limpiarFormularioSenia);
    $("formulario-senia").addEventListener("submit", guardarSenia);

    var buscador = $("buscador-admin-senia");
    var temporizador = null;
    buscador.addEventListener("input", function () {
      window.clearTimeout(temporizador);
      temporizador = window.setTimeout(function () { cargarSenias(buscador.value.trim()); }, 300);
    });
  }

  function limpiarFormularioSenia() {
    $("formulario-senia").reset();
    $("sen-id").value = "";
    $("titulo-formulario-senia").textContent = "Agregar una seña al diccionario";
    $("boton-cancelar-senia").hidden = true;
  }

  function editarSenia(senia) {
    $("sen-id").value = senia.id;
    $("sen-palabra").value = senia.palabra || "";
    $("sen-sinonimos").value = senia.sinonimos || "";
    $("sen-categoria").value = senia.categoria || "";
    $("sen-descripcion").value = senia.descripcion || "";
    $("sen-url-video").value = senia.url_video || "";
    $("sen-url-imagen").value = senia.url_imagen || "";
    $("sen-reciente").checked = !!senia.acuniada_recientemente;
    $("sen-fecha").value = senia.fecha_acuniada ? String(senia.fecha_acuniada).slice(0, 10) : "";
    $("sen-fuente").value = senia.fuente || "";
    $("titulo-formulario-senia").textContent = "Editando: " + senia.palabra;
    $("boton-cancelar-senia").hidden = false;
    window.scrollTo({ top: $("formulario-senia").offsetTop - 120, behavior: "smooth" });
  }

  async function guardarSenia(evento) {
    evento.preventDefault();
    var aviso = $("aviso-diccionario");
    Util.limpiarAviso(aviso);

    var palabra = textoDe("palabra", $("formulario-senia"));
    if (!palabra) {
      Util.aviso(aviso, "error", "La palabra es obligatoria.");
      return;
    }

    try {
      var reciente = marcado("acuniada_recientemente", $("formulario-senia"));
      var fecha = textoDe("fecha_acuniada", $("formulario-senia"));

      var registro = {
        palabra: palabra.toUpperCase(),
        sinonimos: textoDe("sinonimos", $("formulario-senia")) || null,
        categoria: (textoDe("categoria", $("formulario-senia")) || "GENERAL").toUpperCase(),
        descripcion: textoDe("descripcion", $("formulario-senia")) || null,
        url_video: textoDe("url_video", $("formulario-senia")) || null,
        url_imagen: textoDe("url_imagen", $("formulario-senia")) || null,
        acuniada_recientemente: reciente,
        fecha_acuniada: reciente && fecha ? fecha : null,
        fuente: textoDe("fuente", $("formulario-senia")) || null
      };

      var id = $("sen-id").value;
      if (id) registro.id = id;

      await window.DB.guardarSenia(registro);
      Util.aviso(aviso, "exito", id ? "Seña actualizada." : "Seña agregada al diccionario.");
      limpiarFormularioSenia();
      await cargarSenias();
      await llenarAreasSenia();
    } catch (error) {
      Util.aviso(aviso, "error", error.message);
    }
  }

  async function eliminarSenia(senia) {
    if (!window.confirm("¿Eliminar la seña «" + senia.palabra + "»?")) return;
    var aviso = $("aviso-diccionario");
    try {
      await window.DB.eliminarSenia(senia.id);
      Util.aviso(aviso, "exito", "Seña eliminada.");
      await cargarSenias();
    } catch (error) {
      Util.aviso(aviso, "error", error.message);
    }
  }

  async function llenarAreasSenia() {
    try {
      var categorias = await window.DB.listarCategoriasSenias();
      $("lista-areas-senia").innerHTML = categorias.map(function (c) {
        return '<option value="' + esc(c) + '"></option>';
      }).join("");
    } catch (e) { /* el datalist queda vacío y se puede escribir a mano */ }
  }

  async function cargarSenias(filtroTexto) {
    var zona = $("lista-senias");
    zona.innerHTML = '<p class="cargando">Cargando</p>';
    try {
      var lista = await window.DB.listarSenias({ texto: filtroTexto || null });
      $("total-senias").textContent = lista.length + " seña" + (lista.length === 1 ? "" : "s");

      if (!lista.length) {
        zona.innerHTML = window.Sitio.mensajeVacio("No hay señas que coincidan con la búsqueda.");
        return;
      }

      var filas = lista.map(function (s) {
        return "<tr>" +
          "<td><strong>" + esc(s.palabra) + "</strong>" +
            (s.sinonimos ? '<br><span class="texto-suave texto-chico">' + esc(s.sinonimos) + "</span>" : "") + "</td>" +
          "<td>" + esc(s.categoria || "") + "</td>" +
          "<td>" + (s.acuniada_recientemente
                ? '<span class="insignia insignia-nueva">Reciente</span>' + (s.fecha_acuniada ? " " + esc(Util.formatearFecha(s.fecha_acuniada)) : "")
                : "—") + "</td>" +
          "<td>" + (s.url_video ? '<a href="' + esc(s.url_video) + '" target="_blank" rel="noopener noreferrer">Video</a>' : "—") + "</td>" +
          '<td class="acciones">' +
            '<button class="boton boton-chico boton-contorno" type="button" data-accion="editar" data-id="' + esc(s.id) + '">Editar</button>' +
            '<button class="boton boton-chico boton-peligro" type="button" data-accion="eliminar" data-id="' + esc(s.id) + '">Eliminar</button>' +
          "</td></tr>";
      }).join("");

      zona.innerHTML =
        '<div class="tabla-envoltura"><table>' +
          "<thead><tr><th scope=\"col\">Palabra</th><th scope=\"col\">Área</th>" +
          '<th scope="col">Acuñada</th><th scope="col">Video</th><th scope="col">Acciones</th></tr></thead>' +
          "<tbody>" + filas + "</tbody></table></div>";

      var mapa = {};
      lista.forEach(function (s) { mapa[s.id] = s; });

      zona.querySelectorAll("button[data-accion]").forEach(function (boton) {
        var senia = mapa[boton.getAttribute("data-id")];
        if (!senia) return;
        boton.addEventListener("click", function () {
          if (boton.getAttribute("data-accion") === "editar") editarSenia(senia);
          else eliminarSenia(senia);
        });
      });
    } catch (error) {
      zona.innerHTML = window.Sitio.mensajeError(error);
    }
  }

  /* =====================================================================
     CENSO
     ===================================================================== */

  var censoEnMemoria = [];

  function bloqueResumen(titulo, objeto) {
    var claves = Object.keys(objeto || {});
    if (!claves.length) return "";
    claves.sort(function (a, b) { return objeto[b] - objeto[a]; });
    return '<div style="margin-bottom:1.2rem"><h3>' + esc(titulo) + "</h3><ul style=\"margin:0;padding-left:1.2rem\">" +
      claves.map(function (k) {
        return "<li>" + esc(k) + ": <strong>" + esc(objeto[k]) + "</strong></li>";
      }).join("") + "</ul></div>";
  }

  async function cargarResumenCensoAdmin() {
    var zona = $("resumen-censo-admin");
    zona.innerHTML = '<p class="cargando">Consultando</p>';
    try {
      var r = await window.DB.resumenCenso();
      /* Este dato ya no viene en el resumen público (es privado): se
         cuenta aquí a partir de las filas del censo que solo ve el admin. */
      var conInv = censoEnMemoria.filter(function (p) { return p.ha_realizado_investigacion; }).length;
      zona.innerHTML =
          '<div class="tarjetas-contador" style="margin-bottom:1.4rem">' +
            window.Sitio.tarjeta(r.total_egresados || 0, "Total de egresados") +
            window.Sitio.tarjeta(r.total_titulos || 0, "Títulos en total") +
            window.Sitio.tarjeta(conInv, "Con investigación (solo tú ves este dato)") +
          "</div>" +
        '<div class="fila">' +
          bloqueNivelAdmin("Pregrado", "PREGRADO", r) +
          bloqueNivelAdmin("Postgrado", "POSTGRADO", r) +
        "</div>" +
        '<div class="fila">' +
          bloqueResumen("Por estado", r.por_estado) +
          bloqueResumen("Universidades con más títulos", r.por_universidad) +
        "</div>";
    } catch (error) {
      zona.innerHTML = window.Sitio.mensajeError(error);
    }
  }

  /* Desglose de los títulos de un nivel por categoría, con etiquetas legibles. */
  function bloqueNivelAdmin(nombreNivel, nivel, r) {
    var porCategoria = r.por_categoria || {};
    var categorias = cfg.CATEGORIAS_EGRESO.filter(function (c) { return c.nivel === nivel; });
    var items = categorias.map(function (c) {
      return "<li>" + esc(c.etiqueta) + ": <strong>" + esc(Number(porCategoria[c.valor] || 0)) + "</strong></li>";
    }).join("");
    return '<div style="margin-bottom:1.2rem"><h3>' + esc(nombreNivel) + " · " +
      esc(Number((r.por_nivel || {})[nivel] || 0)) + " títulos</h3>" +
      '<ul style="margin:0;padding-left:1.2rem">' + items + "</ul></div>";
  }

  function pintarListaCenso(filtroTexto) {
    var zona = $("lista-censo");
    var filtro = (filtroTexto || "").toLowerCase();

    var lista = censoEnMemoria.filter(function (p) {
      if (!filtro) return true;
      return (p.nombres + " " + p.apellidos + " " + p.universidad + " " + p.estado + " " + p.titulo_egreso)
        .toLowerCase().indexOf(filtro) !== -1;
    });

    $("total-censo").textContent = lista.length + " de " + censoEnMemoria.length;

    if (!lista.length) {
      zona.innerHTML = window.Sitio.mensajeVacio("Ningún registro coincide con la búsqueda.");
      return;
    }

    var filas = lista.map(function (p) {
      return "<tr>" +
        "<td><strong>" + esc(p.apellidos) + ", " + esc(p.nombres) + "</strong>" +
          (p.email ? '<br><span class="texto-chico texto-suave">' + esc(p.email) + "</span>" : "") +
          (p.telefono ? '<br><span class="texto-chico texto-suave">' + esc(p.telefono) + "</span>" : "") + "</td>" +
        "<td>" + esc(p.titulo_egreso) + "<br><span class=\"texto-chico texto-suave\">" + esc(p.universidad) + "</span></td>" +
        "<td>" + esc(Util.etiquetaDe(cfg.CATEGORIAS_EGRESO, p.categoria_egreso, p.categoria_egreso)) +
          "<br><span class=\"texto-chico texto-suave\">" + esc(p.nivel || "") + "</span></td>" +
        "<td>" + esc(p.anio_graduacion || "") + "</td>" +
        "<td>" + esc(p.estado || "") + "</td>" +
        "<td>" + esc(p.anios_experiencia == null ? "" : p.anios_experiencia) + "</td>" +
        "<td>" + (p.ha_realizado_investigacion ? '<span class="insignia insignia-publicado">Sí</span>' : "No") + "</td>" +
        '<td class="acciones">' +
          '<button class="boton boton-chico boton-contorno" type="button" data-accion="titulos" data-id="' + esc(p.id) + '">Títulos adicionales</button>' +
          '<button class="boton boton-chico boton-peligro" type="button" data-accion="eliminar" data-id="' + esc(p.id) + '">Eliminar</button>' +
        "</td></tr>";
    }).join("");

    zona.innerHTML =
      '<div class="tabla-envoltura"><table>' +
        "<thead><tr><th scope=\"col\">Persona</th><th scope=\"col\">Título y universidad</th>" +
        '<th scope="col">Categoría</th><th scope="col">Año</th><th scope="col">Estado</th>' +
        '<th scope="col">Exp.</th><th scope="col">Investiga</th><th scope="col">Acciones</th></tr></thead>' +
        "<tbody>" + filas + "</tbody></table></div>";

    zona.querySelectorAll("button[data-accion]").forEach(function (boton) {
      var id = boton.getAttribute("data-id");
      var persona = censoEnMemoria.filter(function (p) { return p.id === id; })[0];
      if (!persona) return;
      boton.addEventListener("click", function () {
        if (boton.getAttribute("data-accion") === "titulos") verTitulos(persona);
        else eliminarRegistroCenso(persona);
      });
    });
  }

  async function verTitulos(persona) {
    var aviso = $("aviso-censo");
    try {
      var titulos = await window.DB.listarTitulosAdicionales(persona.id);
      var mensaje = titulos.length
        ? titulos.map(function (t) {
            return "• " + t.titulo + (t.universidad ? " — " + t.universidad : "") + (t.anio_graduacion ? " (" + t.anio_graduacion + ")" : "");
          }).join("\n")
        : "Esta persona no registró títulos adicionales.";
      window.alert("Títulos adicionales de " + persona.nombres + " " + persona.apellidos + ":\n\n" + mensaje);
    } catch (error) {
      Util.aviso(aviso, "error", error.message);
    }
  }

  async function eliminarRegistroCenso(persona) {
    if (!window.confirm("¿Eliminar el registro de " + persona.nombres + " " + persona.apellidos + "?")) return;
    var aviso = $("aviso-censo");
    try {
      await window.DB.eliminarCenso(persona.id);
      Util.aviso(aviso, "exito", "Registro eliminado del censo.");
      await cargarCenso();
    } catch (error) {
      Util.aviso(aviso, "error", error.message);
    }
  }

  async function cargarCenso() {
    $("lista-censo").innerHTML = '<p class="cargando">Cargando</p>';
    try {
      censoEnMemoria = await window.DB.listarCenso();
      pintarListaCenso($("buscador-censo").value.trim());
      pintarTotalDestinatarios();
      await cargarResumenCensoAdmin();
    } catch (error) {
      $("lista-censo").innerHTML = window.Sitio.mensajeError(error);
    }
  }

  /* Exporta el censo a CSV (con BOM para que Excel abra bien los acentos). */
  function exportarCensoCsv() {
    if (!censoEnMemoria.length) {
      Util.aviso($("aviso-censo"), "error", "No hay registros que exportar.");
      return;
    }

    var columnas = [
      ["nombres", "Nombres"], ["apellidos", "Apellidos"], ["cedula", "Cédula"],
      ["universidad", "Universidad"], ["carrera", "Carrera"], ["titulo_egreso", "Título de egreso"],
      ["categoria_egreso", "Categoría"], ["nivel", "Nivel"], ["anio_graduacion", "Año de graduación"],
      ["estado", "Estado"], ["anios_experiencia", "Años de experiencia"], ["telefono", "Teléfono"],
      ["email", "Correo"], ["ha_realizado_investigacion", "Ha realizado investigación"],
      ["autoriza_publicar_nombre", "Autoriza publicar nombre"], ["comentarios", "Comentarios"],
      ["creado_el", "Registrado el"]
    ];

    function celda(v) {
      if (v === null || v === undefined || typeof v === "boolean") v = v === true ? "Sí" : (v === false ? "No" : "");
      var s = String(v).replace(/"/g, '""');
      return '"' + s + '"';
    }

    var lineas = [columnas.map(function (c) { return celda(c[1]); }).join(",")];
    censoEnMemoria.forEach(function (p) {
      lineas.push(columnas.map(function (c) { return celda(p[c[0]]); }).join(","));
    });

    var blob = new Blob(["\uFEFF" + lineas.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    var enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = "censo-egresados-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    window.setTimeout(function () { URL.revokeObjectURL(enlace.href); }, 1500);

    Util.aviso($("aviso-censo"), "exito", "Se descargó el censo con " + censoEnMemoria.length + " registros.");
  }

  /* =====================================================================
     SEMINARIO: INSCRITOS, EXPORTACIÓN Y DIAPOSITIVAS DE PONENTES
     ===================================================================== */

  var seminarioEnMemoria = [];

  /* Traduce los códigos guardados a etiquetas legibles para la tabla. */
  var ETIQUETAS_SEMINARIO = {
    condicion: {
      PERSONA_SORDA: "Persona sorda",
      PERSONA_OYENTE: "Persona oyente",
      HIPOACUSICA_CODA_OTRA: "Hipoacúsica / CODA / otra"
    },
    perfil: {
      EGRESADO_COMUNIDAD_APRENDIZAJE: "Egresado de comunidad de aprendizaje",
      PROFESIONAL: "Profesional",
      FACILITADOR_EMPIRICO: "Facilitador empírico",
      ESTUDIANTE_UNIVERSITARIO: "Estudiante universitario",
      REPRESENTANTE_ORGANIZACION: "Representante de organización",
      OTRO: "Otro"
    },
    modalidad: { PRESENCIAL: "Presencial", VIRTUAL: "Virtual" },
    accesibilidad: { LSV: "LSV", SSI: "SSI", SUBTITULADO: "Subtitulado" },
    rol: { ASISTENTE: "Asistente", PONENTE: "Ponente" },
    eje_tematico: {
      DIDACTICA_L1_L2: "Didáctica y metodología de la LSV (L1 / L2)",
      SORDEDAD_GANANCIA: "Sordedad (Deafhood), Ganancia Sorda (Deaf Gain) y pedagogía crítica",
      MNM_SINTAXIS: "Marcadores no manuales, sintaxis espacial y gramática visual",
      TECNOLOGIA_IA: "Tecnología, inteligencia artificial y creación de material didáctico",
      SOCIOLINGUISTICA: "Sociolingüística, neologismos y registro formal en LSV"
    }
  };

  function etiquetaSeminario(campo, codigo) {
    var mapa = ETIQUETAS_SEMINARIO[campo] || {};
    return mapa[codigo] || codigo || "";
  }

  function pintarListaSeminario(filtroTexto) {
    var zona = $("lista-seminario");
    var filtro = (filtroTexto || "").toLowerCase();

    var lista = seminarioEnMemoria.filter(function (p) {
      if (!filtro) return true;
      return (p.nombres_apellidos + " " + p.documento + " " + p.email + " " +
              (p.titulo_ponencia || "")).toLowerCase().indexOf(filtro) !== -1;
    });

    var ponentes = lista.filter(function (p) { return p.rol === "PONENTE"; }).length;
    $("total-seminario").textContent = lista.length + " de " + seminarioEnMemoria.length +
      " · " + ponentes + " ponente" + (ponentes === 1 ? "" : "s");

    if (!lista.length) {
      zona.innerHTML = window.Sitio.mensajeVacio("Ninguna inscripción coincide con la búsqueda.");
      return;
    }

    var filas = lista.map(function (p) {
      var esPonente = p.rol === "PONENTE";
      var ponencia = esPonente
        ? "<strong>" + esc(p.titulo_ponencia || "Sin título") + "</strong>" +
          (p.eje_tematico ? '<br><span class="texto-chico texto-suave">' + esc(etiquetaSeminario("eje_tematico", p.eje_tematico)) + "</span>" : "") +
          (p.enlace_video ? '<br><a class="texto-chico" href="' + esc(p.enlace_video) + '" target="_blank" rel="noopener noreferrer">Ver video en LSV</a>' : "")
        : '<span class="texto-suave">—</span>';

      var acciones =
        (p.ruta_diapositivas
          ? '<button class="boton boton-chico boton-contorno" type="button" data-accion="diapositivas" data-id="' + esc(p.id) + '">Diapositivas</button>'
          : "") +
        '<button class="boton boton-chico boton-contorno" type="button" data-accion="editar" data-id="' + esc(p.id) + '">Editar</button>' +
        '<button class="boton boton-chico boton-peligro" type="button" data-accion="eliminar" data-id="' + esc(p.id) + '">Eliminar</button>';

      return "<tr>" +
        "<td><strong>" + esc(p.nombres_apellidos) + "</strong>" +
          "<br><span class=\"texto-chico texto-suave\">" + esc(p.documento || "") + "</span>" +
          (p.email ? '<br><span class="texto-chico texto-suave">' + esc(p.email) + "</span>" : "") +
          (p.telefono ? '<br><span class="texto-chico texto-suave">' + esc(p.telefono) + "</span>" : "") + "</td>" +
        "<td>" + esc(etiquetaSeminario("condicion", p.condicion)) +
          "<br><span class=\"texto-chico texto-suave\">" + esc(etiquetaSeminario("perfil", p.perfil)) + "</span></td>" +
        "<td>" + esc(etiquetaSeminario("modalidad", p.modalidad)) +
          "<br><span class=\"texto-chico texto-suave\">" + esc(etiquetaSeminario("accesibilidad", p.accesibilidad)) + "</span></td>" +
        "<td>" + (esPonente ? '<span class="insignia insignia-publicado">Ponente</span>' : '<span class="insignia">Asistente</span>') + "</td>" +
        "<td>" + ponencia + "</td>" +
        "<td>" + esc(p.ciudad || "") + (p.pais ? '<br><span class="texto-chico texto-suave">' + esc(p.pais) + "</span>" : "") + "</td>" +
        "<td>" + esc(Util.formatearFecha ? Util.formatearFecha(p.creado_el) : (p.creado_el || "")) + "</td>" +
        '<td class="acciones">' + acciones + "</td>" +
        "</tr>";
    }).join("");

    zona.innerHTML =
      '<div class="tabla-envoltura"><table>' +
        "<thead><tr>" +
          '<th scope="col">Persona</th><th scope="col">Condición y perfil</th>' +
          '<th scope="col">Modalidad</th><th scope="col">Participa</th>' +
          '<th scope="col">Ponencia</th><th scope="col">Ciudad</th>' +
          '<th scope="col">Registrado</th><th scope="col">Acciones</th>' +
        "</tr></thead><tbody>" + filas + "</tbody></table></div>";

    zona.querySelectorAll("button[data-accion]").forEach(function (boton) {
      var id = boton.getAttribute("data-id");
      var persona = seminarioEnMemoria.filter(function (p) { return p.id === id; })[0];
      if (!persona) return;
      boton.addEventListener("click", function () {
        var accion = boton.getAttribute("data-accion");
        if (accion === "diapositivas") descargarDiapositiva(persona);
        if (accion === "editar") editarInscripcion(persona);
        if (accion === "eliminar") eliminarInscripcion(persona);
      });
    });
  }

  /* El bucket de ponencias es privado: pide un enlace firmado temporal y lo
     abre en otra pestaña para descargar el archivo. */
  async function descargarDiapositiva(persona) {
    var aviso = $("aviso-seminario-admin");
    Util.limpiarAviso(aviso);
    if (!persona.ruta_diapositivas) {
      Util.aviso(aviso, "error", "Esta persona no subió diapositivas.");
      return;
    }
    try {
      Util.aviso(aviso, "", "Generando el enlace de descarga…");
      var url = await window.DB.obtenerEnlaceDiapositiva(persona.ruta_diapositivas);
      if (!url) {
        Util.aviso(aviso, "error",
          "En modo demostración no hay archivo real que descargar.");
        return;
      }
      window.open(url, "_blank", "noopener");
      Util.aviso(aviso, "exito", "Se abrió el archivo de " + persona.nombres_apellidos + " en otra pestaña.");
    } catch (error) {
      Util.aviso(aviso, "error", error.message);
    }
  }

  async function cargarInscripcionesSeminario() {
    var zona = $("lista-seminario");
    zona.innerHTML = '<p class="cargando">Cargando</p>';
    try {
      seminarioEnMemoria = await window.DB.listarInscripcionesSeminario();
      pintarResumenSeminario();
      pintarListaSeminario($("buscador-seminario").value.trim());
    } catch (error) {
      seminarioEnMemoria = [];
      $("total-seminario").textContent = "";
      $("resumen-seminario").innerHTML = "";
      zona.innerHTML = window.Sitio.mensajeError(error);
    }
  }

  /* Tarjetas con el total de inscritos, ponentes y asistentes. */
  function pintarResumenSeminario() {
    var zona = $("resumen-seminario");
    if (!zona) return;
    var total = seminarioEnMemoria.length;
    var ponentes = seminarioEnMemoria.filter(function (p) { return p.rol === "PONENTE"; }).length;
    var asistentes = total - ponentes;
    zona.innerHTML =
      window.Sitio.tarjeta(total, total === 1 ? "persona inscrita" : "personas inscritas") +
      window.Sitio.tarjeta(ponentes, ponentes === 1 ? "ponente" : "ponentes") +
      window.Sitio.tarjeta(asistentes, asistentes === 1 ? "asistente" : "asistentes");
  }

  /* Exporta todas las inscripciones a CSV (abre directo en Excel). */
  function exportarSeminarioCsv() {
    if (!seminarioEnMemoria.length) {
      Util.aviso($("aviso-seminario-admin"), "error", "No hay inscripciones que exportar.");
      return;
    }

    function celda(v) {
      if (v === null || v === undefined || typeof v === "boolean") {
        v = v === true ? "Sí" : (v === false ? "No" : "");
      }
      return '"' + String(v).replace(/"/g, '""') + '"';
    }

    var cabeceras = [
      "Nombres y apellidos", "Documento", "Correo", "Teléfono", "País", "Ciudad",
      "Condición", "Perfil", "Modalidad", "Accesibilidad", "Participa como",
      "Título de la ponencia", "Eje temático", "Enlace del video",
      "Ruta de diapositivas", "Registrado el"
    ];
    var claves = [
      "nombres_apellidos", "documento", "email", "telefono", "pais", "ciudad",
      "condicion", "perfil", "modalidad", "accesibilidad", "rol",
      "titulo_ponencia", "eje_tematico", "enlace_video",
      "ruta_diapositivas", "creado_el"
    ];
    /* Campos que salen con etiqueta legible en vez del código interno. */
    var traducir = {
      condicion: "condicion", perfil: "perfil", modalidad: "modalidad",
      accesibilidad: "accesibilidad", rol: "rol", eje_tematico: "eje_tematico"
    };

    var lineas = [cabeceras.map(celda).join(",")];
    seminarioEnMemoria.forEach(function (p) {
      var fila = claves.map(function (k) {
        return celda(traducir[k] ? etiquetaSeminario(traducir[k], p[k]) : p[k]);
      });
      lineas.push(fila.join(","));
    });

    var blob = new Blob(["\uFEFF" + lineas.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    var enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = "seminario-inscritos-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    window.setTimeout(function () { URL.revokeObjectURL(enlace.href); }, 1500);

    Util.aviso($("aviso-seminario-admin"), "exito",
      "Se descargó la lista con " + seminarioEnMemoria.length + " inscripciones.");
  }

  /* =====================================================================
     SEMINARIO: EDITAR Y ELIMINAR INSCRIPCIONES
     ===================================================================== */

  function editarInscripcion(persona) {
    $("insc-id").value = persona.id;
    $("insc-nombres").value = persona.nombres_apellidos || "";
    $("insc-documento").value = persona.documento || "";
    $("insc-email").value = persona.email || "";
    $("insc-telefono").value = persona.telefono || "";
    $("insc-pais").value = persona.pais || "";
    $("insc-ciudad").value = persona.ciudad || "";
    $("insc-condicion").value = persona.condicion || "PERSONA_SORDA";
    $("insc-perfil").value = persona.perfil || "PROFESIONAL";
    $("insc-modalidad").value = persona.modalidad || "PRESENCIAL";
    $("insc-accesibilidad").value = persona.accesibilidad || "LSV";
    $("insc-rol").value = persona.rol || "ASISTENTE";
    $("insc-eje").value = persona.eje_tematico || "";
    $("insc-titulo-ponencia").value = persona.titulo_ponencia || "";
    $("insc-video").value = persona.enlace_video || "";
    $("titulo-editar-inscripcion").textContent =
      "Editando: " + (persona.nombres_apellidos || "inscripción");
    $("tarjeta-editar-inscripcion").hidden = false;
    window.scrollTo({ top: $("tarjeta-editar-inscripcion").offsetTop - 120, behavior: "smooth" });
    $("insc-nombres").focus();
  }

  function cancelarEdicionInscripcion() {
    $("formulario-editar-inscripcion").reset();
    $("insc-id").value = "";
    $("tarjeta-editar-inscripcion").hidden = true;
    Util.limpiarAviso($("aviso-seminario-admin"));
  }

  /* Mismo formato de cédula que exige la planilla pública: V- o E-, solo
     números, sin puntos ni espacios. */
  function validarDocumentoInscripcion(documento) {
    if (!documento) return "Escribe la cédula con el formato V-12345678 o E-12345678.";
    if (/[.\s]/.test(documento)) {
      return "Escribe la cédula sin puntos ni espacios. Ejemplo: V-12345678 o E-12345678.";
    }
    if (!/^[VEve]-\d{5,9}$/.test(documento)) {
      return "La cédula debe comenzar con V- (venezolano) o E- (extranjero), seguido de solo números. Ejemplo: V-12345678.";
    }
    return null;
  }

  async function guardarInscripcionEditada(evento) {
    evento.preventDefault();
    var aviso = $("aviso-seminario-admin");
    Util.limpiarAviso(aviso);

    var id = $("insc-id").value;
    if (!id) return;

    var nombres = Util.texto($("insc-nombres").value);
    var documento = Util.texto($("insc-documento").value);
    var email = Util.texto($("insc-email").value);
    if (!nombres) {
      Util.aviso(aviso, "error", "Escribe los nombres y apellidos.");
      $("insc-nombres").focus();
      return;
    }
    var errorDoc = validarDocumentoInscripcion(documento);
    if (errorDoc) {
      Util.aviso(aviso, "error", errorDoc);
      $("insc-documento").focus();
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      Util.aviso(aviso, "error", "Escribe un correo electrónico válido.");
      $("insc-email").focus();
      return;
    }

    var rol = $("insc-rol").value;
    var esPonente = rol === "PONENTE";
    var cambios = {
      nombres_apellidos: nombres,
      documento: documento,
      email: email,
      telefono: Util.texto($("insc-telefono").value) || null,
      pais: Util.texto($("insc-pais").value) || null,
      ciudad: Util.texto($("insc-ciudad").value) || null,
      condicion: $("insc-condicion").value,
      perfil: $("insc-perfil").value,
      modalidad: $("insc-modalidad").value,
      accesibilidad: $("insc-accesibilidad").value,
      rol: rol,
      titulo_ponencia: esPonente ? (Util.texto($("insc-titulo-ponencia").value) || null) : null,
      eje_tematico: esPonente ? ($("insc-eje").value || null) : null,
      enlace_video: esPonente ? (Util.texto($("insc-video").value) || null) : null
    };

    var boton = $("boton-guardar-inscripcion");
    boton.disabled = true;
    boton.textContent = "Guardando…";
    try {
      await window.DB.actualizarInscripcionSeminario(id, cambios);
      cancelarEdicionInscripcion();
      await cargarInscripcionesSeminario();
      Util.aviso(aviso, "exito", "Inscripción de " + nombres + " actualizada.");
    } catch (error) {
      var msg = /duplicate key|ux_seminario_documento/.test(error.message || "")
        ? "Ya existe otra inscripción con esa cédula. Revisa el documento: no se permiten duplicados."
        : error.message;
      Util.aviso(aviso, "error", msg);
    } finally {
      boton.disabled = false;
      boton.textContent = "Guardar cambios";
    }
  }

  async function eliminarInscripcion(persona) {
    if (!window.confirm(
      "¿Eliminar la inscripción de «" + (persona.nombres_apellidos || "") + "» (" +
      (persona.documento || "") + ")? Esta acción no se puede deshacer."
    )) return;
    var aviso = $("aviso-seminario-admin");
    Util.limpiarAviso(aviso);
    try {
      await window.DB.eliminarInscripcionSeminario(persona.id);
      if ($("insc-id").value === persona.id) cancelarEdicionInscripcion();
      Util.aviso(aviso, "exito", "Inscripción eliminada.");
      await cargarInscripcionesSeminario();
    } catch (error) {
      Util.aviso(aviso, "error", error.message);
    }
  }

  function prepararGestionInscripciones() {
    $("formulario-editar-inscripcion").addEventListener("submit", guardarInscripcionEditada);
    $("boton-cancelar-inscripcion").addEventListener("click", cancelarEdicionInscripcion);
  }

  /* =====================================================================
     SEMINARIO: EDITOR DEL CONTENIDO DE LA PÁGINA PÚBLICA
     ===================================================================== */

  var contenidoSeminarioActual = null;

  function valCont(id) { return Util.texto($(id).value); }
  function ponerCont(id, valor) { $(id).value = valor == null ? "" : valor; }

  /* --- Filas repetibles (ejes, comité, pasos, apoyos) --- */

  function filaEje(item) {
    item = item || {};
    var div = document.createElement("div");
    div.className = "editor-fila";
    div.innerHTML =
      '<div class="campo"><label>Título del eje</label>' +
        '<input type="text" class="eje-titulo" maxlength="160" value="' + esc(item.titulo || "") + '"></div>' +
      '<div class="campo"><label>Descripción del eje</label>' +
        '<textarea class="eje-texto" rows="3" maxlength="1000">' + esc(item.texto || "") + "</textarea></div>" +
      '<button class="boton boton-chico boton-peligro editor-quitar" type="button">Quitar</button>';
    return div;
  }

  function filaComite(item) {
    item = item || {};
    var div = document.createElement("div");
    div.className = "editor-fila";
    div.innerHTML =
      '<div class="campo"><label>Integrante(s)</label>' +
        '<input type="text" class="comite-integrante" maxlength="240" value="' + esc(item.integrante || "") + '"></div>' +
      '<div class="campo"><label>Función</label>' +
        '<input type="text" class="comite-funcion" maxlength="200" value="' + esc(item.funcion || "") + '"></div>' +
      '<button class="boton boton-chico boton-peligro editor-quitar" type="button">Quitar</button>';
    return div;
  }

  function filaPaso(html) {
    var div = document.createElement("div");
    div.className = "editor-fila";
    div.innerHTML =
      '<div class="campo"><label>Paso (admite HTML: &lt;strong&gt;, &lt;a&gt;, &lt;br&gt;)</label>' +
        '<textarea class="paso-texto" rows="3" maxlength="1200">' + esc(html || "") + "</textarea></div>" +
      '<button class="boton boton-chico boton-peligro editor-quitar" type="button">Quitar</button>';
    return div;
  }

  function filaApoyo(item) {
    item = item || {};
    var div = document.createElement("div");
    div.className = "editor-fila";
    div.innerHTML =
      '<input type="hidden" class="apoyo-url" value="' + esc(item.logo_url || "") + '">' +
      '<div class="campo"><label>Logo de la organización (imagen)</label>' +
        '<input type="file" class="apoyo-archivo" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp">' +
        '<img class="apoyo-preview" alt="Vista previa del logo" src="' + esc(item.logo_url || "") +
          '" style="max-width:160px;margin-top:.5rem;display:block"></div>' +
      '<div class="campo"><label>Descripción del logo (texto alternativo)</label>' +
        '<input type="text" class="apoyo-alt" maxlength="300" value="' + esc(item.logo_alt || "") + '"></div>' +
      '<div class="campo"><label>Texto de apoyo (admite HTML)</label>' +
        '<textarea class="apoyo-caption" rows="2" maxlength="600">' + esc(item.caption || "") + "</textarea></div>" +
      '<button class="boton boton-chico boton-peligro editor-quitar" type="button">Quitar</button>';
    div.querySelector(".apoyo-archivo").addEventListener("change", function () {
      if (this.files[0]) div.querySelector(".apoyo-preview").src = URL.createObjectURL(this.files[0]);
    });
    return div;
  }

  function pintarEditorEjes(items) {
    var zona = $("editor-ejes-lista");
    zona.innerHTML = "";
    (items || []).forEach(function (it) { zona.appendChild(filaEje(it)); });
  }
  function pintarEditorComite(filas) {
    var zona = $("editor-comite-lista");
    zona.innerHTML = "";
    (filas || []).forEach(function (it) { zona.appendChild(filaComite(it)); });
  }
  function pintarEditorPasos(pasos) {
    var zona = $("editor-post-lista");
    zona.innerHTML = "";
    (pasos || []).forEach(function (p) { zona.appendChild(filaPaso(p)); });
  }
  function pintarEditorApoyos(items) {
    var zona = $("editor-apoyos-lista");
    zona.innerHTML = "";
    (items || []).forEach(function (it) { zona.appendChild(filaApoyo(it)); });
  }

  function conectarQuitarFilas(idLista) {
    $(idLista).addEventListener("click", function (evento) {
      var objetivo = evento.target;
      var boton = objetivo && objetivo.closest ? objetivo.closest(".editor-quitar") : null;
      if (!boton) return;
      var fila = boton.closest(".editor-fila");
      if (fila && fila.parentNode) fila.parentNode.removeChild(fila);
    });
  }

  /* --- Cargar el contenido guardado en el formulario --- */

  async function cargarContenidoEditorSeminario() {
    try {
      contenidoSeminarioActual = await window.DB.obtenerContenidoSeminario();
    } catch (error) {
      contenidoSeminarioActual = window.SEMINARIO_CONTENIDO_DEFECTO || {};
    }
    volcarContenidoAlEditor(contenidoSeminarioActual);
  }

  function volcarContenidoAlEditor(c) {
    c = c || {};
    var a = c.apertura || {};
    ponerCont("cont-insignia", a.insignia);
    ponerCont("cont-titulo", a.titulo);
    ponerCont("cont-lema", a.lema);
    ponerCont("cont-modalidad", a.parrafo_modalidad);
    ponerCont("cont-portal", a.parrafo_portal);
    ponerCont("cont-flyer-alt", a.flyer_alt);
    ponerCont("cont-boton", a.boton_texto);
    $("cont-flyer-url").value = a.flyer_url || "";
    $("cont-flyer-preview").src = a.flyer_url || "";
    $("cont-flyer-archivo").value = "";

    var ej = c.ejes || {};
    ponerCont("cont-ejes-titulo", ej.titulo);
    ponerCont("cont-ejes-subtitulo", ej.subtitulo);
    pintarEditorEjes(ej.items);

    var co = c.comite || {};
    ponerCont("cont-comite-titulo", co.titulo);
    ponerCont("cont-comite-subtitulo", co.subtitulo);
    pintarEditorComite(co.filas);

    var po = c.postulacion || {};
    ponerCont("cont-post-titulo", po.titulo);
    ponerCont("cont-post-subtitulo", po.subtitulo);
    ponerCont("cont-post-nota", po.nota_asistente);
    pintarEditorPasos(po.pasos);

    var ap = c.apoyos || {};
    ponerCont("cont-apoyos-titulo", ap.titulo);
    pintarEditorApoyos(ap.items);
  }

  /* --- Leer el formulario y subir las imágenes nuevas --- */

  async function recolectarContenidoSeminario(aviso) {
    var apertura = {
      insignia: valCont("cont-insignia"),
      titulo: valCont("cont-titulo"),
      lema: valCont("cont-lema"),
      parrafo_modalidad: valCont("cont-modalidad"),
      parrafo_portal: valCont("cont-portal"),
      flyer_url: $("cont-flyer-url").value || "",
      flyer_alt: valCont("cont-flyer-alt"),
      boton_texto: valCont("cont-boton")
    };
    var archivoFlyer = $("cont-flyer-archivo").files[0];
    if (archivoFlyer) {
      Util.aviso(aviso, "", "Subiendo el afiche del seminario…");
      apertura.flyer_url = await window.DB.subirImagenSeminario(archivoFlyer);
    }

    var ejes = { titulo: valCont("cont-ejes-titulo"), subtitulo: valCont("cont-ejes-subtitulo"), items: [] };
    $("editor-ejes-lista").querySelectorAll(".editor-fila").forEach(function (fila) {
      var t = Util.texto(fila.querySelector(".eje-titulo").value);
      var x = Util.texto(fila.querySelector(".eje-texto").value);
      if (t || x) ejes.items.push({ titulo: t, texto: x });
    });

    var comite = { titulo: valCont("cont-comite-titulo"), subtitulo: valCont("cont-comite-subtitulo"), filas: [] };
    $("editor-comite-lista").querySelectorAll(".editor-fila").forEach(function (fila) {
      var i = Util.texto(fila.querySelector(".comite-integrante").value);
      var f = Util.texto(fila.querySelector(".comite-funcion").value);
      if (i || f) comite.filas.push({ integrante: i, funcion: f });
    });

    var postulacion = {
      titulo: valCont("cont-post-titulo"),
      subtitulo: valCont("cont-post-subtitulo"),
      pasos: [],
      nota_asistente: valCont("cont-post-nota")
    };
    $("editor-post-lista").querySelectorAll(".editor-fila").forEach(function (fila) {
      var p = Util.texto(fila.querySelector(".paso-texto").value);
      if (p) postulacion.pasos.push(p);
    });

    var apoyos = { titulo: valCont("cont-apoyos-titulo"), items: [] };
    var filasApoyo = $("editor-apoyos-lista").querySelectorAll(".editor-fila");
    for (var k = 0; k < filasApoyo.length; k++) {
      var fila = filasApoyo[k];
      var url = fila.querySelector(".apoyo-url").value || "";
      var archivo = fila.querySelector(".apoyo-archivo").files[0];
      if (archivo) {
        Util.aviso(aviso, "", "Subiendo el logo de la organización…");
        url = await window.DB.subirImagenSeminario(archivo);
      }
      var alt = Util.texto(fila.querySelector(".apoyo-alt").value);
      var cap = Util.texto(fila.querySelector(".apoyo-caption").value);
      if (url || alt || cap) apoyos.items.push({ logo_url: url, logo_alt: alt, caption: cap });
    }

    return { apertura: apertura, ejes: ejes, comite: comite, postulacion: postulacion, apoyos: apoyos };
  }

  async function guardarContenidoSeminarioAdmin(evento) {
    evento.preventDefault();
    var aviso = $("aviso-seminario-admin");
    Util.limpiarAviso(aviso);
    var boton = $("boton-guardar-contenido");
    boton.disabled = true;
    boton.textContent = "Guardando…";
    try {
      var contenido = await recolectarContenidoSeminario(aviso);
      await window.DB.guardarContenidoSeminario(contenido);
      contenidoSeminarioActual = contenido;
      volcarContenidoAlEditor(contenido);
      Util.aviso(aviso, "exito",
        "Contenido del seminario publicado. Ya lo ve todo el público en la página del seminario.");
    } catch (error) {
      Util.aviso(aviso, "error", error.message);
    } finally {
      boton.disabled = false;
      boton.textContent = "Guardar contenido";
    }
  }

  function restaurarContenidoSeminario() {
    if (!window.confirm(
      "¿Cargar los textos e imágenes originales en el editor? Se reemplaza lo que tengas " +
      "escrito ahora; pulsa «Guardar contenido» para publicarlos."
    )) return;
    contenidoSeminarioActual = JSON.parse(JSON.stringify(window.SEMINARIO_CONTENIDO_DEFECTO || {}));
    volcarContenidoAlEditor(contenidoSeminarioActual);
    Util.aviso($("aviso-seminario-admin"), "exito",
      "Valores por defecto cargados en el editor. Pulsa «Guardar contenido» para publicarlos.");
  }

  function prepararEditorContenidoSeminario() {
    $("boton-add-eje").addEventListener("click", function () { $("editor-ejes-lista").appendChild(filaEje({})); });
    $("boton-add-comite").addEventListener("click", function () { $("editor-comite-lista").appendChild(filaComite({})); });
    $("boton-add-paso").addEventListener("click", function () { $("editor-post-lista").appendChild(filaPaso("")); });
    $("boton-add-apoyo").addEventListener("click", function () { $("editor-apoyos-lista").appendChild(filaApoyo({})); });
    ["editor-ejes-lista", "editor-comite-lista", "editor-post-lista", "editor-apoyos-lista"].forEach(conectarQuitarFilas);
    $("cont-flyer-archivo").addEventListener("change", function () {
      if (this.files[0]) $("cont-flyer-preview").src = URL.createObjectURL(this.files[0]);
    });
    $("boton-restaurar-contenido").addEventListener("click", restaurarContenidoSeminario);
    $("formulario-contenido-seminario").addEventListener("submit", guardarContenidoSeminarioAdmin);
  }

  /* =====================================================================
     CORREOS MASIVOS (Gmail del sitio vía Edge Function de Supabase)
     ===================================================================== */

  function correosUnicos() {
    var vistos = {};
    censoEnMemoria.forEach(function (p) {
      var c = String(p.email || "").trim().toLowerCase();
      if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c)) vistos[c] = true;
    });
    return Object.keys(vistos);
  }

  function pintarTotalDestinatarios() {
    var el = $("total-destinatarios");
    if (!el) return;
    var n = correosUnicos().length;
    el.textContent = n
      ? n + " destinatarios con correo válido"
      : "Sin correos válidos todavía";
  }

  function prepararFormularioCorreo() {
    $("formulario-correo").addEventListener("submit", enviarCorreoMasivo);
  }

  var ADJUNTO_MAXIMO = 4 * 1024 * 1024; /* 4 MB: el cuerpo del Edge Function lleva el resto */

  /* Lee la imagen seleccionada y la devuelve en base64 para el correo. */
  function leerAdjuntoCorreo() {
    return new Promise(function (resolver, rechazar) {
      var archivo = $("correo-adjunto").files[0];
      if (!archivo) { resolver(null); return; }
      if (!/^image\/(png|jpeg|jpg|gif|webp)$/i.test(archivo.type)) {
        rechazar(new Error("El adjunto debe ser una imagen PNG, JPG, GIF o WEBP."));
        return;
      }
      if (archivo.size > ADJUNTO_MAXIMO) {
        rechazar(new Error("La imagen pesa más de 4 MB. Redúcela antes de adjuntarla."));
        return;
      }
      var lector = new FileReader();
      lector.onload = function () {
        resolver({
          nombre: archivo.name,
          tipo: archivo.type,
          base64: String(lector.result).split(",")[1] || ""
        });
      };
      lector.onerror = function () { rechazar(new Error("No se pudo leer la imagen seleccionada.")); };
      lector.readAsDataURL(archivo);
    });
  }

  async function enviarCorreoMasivo(evento) {
    evento.preventDefault();
    var aviso = $("aviso-correos");
    Util.limpiarAviso(aviso);

    var asunto = textoDe("correo-asunto", $("formulario-correo"));
    var cuerpo = textoDe("correo-cuerpo", $("formulario-correo"));
    var prueba = textoDe("correo-prueba", $("formulario-correo"));
    if (!asunto || !cuerpo) {
      Util.aviso(aviso, "error", "El asunto y el mensaje son obligatorios.");
      return;
    }
    if (prueba && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(prueba)) {
      Util.aviso(aviso, "error", "El correo de prueba no parece una dirección válida.");
      return;
    }

    var destinos = prueba ? 1 : correosUnicos().length;
    if (!destinos) {
      Util.aviso(aviso, "error", "No hay ninguna dirección válida a la cual enviar.");
      return;
    }

    var adjunto = null;
    try {
      adjunto = await leerAdjuntoCorreo();
    } catch (error) {
      Util.aviso(aviso, "error", error.message);
      return;
    }

    if (!window.confirm(
      prueba
        ? "Se enviará SOLO a " + prueba + " como prueba" + (adjunto ? ", con la imagen adjunta" : "") + ". ¿Continuar?"
        : "Se enviará un correo individual a cada una de las " + destinos + " direcciones censadas" +
          (adjunto ? ", con la imagen adjunta" : "") + ". ¿Continuar?"
    )) return;

    var boton = $("boton-enviar-correo");
    boton.disabled = true;
    boton.textContent = "Enviando…";
    try {
      var r = await window.DB.enviarNovedades(asunto, cuerpo, prueba || null, adjunto);
      var detalle = r.simulado
        ? " (simulado: en modo demostración no sale correo real)"
        : " (" + (r.enviados != null ? r.enviados : destinos) + " enviado(s)" +
          (r.fallos && r.fallos.length ? ", " + r.fallos.length + " con fallo" : "") + ")";
      Util.aviso(aviso, "exito",
        "Mensaje repartido a " + (r.destinatarios || destinos) + " destinatario(s)" + detalle +
        ". Salieron desde tu Gmail; si algo no llega, revisa la carpeta Enviados.");
      if (!prueba) {
        $("correo-asunto").value = "";
        $("correo-cuerpo").value = "";
        $("correo-adjunto").value = "";
      }
    } catch (error) {
      Util.aviso(aviso, "error", error.message);
    } finally {
      boton.disabled = false;
      boton.textContent = "Enviar";
    }
  }

  /* =====================================================================
     ARRANQUE
     ===================================================================== */

  async function cargarTodo() {
    await Promise.all([cargarInvestigaciones(), cargarNoticias(), cargarVideos(), cargarSenias(), llenarAreasSenia(), cargarVideosLsv()]);
    await cargarCenso();
    await cargarInscripcionesSeminario();
    await cargarContenidoEditorSeminario();
  }

  function prepararPanelSitio() {
    var checkbox = $("seminario-habilitado");
    var boton = $("boton-guardar-seminario");
    var avisoSitio = $("aviso-sitio");

    window.DB.obtenerConfiguracion().then(function (config) {
      checkbox.checked = config.seminario_habilitado === "si";
    }).catch(function () { /* sin configuración: queda apagada */ });

    boton.addEventListener("click", function () {
      boton.disabled = true;
      window.DB.guardarConfiguracion("seminario_habilitado", checkbox.checked ? "si" : "no")
        .then(function () {
          Util.aviso(avisoSitio, "exito", checkbox.checked
            ? "Pestaña del seminario activada: ya la ve todo el público."
            : "Pestaña del seminario oculta para el público; con tu sesión iniciada la sigues viendo.");
        })
        .catch(function (error) {
          Util.aviso(avisoSitio, "error", "No se pudo guardar el cambio: " + error.message);
        })
        .finally(function () { boton.disabled = false; });
    });
  }

  /* =====================================================================
     VIDEOS EN LSV DEL SEMINARIO (pestaña Sitio)
     ===================================================================== */

  var urlVideoLsvActual = "";

  function prepararVideosLsv() {
    $("boton-nuevo-video-lsv").addEventListener("click", limpiarFormularioVideoLsv);
    $("boton-cancelar-video-lsv").addEventListener("click", limpiarFormularioVideoLsv);
    $("formulario-video-lsv").addEventListener("submit", guardarVideoLsv);
  }

  function limpiarFormularioVideoLsv() {
    $("formulario-video-lsv").reset();
    $("lsv-id").value = "";
    $("lsv-activo").checked = true;
    $("lsv-orden").value = "0";
    urlVideoLsvActual = "";
    $("ayuda-archivo-lsv").innerHTML =
      "Opcional. Si subes un archivo, el enlace de abajo se ignora. Se guarda en el " +
      "bucket público <code>noticias</code>. El plan gratuito de Supabase da ~5 GB de " +
      "transferencia al mes: para videos largos o muchos videos conviene YouTube.";
    $("titulo-formulario-video-lsv").textContent = "Publicar un video en LSV";
    $("boton-guardar-video-lsv").textContent = "Publicar el video";
    $("boton-cancelar-video-lsv").hidden = true;
  }

  function editarVideoLsv(video) {
    limpiarFormularioVideoLsv();
    $("lsv-id").value = video.id;
    $("lsv-titulo").value = video.titulo || "";
    $("lsv-descripcion").value = video.descripcion || "";
    $("lsv-url").value = video.url || "";
    $("lsv-orden").value = video.orden == null ? 0 : video.orden;
    $("lsv-activo").checked = video.activo !== false;
    urlVideoLsvActual = video.url || "";
    $("ayuda-archivo-lsv").textContent =
      "Este video ya tiene archivo o enlace. Solo se reemplazará si subes un archivo nuevo.";
    $("titulo-formulario-video-lsv").textContent = "Editando: " + video.titulo;
    $("boton-guardar-video-lsv").textContent = "Actualizar el video";
    $("boton-cancelar-video-lsv").hidden = false;
    window.scrollTo({ top: $("formulario-video-lsv").offsetTop - 120, behavior: "smooth" });
  }

  async function guardarVideoLsv(evento) {
    evento.preventDefault();
    var aviso = $("aviso-sitio");
    Util.limpiarAviso(aviso);

    var titulo = textoDe("titulo", $("formulario-video-lsv"));
    var url = textoDe("url", $("formulario-video-lsv"));
    var archivo = $("lsv-archivo-video").files[0];
    if (!titulo) {
      Util.aviso(aviso, "error", "El título del video es obligatorio.");
      return;
    }
    if (!url && !archivo && !urlVideoLsvActual) {
      Util.aviso(aviso, "error", "Sube un archivo de video o pega el enlace (YouTube, Vimeo o .mp4).");
      return;
    }

    var boton = $("boton-guardar-video-lsv");
    boton.disabled = true;
    boton.textContent = "Guardando…";

    try {
      if (archivo) {
        Util.aviso(aviso, "", "Subiendo el archivo de video…");
        url = await window.DB.subirVideoLsv(archivo);
      }

      var registro = {
        titulo: titulo,
        descripcion: textoDe("descripcion", $("formulario-video-lsv")) || null,
        url: url || urlVideoLsvActual,
        activo: marcado("activo", $("formulario-video-lsv")),
        orden: Number(textoDe("orden", $("formulario-video-lsv")) || 0)
      };
      var id = $("lsv-id").value;
      if (id) registro.id = id;

      await window.DB.guardarVideoLsv(registro);
      Util.aviso(aviso, "exito", id ? "Video actualizado." : "Video publicado en la página del seminario.");
      limpiarFormularioVideoLsv();
      await cargarVideosLsv();
    } catch (error) {
      Util.aviso(aviso, "error", error.message);
    } finally {
      boton.disabled = false;
      boton.textContent = $("lsv-id").value ? "Actualizar el video" : "Publicar el video";
    }
  }

  async function alternarVideoLsv(video) {
    var aviso = $("aviso-sitio");
    try {
      await window.DB.guardarVideoLsv({ id: video.id, activo: video.activo === false });
      await cargarVideosLsv();
      Util.aviso(aviso, "exito", video.activo === false
        ? "Video visible de nuevo en la página del seminario."
        : "Video ocultado de la página del seminario.");
    } catch (error) {
      Util.aviso(aviso, "error", error.message);
    }
  }

  async function eliminarVideoLsv(video) {
    if (!window.confirm("¿Eliminar el video «" + video.titulo + "»?")) return;
    var aviso = $("aviso-sitio");
    try {
      await window.DB.eliminarVideoLsv(video.id);
      Util.aviso(aviso, "exito", "Video eliminado.");
      await cargarVideosLsv();
    } catch (error) {
      Util.aviso(aviso, "error", error.message);
    }
  }

  async function cargarVideosLsv() {
    var zona = $("lista-videos-lsv-admin");
    zona.innerHTML = '<p class="cargando">Cargando</p>';
    try {
      var lista = await window.DB.listarVideosLsv(true);
      $("total-videos-lsv").textContent = lista.length + " video" + (lista.length === 1 ? "" : "s");

      if (!lista.length) {
        zona.innerHTML = window.Sitio.mensajeVacio("No hay videos en LSV publicados todavía.");
        return;
      }

      var filas = lista.map(function (v) {
        return "<tr>" +
          "<td><strong>" + esc(v.titulo) + "</strong><br><span class=\"texto-suave texto-chico\">" + esc(v.descripcion || "") + "</span></td>" +
          '<td class="texto-chico">' + (v.url
            ? '<a href="' + esc(v.url) + '" target="_blank" rel="noopener noreferrer">' + esc(v.url) + "</a>"
            : "—") + "</td>" +
          "<td>" + (v.orden == null ? "—" : esc(v.orden)) + "</td>" +
          "<td>" + (v.activo === false ? '<span class="insignia">Oculto</span>' : '<span class="insignia insignia-publicado">Visible</span>') + "</td>" +
          '<td class="acciones">' +
            '<button class="boton boton-chico boton-contorno" type="button" data-accion="editar" data-id="' + esc(v.id) + '">Editar</button>' +
            '<button class="boton boton-chico boton-contorno" type="button" data-accion="alternar" data-id="' + esc(v.id) + '">' + (v.activo === false ? "Mostrar" : "Ocultar") + "</button>" +
            '<button class="boton boton-chico boton-peligro" type="button" data-accion="eliminar" data-id="' + esc(v.id) + '">Eliminar</button>' +
          "</td></tr>";
      }).join("");

      zona.innerHTML =
        '<div class="tabla-envoltura"><table>' +
          "<thead><tr><th scope=\"col\">Título</th><th scope=\"col\">Enlace</th>" +
          '<th scope="col">Orden</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead>' +
          "<tbody>" + filas + "</tbody></table></div>";

      var mapa = {};
      lista.forEach(function (v) { mapa[v.id] = v; });

      zona.querySelectorAll("button[data-accion]").forEach(function (boton) {
        var video = mapa[boton.getAttribute("data-id")];
        if (!video) return;
        boton.addEventListener("click", function () {
          var accion = boton.getAttribute("data-accion");
          if (accion === "editar") editarVideoLsv(video);
          if (accion === "alternar") alternarVideoLsv(video);
          if (accion === "eliminar") eliminarVideoLsv(video);
        });
      });
    } catch (error) {
      zona.innerHTML = window.Sitio.mensajeError(error);
    }
  }

  function iniciar() {
    iniciarPestanyas();
    prepararFormularioInvestigacion();
    prepararFormularioNoticia();
    prepararFormularioVideo();
    prepararFormularioSenia();
    prepararFormularioCorreo();
    prepararPanelSitio();
    prepararVideosLsv();
    iniciarAcceso();

    $("buscador-censo").addEventListener("input", function () {
      pintarListaCenso(this.value.trim());
    });
    $("boton-exportar-censo").addEventListener("click", exportarCensoCsv);

    $("buscador-seminario").addEventListener("input", function () {
      pintarListaSeminario(this.value.trim());
    });
    $("boton-exportar-seminario").addEventListener("click", exportarSeminarioCsv);
    prepararGestionInscripciones();
    prepararEditorContenidoSeminario();

    window.DB.alCambiarSesion(function () { revisarSesion(); });

    revisarSesion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
