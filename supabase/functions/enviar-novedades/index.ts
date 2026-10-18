/* =====================================================================
   EDGE FUNCTION: enviar-novedades
   Envía el correo masivo a los censados desde el propio Gmail del sitio
   (SMTP con contraseña de aplicación). Así no se depende de proveedores
   externos de correo.

   Despliegue: panel de Supabase → Edge Functions → crear función
   "enviar-novedades" → pegar este código → Deploy.
   Los secretos de Gmail NO van aquí: se guardan en la tabla
   secretos_sitio (claves gmail_usuario y gmail_clave_app), igual que el
   resto de la configuración del sitio.
   ===================================================================== */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "https://esm.sh/nodemailer@6.9.16";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const bearer = (req.headers.get("Authorization") ?? "").replace(
      /^Bearer\s+/i,
      "",
    );
    if (!bearer) {
      throw new Error(
        "Solo una sesión de administrador puede enviar correos",
      );
    }

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
    const { data: sesion, error: errorSesion } = await admin.auth.getUser(
      bearer,
    );
    if (errorSesion || !sesion.user) {
      throw new Error(
        "Solo una sesión de administrador puede enviar correos",
      );
    }

    const {
      asunto,
      cuerpo,
      prueba_a: pruebaA,
      adjunto,
    } = await req.json();
    if (!String(asunto ?? "").trim() || !String(cuerpo ?? "").trim()) {
      throw new Error(
        "El asunto y el cuerpo del correo no pueden quedar vacíos",
      );
    }

    /* Adjunto opcional: una imagen en base64 que llega desde el panel. */
    let attachments: {
      filename: string;
      content: string;
      contentType: string;
      encoding: string;
    }[] = [];
    if (adjunto && String(adjunto.base64 ?? "").trim()) {
      const tipo = String(adjunto.tipo ?? "");
      if (!/^image\/(png|jpe?g|gif|webp)$/i.test(tipo)) {
        throw new Error("El adjunto debe ser una imagen PNG, JPG, GIF o WEBP");
      }
      const base64 = String(adjunto.base64).replace(/^data:[^,]*,/, "");
      if (base64.length > 6 * 1024 * 1024) {
        throw new Error("La imagen adjunta es demasiado pesada (máximo 4 MB)");
      }
      attachments = [{
        filename:
          String(adjunto.nombre ?? "imagen.jpg").replace(/[^a-zA-Z0-9._-]/g, "_"),
        content: base64,
        contentType: tipo,
        encoding: "base64",
      }];
    }

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

    let correos: string[];
    if (String(pruebaA ?? "").trim()) {
      correos = [String(pruebaA).trim().toLowerCase()];
    } else {
      const { data: filas } = await admin
        .from("censo_egresados")
        .select("email");
      const unicos = new Set<string>();
      for (const f of filas ?? []) {
        const c = String(f.email ?? "").trim().toLowerCase();
        if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c)) unicos.add(c);
      }
      correos = [...unicos];
    }
    if (correos.length === 0) {
      throw new Error("No hay correos válidos a quienes enviar");
    }

    const html =
      `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55">` +
      escaparHtml(String(cuerpo)).replace(/\n/g, "<br>") +
      `<br><br><span style="color:#666;font-size:13px">` +
      escaparHtml(nombreRemitente) +
      ` · Respondiendo a este correo contactas directamente al equipo del sitio.</span></div>`;

    const transporte = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: usuario, pass: claveApp },
    });

    /* Un correo por persona: nadie ve las direcciones de los demás. */
    let enviados = 0;
    const fallos: string[] = [];
    for (const destino of correos) {
      try {
        await transporte.sendMail({
          from: `"${nombreRemitente.replace(/"/g, "")}" <${usuario}>`,
          to: destino,
          subject: String(asunto),
          html,
          attachments,
        });
        enviados++;
      } catch (_e) {
        fallos.push(destino);
      }
    }

    return new Response(
      JSON.stringify({
        destinatarios: correos.length,
        enviados,
        fallos,
        prueba: !!String(pruebaA ?? "").trim(),
      }),
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
