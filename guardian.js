/**
 * Комната Хранителя — Даша Художник
 * Чат с Gemini 1.5 Flash через REST API.
 */
(function () {
  "use strict";

  var API_KEY = "AIzaSyA4PG8QIYtgw1ZnpBUuxF00-dr6npDXQEw";
  var API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

  /* Контекст: содержание сайта, которое Хранитель «знает» */
  var SITE_CONTEXT =
    "Ты — Хранитель, мудрый и добрый помощник сайта «Даша Художник». " +
    "Сайт создан художницей Дашей: там есть галерея картин, рассказы и страница «О Даше». " +
    "Рассказы на сайте: «Мир глазами Даши» — о том, как Даша рисует природу и ловит живые мгновения; " +
    "«Спящие друзья» — тёплая история о щенке и котёнке, уснувших на берегу озера. " +
    "Сайт переведён на 9 языков: русский, английский, японский, итальянский, китайский, испанский, немецкий, французский, иврит. " +
    "Ты помогаешь Даше: можешь обсудить её рисунки, рассказы, творческие планы, рецепты, перевести или адаптировать текст для детей. " +
    "Отвечай тепло, искренне, на языке собеседника. Будь краток и по существу.";

  var SYSTEM_CHILDREN =
    SITE_CONTEXT +
    " ВАЖНО: сейчас режим «Для детей» — говори очень просто, короткими предложениями, дружелюбно, без сложных слов.";

  /* Состояние */
  var history = []; /* [{role:"user"|"model", text:"..."}] */
  var isLoading = false;

  /* DOM */
  var messagesEl = document.getElementById("guardian-messages");
  var inputEl = document.getElementById("guardian-input");
  var sendBtn = document.getElementById("guardian-send");
  var chatEl = document.getElementById("guardian-chat");

  if (!messagesEl || !inputEl || !sendBtn) return;

  /* ─────────── UI-хелперы ─────────── */

  function getMode() {
    var btn = document.querySelector(".guardian-mode__btn--active");
    return btn ? btn.getAttribute("data-mode") : "assistant";
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function makeMsgEl(role, text) {
    var msg = document.createElement("div");
    msg.className = "guardian-msg guardian-msg--" + (role === "user" ? "user" : "bot");
    if (role !== "user") msg.setAttribute("aria-live", "polite");

    var avatar = document.createElement("div");
    avatar.className = "guardian-msg__avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = role === "user" ? "✎" : "✦";

    var bubble = document.createElement("div");
    bubble.className = "guardian-msg__bubble";

    var p = document.createElement("p");
    p.className = "guardian-msg__text";
    p.textContent = text;

    bubble.appendChild(p);
    msg.appendChild(avatar);
    msg.appendChild(bubble);
    return msg;
  }

  function appendMessage(role, text) {
    var el = makeMsgEl(role, text);
    messagesEl.appendChild(el);
    scrollToBottom();
    return el;
  }

  function showTyping() {
    var msg = document.createElement("div");
    msg.id = "guardian-typing";
    msg.className = "guardian-msg guardian-msg--bot guardian-msg--typing";

    var avatar = document.createElement("div");
    avatar.className = "guardian-msg__avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = "✦";

    var bubble = document.createElement("div");
    bubble.className = "guardian-msg__bubble";

    var p = document.createElement("p");
    p.className = "guardian-msg__text";
    p.textContent = "Хранитель думает";

    bubble.appendChild(p);
    msg.appendChild(avatar);
    msg.appendChild(bubble);
    messagesEl.appendChild(msg);
    scrollToBottom();
  }

  function hideTyping() {
    var el = document.getElementById("guardian-typing");
    if (el) el.remove();
  }

  function showError(msg) {
    var old = document.getElementById("guardian-error");
    if (old) old.remove();
    var el = document.createElement("p");
    el.id = "guardian-error";
    el.className = "guardian-chat__error";
    el.textContent = msg;
    var hint = chatEl && chatEl.querySelector(".guardian-chat__hint");
    if (hint) {
      hint.parentNode.insertBefore(el, hint.nextSibling);
    } else if (chatEl) {
      chatEl.appendChild(el);
    }
    setTimeout(function () { if (el.parentNode) el.remove(); }, 7000);
  }

  /* ─────────── API ─────────── */

  function buildRequest(userText) {
    var sys = getMode() === "children" ? SYSTEM_CHILDREN : SITE_CONTEXT;
    var contents = [];

    /* История разговора */
    for (var i = 0; i < history.length; i++) {
      contents.push({
        role: history[i].role === "model" ? "model" : "user",
        parts: [{ text: history[i].text }]
      });
    }
    /* Новое сообщение */
    contents.push({ role: "user", parts: [{ text: userText }] });

    return {
      systemInstruction: { parts: [{ text: sys }] },
      contents: contents,
      generationConfig: {
        temperature: 0.75,
        maxOutputTokens: 1024,
        topP: 0.95
      }
    };
  }

  function callGemini(userText, onSuccess, onError) {
    var url = API_URL + "?key=" + encodeURIComponent(API_KEY);
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildRequest(userText))
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.error) {
          var code = data.error.code;
          var detail = data.error.message || "Ошибка API";
          if (code === 400) detail = "Запрос не принят API (400). Попробуй ещё раз.";
          if (code === 403) detail = "Ключ API не действует или нет доступа (403). Проверь ключ.";
          if (code === 429) detail = "Слишком много запросов. Подожди минуту и попробуй снова.";
          onError(detail);
          return;
        }
        var text = "";
        try {
          text = data.candidates[0].content.parts[0].text || "";
        } catch (e) {
          onError("Хранитель не смог ответить. Попробуй ещё раз.");
          return;
        }
        onSuccess(text);
      })
      .catch(function (err) {
        onError("Нет связи с Хранителем: " + (err.message || "сетевая ошибка"));
      });
  }

  /* ─────────── Основная логика ─────────── */

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

  /* ─────────── Обработчики ─────────── */

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
})();
