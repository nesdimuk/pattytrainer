import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Eres un asistente experto en antropometría deportiva.
Tu tarea es extraer datos de evaluaciones antropométricas de cualquier fuente (imagen, texto, tabla)
y devolverlos en formato JSON estructurado.

Devuelve SIEMPRE un array JSON con una o más evaluaciones. Cada evaluación tiene esta estructura:
{
  "fecha": "YYYY-MM-DD",          // fecha de la evaluación (null si no se encuentra)
  "nombre_alumna": "...",          // nombre si aparece (null si no)
  "sexo": "femenino|masculino",    // (null si no se encuentra)
  "edad": number,                  // en años (null si no)
  "peso": number,                  // kg (null si no)
  "talla": number,                 // cm (null si no)
  "triceps": number,               // mm (null si no)
  "subescapular": number,          // mm (null si no)
  "supraespinal": number,          // mm (null si no)
  "abdominal": number,             // mm (null si no)
  "muslo": number,                 // mm (null si no)
  "pantorrilla": number,           // mm (null si no)
  "biceps": number,                // mm, opcional (null si no)
  "cresta_iliaca": number,         // mm, opcional (null si no)
  "p_brazo_rel": number,           // perímetro brazo relajado cm (null si no)
  "p_brazo_flex": number,          // perímetro brazo flexionado cm (null si no)
  "p_cintura": number,             // cm (null si no)
  "p_cadera": number,              // cm (null si no)
  "p_pantorrilla": number,         // cm (null si no)
  "d_humero": number,              // diámetro húmero cm (null si no)
  "d_femur": number,               // diámetro fémur cm (null si no)
  "d_biestiloideo": number,        // diámetro biestiloideo cm (null si no)
  "notas": "...",                  // observaciones libres (null si no)
  "pct_grasa": number,             // % grasa si ya está calculado (null si no)
  "suma_6": number                 // suma 6 pliegues si ya está calculado (null si no)
}

Responde SOLO con el JSON, sin texto adicional, sin markdown, sin explicaciones.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json();
    const { tipo, contenido } = body;
    // tipo: "texto" | "imagen_base64"
    // contenido: string de texto o base64 de imagen

    let messages: unknown[];

    if (tipo === "imagen_base64") {
      messages = [{
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${contenido}` },
          },
          {
            type: "text",
            text: "Extrae todos los datos antropométricos que veas en esta imagen. Si hay varias evaluaciones, inclúyelas todas en el array.",
          },
        ],
      }];
    } else {
      messages = [{
        role: "user",
        content: `Extrae los datos antropométricos del siguiente texto:\n\n${contenido}`,
      }];
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        temperature: 0,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: err }), { status: 500, headers: cors });
    }

    const data = await res.json();
    const raw = data.choices[0].message.content.trim();

    // Limpiar posible markdown
    const clean = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    const evaluaciones = JSON.parse(clean);

    return new Response(JSON.stringify({ evaluaciones }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
