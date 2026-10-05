/* =====================================================================
   CAPA DE DATOS — ESTUDIOS SORDOS DE VENEZUELA
   =====================================================================
   Unifica el acceso a Supabase y al modo demostración. El resto de las
   páginas nunca llama a Supabase directamente: siempre pasa por DB.

   Si js/config.js tiene SUPABASE_URL y SUPABASE_ANON_KEY  -> usa Supabase
   Si están vacíos                                        -> modo demo
   ===================================================================== */

(function () {
  "use strict";

  var cfg = window.CONFIG;
  var PRE = "esv_demo_";

  function supabaseConfigurado() {
    return !!(cfg && cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
              String(cfg.SUPABASE_URL).indexOf("http") === 0);
  }

  var cliente = null;
  var esSupabase = false;

  function obtenerCliente() {
    if (cliente) return cliente;
    if (!supabaseConfigurado()) return null;
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      console.error(
        "[ESV] No se pudo cargar la librería de Supabase. " +
        "Revisa tu conexión a internet o el script del CDN en el HTML."
      );
      return null;
    }
    cliente = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
    return cliente;
  }

  /* Decide el modo real: si config está incompleto o el CDN falló, demo. */
  esSupabase = !!obtenerCliente();

  function sb() {
    var c = obtenerCliente();
    if (!c) throw new Error("Cliente de Supabase no disponible.");
    return c;
  }

  function fallo(res) {
    if (res && res.error) {
      throw new Error(res.error.message || "Ocurrió un error en la base de datos.");
    }
    return res.data;
  }

  /* -------------------------------------------------------------------
     ALMACÉN DEL MODO DEMO (localStorage, precargado desde datos-demo.js)
     ------------------------------------------------------------------- */
  function demoLeer(tabla) {
    try {
      var crudo = localStorage.getItem(PRE + tabla);
      if (crudo === null) {
        var semilla = (window.DATOS_DEMO && window.DATOS_DEMO[tabla]) || [];
        localStorage.setItem(PRE + tabla, JSON.stringify(semilla));
        return semilla.slice();
      }
      return JSON.parse(crudo);
    } catch (e) {
      return ((window.DATOS_DEMO && window.DATOS_DEMO[tabla]) || []).slice();
    }
  }

  function demoGuardar(tabla, filas) {
    try { localStorage.setItem(PRE + tabla, JSON.stringify(filas)); } catch (e) { /* cuota llena */ }
    return filas;
  }

  function demoId() {
    return "demo-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function demoInsertar(tabla, registro) {
    var filas = demoLeer(tabla);
    var nuevo = Object.assign({}, registro, {
      id: registro.id || demoId(),
      creado_el: registro.creado_el || new Date().toISOString()
    });
    filas.push(nuevo);
    demoGuardar(tabla, filas);
    return nuevo;
  }

  function demoActualizar(tabla, id, cambios) {
    var filas = demoLeer(tabla);
    for (var i = 0; i < filas.length; i++) {
      if (filas[i].id === id) {
        filas[i] = Object.assign({}, filas[i], cambios, {
          actualizado_el: new Date().toISOString()
        });
        demoGuardar(tabla, filas);
        return filas[i];
      }
    }
    throw new Error("No se encontró el registro con id " + id);
  }

  function demoEliminar(tabla, id) {
    var filas = demoLeer(tabla).filter(function (f) { return f.id !== id; });
    demoGuardar(tabla, filas);
    return true;
  }

  function demoContiene(texto, agujas) {
    var t = String(texto || "").toLowerCase();
    return agujas.some(function (a) { return a && t.indexOf(a.toLowerCase()) !== -1; });
  }

  /* -------------------------------------------------------------------
     SESIÓN / ADMINISTRADOR
     ------------------------------------------------------------------- */
  var DEMO_SESION = PRE + "sesion";

  async function iniciarSesion(email, contrasena) {
    if (!esSupabase) {
      if (!email || !contrasena) throw new Error("Escribe tu correo y tu contraseña.");
      localStorage.setItem(DEMO_SESION, JSON.stringify({ email: email, demo: true }));
      return { email: email, demo: true };
    }
    var res = await sb().auth.signInWithPassword({ email: email, password: contrasena });
    if (res.error) throw new Error(res.error.message);
    return { email: email, demo: false };
  }

  async function cerrarSesion() {
    localStorage.removeItem(DEMO_SESION);
    if (esSupabase) await sb().auth.signOut();
  }

  async function sesionActual() {
    if (!esSupabase) {
      try {
        var crudo = localStorage.getItem(DEMO_SESION);
        return crudo ? JSON.parse(crudo) : null;
      } catch (e) { return null; }
    }
    var res = await sb().auth.getSession();
    if (res.error || !res.data || !res.data.session) return null;
    return { email: res.data.session.user.email, demo: false, id: res.data.session.user.id };
  }

  function alCambiarSesion(callback) {
    if (!esSupabase) return { data: { subscription: { unsubscribe: function () {} } } };
    return sb().auth.onAuthStateChange(function (_evento, sesion) {
      callback(sesion ? { email: sesion.user.email, demo: false } : null);
    });
  }

  /* -------------------------------------------------------------------
     INVESTIGACIONES
     ------------------------------------------------------------------- */
  function ordenarInvestigaciones(lista) {
    return lista.slice().sort(function (a, b) {
      if (!!b.destacado !== !!a.destacado) return b.destacado ? 1 : -1;
      var oa = a.orden == null ? 999 : a.orden;
      var ob = b.orden == null ? 999 : b.orden;
      if (oa !== ob) return oa - ob;
      return String(b.creado_el || "").localeCompare(String(a.creado_el || ""));
    });
  }

  async function listarInvestigaciones(opciones) {
    var opts = opciones || {};
    var soloPublicados = opts.todas ? false : true;

    if (!esSupabase) {
      var datos = demoLeer("investigaciones");
      if (soloPublicados) datos = datos.filter(function (i) { return i.estado === "PUBLICADO"; });
      if (opts.categoria) datos = datos.filter(function (i) { return i.categoria === opts.categoria; });
      if (opts.texto) {
        datos = datos.filter(function (i) {
          return demoContiene(i.titulo + " " + i.autor + " " + i.resumen + " " + (i.universidad || ""), [opts.texto]);
        });
      }
      if (opts.limit) datos = datos.slice(0, opts.limit);
      return ordenarInvestigaciones(datos);
    }

    var q = sb().from("investigaciones").select("*");
    if (soloPublicados) q = q.eq("estado", "PUBLICADO");
    if (opts.categoria) q = q.eq("categoria", opts.categoria);
    if (opts.texto) {
      var seguro = String(opts.texto).replace(/[%_,()]/g, " ").trim();
      if (seguro) q = q.or("titulo.ilike.%" + seguro + "%,autor.ilike.%" + seguro + "%,resumen.ilike.%" + seguro + "%");
    }
    q = q.order("destacado", { ascending: false })
         .order("orden", { ascending: true })
         .order("creado_el", { ascending: false });
    if (opts.limit) q = q.limit(opts.limit);
    return fallo(await q);
  }

  async function obtenerInvestigacion(id) {
    if (!esSupabase) {
      var lista = demoLeer("investigaciones");
      var hallada = lista.filter(function (i) { return i.id === id; })[0];
      if (!hallada) throw new Error("No se encontró esa investigación.");
      return hallada;
    }
    var datos = fallo(await sb().from("investigaciones").select("*").eq("id", id).maybeSingle());
    if (!datos) throw new Error("No se encontró esa investigación.");
    return datos;
  }

  async function guardarInvestigacion(registro) {
    if (!esSupabase) {
      if (registro.id) return demoActualizar("investigaciones", registro.id, registro);
      return demoInsertar("investigaciones", registro);
    }
    var limpio = Object.assign({}, registro);
    delete limpio.id;
    delete limpio.creado_el;
    if (registro.id) {
      return fallo(await sb().from("investigaciones").update(limpio).eq("id", registro.id).select().single());
    }
    return fallo(await sb().from("investigaciones").insert(limpio).select().single());
  }

  async function eliminarInvestigacion(id) {
    if (!esSupabase) return demoEliminar("investigaciones", id);
    fallo(await sb().from("investigaciones").delete().eq("id", id));
    return true;
  }

  /* -------------------------------------------------------------------
     VIDEOS DE PORTADA
     ------------------------------------------------------------------- */
  async function listarVideos(incluirInactivos) {
    if (!esSupabase) {
      var datos = demoLeer("videos_portada");
      if (!incluirInactivos) datos = datos.filter(function (v) { return v.activo !== false; });
      return datos.slice().sort(function (a, b) { return (a.orden || 0) - (b.orden || 0); });
    }
    var q = sb().from("videos_portada").select("*");
    if (!incluirInactivos) q = q.eq("activo", true);
    return fallo(await q.order("orden", { ascending: true }).order("creado_el", { ascending: false }));
  }

  async function guardarVideo(registro) {
    if (!esSupabase) {
      if (registro.id) return demoActualizar("videos_portada", registro.id, registro);
      return demoInsertar("videos_portada", registro);
    }
    var limpio = Object.assign({}, registro);
    delete limpio.id;
    delete limpio.creado_el;
    if (registro.id) {
      return fallo(await sb().from("videos_portada").update(limpio).eq("id", registro.id).select().single());
    }
    return fallo(await sb().from("videos_portada").insert(limpio).select().single());
  }

  async function eliminarVideo(id) {
    if (!esSupabase) return demoEliminar("videos_portada", id);
    fallo(await sb().from("videos_portada").delete().eq("id", id));
    return true;
  }

  /* -------------------------------------------------------------------
     DICCIONARIO DE SEÑAS
     ------------------------------------------------------------------- */
  async function listarSenias(opciones) {
    var opts = opciones || {};
    if (!esSupabase) {
      var datos = demoLeer("diccionario_senias");
      if (opts.categoria) datos = datos.filter(function (s) { return s.categoria === opts.categoria; });
      if (opts.soloRecientes) datos = datos.filter(function (s) { return !!s.acuniada_recientemente; });
      if (opts.texto) {
        datos = datos.filter(function (s) {
          return demoContiene(s.palabra + " " + (s.sinonimos || "") + " " + (s.descripcion || ""), [opts.texto]);
        });
      }
      return datos.slice().sort(function (a, b) {
        return String(a.palabra).localeCompare(String(b.palabra), "es");
      });
    }
    var q = sb().from("diccionario_senias").select("*");
    if (opts.categoria) q = q.eq("categoria", opts.categoria);
    if (opts.soloRecientes) q = q.eq("acuniada_recientemente", true);
    if (opts.texto) {
      var seguro = String(opts.texto).replace(/[%_,()]/g, " ").trim();
      if (seguro) q = q.or("palabra.ilike.%" + seguro + "%,sinonimos.ilike.%" + seguro + "%,descripcion.ilike.%" + seguro + "%");
    }
    return fallo(await q.order("palabra", { ascending: true }));
  }

  async function listarCategoriasSenias() {
    var lista = await listarSenias({});
    var vistos = {};
    lista.forEach(function (s) { if (s.categoria) vistos[s.categoria] = true; });
    return Object.keys(vistos).sort(function (a, b) { return a.localeCompare(b, "es"); });
  }

  async function guardarSenia(registro) {
    if (!esSupabase) {
      if (registro.id) return demoActualizar("diccionario_senias", registro.id, registro);
      return demoInsertar("diccionario_senias", registro);
    }
    var limpio = Object.assign({}, registro);
    delete limpio.id;
    delete limpio.creado_el;
    if (registro.id) {
      return fallo(await sb().from("diccionario_senias").update(limpio).eq("id", registro.id).select().single());
    }
    return fallo(await sb().from("diccionario_senias").insert(limpio).select().single());
  }

  async function eliminarSenia(id) {
    if (!esSupabase) return demoEliminar("diccionario_senias", id);
    fallo(await sb().from("diccionario_senias").delete().eq("id", id));
    return true;
  }

  /* -------------------------------------------------------------------
     CENSO DE EGRESADOS
     ------------------------------------------------------------------- */
  async function registrarCenso(datos, titulosAdicionales) {
    var extra = (titulosAdicionales || []).filter(function (t) {
      return t && String(t.titulo || "").trim() !== "";
    });
    var idNuevo = crypto.randomUUID();
    var registro = Object.assign({}, datos, { id: idNuevo });

    if (!esSupabase) {
      var nuevo = demoInsertar("censo_egresados", registro);
      var todos = demoLeer("titulos_adicionales");
      extra.forEach(function (t) {
        todos.push(Object.assign({}, t, { id: demoId(), censo_id: nuevo.id }));
      });
      demoGuardar("titulos_adicionales", todos);
      return nuevo;
    }

    /* Sin .select(): el público solo inserta (privacidad), así que un
       RETURNING no devolvería filas y el id se genera aquí mismo. */
    fallo(await sb().from("censo_egresados").insert(registro));
    if (extra.length) {
      var filas = extra.map(function (t) {
        return {
          censo_id: idNuevo,
          titulo: t.titulo,
          universidad: t.universidad || null,
          anio_graduacion: t.anio_graduacion ? Number(t.anio_graduacion) : null,
          categoria_egreso: t.categoria_egreso || null,
          nivel: t.nivel || null
        };
      });
      fallo(await sb().from("titulos_adicionales").insert(filas));
    }
    return registro;
  }

  async function listarCenso() {
    if (!esSupabase) {
      return demoLeer("censo_egresados").slice().sort(function (a, b) {
        return String(b.creado_el || "").localeCompare(String(a.creado_el || ""));
      });
    }
    return fallo(await sb().from("censo_egresados").select("*").order("creado_el", { ascending: false }));
  }

  async function listarTitulosAdicionales(censoId) {
    if (!esSupabase) {
      return demoLeer("titulos_adicionales").filter(function (t) { return t.censo_id === censoId; });
    }
    return fallo(await sb().from("titulos_adicionales").select("*").eq("censo_id", censoId));
  }

  async function eliminarCenso(id) {
    if (!esSupabase) {
      demoEliminar("censo_egresados", id);
      demoGuardar("titulos_adicionales",
        demoLeer("titulos_adicionales").filter(function (t) { return t.censo_id !== id; }));
      return true;
    }
    fallo(await sb().from("censo_egresados").delete().eq("id", id));
    return true;
  }

  /* Estadísticas del censo. En Supabase se calculan en la base de datos
     (función SECURITY DEFINER) para no exponer datos personales al público. */
  async function resumenCenso() {
    if (!esSupabase) {
      var filas = demoLeer("censo_egresados");
      var resumen = {
        total_egresados: filas.length,
        con_investigacion: 0,
        por_nivel: {}, por_categoria: {}, por_estado: {}, por_universidad: {}
      };
      var universidades = {};
      filas.forEach(function (f) {
        if (f.ha_realizado_investigacion) resumen.con_investigacion++;
        if (f.nivel) resumen.por_nivel[f.nivel] = (resumen.por_nivel[f.nivel] || 0) + 1;
        if (f.categoria_egreso) resumen.por_categoria[f.categoria_egreso] = (resumen.por_categoria[f.categoria_egreso] || 0) + 1;
        if (f.estado) resumen.por_estado[f.estado] = (resumen.por_estado[f.estado] || 0) + 1;
        if (f.universidad) universidades[f.universidad] = (universidades[f.universidad] || 0) + 1;
      });
      Object.keys(universidades).sort(function (a, b) {
        return universidades[b] - universidades[a];
      }).slice(0, 10).forEach(function (u) {
        resumen.por_universidad[u] = universidades[u];
      });
      return resumen;
    }
    var res = await sb().rpc("resumen_censo");
    if (res.error) throw new Error(res.error.message);
    return res.data;
  }

  async function nombresPublicosEgresados() {
    if (!esSupabase) {
      return demoLeer("censo_egresados")
        .filter(function (f) { return f.autoriza_publicar_nombre; })
        .map(function (f) {
          return {
            nombres: f.nombres, apellidos: f.apellidos, titulo_egreso: f.titulo_egreso,
            universidad: f.universidad, estado: f.estado, anio_graduacion: f.anio_graduacion
          };
        })
        .sort(function (a, b) { return String(a.apellidos).localeCompare(String(b.apellidos), "es"); });
    }
    var res = await sb().rpc("nombres_publicos_egresados");
    if (res.error) throw new Error(res.error.message);
    return res.data;
  }

  /* -------------------------------------------------------------------
     ARCHIVOS PDF
     ------------------------------------------------------------------- */
  async function subirPdf(archivo) {
    if (!archivo) return null;
    if (!esSupabase) {
      throw new Error(
        "En modo demostración no se pueden subir archivos. " +
        "Conecta Supabase en js/config.js para habilitar la subida de PDF."
      );
    }
    var nombre = archivo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    var ruta = Date.now() + "-" + nombre;
    var res = await sb().storage.from(cfg.BUCKET_PDF).upload(ruta, archivo, {
      cacheControl: "3600",
      upsert: false,
      contentType: archivo.type || "application/pdf"
    });
    if (res.error) throw new Error(res.error.message);
    var publica = sb().storage.from(cfg.BUCKET_PDF).getPublicUrl(res.data.path);
    return publica.data.publicUrl;
  }

  /* -------------------------------------------------------------------
     CONFIGURACIÓN DEL SITIO
     ------------------------------------------------------------------- */
  async function obtenerConfiguracion() {
    var mapa = {};
    if (!esSupabase) {
      demoLeer("configuracion_sitio").forEach(function (c) { mapa[c.clave] = c.valor; });
      return mapa;
    }
    var filas = fallo(await sb().from("configuracion_sitio").select("clave,valor"));
    filas.forEach(function (c) { mapa[c.clave] = c.valor; });
    return mapa;
  }

  /* -------------------------------------------------------------------
     API PÚBLICA
     ------------------------------------------------------------------- */
  window.DB = {
    modo: function () { return esSupabase ? "supabase" : "demo"; },
    usaSupabase: function () { return esSupabase; },

    iniciarSesion: iniciarSesion,
    cerrarSesion: cerrarSesion,
    sesionActual: sesionActual,
    alCambiarSesion: alCambiarSesion,

    listarInvestigaciones: listarInvestigaciones,
    obtenerInvestigacion: obtenerInvestigacion,
    guardarInvestigacion: guardarInvestigacion,
    eliminarInvestigacion: eliminarInvestigacion,

    listarVideos: listarVideos,
    guardarVideo: guardarVideo,
    eliminarVideo: eliminarVideo,

    listarSenias: listarSenias,
    listarCategoriasSenias: listarCategoriasSenias,
    guardarSenia: guardarSenia,
    eliminarSenia: eliminarSenia,

    registrarCenso: registrarCenso,
    listarCenso: listarCenso,
    listarTitulosAdicionales: listarTitulosAdicionales,
    eliminarCenso: eliminarCenso,
    resumenCenso: resumenCenso,
    nombresPublicosEgresados: nombresPublicosEgresados,

    subirPdf: subirPdf,
    obtenerConfiguracion: obtenerConfiguracion
  };
})();
