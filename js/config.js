/* =====================================================================
   CONFIGURACIÓN — ESTUDIOS SORDOS DE VENEZUELA
   =====================================================================
   ÚNICO ARCHIVO QUE DEBES EDITAR PARA CONECTAR LA BASE DE DATOS.

   1. Entra a https://supabase.com -> tu proyecto
   2. Menú lateral: "Project Settings" (el ícono de engranaje)
   3. Opción "API" (o "Data API")
   4. Copia "Project URL"           -> pégala en SUPABASE_URL
   5. Copia la clave "anon public"  -> pégala en SUPABASE_ANON_KEY

   Mientras ambos valores estén vacíos el sitio funciona en MODO
   DEMOSTRACIÓN con datos locales (js/datos-demo.js), para que puedas
   ver y probar todas las páginas sin necesidad de base de datos.
   ===================================================================== */

window.CONFIG = {
  SUPABASE_URL: "https://gscvmupzgfavgtpkmvxp.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_tW-I396GngXVM7lUlYCu3Q_2-6vb12c",

  /* Correo oficial para recibir trabajos de investigación en PDF */
  CORREO_RECEPCION: "cavpslepee@gmail.com",

  /* Autoría del sitio */
  AUTOR_SITIO: "Dr. Javier Ramírez González",
  NOMBRE_SITIO: "Estudios Sordos de Venezuela",
  ANIO_FUNDACION: 2026,

  /* Bucket de Supabase Storage donde se guardan los PDF */
  BUCKET_PDF: "investigaciones",

  /* Categorías de las investigaciones (deben coincidir con el ENUM del SQL) */
  CATEGORIAS_INVESTIGACION: [
    { valor: "EDUCACION",   etiqueta: "Educación" },
    { valor: "LINGUISTICA", etiqueta: "Lingüística" },
    { valor: "DEPORTE",     etiqueta: "Deporte" },
    { valor: "SOCIAL",      etiqueta: "Social" },
    { valor: "CULTURAL",    etiqueta: "Cultural" },
    { valor: "COMUNITARIA", etiqueta: "Comunitaria" },
    { valor: "POLITICA",    etiqueta: "Política" },
    { valor: "ARTE",        etiqueta: "Arte" },
    { valor: "BIOGRAFIA",   etiqueta: "Biografía de personas sordas destacadas" }
  ],

  ESTADOS_INVESTIGACION: [
    { valor: "PENDIENTE", etiqueta: "Pendiente de revisión" },
    { valor: "APROBADO",  etiqueta: "Aprobado" },
    { valor: "PUBLICADO", etiqueta: "Publicado" },
    { valor: "RECHAZADO", etiqueta: "Rechazado" }
  ],

  /* Categorías de egreso del censo */
  CATEGORIAS_EGRESO: [
    { valor: "TSU",            etiqueta: "TSU (Técnico Superior Universitario)", nivel: "PREGRADO" },
    { valor: "LICENCIADO",     etiqueta: "Licenciado / Ingeniero",               nivel: "PREGRADO" },
    { valor: "ESPECIALIZACION",etiqueta: "Especialización",                      nivel: "POSTGRADO" },
    { valor: "MAESTRIA",       etiqueta: "Maestría",                             nivel: "POSTGRADO" },
    { valor: "DOCTORADO",      etiqueta: "Doctorado",                            nivel: "POSTGRADO" }
  ],

  /* Estados de Venezuela para el formulario del censo */
  ESTADOS_VENEZUELA: [
    "Amazonas", "Anzoátegui", "Apure", "Aragua", "Barinas", "Bolívar",
    "Carabobo", "Cojedes", "Delta Amacuro", "Dependencias Federales",
    "Distrito Capital", "Falcón", "Guárico", "La Guaira", "Lara", "Mérida",
    "Miranda", "Monagas", "Nueva Esparta", "Portuguesa", "Sucre", "Táchira",
    "Trujillo", "Yaracuy", "Zulia", "Resido en el exterior"
  ]
};
