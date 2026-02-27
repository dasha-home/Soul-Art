/**
 * Комната Хранителя — мудрый самурай у костра
 * Pollinations.ai | 4 режима: разговор, языки, рисование, душа
 *
 * Никаких API-ключей — Pollinations.ai бесплатный и работает без регистрации.
 * Запросы идут напрямую из браузера, никакой прокси не нужен.
 */
(function () {
  "use strict";

  /* ── Настройки подключения ── */
  var AI_URL = "https://text.pollinations.ai/openai";

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

  /* ═══════ POLLINATIONS API (без ключей) ═══════ */

  function buildMessages(userText) {
    var messages = [
      { role: "system", content: PROMPTS[getMode()] || PROMPTS.assistant }
    ];
    for (var i = 0; i < history.length; i++) {
      messages.push({
        role: history[i].role === "model" ? "assistant" : "user",
        content: history[i].text,
      });
    }
    messages.push({ role: "user", content: userText });
    return messages;
  }

  function callAI(userText, onSuccess, onError) {
    var body = JSON.stringify({
      model: "openai-large",
      messages: buildMessages(userText),
      temperature: 0.8,
      max_tokens: 1024,
    });

    fetch(AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
    })
      .then(function (res) {
        if (!res.ok) {
          if (res.status === 429) throw new Error("Слишком много запросов. Подождите немного и попробуйте снова.");
          throw new Error("Сервис временно недоступен (" + res.status + "). Попробуйте позже.");
        }
        return res.json();
      })
      .then(function (data) {
        var text = "";
        try { text = data.choices[0].message.content || ""; } catch (e) {}
        if (!text.trim()) { onError("Хранитель молчит. Попробуйте спросить иначе."); return; }
        onSuccess(text);
      })
      .catch(function (err) {
        onError(err && err.message ? err.message : "Нет связи с Хранителем. Проверьте подключение к интернету.");
      });
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

    callAI(
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
