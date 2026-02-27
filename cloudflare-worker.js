/**
 * Cloudflare Worker: AI-прокси для сайта Даши Художник
 *
 * Использует Groq (бесплатный, быстрый, Llama 3.3 70B).
 * Установи переменную окружения GROQ_KEY в настройках Worker.
 * Получить бесплатный ключ: https://console.groq.com → API Keys → Create
 */

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "POST") {
      return new Response("Only POST allowed", { status: 405, headers: cors });
    }

    const key = env.GROQ_KEY;
    if (!key) {
      return new Response(
        JSON.stringify({ error: { message: "GROQ_KEY not set. Add it in Cloudflare Worker → Settings → Variables", code: 503 } }),
        { status: 503, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    let body;
    try { body = await request.text(); }
    catch {
      return new Response(
        JSON.stringify({ error: { message: "Failed to read request body", code: 400 } }),
        { status: 400, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    let parsed;
    try { parsed = JSON.parse(body); }
    catch {
      return new Response(
        JSON.stringify({ error: { message: "Invalid JSON", code: 400 } }),
        { status: 400, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    const groqBody = JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: parsed.messages || [],
      temperature: parsed.temperature || 0.8,
      max_tokens: parsed.max_tokens || 800,
    });

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + key,
        },
        body: groqBody,
      });
      const text = await res.text();
      return new Response(text, {
        status: res.status,
        headers: { "Content-Type": "application/json", ...cors },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: { message: "Groq error: " + err.message, code: 502 } }),
        { status: 502, headers: { "Content-Type": "application/json", ...cors } }
      );
    }
  },
};
