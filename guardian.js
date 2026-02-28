/**
 * Комната Хранителя — мудрый самурай у костра
 * Pollinations.ai | 4 режима: разговор, языки, рисование, душа
 *
 * Никаких API-ключей — Pollinations.ai бесплатный и работает без регистрации.
 * Запросы идут напрямую из браузера, никакой прокси не нужен.
 */
(function () {
  "use strict";

  /* ── Цепочка AI-сервисов (пробуем по порядку до первого успешного) ──
     1. Cloudflare Worker → Groq Llama 3.3 70B  (надёжный, если GROQ_KEY задан)
     2-5. Pollinations (бесплатный, без ключей, запасной)
  */
  var AI_CHAIN = [
    { url: "https://guardian-proxy.qerevv.workers.dev/v1/chat/completions", model: "llama-3.3-70b-versatile" },
    { url: "https://text.pollinations.ai/openai",             model: "openai-large" },
    { url: "https://text.pollinations.ai/openai",             model: "openai"       },
    { url: "https://gen.pollinations.ai/v1/chat/completions", model: "openai-large" },
    { url: "https://gen.pollinations.ai/v1/chat/completions", model: "openai-fast"  },
  ];

  /* ═══════ ЛИЧНОСТЬ ХРАНИТЕЛЯ ═══════ */

  var BASE =
    "Ты — Хранитель (守護者), мудрый японский самурай и добрый наставник молодой художницы Даши. " +
    "Даша — живёт в России, рисует картины, увлечена языками. " +
    "Сайт «Даша Художник» — её творческое пространство. " +
    "На сайте есть рассказы: «Мир глазами Даши» (о рисовании природы) " +
    "и «Спящие друзья» (тёплая история о щенке и котёнке). " +
    "Ты говоришь на языке собеседника. " +
    "Очень редко, только в особый момент, можешь добавить одно японское слово — пишешь его латиницей с переводом, например: 'ma (тишина)'. Без иероглифов. " +
    "Ты немногословен, точен, тёпел. Отвечаешь по существу, с достоинством.";

  /* ═══════ ДУЭТ ═══════ */
  var ARTIST_DUO =
    "Ты — Художник (絵師), молчаливый мастер кисти и цвета. " +
    "Рядом — Сэнсэй-лингвист и Психолог. Ты считаешь: один образ говорит больше тысячи слов. " +
    "Иногда мягко подтруниваешь над Сэнсэем (он слишком много болтает). " +
    "Отвечай кратко, образно, поэтично. Только в особый момент добавь японское слово латиницей с переводом — без иероглифов. " +
    "Когда уместно — предлагай нарисовать: скажи «нарисуй [описание]» и картина появится. " +
    "Даша живёт в России, рисует, мечтает о путешествиях. Говоришь по-русски.";

  var LINGUIST_DUO =
    "Ты — Сэнсэй (先生), блестящий знаток языков: русского, английского, японского. " +
    "Рядом — Художник и Психолог. Ты считаешь: точное слово — сильнее картины. " +
    "Иногда мягко споришь с Художником или подхватываешь его мысль с языковой точки зрения. " +
    "Всегда учишь естественно: вплетай English phrases with translation, японские слова с ромадзи. " +
    "Мягко поправляй ошибки Даши. Дружелюбен, с лёгким юмором. " +
    "Даша живёт в России, обожает иностранные языки. Говоришь по-русски, вставляя английский и японский.";

  /* ═══════ ПСИХОЛОГ ═══════ */
  var PSYCHOLOGIST_SOLO =
    "Ты — Психолог, тёплый и внимательный специалист по душевному состоянию. " +
    "Работаешь с молодой художницей Дашей, которая живёт в России. У неё бывают трудные моменты — тревога, тяжесть, одиночество. " +
    "Твой подход: принятие без осуждения, мягкие вопросы, отражение чувств. " +
    "Ты НЕ ставишь диагнозов, НЕ назначаешь лекарства. " +
    "Когда ситуация кажется серьёзной — мягко напоминаешь, что живой специалист рядом поможет лучше. " +
    "Говоришь тихо, медленно, без спешки. Каждое слово — с заботой. " +
    "Используешь техники КПТ и АСТ: называй чувства, возвращай к настоящему моменту, ищи ресурсы. " +
    "Никогда не обесцениваешь боль ('всё будет хорошо' — запрещено). " +
    "Начинаешь с вопроса: что сейчас происходит внутри? Говоришь по-русски.";

  var PSYCHOLOGIST_DUO =
    "Ты — Психолог, тёплый специалист по душевному состоянию. " +
    "Рядом — Художник и Сэнсэй, они уже высказались. Ты смотришь глубже — на чувства и состояние человека. " +
    "Подхватывай нить разговора: что за этими словами? Какие эмоции? " +
    "Говоришь коротко — один тёплый вопрос или одно наблюдение. " +
    "Никогда не обесцениваешь. Не советуешь лекарства. " +
    "Если видишь тяжесть — называй её бережно. Говоришь по-русски.";

  var PROMPTS = {
    assistant:
      BASE +
      " РЕЖИМ — Свободный разговор. " +
      "Ты близкий собеседник: интересуешься жизнью Даши, её мечтами и планами. " +
      "Поддерживаешь, вдохновляешь, шутишь когда уместно. " +
      "Говоришь как умный, тёплый старший друг, который всегда рядом. " +
      "Иногда (примерно раз в 4-5 своих сообщений) по собственному желанию рисуй для Даши что-нибудь красивое, " +
      "связанное с темой разговора или просто красивый образ — закат, цветок, пейзаж. " +
      "Делай это неожиданно: просто скажи в конце «нарисуй [описание на русском]» — и картина появится сама. " +
      "Иногда предупреди одной фразой: «Позволь нарисовать кое-что для тебя...» или «Я вижу образ — нарисую его.» " +
      "Никогда не называй заранее что именно нарисуешь — пусть будет сюрпризом. " +
      "Когда Даша говорит о желании рисовать, о творчестве, о том что хочет что-то создать своими руками — " +
      "мягко приглашай её в Творческую комнату: напиши в конце ответа «[ОТКРЫТЬ_МАСТЕРСКУЮ]» и она появится как кнопка.",

    language:
      BASE +
      " РЕЖИМ — Репетитор по языкам. " +
      "Ты блестящий полиглот: знаешь японский, английский, русский и другие языки глубоко. " +
      "Помогаешь Даше учить языки: объясняешь грамматику через яркие образы, " +
      "приводишь примеры из жизни, мягко исправляешь ошибки, хвалишь за прогресс. " +
      "Даёшь мини-задания и проверяешь. Показываешь интересные параллели между языками. " +
      "Учебный процесс делаешь живым и радостным — никакой скуки. " +
      "Иногда в конце сообщения рисуй иллюстрацию к теме урока — скажи «нарисуй [образ]».",

    art:
      BASE +
      " РЕЖИМ — Наставник по рисованию. " +
      "Ты глубоко чувствуешь живопись: цвет, свет, тень, композицию, настроение. " +
      "Помогаешь Даше расти как художнице: обсуждаешь техники акварели и масла, " +
      "помогаешь найти свой стиль, вдохновляешь образами природы и японской эстетики. " +
      "Говоришь образно и поэтично. Умеешь описать картину словами так, что она оживает. " +
      "Эстетика ваби-саби (красота несовершенства) — твой философский ориентир. " +
      "В этом режиме рисуй часто — почти каждое второе сообщение заканчивай «нарисуй [образ]». " +
      "Рисуй неожиданно, без предупреждения — пусть Даша видит образ и удивляется.",

    psychology: PSYCHOLOGIST_SOLO,
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

  function appendMessageStyled(role, text, extraClass, avatarSymbol) {
    var isUser = role === "user";
    var msg = document.createElement("div");
    msg.className = "guardian-msg guardian-msg--" + (isUser ? "user" : "bot") +
                    (extraClass ? " guardian-msg--" + extraClass : "");

    var av = document.createElement("div");
    av.className = "guardian-msg__avatar";
    av.setAttribute("aria-hidden", "true");
    av.textContent = avatarSymbol || (isUser ? "✎" : "✦");

    var bubble = document.createElement("div");
    bubble.className = "guardian-msg__bubble";

    var p = document.createElement("p");
    p.className = "guardian-msg__text";
    p.textContent = text.replace(/\[ОТКРЫТЬ_МАСТЕРСКУЮ\]/g, "").trim();

    bubble.appendChild(p);
    msg.appendChild(av);
    msg.appendChild(bubble);
    messagesEl.appendChild(msg);
    scrollToBottom();
    return msg;
  }

  function appendMessage(role, text) {
    return appendMessageStyled(role, text, null, role === "user" ? "✎" : "✦");
  }

  function showTyping(extraClass, symbol, label) {
    var msg = document.createElement("div");
    msg.id = "guardian-typing";
    msg.className = "guardian-msg guardian-msg--bot guardian-msg--typing" +
                    (extraClass ? " guardian-msg--" + extraClass : "");

    var av = document.createElement("div");
    av.className = "guardian-msg__avatar";
    av.setAttribute("aria-hidden", "true");
    av.textContent = symbol || "✦";

    var bubble = document.createElement("div");
    bubble.className = "guardian-msg__bubble";

    var p = document.createElement("p");
    p.className = "guardian-msg__text";
    p.textContent = label || "Хранитель думает";

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

  function buildMessages(systemPrompt, userText, partnerNote) {
    var messages = [{ role: "system", content: systemPrompt }];
    for (var i = 0; i < history.length; i++) {
      messages.push({
        role: history[i].role === "model" ? "assistant" : "user",
        content: history[i].text,
      });
    }
    var txt = (partnerNote)
      ? userText + "\n[Мой коллега только что сказал: «" + partnerNote + "»]"
      : userText;
    messages.push({ role: "user", content: txt });
    return messages;
  }

  function tryEndpoint(idx, messages, onSuccess, onFail) {
    if (idx >= AI_CHAIN.length) {
      onFail("Все серверы временно недоступны. Подождите минуту и попробуйте снова.");
      return;
    }
    var ep   = AI_CHAIN[idx];
    var body = JSON.stringify({
      model: ep.model,
      messages: messages,
      temperature: 0.82,
      max_tokens: 800,
    });
    fetch(ep.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body })
      .then(function (res) {
        /* 429 — лимит, 401/403 — авторизация: пробуем следующий */
        if (res.status === 429 || res.status === 401 || res.status === 403) {
          tryEndpoint(idx + 1, messages, onSuccess, onFail);
          return;
        }
        if (!res.ok) { tryEndpoint(idx + 1, messages, onSuccess, onFail); return; }
        return res.json();
      })
      .then(function (data) {
        if (!data) return;
        var text = "";
        try { text = data.choices[0].message.content || ""; } catch (e) {}
        if (!text.trim()) { tryEndpoint(idx + 1, messages, onSuccess, onFail); return; }
        onSuccess(text);
      })
      .catch(function () {
        tryEndpoint(idx + 1, messages, onSuccess, onFail);
      });
  }

  function callAIWithPrompt(systemPrompt, userText, partnerNote, onSuccess, onError) {
    tryEndpoint(0, buildMessages(systemPrompt, userText, partnerNote), onSuccess, onError);
  }

  function callAI(userText, onSuccess, onError) {
    callAIWithPrompt(PROMPTS[getMode()] || PROMPTS.assistant, userText, null, onSuccess, onError);
  }

  /* ═══════ ГОЛОС (Text-to-Speech) ═══════ */

  var voiceEnabled = localStorage.getItem("guardian_voice") === "on";
  var voiceToggleBtn = document.getElementById("guardian-voice-toggle");

  function updateVoiceUI() {
    if (!voiceToggleBtn) return;
    var icon = voiceToggleBtn.querySelector(".voice-icon");
    if (icon) icon.textContent = voiceEnabled ? "🔊" : "🔇";
    voiceToggleBtn.classList.toggle("guardian-chat__voice-btn--off", !voiceEnabled);
  }

  function cleanForSpeech(text) {
    return text
      /* убираем японские/китайские иероглифы и скобки с ними */
      .replace(/[\u3000-\u9fff\uf900-\ufaff\u3400-\u4dbf]+/g, "")
      /* убираем ромадзи в скобках типа (ma — пауза) */
      .replace(/\([^)]{1,40}\)/g, "")
      /* убираем символы типа ✦ 語 ♥ 守 */
      .replace(/[^\u0000-\u036f\u0400-\u04ff\u0020-\u007e]/g, "")
      /* убираем лишние пробелы */
      .replace(/\s{2,}/g, " ").trim()
      .slice(0, 600);
  }

  function speak(text) {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    var clean = cleanForSpeech(text);
    if (!clean) return;
    var utt = new SpeechSynthesisUtterance(clean);
    utt.lang = "ru-RU";
    utt.rate = 0.88;
    utt.pitch = 0.72;
    var trySpeak = function () {
      var voices = window.speechSynthesis.getVoices();
      /* Только хорошие голоса — лучше молчать чем говорить плохим */
      var pick = voices.find(function (v) { return /yuri/i.test(v.name); })
              || voices.find(function (v) { return /pavel|dmitri|aleksandr/i.test(v.name); })
              || voices.find(function (v) { return v.lang === "ru-RU"; })
              || voices.find(function (v) { return v.lang.startsWith("ru"); })
              || null;
      if (!pick) return;
      utt.voice = pick;
      window.speechSynthesis.speak(utt);
    };
    if (window.speechSynthesis.getVoices().length) {
      trySpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = trySpeak;
    }
  }

  if (voiceToggleBtn) {
    voiceToggleBtn.addEventListener("click", function () {
      voiceEnabled = !voiceEnabled;
      localStorage.setItem("guardian_voice", voiceEnabled ? "on" : "off");
      if (!voiceEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
      updateVoiceUI();
    });
    updateVoiceUI();
  }

  /* ═══════ КАРТИНКИ: по желанию Хранителя или только по просьбе ═══════ */

  var IMAGES_STORAGE_KEY = "guardian_images_mode";
  var imagesMode = localStorage.getItem(IMAGES_STORAGE_KEY) || "auto"; // "auto" | "request"
  var imagesToggleBtn = document.getElementById("guardian-images-toggle");

  function updateImagesUI() {
    if (!imagesToggleBtn) return;
    var label = imagesToggleBtn.querySelector(".images-label");
    if (label) label.textContent = imagesMode === "request" ? "по просьбе" : "по желанию";
    imagesToggleBtn.classList.toggle("guardian-chat__images-btn--request-only", imagesMode === "request");
    imagesToggleBtn.title = imagesMode === "request"
      ? "Картинки только когда ты просишь (нарисуй…, найди фото…). Нажми — разрешить Хранителю рисовать по желанию."
      : "Хранитель может сам предлагать картинки. Нажми — только когда ты просишь.";
  }

  if (imagesToggleBtn) {
    imagesToggleBtn.addEventListener("click", function () {
      imagesMode = imagesMode === "auto" ? "request" : "auto";
      localStorage.setItem(IMAGES_STORAGE_KEY, imagesMode);
      updateImagesUI();
    });
    updateImagesUI();
  }

  /* ═══════ МИКРОФОН (Speech-to-Text) ═══════ */

  var micBtn = document.getElementById("guardian-mic");
  var isRecording = false;
  var recognition = null;

  if (micBtn) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      recognition = new SR();
      recognition.lang = "ru-RU";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      function stopRecording() {
        isRecording = false;
        micBtn.classList.remove("guardian-chat__mic--recording");
      }

      recognition.onresult = function (e) {
        var transcript = e.results[0][0].transcript;
        inputEl.value = transcript;
        inputEl.style.height = "auto";
        inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + "px";
        stopRecording();
        sendMessage();
      };
      recognition.onerror = stopRecording;
      recognition.onend   = stopRecording;

      micBtn.addEventListener("click", function () {
        if (isLoading) return;
        if (isRecording) {
          recognition.stop();
        } else {
          isRecording = true;
          micBtn.classList.add("guardian-chat__mic--recording");
          try { recognition.start(); } catch (_) { stopRecording(); }
        }
      });
    } else {
      micBtn.style.display = "none";
    }
  }

  /* ═══════ ГЕНЕРАЦИЯ И ПОИСК КАРТИНОК ═══════ */

  var IMG_RE    = /(?:^|\s)(нарисуй мне|нарисуй|покажи картину|покажи мне картину|изобрази|создай картину|нарисуй картину)\s+/i;
  var FIND_RE   = /(?:^|\s)(найди фото|найди картинку|найди картину|покажи фото|найди изображение|поищи фото|поищи картинку)\s+/i;
  var MAP_RE    = /(?:^|\s)(найди карту|покажи карту|найди на карте|покажи на карте|где находится|карта)\s+/i;
  var ROUTE_RE  = /(?:маршрут|проложи|как добраться|как попасть|как доехать|как дойти|дорога|путь).*(?:из|от)\s+(.+?)\s+(?:в|до|к)\s+(.+?)(?:\s*[.!?]|$)/i;
  var CF_IMAGE_URL = "https://guardian-proxy.qerevv.workers.dev/v1/image";

  /* ── Поиск реальной фотографии через LoremFlickr (бесплатно, без ключей) ── */
  function findRealPhoto(subject, onSuccess, onFail) {
    callAIWithPrompt(
      "Translate this Russian text to 2-3 English keywords for image search, comma-separated. " +
      "Return ONLY keywords, no explanations.",
      subject, null,
      function (keywords) {
        keywords = keywords.trim().replace(/['"]/g, "").replace(/\s+/g, ",");
        var seed = Math.floor(Math.random() * 9999);
        var url = "https://loremflickr.com/768/512/" + encodeURIComponent(keywords) + "?random=" + seed;
        onSuccess(url, keywords);
      },
      function () {
        /* Перевод не удался */
        var enc = encodeURIComponent(subject.slice(0, 30));
        onSuccess("https://loremflickr.com/768/512/" + enc + "?random=" + Math.random(), subject);
      }
    );
  }

  /* ── Создать блок с найденным фото ── */
  function startFinding(subject) {
    var el = createImageBlock(subject);
    el.caption.textContent = "Ищу фото… 🔍";
    findRealPhoto(subject,
      function (url, keywords) {
        el.caption.textContent = "Нашёл фото… ⏳";
        el.img.onload  = function () {
          el.caption.textContent = "📷 " + subject;
          showDownloadBtn(el.downloadBtn, el.img, subject, el.imageId);
        };
        el.img.onerror = function () {
          /* LoremFlickr не ответил — рисуем через AI */
          el.caption.textContent = "Фото не нашлось, рисую… ⏳";
          generateImage(keywords || subject, el.img, el.caption, subject, el.downloadBtn, el.imageId);
        };
        el.img.src = url;
      },
      function () {
        generateImage(subject, el.img, el.caption, subject, el.downloadBtn, el.imageId);
      }
    );
  }

  /* ── Маршрут через Google Maps (открывается в новой вкладке) ── */
  function showRoute(from, to) {
    var mapsUrl = "https://www.google.com/maps/dir/?api=1" +
      "&origin=" + encodeURIComponent(from) +
      "&destination=" + encodeURIComponent(to) +
      "&travelmode=driving";

    var msgEl = document.createElement("div");
    msgEl.className = "guardian-msg guardian-msg--bot";

    var av = document.createElement("div");
    av.className = "guardian-msg__avatar";
    av.setAttribute("aria-hidden", "true");
    av.textContent = "✦";

    var bubble = document.createElement("div");
    bubble.className = "guardian-msg__bubble";

    var caption = document.createElement("p");
    caption.className = "guardian-msg__image-caption";
    caption.textContent = "🗺 Маршрут: " + from + " → " + to;

    var btnRow = document.createElement("div");
    btnRow.className = "guardian-msg__image-btns";

    /* Кнопка на авто */
    var btnCar = document.createElement("a");
    btnCar.className = "guardian-msg__route-btn";
    btnCar.textContent = "🚗 На авто";
    btnCar.href = mapsUrl;
    btnCar.target = "_blank";
    btnCar.rel = "noopener";

    /* Кнопка пешком */
    var btnWalk = document.createElement("a");
    btnWalk.className = "guardian-msg__route-btn";
    btnWalk.textContent = "🚶 Пешком";
    btnWalk.href = mapsUrl.replace("travelmode=driving", "travelmode=walking");
    btnWalk.target = "_blank";
    btnWalk.rel = "noopener";

    /* Кнопка транспорт */
    var btnTransit = document.createElement("a");
    btnTransit.className = "guardian-msg__route-btn";
    btnTransit.textContent = "🚌 Транспорт";
    btnTransit.href = mapsUrl.replace("travelmode=driving", "travelmode=transit");
    btnTransit.target = "_blank";
    btnTransit.rel = "noopener";

    btnRow.appendChild(btnCar);
    btnRow.appendChild(btnWalk);
    btnRow.appendChild(btnTransit);
    bubble.appendChild(caption);
    bubble.appendChild(btnRow);
    msgEl.appendChild(av);
    msgEl.appendChild(bubble);
    messagesEl.appendChild(msgEl);
    scrollToBottom();
  }

  /* ── Карта через Pollinations (стилизованная) ── */
  function startMap(place) {
    var mapPrompt = place + ", detailed map, cartography style, vintage map illustration, top view";
    startDrawingWithPrompt(mapPrompt, "🗺 " + place);
  }

  /* ── Рисование с готовым английским промптом ── */
  function startDrawingWithPrompt(englishPrompt, subject) {
    var el = createImageBlock(subject);
    generateImage(englishPrompt, el.img, el.caption, subject, el.downloadBtn, el.imageId);
  }

  /* ═══════ СОХРАНЕНИЕ КАРТИНОК В БРАУЗЕРЕ ═══════ */

  var STORAGE_KEY = "guardian_saved_images";
  var MAX_SAVED   = 30;

  function loadSavedImages() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch (_) { return []; }
  }

  function persistSavedImages(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (_) {}
  }

  function saveImage(subject, src, id) {
    var list = loadSavedImages();
    /* Не дублируем */
    if (list.some(function (x) { return x.id === id; })) return;
    list.unshift({ id: id, subject: subject, src: src, ts: Date.now() });
    /* Храним не больше MAX_SAVED */
    if (list.length > MAX_SAVED) list = list.slice(0, MAX_SAVED);
    persistSavedImages(list);
  }

  function deleteSavedImage(id) {
    var list = loadSavedImages().filter(function (x) { return x.id !== id; });
    persistSavedImages(list);
  }

  /* ── Создать DOM-блок картинки (используется и при генерации, и при восстановлении) ── */
  function buildImageCard(subject, src, id, isSaved) {
    var imgMsg = document.createElement("div");
    imgMsg.className = "guardian-msg guardian-msg--bot";
    imgMsg.dataset.imageId = id;

    var av = document.createElement("div");
    av.className = "guardian-msg__avatar";
    av.setAttribute("aria-hidden", "true");
    av.textContent = "✦";

    var bubble = document.createElement("div");
    bubble.className = "guardian-msg__bubble";

    var caption = document.createElement("p");
    caption.className = "guardian-msg__image-caption";
    caption.textContent = "✦ " + subject;

    var img = document.createElement("img");
    img.className = "guardian-msg__image";
    img.alt = subject;
    if (src) img.src = src;

    var btnRow = document.createElement("div");
    btnRow.className = "guardian-msg__image-btns";

    var downloadBtn = document.createElement("a");
    downloadBtn.className = "guardian-msg__image-download";
    downloadBtn.textContent = "⬇ Скачать";
    downloadBtn.style.display = src ? "inline-flex" : "none";
    if (src) {
      var filename = subject.replace(/[^\u0400-\u04ffa-z0-9\s]/gi, "").trim().slice(0, 40) || "картина";
      downloadBtn.download = filename + ".png";
      downloadBtn.href = src;
    }

    var deleteBtn = document.createElement("button");
    deleteBtn.className = "guardian-msg__image-delete";
    deleteBtn.textContent = isSaved ? "✕ Удалить" : "✕";
    deleteBtn.title = "Удалить картинку";
    deleteBtn.addEventListener("click", function () {
      deleteSavedImage(id);
      imgMsg.remove();
    });

    btnRow.appendChild(downloadBtn);
    btnRow.appendChild(deleteBtn);
    bubble.appendChild(caption);
    bubble.appendChild(img);
    bubble.appendChild(btnRow);
    imgMsg.appendChild(av);
    imgMsg.appendChild(bubble);
    return { el: imgMsg, img: img, caption: caption, downloadBtn: downloadBtn };
  }

  /* ── Восстановить сохранённые картинки при загрузке страницы ── */
  function restoreSavedImages() {
    var list = loadSavedImages();
    if (!list.length) return;

    var divider = document.createElement("p");
    divider.className = "guardian-msg__saved-divider";
    divider.textContent = "✦ Сохранённые картинки";
    messagesEl.insertBefore(divider, messagesEl.firstChild);

    list.slice().reverse().forEach(function (item) {
      var card = buildImageCard(item.subject, item.src, item.id, true);
      messagesEl.insertBefore(card.el, divider.nextSibling);
    });
  }

  /* ── Показать кнопку скачивания и сохранить картинку ── */
  function showDownloadBtn(downloadBtn, img, subject, imageId) {
    var filename = subject.replace(/[^\u0400-\u04ffa-z0-9\s]/gi, "").trim().slice(0, 40) || "картина";
    var finalSrc;

    if (img.src.startsWith("data:")) {
      finalSrc = img.src;
    } else {
      try {
        var canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d").drawImage(img, 0, 0);
        finalSrc = canvas.toDataURL("image/png");
      } catch (_) {
        finalSrc = img.src;
        downloadBtn.removeAttribute("download");
        downloadBtn.target = "_blank";
        downloadBtn.textContent = "🔗 Открыть";
      }
    }

    downloadBtn.download = filename + ".png";
    downloadBtn.href = finalSrc;
    downloadBtn.style.display = "inline-flex";

    /* Сохраняем в localStorage чтобы не пропадала при обновлении */
    saveImage(subject, finalSrc.startsWith("data:") ? finalSrc : img.src, imageId);

    scrollToBottom();
  }

  /* ── Попытка через Cloudflare AI (flux-1-schnell) ── */
  function generateImageCF(englishPrompt, img, caption, subject, downloadBtn, imageId, onFail) {
    caption.textContent = "Рисую… ✨";
    fetch(CF_IMAGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: englishPrompt + ", beautiful art, detailed, soft light" })
    })
      .then(function (res) {
        if (!res.ok) { onFail(); return null; }
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.image) { onFail(); return; }
        img.onload  = function () {
          caption.textContent = "✦ " + subject;
          showDownloadBtn(downloadBtn, img, subject, imageId);
        };
        img.onerror = function () { onFail(); };
        img.src = "data:image/png;base64," + data.image;
      })
      .catch(function () { onFail(); });
  }

  /* ── Запасной вариант: Pollinations.ai через img.src (без CORS) ── */
  function generateImagePollinations(englishPrompt, img, caption, subject, downloadBtn, imageId) {
    var seed = Math.floor(Math.random() * 99999);
    var enc = encodeURIComponent(englishPrompt);
    var encFull = encodeURIComponent(englishPrompt + ", beautiful art, detailed, soft light");

    var urls = [
      "https://image.pollinations.ai/prompt/" + encFull + "?width=768&height=512&seed=" + seed + "&nologo=true",
      "https://image.pollinations.ai/prompt/" + encFull + "?width=768&height=512&seed=" + seed + "&model=flux&nologo=true",
      "https://image.pollinations.ai/prompt/" + enc + "?width=512&height=512&seed=" + seed + "&model=turbo",
      "https://image.pollinations.ai/prompt/" + enc + "?width=512&height=512&seed=" + seed,
      "https://image.pollinations.ai/prompt/" + enc + "?width=512&height=512"
    ];

    var attempt = 0;
    function tryNext() {
      if (attempt >= urls.length) {
        caption.textContent = "Сервис рисования сейчас недоступен. Попробуй позже — он восстановится.";
        return;
      }
      var url = urls[attempt++];
      caption.textContent = "Рисую… ⏳" + (attempt > 1 ? " (вариант " + attempt + ")" : "");
      img.src = url;
    }

    img.onload  = function () {
      caption.textContent = "✦ " + subject;
      showDownloadBtn(downloadBtn, img, subject, imageId);
    };
    img.onerror = function () { setTimeout(tryNext, 2000); };
    tryNext();
  }

  /* ── Основная точка входа: CF AI → Pollinations.ai ── */
  function generateImage(englishPrompt, img, caption, subject, downloadBtn, imageId) {
    generateImageCF(englishPrompt, img, caption, subject, downloadBtn, imageId, function () {
      generateImagePollinations(englishPrompt, img, caption, subject, downloadBtn, imageId);
    });
  }

  /* ── Создать блок с картинкой в чате (во время генерации) ── */
  function createImageBlock(subject) {
    var imageId = "img_" + Date.now() + "_" + Math.floor(Math.random() * 9999);
    var card = buildImageCard(subject, null, imageId, false);
    card.caption.textContent = "Перевожу… ⏳";
    card.downloadBtn.style.display = "none";
    messagesEl.appendChild(card.el);
    scrollToBottom();
    return { img: card.img, caption: card.caption, downloadBtn: card.downloadBtn, imageId: imageId };
  }

  /* ── Запустить рисование по теме (переводим → рисуем) ── */
  function startDrawing(subject) {
    var el = createImageBlock(subject);
    callAIWithPrompt(
      "Translate the Russian image description to a short English image generation prompt. " +
      "Return ONLY the English prompt, 3-8 words, no explanations, no quotes.",
      subject, null,
      function (englishPrompt) {
        englishPrompt = englishPrompt.trim().replace(/^["']|["']$/g, "");
        generateImage(englishPrompt, el.img, el.caption, subject, el.downloadBtn, el.imageId);
      },
      function () {
        generateImage(subject, el.img, el.caption, subject, el.downloadBtn, el.imageId);
      }
    );
  }

  /* ── «Не рисуй» / «хватит картинок» → режим «только по просьбе» ── */
  var NO_IMAGES_RE = /^(не рисуй|хватит картинок|не показывай картинки|без картинок|не выдавай картинки|картинки не надо|больше не рисуй)\s*[.!]?$/i;
  function maybeDisableAutoImages(userText) {
    if (!NO_IMAGES_RE.test(userText.trim())) return false;
    imagesMode = "request";
    localStorage.setItem(IMAGES_STORAGE_KEY, imagesMode);
    updateImagesUI();
    return true;
  }

  /* ── Проверяем сообщение пользователя на все команды ── */
  function maybeShowImage(userText) {
    /* Маршрут */
    var mRoute = userText.match(ROUTE_RE);
    if (mRoute && mRoute[1] && mRoute[2]) {
      showRoute(mRoute[1].trim(), mRoute[2].trim());
      return;
    }

    /* Карта */
    var mMap = userText.match(MAP_RE);
    if (mMap) {
      var place = userText.slice(userText.indexOf(mMap[0]) + mMap[0].length).trim();
      if (place) { startMap(place); return; }
    }

    /* Поиск реального фото */
    var mFind = userText.match(FIND_RE);
    if (mFind) {
      var subject = userText.slice(userText.indexOf(mFind[0]) + mFind[0].length).trim();
      if (subject) { startFinding(subject); return; }
    }

    /* Рисование */
    var mDraw = userText.match(IMG_RE);
    if (mDraw) {
      var drawSubject = userText.slice(userText.indexOf(mDraw[0]) + mDraw[0].length).trim();
      if (drawSubject) startDrawing(drawSubject);
    }
  }

  /* ── Кнопка "Открыть Творческую комнату" ── */
  function showDrawRoomBtn() {
    var msgEl = document.createElement("div");
    msgEl.className = "guardian-msg guardian-msg--bot";

    var av = document.createElement("div");
    av.className = "guardian-msg__avatar";
    av.setAttribute("aria-hidden", "true");
    av.textContent = "✦";

    var bubble = document.createElement("div");
    bubble.className = "guardian-msg__bubble";

    var caption = document.createElement("p");
    caption.className = "guardian-msg__image-caption";
    caption.textContent = "✦ Творческая комната — холст, кисти, краски";

    var btn = document.createElement("a");
    btn.className = "guardian-msg__draw-room-btn";
    btn.href = "draw.html";
    btn.textContent = "🎨 Открыть Творческую комнату";

    var hint = document.createElement("p");
    hint.className = "guardian-msg__draw-room-hint";
    hint.textContent = "Рисуй кистью, выбирай цвета, сохраняй свои работы";

    bubble.appendChild(caption);
    bubble.appendChild(btn);
    bubble.appendChild(hint);
    msgEl.appendChild(av);
    msgEl.appendChild(bubble);
    messagesEl.appendChild(msgEl);
    scrollToBottom();
  }

  /* ── Проверяем ответ бота: картинка или приглашение в мастерскую ── */
  function maybeShowImageFromBot(botText) {
    /* Приглашение в творческую комнату */
    if (/\[ОТКРЫТЬ_МАСТЕРСКУЮ\]/.test(botText)) {
      showDrawRoomBtn();
    }

    /* Самурай рисует сам — только если картинки «по желанию» */
    if (imagesMode !== "auto") return;
    var m = botText.replace(/\[ОТКРЫТЬ_МАСТЕРСКУЮ\]/g, "").match(/нарисуй\s+([^\n.!?]{4,80})/i);
    if (!m) return;
    var subject = m[1].trim().replace(/[«»"']+/g, "");
    if (!subject) return;
    startDrawing(subject);
  }

  /* ═══════ ОТПРАВКА ═══════ */

  function setThinking(on) {
    document.body.classList.toggle("guardian-page--thinking", on);
  }

  function finishLoading() {
    isLoading = false;
    sendBtn.disabled = false;
    setThinking(false);
  }

  function sendDuo(userText) {
    showTyping("artist", "✦", "Художник думает…");
    callAIWithPrompt(ARTIST_DUO, userText, null,
      function (artistReply) {
        hideTyping();
        appendMessageStyled("model", artistReply, "artist", "✦");
        history.push({ role: "model", text: artistReply });
        speak(artistReply);
        maybeShowImage(userText);
        maybeShowImageFromBot(artistReply);

        showTyping("linguist", "語", "Сэнсэй думает…");
        callAIWithPrompt(LINGUIST_DUO, userText, artistReply,
          function (linguistReply) {
            hideTyping();
            finishLoading();
            appendMessageStyled("model", linguistReply, "linguist", "語");
            history.push({ role: "model", text: linguistReply });
            setTimeout(function () { speak(linguistReply); }, 800);
          },
          function (errMsg) { hideTyping(); finishLoading(); showError(errMsg); }
        );
      },
      function (errMsg) { hideTyping(); finishLoading(); showError(errMsg); }
    );
  }

  function sendTrio(userText) {
    showTyping("artist", "✦", "Художник думает…");
    callAIWithPrompt(ARTIST_DUO, userText, null,
      function (artistReply) {
        hideTyping();
        appendMessageStyled("model", artistReply, "artist", "✦");
        history.push({ role: "model", text: artistReply });
        speak(artistReply);
        maybeShowImage(userText);
        maybeShowImageFromBot(artistReply);

        showTyping("linguist", "語", "Сэнсэй думает…");
        callAIWithPrompt(LINGUIST_DUO, userText, artistReply,
          function (linguistReply) {
            hideTyping();
            appendMessageStyled("model", linguistReply, "linguist", "語");
            history.push({ role: "model", text: linguistReply });
            setTimeout(function () { speak(linguistReply); }, 800);

            /* Психолог — последний, видит контекст обоих */
            var context = "Художник сказал: «" + artistReply + "». Сэнсэй сказал: «" + linguistReply + "».";
            showTyping("psychologist", "♥", "Психолог думает…");
            callAIWithPrompt(PSYCHOLOGIST_DUO, userText, context,
              function (psychReply) {
                hideTyping();
                finishLoading();
                appendMessageStyled("model", psychReply, "psychologist", "♥");
                history.push({ role: "model", text: psychReply });
                setTimeout(function () { speak(psychReply); }, 1600);
              },
              function (errMsg) { hideTyping(); finishLoading(); showError(errMsg); }
            );
          },
          function (errMsg) { hideTyping(); finishLoading(); showError(errMsg); }
        );
      },
      function (errMsg) { hideTyping(); finishLoading(); showError(errMsg); }
    );
  }

  function sendMessage() {
    if (isLoading) return;
    var text = (inputEl.value || "").trim();
    if (!text) return;

    inputEl.value = "";
    inputEl.style.height = "auto";
    isLoading = true;
    sendBtn.disabled = true;
    setThinking(true);

    appendMessage("user", text);
    history.push({ role: "user", text: text });

    /* «Хватит картинок» / «не рисуй» — переключаем на «только по просьбе» */
    if (maybeDisableAutoImages(text)) {
      appendMessageStyled("model", "Хорошо. Буду рисовать только когда попросишь — напиши «нарисуй …» или «найди фото …».", null, "✦");
      history.push({ role: "model", text: "Хорошо. Буду рисовать только когда попросишь." });
      finishLoading();
      return;
    }

    if (getMode() === "duo")  { sendDuo(text);  return; }
    if (getMode() === "trio") { sendTrio(text); return; }

    showTyping();
    callAI(
      text,
      function (reply) {
        hideTyping();
        finishLoading();
        appendMessage("model", reply);
        history.push({ role: "model", text: reply });
        speak(reply);
        maybeShowImage(text);
        maybeShowImageFromBot(reply);
      },
      function (errMsg) {
        hideTyping();
        finishLoading();
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

  /* Восстанавливаем сохранённые картинки при загрузке */
  restoreSavedImages();
})();
