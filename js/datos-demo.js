/* =====================================================================
   DATOS DE DEMOSTRACIÓN
   =====================================================================
   Se usan SOLO cuando js/config.js no tiene credenciales de Supabase.
   Permiten ver y probar el sitio completo antes de conectar la base de
   datos real. En modo demo los cambios del administrador se guardan en
   el almacenamiento local del navegador (se pierden al limpiar datos).
   ===================================================================== */

window.DATOS_DEMO = {
  investigaciones: [
    {
      id: "demo-inv-1",
      titulo: "Integración de estudiantes sordos a la educación universitaria",
      autor: "Dr. Javier Ramírez González",
      anio: 2020,
      categoria: "EDUCACION",
      resumen: "Análisis de las barreras de acceso y permanencia que enfrentan los estudiantes sordos en la educación universitaria, y de las condiciones institucionales, lingüísticas y pedagógicas necesarias para lograr una integración real.",
      universidad: null,
      url_pdf: null,
      url_externa: "https://www.cultura-sorda.org/integracion-de-estudiantes-sordos-a-la-educacion-universitaria/",
      estado: "PUBLICADO",
      destacado: true,
      orden: 1,
      creado_el: "2020-05-14T10:00:00Z"
    },
    {
      id: "demo-inv-2",
      titulo: "Aproximación a la metáfora en la Lengua de Señas Venezolana",
      autor: "Dr. Javier Ramírez González",
      anio: 2020,
      categoria: "LINGUISTICA",
      resumen: "Estudio lingüístico sobre los mecanismos metafóricos presentes en la Lengua de Señas Venezolana (LSV), con análisis de corpus y su aporte a la descripción gramatical de la lengua.",
      universidad: null,
      url_pdf: null,
      url_externa: "https://www.cultura-sorda.org/wp-content/uploads/2026/03/Ramirez2020_APROXIMACION_METAFORA_LSV.pdf",
      estado: "PUBLICADO",
      destacado: true,
      orden: 2,
      creado_el: "2020-03-02T10:00:00Z"
    },
    {
      id: "demo-inv-3",
      titulo: "Publicación en Revista Metrópolis",
      autor: "Dr. Javier Ramírez González",
      anio: null,
      categoria: "EDUCACION",
      resumen: "Trabajo de investigación publicado en la Revista Metrópolis de la Universidad Metropolitana.",
      universidad: "Universidad Metropolitana",
      url_pdf: null,
      url_externa: "https://metropolis.metrouni.us/index.php/metropolis/article/view/99",
      estado: "PUBLICADO",
      destacado: true,
      orden: 3,
      creado_el: "2021-09-20T10:00:00Z"
    },
    {
      id: "demo-inv-4",
      titulo: "Trabajo comunitario con familias de niños sordos",
      autor: "Ejemplo de autora sorda",
      anio: 2024,
      categoria: "COMUNITARIA",
      resumen: "Registro de una experiencia de acompañamiento a familias oyentes con hijos sordos en una comunidad del estado Zulia. Este es un registro de demostración.",
      universidad: "Universidad del Zulia",
      url_pdf: null,
      url_externa: null,
      estado: "PENDIENTE",
      destacado: false,
      orden: 7,
      creado_el: "2024-11-01T10:00:00Z"
    },
    {
      id: "demo-inv-5",
      titulo: "La caverna y la luz: narrativas pedagógicas con sordociegos y sordos desde la Lengua de Señas Venezolana",
      autor: "Poema Rondón",
      anio: 2025,
      categoria: "EDUCACION",
      resumen: "Trabajo final de grado de la Licenciatura en Pedagogía Alternativa (subárea Cultura Sorda): narrativas pedagógicas con personas sordociegas y sordas construidas desde la Lengua de Señas Venezolana. Tutor académico: Dr. Javier Ramírez.",
      universidad: null,
      url_pdf: "pdf/la-caverna-y-la-luz-poema-rondon.pdf",
      url_externa: null,
      estado: "PUBLICADO",
      destacado: false,
      orden: 4,
      creado_el: "2025-09-01T10:00:00Z"
    },
    {
      id: "demo-inv-6",
      titulo: "Refrigeración en señas: una aproximación técnica, lingüística y antropológica desde la perspectiva sorda",
      autor: "Eliscson Reverón",
      anio: 2025,
      categoria: "LINGUISTICA",
      resumen: "Trabajo de grado de la Licenciatura en Desarrollo Endógeno (subárea Refrigeración): el vocabulario técnico de la refrigeración en lengua de señas, abordado desde lo técnico, lo lingüístico y lo antropológico por un autor sordo. Tutor académico: Javier Ramírez.",
      universidad: "Universidad Nacional Experimental Simón Rodríguez",
      url_pdf: "pdf/refrigeracion-en-senas-eliscson-reveron.pdf",
      url_externa: null,
      estado: "PUBLICADO",
      destacado: false,
      orden: 5,
      creado_el: "2025-09-01T10:00:00Z"
    },
    {
      id: "demo-inv-7",
      titulo: "Lo que mis manos cuentan: pedagogía, identidad y resistencia desde la lengua de señas",
      autor: "Glenda Maginan",
      anio: 2025,
      categoria: "EDUCACION",
      resumen: "Trabajo final de grado de la Licenciatura en Pedagogía Alternativa en Comunicación y Lengua de Señas Venezolana: pedagogía, identidad y resistencia de la persona sorda contadas desde su propia lengua. Tutor académico: Javier Ramírez.",
      universidad: null,
      url_pdf: "pdf/lo-que-mis-manos-cuentan-glenda-maginan.pdf",
      url_externa: null,
      estado: "PUBLICADO",
      destacado: false,
      orden: 6,
      creado_el: "2025-09-01T10:00:00Z"
    }
  ],

  videos_portada: [
    {
      id: "demo-video-1",
      titulo: "Bienvenidos a Estudios Sordos de Venezuela",
      descripcion: "Video de presentación del proyecto. El administrador puede cambiarlo desde el panel.",
      url: "",
      activo: true,
      orden: 1
    },
    {
      id: "demo-video-2",
      titulo: "Personas sordas en la universidad",
      descripcion: "Segundo video de ejemplo para mostrar que la portada admite varios videos intercambiables.",
      url: "",
      activo: true,
      orden: 2
    }
  ],

  diccionario_senias: [
    {
      id: "demo-senia-1",
      palabra: "UNIVERSIDAD",
      sinonimos: "Casa de estudios superiores",
      categoria: "EDUCACION",
      descripcion: "Se coloca la mano dominante en forma de «U» sobre la frente y se desplaza hacia adelante y arriba, evocando el birrete académico.",
      url_video: "",
      url_imagen: "",
      acuniada_recientemente: false,
      fecha_acuniada: null,
      fuente: "Datos de ejemplo"
    },
    {
      id: "demo-senia-2",
      palabra: "INVESTIGACIÓN",
      sinonimos: "Investigar",
      categoria: "EDUCACION",
      descripcion: "Ambos índices se mueven en círculos pequeños frente a los ojos, representando la búsqueda detallada de información.",
      url_video: "",
      url_imagen: "",
      acuniada_recientemente: false,
      fecha_acuniada: null,
      fuente: "Datos de ejemplo"
    },
    {
      id: "demo-senia-3",
      palabra: "LENGUA DE SEÑAS",
      sinonimos: "LSV, idioma de señas",
      categoria: "LINGUISTICA",
      descripcion: "Las manos abiertas se alternan moviéndose hacia arriba desde la boca, simulando el flujo continuo de la comunicación visual.",
      url_video: "",
      url_imagen: "",
      acuniada_recientemente: false,
      fecha_acuniada: null,
      fuente: "Datos de ejemplo"
    },
    {
      id: "demo-senia-4",
      palabra: "SORDO",
      sinonimos: "Persona sorda",
      categoria: "IDENTIDAD",
      descripcion: "La mano en forma de «S» o el índice extendido gira desde la comisura de la boca hacia la oreja.",
      url_video: "",
      url_imagen: "",
      acuniada_recientemente: false,
      fecha_acuniada: null,
      fuente: "Datos de ejemplo"
    },
    {
      id: "demo-senia-5",
      palabra: "OYENTE",
      sinonimos: "Persona oyente",
      categoria: "IDENTIDAD",
      descripcion: "El índice se coloca sobre la oreja y da un pequeño toque, señalando la audición.",
      url_video: "",
      url_imagen: "",
      acuniada_recientemente: false,
      fecha_acuniada: null,
      fuente: "Datos de ejemplo"
    },
    {
      id: "demo-senia-6",
      palabra: "GRADUACIÓN",
      sinonimos: "Grado, egreso",
      categoria: "EDUCACION",
      descripcion: "La mano plana simula el birrete sobre la cabeza y se levanta ligeramente, acompañada de expresión de logro.",
      url_video: "",
      url_imagen: "",
      acuniada_recientemente: false,
      fecha_acuniada: null,
      fuente: "Datos de ejemplo"
    },
    {
      id: "demo-senia-7",
      palabra: "TESIS",
      sinonimos: "Trabajo de grado",
      categoria: "EDUCACION",
      descripcion: "Se sostiene una mano como si fuera un documento y la otra golpea suavemente el dorso, indicando el trabajo escrito final.",
      url_video: "",
      url_imagen: "",
      acuniada_recientemente: false,
      fecha_acuniada: null,
      fuente: "Datos de ejemplo"
    },
    {
      id: "demo-senia-8",
      palabra: "ACCESIBILIDAD",
      sinonimos: "Acceso, inclusión",
      categoria: "SOCIAL",
      descripcion: "Las manos entrelazadas se abren hacia el frente, representando la eliminación de barreras.",
      url_video: "",
      url_imagen: "",
      acuniada_recientemente: true,
      fecha_acuniada: "2025-06-10",
      fuente: "Seña acuñada recientemente — datos de ejemplo"
    },
    {
      id: "demo-senia-9",
      palabra: "INTÉRPRETE",
      sinonimos: "Intérprete de LSV",
      categoria: "PROFESIONES",
      descripcion: "Los índices de ambas manos giran uno alrededor del otro, mostrando el traslado del mensaje entre dos lenguas.",
      url_video: "",
      url_imagen: "",
      acuniada_recientemente: false,
      fecha_acuniada: null,
      fuente: "Datos de ejemplo"
    },
    {
      id: "demo-senia-10",
      palabra: "COMUNIDAD SORDA",
      sinonimos: "Pueblo sordo",
      categoria: "COMUNITARIA",
      descripcion: "Ambas manos en «S» se mueven en círculo frente al pecho, expresando el colectivo y la identidad compartida.",
      url_video: "",
      url_imagen: "",
      acuniada_recientemente: true,
      fecha_acuniada: "2025-09-01",
      fuente: "Seña acuñada recientemente — datos de ejemplo"
    }
  ],

  censo_egresados: [
    { id: "demo-c1", nombres: "María Gabriela", apellidos: "Pérez González", universidad: "Universidad Central de Venezuela", titulo_egreso: "Licenciada en Educación", categoria_egreso: "LICENCIADO", nivel: "PREGRADO", anio_graduacion: 2015, estado: "Distrito Capital", anios_experiencia: 9, telefono: "0414-0000000", email: "ejemplo1@correo.com", ha_realizado_investigacion: true, autoriza_publicar_nombre: true },
    { id: "demo-c2", nombres: "José Antonio", apellidos: "Rodríguez Silva", universidad: "Universidad del Zulia", titulo_egreso: "Licenciado en Letras", categoria_egreso: "LICENCIADO", nivel: "PREGRADO", anio_graduacion: 2018, estado: "Zulia", anios_experiencia: 6, telefono: "0424-0000000", email: "ejemplo2@correo.com", ha_realizado_investigacion: true, autoriza_publicar_nombre: true },
    { id: "demo-c3", nombres: "Andreína", apellidos: "Martínez Rojas", universidad: "Universidad Pedagógica Experimental Libertador", titulo_egreso: "TSU en Educación Integral", categoria_egreso: "TSU", nivel: "PREGRADO", anio_graduacion: 2019, estado: "Miranda", anios_experiencia: 5, telefono: "0412-0000000", email: "ejemplo3@correo.com", ha_realizado_investigacion: false, autoriza_publicar_nombre: false },
    { id: "demo-c4", nombres: "Luis Miguel", apellidos: "Fernández Díaz", universidad: "Universidad de Carabobo", titulo_egreso: "Magíster en Educación", categoria_egreso: "MAESTRIA", nivel: "POSTGRADO", anio_graduacion: 2021, estado: "Carabobo", anios_experiencia: 11, telefono: "0416-0000000", email: "ejemplo4@correo.com", ha_realizado_investigacion: true, autoriza_publicar_nombre: true },
    { id: "demo-c5", nombres: "Carmen Rosa", apellidos: "Hernández Lara", universidad: "Universidad de Los Andes", titulo_egreso: "Doctora en Ciencias Humanas", categoria_egreso: "DOCTORADO", nivel: "POSTGRADO", anio_graduacion: 2022, estado: "Mérida", anios_experiencia: 15, telefono: "0426-0000000", email: "ejemplo5@correo.com", ha_realizado_investigacion: true, autoriza_publicar_nombre: true },
    { id: "demo-c6", nombres: "Pedro José", apellidos: "Bermúdez Ávila", universidad: "Universidad Rafael Belloso Chacín", titulo_egreso: "Ingeniero en Informática", categoria_egreso: "LICENCIADO", nivel: "PREGRADO", anio_graduacion: 2020, estado: "Zulia", anios_experiencia: 4, telefono: "0414-0000000", email: "ejemplo6@correo.com", ha_realizado_investigacion: false, autoriza_publicar_nombre: false },
    { id: "demo-c7", nombres: "Yolimar", apellidos: "Castillo Mendoza", universidad: "Universidad Nacional Experimental Simón Rodríguez", titulo_egreso: "Licenciada en Administración", categoria_egreso: "LICENCIADO", nivel: "PREGRADO", anio_graduacion: 2017, estado: "Aragua", anios_experiencia: 7, telefono: "0424-0000000", email: "ejemplo7@correo.com", ha_realizado_investigacion: false, autoriza_publicar_nombre: true },
    { id: "demo-c8", nombres: "Jesús Manuel", apellidos: "Torrealba Pinto", universidad: "Universidad Centroccidental Lisandro Alvarado", titulo_egreso: "Especialista en Gerencia Educativa", categoria_egreso: "ESPECIALIZACION", nivel: "POSTGRADO", anio_graduacion: 2023, estado: "Lara", anios_experiencia: 8, telefono: "0412-0000000", email: "ejemplo8@correo.com", ha_realizado_investigacion: true, autoriza_publicar_nombre: false },
    { id: "demo-c9", nombres: "Rosangel", apellidos: "Villalobos Camacho", universidad: "Universidad del Zulia", titulo_egreso: "Licenciada en Trabajo Social", categoria_egreso: "LICENCIADO", nivel: "PREGRADO", anio_graduacion: 2016, estado: "Zulia", anios_experiencia: 8, telefono: "0416-0000000", email: "ejemplo9@correo.com", ha_realizado_investigacion: true, autoriza_publicar_nombre: true },
    { id: "demo-c10", nombres: "Carlos Eduardo", apellidos: "Navarro Gil", universidad: "Universidad Central de Venezuela", titulo_egreso: "Magíster en Lingüística", categoria_egreso: "MAESTRIA", nivel: "POSTGRADO", anio_graduacion: 2024, estado: "Distrito Capital", anios_experiencia: 3, telefono: "0426-0000000", email: "ejemplo10@correo.com", ha_realizado_investigacion: true, autoriza_publicar_nombre: true },
    { id: "demo-c11", nombres: "Diana Carolina", apellidos: "Fuentes Romero", universidad: "Universidad de Oriente", titulo_egreso: "Licenciada en Comunicación Social", categoria_egreso: "LICENCIADO", nivel: "PREGRADO", anio_graduacion: 2019, estado: "Sucre", anios_experiencia: 5, telefono: "0414-0000000", email: "ejemplo11@correo.com", ha_realizado_investigacion: false, autoriza_publicar_nombre: false },
    { id: "demo-c12", nombres: "Alexander", apellidos: "Gutiérrez Paredes", universidad: "Universidad Nacional Abierta", titulo_egreso: "TSU en Educación", categoria_egreso: "TSU", nivel: "PREGRADO", anio_graduacion: 2021, estado: "Bolívar", anios_experiencia: 4, telefono: "0424-0000000", email: "ejemplo12@correo.com", ha_realizado_investigacion: false, autoriza_publicar_nombre: true }
  ],

  titulos_adicionales: [
    { id: "demo-t1", censo_id: "demo-c4", titulo: "Diplomado en Lengua de Señas Venezolana", universidad: "Universidad de Carabobo", anio_graduacion: 2022, categoria_egreso: null, nivel: null },
    { id: "demo-t2", censo_id: "demo-c5", titulo: "Especialización en Educación Especial", universidad: "Universidad de Los Andes", anio_graduacion: 2018, categoria_egreso: "ESPECIALIZACION", nivel: "POSTGRADO" }
  ],

  configuracion_sitio: [
    { clave: "correo_recepcion", valor: "cavpslepee@gmail.com" },
    { clave: "autor_sitio", valor: "Dr. Javier Ramírez González" },
    { clave: "texto_objetivo", valor: "Visibilizar los trabajos realizados por personas sordas a nivel de educación universitaria y determinar la cantidad de egresados en la actualidad." }
  ]
};
