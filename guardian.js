/**
 * Комната Хранителя — мудрый самурай у костра
 * Gemini 1.5 Flash | 4 режима: разговор, языки, рисование, душа
 *
 * ПРОКСИ (Cloudflare Worker) — для обхода блокировок в России:
 * Установите PROXY_URL после деплоя Worker на Cloudflare.
 * Пока пусто — работает напрямую через Google.
 */
(function () {
  "use strict";

  /* ── Настройки подключения ── */
  var API_KEY   = "AIzaSyCyRjWOzoH9o9OsknHh8sCxAf5hlfLSGiw";
  var API_PATH  = "/v1beta/models/gemini-2.0-flash:generateContent";
  var API_URL   = "https://generativelanguage.googleapis.com" + API_PATH;
  /* Cloudflare Worker — прокси для обхода блокировок в России */
  var PROXY_URL = "https://guardian-proxy.qerevv.workers.dev";

  /* ═══════ ЛИЧНОСТЬ ХРАНИТЕЛЯ ═══════ */

  var BASE =
    "Ты — Хранитель (守護者), мудрый японский самурай и добрый наставник молодой художницы Даши. " +
    "Даша — живёт в России, рисует картины, увлечена языками. " +
    "Сайт «Даша Художник» — её творческое пространство. " +
    "На сайте есть рассказы: «Мир глазами Даши» (о рисовании природы) " +
    "и «Спящие друзья» (тёплая история о щенке и котёнке). " +
    "Ты говоришь на языке собеседника. " +
    "Изредка вплетаешь японские слова с переводом в скобках — это твоя натура. " +
    "Ты немногословен, точен, тёпел. Отвечаешь по существу, с достоинством.";

  var PROMPTS = {
    assistant:
      BASE +
      " РЕЖИМ — Свободный разговор. " +
      "Ты близкий собеседник: интересуешься жизнью Даши, её мечтами и планами. " +
      "Поддерживаешь, вдохновляешь, шутишь когда уместно. " +
      "Говоришь как умный, тёплый старший друг, который всегда рядом.",

    language:
      BASE +
      " РЕЖИМ — Репетитор по языкам. " +
      "Ты блестящий полиглот: знаешь японский, английский, русский и другие языки глубоко. " +
      "Помогаешь Даше учить языки: объясняешь грамматику через яркие образы, " +
      "приводишь примеры из жизни, мягко исправляешь ошибки, хвалишь за прогресс. " +
      "Даёшь мини-задания и проверяешь. Показываешь интересные параллели между языками. " +
      "Учебный процесс делаешь живым и радостным — никакой скуки.",

    art:
      BASE +
      " РЕЖИМ — Наставник по рисованию. " +
      "Ты глубоко чувствуешь живопись: цвет, свет, тень, композицию, настроение. " +
      "Помогаешь Даше расти как художнице: обсуждаешь техники акварели и масла, " +
      "помогаешь найти свой стиль, вдохновляешь образами природы и японской эстетики. " +
      "Говоришь образно и поэтично. Умеешь описать картину словами так, что она оживает. " +
      "Эстетика ваби-саби (красота несовершенства) — твой философский ориентир.",

    psychology:
      BASE +
      " РЕЖИМ — Мудрый слушатель. " +
      "Ты умеешь принимать чувства человека без осуждения и оценок. " +
      "Помогаешь Даше разобраться в себе: задаёшь тихие вопросы, отражаешь её слова, " +
      "помогаешь найти опору и спокойствие внутри. " +
      "Не ставишь диагнозов, не советуешь лекарства. " +
      "Говоришь как мудрый старший, который просто рядом — без спешки, без осуждения. " +
      "Иногда делишься самурайской мудростью о стойкости, принятии и пути (Do — 道).",
  };

  /* ═══════ СОСТОЯНИЕ ═══════ */

  var history = [];
  var isLoading = false;

  var messagesEl = document.getElementById("guardian-messages");
  var inputEl    = document.getElementById("guardian-input");
  var sendBtn    = document.getElementById("guardian-send");

  if (!messagesEl || !inputEl || !sendBtn) return;

  /* ═══════ УТИЛИТЫ ═══════ */

  function getMode() {
    var btn = document.querySelector(".guardian-mode__btn--active");
    return btn ? (btn.getAttribute("data-mode") || "assistant") : "assistant";
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function appendMessage(role, text) {
    var msg = document.createElement("div");
    msg.className = "guardian-msg guardian-msg--" + (role === "user" ? "user" : "bot");

    var av = document.createElement("div");
    av.className = "guardian-msg__avatar";
    av.setAttribute("aria-hidden", "true");
    av.textContent = role === "user" ? "✎" : "✦";

    var bubble = document.createElement("div");
    bubble.className = "guardian-msg__bubble";

    var p = document.createElement("p");
    p.className = "guardian-msg__text";
    p.textContent = text;

    bubble.appendChild(p);
    msg.appendChild(av);
    msg.appendChild(bubble);
    messagesEl.appendChild(msg);
    scrollToBottom();
    return msg;
  }

  function showTyping() {
    var msg = document.createElement("div");
    msg.id = "guardian-typing";
    msg.className = "guardian-msg guardian-msg--bot guardian-msg--typing";

    var av = document.createElement("div");
    av.className = "guardian-msg__avatar";
    av.setAttribute("aria-hidden", "true");
    av.textContent = "✦";

    var bubble = document.createElement("div");
    bubble.className = "guardian-msg__bubble";

    var p = document.createElement("p");
    p.className = "guardian-msg__text";
    p.textContent = "Хранитель думает";

    bubble.appendChild(p);
    msg.appendChild(av);
    msg.appendChild(bubble);
    messagesEl.appendChild(msg);
    scrollToBottom();
  }

  function hideTyping() {
    var el = document.getElementById("guardian-typing");
    if (el) el.remove();
  }

  function showError(text) {
    var old = document.getElementById("guardian-error");
    if (old) old.remove();

    var p = document.createElement("p");
    p.id = "guardian-error";
    p.className = "guardian-chat__error";
    p.textContent = text;

    var hint = document.querySelector(".guardian-chat__hint");
    if (hint && hint.parentNode) {
      hint.parentNode.insertBefore(p, hint);
    } else {
      messagesEl.parentNode.appendChild(p);
    }

    setTimeout(function () { if (p.parentNode) p.remove(); }, 9000);
  }

  /* ═══════ GEMINI API ═══════ */

  function buildContents(userText) {
    var contents = [];
    for (var i = 0; i < history.length; i++) {
      contents.push({
        role: history[i].role === "model" ? "model" : "user",
        parts: [{ text: history[i].text }],
      });
    }
    contents.push({ role: "user", parts: [{ text: userText }] });
    return contents;
  }

  /* Разбираем ответ Gemini */
  function parseGeminiData(data, onSuccess, onError) {
    if (data.error) {
      var m = data.error.message || "Ошибка API";
      var c = data.error.code;
      if (c === 400) m = "Запрос не принят (400). Попробуйте переформулировать.";
      if (c === 403) m = "Ключ API не действует (403). Проверьте настройки.";
      if (c === 429) m = "Слишком много запросов (429). Подождите минуту.";
      if (c === 503) m = "Сервис временно недоступен. Попробуйте позже.";
      onError(m);
      return;
    }
    var text = "";
    try { text = data.candidates[0].content.parts[0].text || ""; }
    catch (e) { onError("Хранитель не смог ответить. Попробуйте ещё раз."); return; }
    if (!text.trim()) { onError("Хранитель молчит. Попробуйте спросить иначе."); return; }
    onSuccess(text);
  }

  /* Один HTTP-запрос к нужному URL */
  function doFetch(url, headers, bodyStr, onSuccess, onError) {
    fetch(url, { method: "POST", headers: headers, body: bodyStr })
      .then(function (res) { return res.json(); })
      .then(function (data) { parseGeminiData(data, onSuccess, onError); })
      .catch(function (err) {
        onError("__NETWORK__:" + (err && err.message ? err.message : "fetch error"));
      });
  }

  function callGemini(userText, onSuccess, onError) {
    var bodyObj = {
      systemInstruction: { parts: [{ text: PROMPTS[getMode()] || PROMPTS.assistant }] },
      contents: buildContents(userText),
      generationConfig: { temperature: 0.8, maxOutputTokens: 1024, topP: 0.95 },
    };
    var bodyStr = JSON.stringify(bodyObj);

    function tryDirect() {
      doFetch(
        API_URL + "?key=" + encodeURIComponent(API_KEY),
        { "Content-Type": "application/json" },
        bodyStr,
        onSuccess,
        function (err) {
          var m = err.indexOf("__NETWORK__") === 0
            ? "Нет связи с Хранителем. Если вы в России — возможно, Google заблокирован. Скоро появится прокси."
            : err;
          onError(m);
        }
      );
    }

    if (PROXY_URL) {
      /* Сначала пробуем прокси (Cloudflare Worker) — работает из России */
      doFetch(
        PROXY_URL + API_PATH,
        { "Content-Type": "application/json" },
        bodyStr,
        onSuccess,
        function (proxyErr) {
          /* При любой ошибке прокси — пробуем напрямую (резервный путь) */
          tryDirect();
        }
      );
    } else {
      tryDirect();
    }
  }

  /* ═══════ ОТПРАВКА ═══════ */

  function sendMessage() {
    if (isLoading) return;
    var text = (inputEl.value || "").trim();
    if (!text) return;

    inputEl.value = "";
    isLoading = true;
    sendBtn.disabled = true;

    appendMessage("user", text);
    history.push({ role: "user", text: text });

    showTyping();

    callGemini(
      text,
      function (reply) {
        hideTyping();
        isLoading = false;
        sendBtn.disabled = false;
        appendMessage("model", reply);
        history.push({ role: "model", text: reply });
      },
      function (errMsg) {
        hideTyping();
        isLoading = false;
        sendBtn.disabled = false;
        showError(errMsg);
      }
    );
  }

  /* ═══════ ОБРАБОТЧИКИ ═══════ */

  sendBtn.addEventListener("click", sendMessage);

  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  /* Переключение режима */
  var modeBtns = document.querySelectorAll(".guardian-mode__btn");
  modeBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      modeBtns.forEach(function (b) {
        b.classList.remove("guardian-mode__btn--active");
      });
      btn.classList.add("guardian-mode__btn--active");
    });
  });

  /* Плавное изменение высоты textarea */
  inputEl.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 120) + "px";
  });
})();
