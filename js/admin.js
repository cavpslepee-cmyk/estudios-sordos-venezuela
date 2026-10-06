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
      zona.innerHTML =
          '<div class="tarjetas-contador" style="margin-bottom:1.4rem">' +
            window.Sitio.tarjeta(r.total_egresados || 0, "Total de egresados") +
            window.Sitio.tarjeta(r.total_titulos || 0, "Títulos en total") +
            window.Sitio.tarjeta(r.con_investigacion || 0, "Con investigación") +
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
     ARRANQUE
     ===================================================================== */

  async function cargarTodo() {
    await Promise.all([cargarInvestigaciones(), cargarNoticias(), cargarVideos(), cargarSenias(), llenarAreasSenia()]);
    await cargarCenso();
  }

  function iniciar() {
    iniciarPestanyas();
    prepararFormularioInvestigacion();
    prepararFormularioNoticia();
    prepararFormularioVideo();
    prepararFormularioSenia();
    iniciarAcceso();

    $("buscador-censo").addEventListener("input", function () {
      pintarListaCenso(this.value.trim());
    });
    $("boton-exportar-censo").addEventListener("click", exportarCensoCsv);

    window.DB.alCambiarSesion(function () { revisarSesion(); });

    revisarSesion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
