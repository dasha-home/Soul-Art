/**
 * Cloudflare Worker: гибкий прокси для Gemini API
 * Сайт Даши Художник — обход блокировок в России
 *
 * Принимает любой запрос к /v1beta/models/...
 * и перенаправляет на generativelanguage.googleapis.com
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

    const key = env.GEMINI_KEY;
    if (!key) {
      return new Response(
        JSON.stringify({ error: { message: "GEMINI_KEY not set in Worker env", code: 500 } }),
        { status: 500, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    /* Берём путь из URL запроса: /v1beta/models/gemini-2.0-flash:generateContent */
    const url = new URL(request.url);
    const geminiUrl =
      "https://generativelanguage.googleapis.com" + url.pathname + "?key=" + key;

    let body;
    try {
      body = await request.text();
    } catch {
      return new Response(
        JSON.stringify({ error: { message: "Failed to read request body", code: 400 } }),
        { status: 400, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    try {
      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
      });
      const text = await res.text();
      return new Response(text, {
        status: res.status,
        headers: { "Content-Type": "application/json", ...cors },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: { message: "Proxy error: " + err.message, code: 502 } }),
        { status: 502, headers: { "Content-Type": "application/json", ...cors } }
      );
    }
  },
};
