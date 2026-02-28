/**
 * Cloudflare Worker: AI-прокси для сайта Даши Художник
 *
 * Маршруты:
 *   POST /v1/chat/completions  → Groq Llama 3.3 70B (текст)
 *   POST /v1/image             → Cloudflare AI (генерация картинок, бесплатно)
 *
 * Переменные окружения:
 *   GROQ_KEY — ключ от groq.com (для чата)
 *
 * AI Binding (для картинок):
 *   В настройках Worker → Settings → Bindings → Add → AI → имя: AI
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

    const url = new URL(request.url);

    /* ── Генерация картинок через Cloudflare AI ── */
    if (url.pathname === "/v1/image") {
      if (!env.AI) {
        return new Response(
          JSON.stringify({ error: "AI binding not configured. Add AI binding in Worker settings." }),
          { status: 503, headers: { "Content-Type": "application/json", ...cors } }
        );
      }
      let body;
      try { body = await request.json(); } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json", ...cors } });
      }
      const prompt = body.prompt || "beautiful landscape";
      try {
        const result = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", { prompt });
        /* Возвращаем PNG-бинарник напрямую */
        return new Response(result, {
          status: 200,
          headers: { "Content-Type": "image/png", ...cors }
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Image generation failed: " + err.message }),
          { status: 502, headers: { "Content-Type": "application/json", ...cors } }
        );
      }
    }

    /* ── Чат через Groq ── */
    if (request.method !== "POST") {
      return new Response("Only POST allowed", { status: 405, headers: cors });
    }

    const key = env.GROQ_KEY;
    if (!key) {
      return new Response(
        JSON.stringify({ error: { message: "GROQ_KEY not set in Worker Variables", code: 503 } }),
        { status: 503, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    let body;
    try { body = await request.text(); } catch {
      return new Response(JSON.stringify({ error: { message: "Failed to read body", code: 400 } }),
        { status: 400, headers: { "Content-Type": "application/json", ...cors } });
    }

    let parsed;
    try { parsed = JSON.parse(body); } catch {
      return new Response(JSON.stringify({ error: { message: "Invalid JSON", code: 400 } }),
        { status: 400, headers: { "Content-Type": "application/json", ...cors } });
    }

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: parsed.messages || [],
          temperature: parsed.temperature || 0.8,
          max_tokens: parsed.max_tokens || 800,
        }),
      });
      const text = await res.text();
      return new Response(text, { status: res.status, headers: { "Content-Type": "application/json", ...cors } });
    } catch (err) {
      return new Response(JSON.stringify({ error: { message: "Groq error: " + err.message, code: 502 } }),
        { status: 502, headers: { "Content-Type": "application/json", ...cors } });
    }
  },
};
