// Центральное описание возможных состояний приложения.
const APP_STATES = {
  INTRO: "INTRO",
  GALLERY: "GALLERY",
  ABOUT: "ABOUT",
};

// Глобальный объект состояния. Через него можно добавлять новые режимы.
const AppState = {
  current: APP_STATES.INTRO,
  listeners: new Set(),

  setState(nextState) {
    if (this.current === nextState) return;
    this.current = nextState;
    this.listeners.forEach((fn) => fn(this.current));
  },

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  },
};

// ---------- ЗАГРУЗКА ДАННЫХ (позже GitHub / Prose.io) ----------

/**
 * Загружает список работ Даши.
 * В будущем сюда можно добавить запрос к GitHub (JSON в репозитории),
 * а пока возвращаем заглушки, чтобы видеть структуру слайдера.
 */
async function fetchArtworks() {
  // Пример будущей интеграции:
  //
  // const response = await fetch(
  //   "https://raw.githubusercontent.com/<user>/<repo>/main/data/artworks.json",
  //   { cache: "no-store" }
  // );
  // if (!response.ok) {
  //   throw new Error("Не удалось загрузить список работ");
  // }
  // const data = await response.json();
  // return data.artworks;

  // Пока данных нет — возвращаем заглушки.
  await new Promise((resolve) => setTimeout(resolve, 300));

  return [
    {
      id: "placeholder-1",
      title: "Фудзияма в тумане",
      subtitle: "Серия: Рисунки Даши",
      imageUrl: "./placeholder_fuji_1.jpg",
    },
    {
      id: "placeholder-2",
      title: "Свет в облаках",
      subtitle: "Эскиз к будущей серии",
      imageUrl: "./placeholder_clouds_2.jpg",
    },
    {
      id: "placeholder-3",
      title: "Тихий снег",
      subtitle: "Опыт с фактурой бумаги",
      imageUrl: "./placeholder_snow_3.jpg",
    },
  ];
}

// ---------- КОМПОНЕНТ: СЛАЙДЕР ГАЛЕРЕИ ----------

/**
 * Создаёт DOM-узел слайдера и возвращает его вместе с API для управления.
 * Компонент не привязан к глобальному состоянию и может быть переиспользован.
 */
function createArtSlider(artworks) {
  const root = document.createElement("section");
  root.className = "gallery-view";

  const metaColumn = document.createElement("div");
  metaColumn.innerHTML = `
    <div class="gallery-view__meta-title">онлайн-портал</div>
    <h2 class="gallery-view__heading">
      Рисунки <span class="gallery-view__accent">Даши</span>
    </h2>
    <p class="gallery-view__lead">
      Живая коллекция иллюстраций, которая будет расти вместе с художником.
      Сейчас вы видите демонстрационный режим с заглушками — позже сюда
      подгрузятся реальные работы из GitHub.
    </p>
    <p class="gallery-view__hint">
      Используйте стрелки вверху кадра, чтобы листать рисунки.
    </p>
  `;

  const sliderColumn = document.createElement("div");
  sliderColumn.className = "gallery-view__slider";

  const slider = document.createElement("div");
  slider.className = "art-slider";

  if (!artworks || artworks.length === 0) {
    slider.innerHTML = `
      <div class="art-slider__empty">
        Пока нет ни одной работы. Как только JSON с рисунками появится в GitHub,
        этот блок автоматически превратится в интерактивную галерею.
      </div>
    `;
    sliderColumn.appendChild(slider);
    root.append(metaColumn, sliderColumn);
    return { root, destroy() {} };
  }

  let index = 0;

  const frame = document.createElement("div");
  frame.className = "art-slider__frame";

  const images = artworks.map((art, i) => {
    const img = document.createElement("img");
    img.className = "art-slider__img" + (i === 0 ? " art-slider__img--active" : "");
    img.src = art.imageUrl;
    img.alt = art.title;
    frame.appendChild(img);
    return img;
  });

  const metaBar = document.createElement("div");
  metaBar.className = "art-slider__meta";
  const titleSpan = document.createElement("div");
  titleSpan.className = "art-slider__title";
  const subtitleSpan = document.createElement("div");
  subtitleSpan.className = "art-slider__subtitle";
  const indexSpan = document.createElement("div");
  indexSpan.className = "art-slider__index";
  metaBar.appendChild(
    (() => {
      const wrapper = document.createElement("div");
      wrapper.appendChild(titleSpan);
      wrapper.appendChild(subtitleSpan);
      return wrapper;
    })()
  );
  metaBar.appendChild(indexSpan);

  const controls = document.createElement("div");
  controls.className = "art-slider__controls";

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "art-slider__btn";
  prevBtn.innerHTML = `<span class="art-slider__btn-icon">←</span>`;
  prevBtn.setAttribute("aria-label", "Предыдущий рисунок");

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "art-slider__btn";
  nextBtn.innerHTML = `<span class="art-slider__btn-icon">→</span>`;
  nextBtn.setAttribute("aria-label", "Следующий рисунок");

  controls.append(prevBtn, nextBtn);

  slider.append(frame, metaBar, controls);
  sliderColumn.appendChild(slider);
  root.append(metaColumn, sliderColumn);

  function renderMeta() {
    const art = artworks[index];
    titleSpan.textContent = art.title;
    subtitleSpan.textContent = art.subtitle;
    indexSpan.textContent = `${index + 1} / ${artworks.length}`;
  }

  function goTo(delta) {
    const prevIndex = index;
    index = (index + delta + artworks.length) % artworks.length;

    images[prevIndex].classList.remove("art-slider__img--active");
    images[index].classList.add("art-slider__img--active");
    renderMeta();
  }

  prevBtn.addEventListener("click", () => goTo(-1));
  nextBtn.addEventListener("click", () => goTo(1));

  renderMeta();

  return {
    root,
    destroy() {
      prevBtn.replaceWith(prevBtn.cloneNode(true));
      nextBtn.replaceWith(nextBtn.cloneNode(true));
    },
  };
}

// ---------- РЕНДЕРИНГ СОСТОЯНИЙ В #app-content ----------

const appContent = document.getElementById("app-content");
let currentViewCleanup = null;

function clearView() {
  if (typeof currentViewCleanup === "function") {
    currentViewCleanup();
  }
  currentViewCleanup = null;
  appContent.innerHTML = "";
}

async function renderGallery() {
  clearView();

  const artworks = await fetchArtworks();
  const sliderComponent = createArtSlider(artworks);
  appContent.appendChild(sliderComponent.root);

  currentViewCleanup = () => sliderComponent.destroy();
}

function renderAbout() {
  clearView();

  const wrapper = document.createElement("section");
  wrapper.className = "about-view";

  wrapper.innerHTML = `
    <div class="about-view__eyebrow">о художнике</div>
    <h2 class="about-view__title">Даша и её мир рисунков</h2>
    <p class="about-view__text">
      Здесь появится биография Даши, выбранный стиль, истории о том,
      как создаются рисунки и чем вдохновляется художник.
    </p>
    <p class="about-view__text">
      Страница спроектирована как отдельная "комната" портала.
      В будущем можно добавлять новые блоки (видео, раскадровки, дневник)
      без изменения базовой архитектуры.
    </p>
    <p class="about-view__note">
      Текст сейчас служит заглушкой — его можно заменить любым контентом,
      при этом навигация и система состояний останутся прежними.
    </p>
  `;

  appContent.appendChild(wrapper);
}

async function renderState(state) {
  // Intro управляется отдельно через оверлей, здесь нас интересуют "страницы".
  switch (state) {
    case APP_STATES.GALLERY:
      await renderGallery();
      break;
    case APP_STATES.ABOUT:
      renderAbout();
      break;
  }
}

// ---------- ИНТРО-СЦЕНА: ДАША ТЯНЕТ ТУМАН ----------

function setupIntroScene() {
  const intro = document.getElementById("intro-layer");
  const hero = document.getElementById("intro-hero");
  const clouds = document.getElementById("intro-clouds");
  const title = document.getElementById("intro-title");
  const startButton = document.getElementById("intro-start");
  const appShell = document.getElementById("app-shell");

  if (!intro || !hero || !clouds || !title || !startButton || !appShell) return;

  function startSequence() {
    startButton.disabled = true;

    // Туман уходит влево как завеса. Остальные слои (фон, Даша, UI) остаются на месте.
    clouds.classList.add("intro__layer--clouds-off");

    // Текст интро плавно исчезает.
    title.style.transition = "opacity 0.6s ease-out, transform 0.6s ease-out";
    title.style.opacity = "0";
    title.style.transform = "translateY(-6px)";

    // После завершения анимации включаем основное приложение и скрываем интро.
    setTimeout(() => {
      intro.classList.remove("intro--active");
      intro.classList.add("intro--hidden");

      appShell.classList.add("app-shell--active");

      // Переход в GALLERY_MODE.
      AppState.setState(APP_STATES.GALLERY);
    }, 1000);
  }

  startButton.addEventListener("click", startSequence, { once: true });
  intro.addEventListener(
    "click",
    (event) => {
      if (event.target === startButton) return;
      startSequence();
    },
    { once: true }
  );
}

// ---------- НАВИГАЦИЯ (кнопки в шапке) ----------

function setupTopNav() {
  const navButtons = document.querySelectorAll(".top-nav__link");

  function updateActiveButton(state) {
    navButtons.forEach((btn) => {
      const targetState = btn.getAttribute("data-state");
      if (targetState === state) {
        btn.classList.add("top-nav__link--active");
      } else {
        btn.classList.remove("top-nav__link--active");
      }
    });
  }

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const state = btn.getAttribute("data-state");
      if (!state) return;
      AppState.setState(state);
    });
  });

  AppState.subscribe((state) => {
    if (state === APP_STATES.INTRO) return;
    updateActiveButton(state);
    renderState(state);
  });
}

// ---------- КОНТРОЛЛЕРЫ ЯРКОСТИ: ГОРА И ТЕКСТ РАЗДЕЛЬНО ----------

function interpolateHex(hex1, hex2, t) {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Ползунок для горы: меняет ТОЛЬКО яркость фона (01_fuji.png).
 * Гора остаётся на нормальной яркости по умолчанию (120 = 1.2).
 */
function setupMountainBrightnessControl() {
  const slider = document.getElementById("brightness-mountain-slider");
  if (!slider) return;

  const root = document.documentElement;

  const applyValue = () => {
    const value = Number(slider.value) || 120;
    const normalized = value / 100;
    root.style.setProperty("--mountain-brightness", String(normalized));
  };

  slider.addEventListener("input", applyValue);
  applyValue();
}

/**
 * Ползунок для текста: меняет ТОЛЬКО цвет букв и свечение.
 * Левый край (40) = ночь → светлый текст + свечение; правый (200) = очень светло → тёмные буквы.
 */
function setupTextBrightnessControl() {
  const slider = document.getElementById("brightness-text-slider");
  if (!slider) return;

  const root = document.documentElement;

  const applyValue = () => {
    const value = Number(slider.value) || 120;
    // t: 0 (ночь, value 40) → светлый текст; 1 (день, value 200) → тёмный текст
    const t = Math.max(0, Math.min(1, (value - 40) / 160));

    const textColorLight = "#f7f7ff";
    const textColorDark = "#0d0d18";
    const mutedColorLight = "#b8bce0";
    const mutedColorDark = "#2d2d4a";

    const textColor = interpolateHex(textColorLight, textColorDark, t);
    const mutedColor = interpolateHex(mutedColorLight, mutedColorDark, t);

    const glowNone = "none";
    const glowStrong = "0 0 28px rgba(255, 255, 255, 0.35), 0 0 60px rgba(255, 255, 255, 0.12)";
    const glowMid = "0 0 20px rgba(255, 255, 255, 0.2)";
    const textGlow = t <= 0.35 ? glowStrong : t <= 0.6 ? glowMid : glowNone;

    root.style.setProperty("--text-color", textColor);
    root.style.setProperty("--muted-color", mutedColor);
    root.style.setProperty("--text-glow", textGlow);
  };

  slider.addEventListener("input", applyValue);
  applyValue();
}

function setupBrightnessControl() {
  setupMountainBrightnessControl();
  setupTextBrightnessControl();
}

// ---------- ИНИЦИАЛИЗАЦИЯ ----------

window.addEventListener("DOMContentLoaded", () => {
  setupIntroScene();
  setupTopNav();
  setupBrightnessControl();
});

