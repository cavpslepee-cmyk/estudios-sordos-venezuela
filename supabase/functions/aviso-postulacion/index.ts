/* =====================================================================
   EDGE FUNCTION: aviso-postulacion
   Correo automático tras registrar una postulación de ponencia al
   Seminario. Es PÚBLICA (sin sesión de administrador), porque la dispara
   el formulario público de seminario.html.

   Para que nadie abuse del endpoint, ANTES de enviar comprueba en la base
   (con la clave de servicio) que existe una inscripción con ese documento
   y que efectivamente postula una ponencia. Si no existe, no envía nada.

   Envía dos correos desde el Gmail del sitio (SMTP con contraseña de
   aplicación):
     1) Agradecimiento al postulante (su postulación será evaluada).
     2) Aviso interno a la comisión evaluadora (gmail_usuario).

   Despliegue: panel de Supabase → Edge Functions → crear función
   "aviso-postulacion" → pegar este código → Deploy.
   Los secretos de Gmail NO van aquí: se guardan en la tabla
   secretos_sitio (claves gmail_usuario y gmail_clave_app).
   ===================================================================== */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "https://esm.sh/nodemailer@6.9.16";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function escaparHtml(texto: string): string {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const ETIQUETAS_EJE: Record<string, string> = {
  DIDACTICA_L1_L2: "Didáctica y metodología de la LSV (L1 / L2)",
  SORDEDAD_GANANCIA:
    "Sordedad (Deafhood), Ganancia Sorda (Deaf Gain) y pedagogía crítica",
  MNM_SINTAXIS: "Marcadores no manuales, sintaxis espacial y gramática visual",
  TECNOLOGIA_IA:
    "Tecnología, inteligencia artificial y creación de material didáctico",
  SOCIOLINGUISTICA: "Sociolingüística, neologismos y registro formal en LSV",
};

function etiquetaEje(clave: string): string {
  return ETIQUETAS_EJE[String(clave ?? "").trim()] ?? String(clave ?? "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    const {
      documento,
      email,
      nombres_apellidos: nombres,
      titulo_ponencia: titulo,
      eje_tematico: eje,
    } = await req.json();

    const documentoNormal = String(documento ?? "")
      .toUpperCase()
      .replace(/[\s.]/g, "");
    const emailPostulante = String(email ?? "").trim().toLowerCase();
    if (!documentoNormal || !emailPostulante) {
      throw new Error("Faltan el documento o el correo del postulante");
    }

    /* Verificación anti-abuso: la inscripción debe existir en la base y
       haber postulado una ponencia. Así nadie puede usar este endpoint
       para enviar correos arbitrarios. */
    const { data: filas, error: errorConsulta } = await admin
      .from("seminario_inscripciones")
      .select("documento, email, rol, nombres_apellidos, titulo_ponencia, eje_tematico")
      .eq("rol", "PONENTE");
    if (errorConsulta) {
      throw new Error(
        "No se pudo verificar la inscripción. ¿Ejecutaste sql/seminario.sql?",
      );
    }
    const inscrita = (filas ?? []).find(
      (f) =>
        String(f.documento ?? "").toUpperCase().replace(/[\s.]/g, "") ===
          documentoNormal &&
        String(f.email ?? "").trim().toLowerCase() === emailPostulante,
    );
    if (!inscrita) {
      throw new Error("No encontramos una postulación registrada con esos datos");
    }

    const nombreSeguro = String(
      nombres ?? inscrita.nombres_apellidos ?? "participante",
    ).trim();
    const tituloSeguro = String(
      titulo ?? inscrita.titulo_ponencia ?? "",
    ).trim();
    const ejeSeguro = etiquetaEje(eje ?? inscrita.eje_tematico ?? "");

    const { data: secretos } = await admin
      .from("secretos_sitio")
      .select("clave, valor");
    const mapa: Record<string, string> = {};
    for (const s of secretos ?? []) mapa[s.clave] = s.valor;
    const usuario = String(mapa.gmail_usuario ?? "").trim();
    const claveApp = String(mapa.gmail_clave_app ?? "").replace(/\s+/g, "");
    if (!usuario || !claveApp) {
      throw new Error(
        "Faltan los datos de Gmail en secretos_sitio (claves gmail_usuario y gmail_clave_app)",
      );
    }
    const nombreRemitente = String(
      mapa.nombre_remitente ?? "Estudios Sordos de Venezuela",
    ).trim();
    const nombreSeminario = String(
      mapa.nombre_seminario ??
        "I Seminario Nacional de Actualización Pedagógica en LSV",
    ).trim();

    const transporte = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: usuario, pass: claveApp },
    });

    /* 1) Agradecimiento al postulante. */
    const asuntoPostulante =
      "Recibimos tu postulación · " + nombreSeminario;
    const htmlPostulante =
      `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1b2a30">` +
      `<p>Hola, <strong>${escaparHtml(nombreSeguro)}</strong>:</p>` +
      `<p>Gracias por postular tu ponencia al <strong>${
        escaparHtml(nombreSeminario)
      }</strong>. Confirmamos que la registramos correctamente.</p>` +
      (tituloSeguro
        ? `<p style="margin-left:12px;border-left:3px solid #2a9d8f;padding-left:12px">` +
          `<strong>Título:</strong> ${escaparHtml(tituloSeguro)}<br>` +
          (ejeSeguro
            ? `<strong>Eje temático:</strong> ${escaparHtml(ejeSeguro)}`
            : ``) +
          `</p>`
        : ``) +
      `<p>La <strong>comisión evaluadora</strong> revisará tu propuesta y, ` +
      `culminado ese proceso, te escribiremos a este mismo correo para ` +
      `comunicarte si tu ponencia fue seleccionada.</p>` +
      `<p>Agradecemos de nuevo tu interés en compartir tu investigación y tu ` +
      `experiencia pedagógica con la comunidad sorda venezolana.</p>` +
      `<br><span style="color:#666;font-size:13px">${
        escaparHtml(nombreRemitente)
      } · Respondiendo a este correo contactas directamente al equipo del sitio.</span></div>`;

    /* 2) Aviso interno a la comisión evaluadora. */
    const asuntoComision =
      "Nueva postulación de ponencia · " + nombreSeguro;
    const htmlComision =
      `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1b2a30">` +
      `<p>Se registró una nueva postulación al <strong>${
        escaparHtml(nombreSeminario)
      }</strong>:</p>` +
      `<ul>` +
      `<li><strong>Postulante:</strong> ${escaparHtml(nombreSeguro)}</li>` +
      `<li><strong>Documento:</strong> ${escaparHtml(documentoNormal)}</li>` +
      `<li><strong>Correo:</strong> ${escaparHtml(emailPostulante)}</li>` +
      (tituloSeguro
        ? `<li><strong>Título de la ponencia:</strong> ${
            escaparHtml(tituloSeguro)
          }</li>`
        : ``) +
      (ejeSeguro
        ? `<li><strong>Eje temático:</strong> ${escaparHtml(ejeSeguro)}</li>`
        : ``) +
      `</ul>` +
      `<p>La comisión evaluadora debe revisar la propuesta y, más adelante, ` +
      `emitir y comunicar el dictamen (seleccionada / no seleccionada). Ya se ` +
      `envió al postulante el agradecimiento automático.</p>` +
      `<br><span style="color:#666;font-size:13px">Aviso interno generado ` +
      `automáticamente por el sitio ${
        escaparHtml(nombreRemitente)
      }.</span></div>`;

    let enviados = 0;
    const fallos: string[] = [];

    try {
      await transporte.sendMail({
        from: `"${nombreRemitente.replace(/"/g, "")}" <${usuario}>`,
        to: emailPostulante,
        subject: asuntoPostulante,
        html: htmlPostulante,
      });
      enviados++;
    } catch (_e) {
      fallos.push(emailPostulante);
    }

    /* El aviso a la comisión va al propio Gmail del sitio. */
    try {
      await transporte.sendMail({
        from: `"${nombreRemitente.replace(/"/g, "")}" <${usuario}>`,
        to: usuario,
        subject: asuntoComision,
        html: htmlComision,
      });
      enviados++;
    } catch (_e) {
      fallos.push(usuario);
    }

    return new Response(
      JSON.stringify({ ok: true, enviados, fallos }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
