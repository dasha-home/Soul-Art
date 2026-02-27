/**
 * Cloudflare Worker: прокси для Gemini API
 * Сайт Даши Художник — обход блокировок в России
 *
 * КАК ИСПОЛЬЗОВАТЬ:
 * 1. Зайди на https://dash.cloudflare.com/sign-up (бесплатно)
 * 2. Войди → "Workers & Pages" → "Create" → "Create Worker"
 * 3. Дай имя: guardian-proxy
 * 4. Замени весь код в редакторе на этот файл
 * 5. Нажми "Deploy"
 * 6. Перейди в Settings → Variables and Secrets → Add
 *    Имя переменной: GEMINI_KEY
 *    Значение: AIzaSyA4PG8QIYtgw1ZnpBUuxF00-dr6npDXQEw
 *    Тип: Secret (зашифровано)
 * 7. Скопируй URL Worker (вида https://guardian-proxy.ИМЯ.workers.dev)
 * 8. Сообщи URL — обновим guardian.js в одну строку
 */

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    /* Preflight */
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

    const geminiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + key;

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
