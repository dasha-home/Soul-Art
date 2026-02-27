/**
 * Атмосфера: Фон и Текст. Выбор сохраняется в localStorage и применяется на всех страницах.
 * Подключите этот скрипт и добавьте <div id="atmosphere-widget" class="atmosphere-widget"></div>.
 */
(function () {
  var STORAGE_BG = "soulart_atm_bg";
  var STORAGE_TEXT = "soulart_atm_text";
  var STORAGE_AUTO = "soulart_atm_auto";
  var MIN = 40;
  var MAX = 200;
  /** Стандартный вид: светлый фон, чёткий тёмный текст. */
  var STANDARD_BG = 200;
  var STANDARD_TEXT = 200;

  function isAuto() {
    return localStorage.getItem(STORAGE_AUTO) === "1";
  }

  function getStored() {
    if (isAuto()) return { bg: STANDARD_BG, text: STANDARD_TEXT, auto: true };
    var bg = parseInt(localStorage.getItem(STORAGE_BG), 10);
    var text = parseInt(localStorage.getItem(STORAGE_TEXT), 10);
    if (isNaN(bg) || bg < MIN || bg > MAX) bg = STANDARD_BG;
    if (isNaN(text) || text < MIN || text > MAX) text = STANDARD_TEXT;
    return { bg: bg, text: text, auto: false };
  }

  function setStored(bg, text) {
    localStorage.setItem(STORAGE_BG, String(bg));
    localStorage.setItem(STORAGE_TEXT, String(text));
  }

  function interpolateHex(hex1, hex2, t) {
    t = Math.max(0, Math.min(1, t));
    var r1 = parseInt(hex1.slice(1, 3), 16);
    var g1 = parseInt(hex1.slice(3, 5), 16);
    var b1 = parseInt(hex1.slice(5, 7), 16);
    var r2 = parseInt(hex2.slice(1, 3), 16);
    var g2 = parseInt(hex2.slice(3, 5), 16);
    var b2 = parseInt(hex2.slice(5, 7), 16);
    var r = Math.round(r1 + (r2 - r1) * t);
    var g = Math.round(g1 + (g2 - g1) * t);
    var b = Math.round(b1 + (b2 - b1) * t);
    return "#" + r.toString(16).padStart(2, "0") + g.toString(16).padStart(2, "0") + b.toString(16).padStart(2, "0");
  }

  /** Мягкий тёмный и приятный светлый фон (без резкого чёрного). */
  var PAGE_BG_DARK = "#252530";
  var PAGE_BG_LIGHT = "#e8e0d6";
  /** Текст: максимально чёткий и контрастный под фон. */
  var TEXT_ON_DARK = "#f0f0f5";
  var TEXT_ON_LIGHT = "#1a1510";
  var MUTED_ON_DARK = "#a0a0b8";
  var MUTED_ON_LIGHT = "#5c564d";

  function applyAtmosphere(bgValue, textValue) {
    var root = document.documentElement;
    var tBg = (bgValue - MIN) / (MAX - MIN);
    var pageBg = interpolateHex(PAGE_BG_DARK, PAGE_BG_LIGHT, tBg);
    var mountainBrightness = 0.45 + 0.8 * tBg;

    root.style.setProperty("--page-bg", pageBg);
    root.style.setProperty("--mountain-brightness", String(mountainBrightness));

    var tText = (textValue - MIN) / (MAX - MIN);
    var textColor = interpolateHex(TEXT_ON_DARK, TEXT_ON_LIGHT, tText);
    var mutedColor = interpolateHex(MUTED_ON_DARK, MUTED_ON_LIGHT, tText);
    var textGlow = tText <= 0.35 ? "0 0 28px rgba(255,255,255,0.35), 0 0 60px rgba(255,255,255,0.12)" : tText <= 0.6 ? "0 0 20px rgba(255,255,255,0.2)" : "none";

    root.style.setProperty("--text-color", textColor);
    root.style.setProperty("--muted-color", mutedColor);
    root.style.setProperty("--text-glow", textGlow);

    document.body.style.setProperty("background", pageBg);
    document.body.style.setProperty("color", textColor);
  }

  (function applyStoredOnLoad() {
    var stored = getStored();
    applyAtmosphere(stored.bg, stored.text);
  })();

  function injectWidgetStyles() {
    if (document.getElementById("atmosphere-widget-styles")) return;
    var style = document.createElement("style");
    style.id = "atmosphere-widget-styles";
    style.textContent =
      ".atmosphere-widget{position:fixed;top:max(1rem,env(safe-area-inset-top));right:max(1rem,env(safe-area-inset-right));z-index:50;pointer-events:auto;display:flex;flex-direction:column;align-items:flex-end}" +
      ".atmosphere-widget__trigger{width:48px;height:48px;min-width:48px;min-height:48px;border-radius:50%;border:1px solid rgba(255,220,100,0.5);background:rgba(255,240,180,0.2);backdrop-filter:blur(12px);color:#ffeb3b;font-size:1.5rem;cursor:pointer;display:grid;place-items:center;box-shadow:0 0 32px rgba(255,235,59,0.7);transition:transform .2s ease}" +
      ".atmosphere-widget__trigger:hover{transform:scale(1.08)}" +
      ".atmosphere-widget__panel{position:absolute;top:calc(100% + .5rem);right:0;min-width:200px;padding:.6rem .75rem;border-radius:12px;background:rgba(255,255,255,0.08);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.15);box-shadow:0 8px 24px rgba(0,0,0,0.15)}" +
      ".atmosphere-widget__panel[hidden]{display:none!important}" +
      ".atmosphere-widget__panel-inner{display:flex;flex-direction:column;gap:.5rem}" +
      ".atmosphere-widget__panel-header{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin-bottom:.15rem}" +
      ".atmosphere-widget__panel-title{font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.1em;opacity:.95;margin:0;-webkit-font-smoothing:antialiased}" +
      ".atmosphere-widget__auto-btn{flex-shrink:0;padding:.3rem .55rem;font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;border-radius:6px;border:1px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.1);color:inherit;cursor:pointer;font-family:inherit;-webkit-font-smoothing:antialiased;transition:background .15s ease,border-color .15s ease}" +
      ".atmosphere-widget__auto-btn:hover{background:rgba(255,255,255,0.18);border-color:rgba(255,255,255,0.35)}" +
      ".atmosphere-widget .brightness-control__label{flex-shrink:0;font-weight:600;-webkit-font-smoothing:antialiased}" +
      ".atmosphere-widget .brightness-control{display:flex;align-items:center;gap:.5rem;font-size:.7rem;max-width:none;padding:.4rem .5rem}" +
      ".atmosphere-widget .brightness-control__label{flex-shrink:0}" +
      ".atmosphere-widget .brightness-control__range{flex:1;min-width:0;height:10px;border-radius:999px;background:rgba(0,0,0,0.25);-webkit-appearance:none;appearance:none;cursor:pointer}" +
      ".atmosphere-widget .brightness-control__range::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:linear-gradient(145deg,rgba(255,255,255,0.95),rgba(255,107,156,0.4));cursor:grab}" +
      ".atmosphere-widget .brightness-control__range::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:linear-gradient(145deg,rgba(255,255,255,0.95),rgba(255,107,156,0.4));cursor:grab}";
    document.head.appendChild(style);
  }

  function createAtmosphereWidget(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    injectWidgetStyles();

    var stored = getStored();
    applyAtmosphere(stored.bg, stored.text);

    container.innerHTML =
      '<button type="button" class="atmosphere-widget__trigger" id="atmosphere-trigger" aria-label="Настройки атмосферы" aria-expanded="false">' +
      '<span class="atmosphere-widget__sun" aria-hidden="true">☀</span></button>' +
      '<div class="atmosphere-widget__panel" id="atmosphere-panel" role="dialog" aria-label="Настройки яркости" hidden>' +
      '<div class="atmosphere-widget__panel-inner">' +
      '<div class="atmosphere-widget__panel-header">' +
      '<span class="atmosphere-widget__panel-title">Атмосфера</span>' +
      '<button type="button" class="atmosphere-widget__auto-btn" id="atmosphere-auto-btn" aria-label="Вернуть к стандартному виду">Авто</button>' +
      '</div>' +
      '<label class="brightness-control" for="brightness-mountain-slider"><span class="brightness-control__label">Фон</span>' +
      '<input id="brightness-mountain-slider" class="brightness-control__range" type="range" min="' + MIN + '" max="' + MAX + '" value="' + stored.bg + '" aria-label="Яркость фона" /></label>' +
      '<label class="brightness-control" for="brightness-text-slider"><span class="brightness-control__label">Текст</span>' +
      '<input id="brightness-text-slider" class="brightness-control__range" type="range" min="' + MIN + '" max="' + MAX + '" value="' + stored.text + '" aria-label="Контраст текста" /></label>' +
      '</div></div>';

    var trigger = document.getElementById("atmosphere-trigger");
    var panel = document.getElementById("atmosphere-panel");
    var bgSlider = document.getElementById("brightness-mountain-slider");
    var textSlider = document.getElementById("brightness-text-slider");

    if (trigger && panel) {
      trigger.addEventListener("click", function (e) {
        e.stopPropagation();
        var willBeOpen = panel.hidden;
        panel.hidden = !willBeOpen;
        trigger.setAttribute("aria-expanded", String(willBeOpen));
      });
      document.addEventListener("click", function (e) {
        if (!panel.hidden && container && !container.contains(e.target)) {
          panel.hidden = true;
          trigger.setAttribute("aria-expanded", "false");
        }
      });
    }

    function apply() {
      if (isAuto()) return;
      var bg = parseInt(bgSlider.value, 10) || STANDARD_BG;
      var text = parseInt(textSlider.value, 10) || STANDARD_TEXT;
      applyAtmosphere(bg, text);
      setStored(bg, text);
    }

    if (bgSlider) bgSlider.addEventListener("input", function () {
      localStorage.removeItem(STORAGE_AUTO);
      apply();
    });
    if (textSlider) textSlider.addEventListener("input", function () {
      localStorage.removeItem(STORAGE_AUTO);
      apply();
    });

    var autoBtn = document.getElementById("atmosphere-auto-btn");
    if (autoBtn) {
      autoBtn.addEventListener("click", function () {
        if (isAuto()) {
          localStorage.removeItem(STORAGE_AUTO);
          var stored = getStored();
          applyAtmosphere(stored.bg, stored.text);
          if (bgSlider) bgSlider.value = stored.bg;
          if (textSlider) textSlider.value = stored.text;
        } else {
          setStored(parseInt(bgSlider.value, 10) || STANDARD_BG, parseInt(textSlider.value, 10) || STANDARD_TEXT);
          localStorage.setItem(STORAGE_AUTO, "1");
          applyAtmosphere(STANDARD_BG, STANDARD_TEXT);
          if (bgSlider) bgSlider.value = STANDARD_BG;
          if (textSlider) textSlider.value = STANDARD_TEXT;
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      var stored = getStored();
      applyAtmosphere(stored.bg, stored.text);
      createAtmosphereWidget("atmosphere-widget");
    });
  } else {
    var stored = getStored();
    applyAtmosphere(stored.bg, stored.text);
    createAtmosphereWidget("atmosphere-widget");
  }
})();
