// Центральное описание возможных состояний приложения.
const APP_STATES = {
  INTRO: "INTRO",
  GALLERY: "GALLERY",
  ABOUT: "ABOUT",
  ADMIN: "ADMIN",
};

const GITHUB_REPO = { owner: "dasha-home", repo: "Soul-Art" };
const ADMIN_TOKEN_KEY = "soulart_github_token";

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

// ---------- ЗАГРУЗКА ДАННЫХ (из репозитория / Prose.io) ----------

const ARTWORKS_JSON =
  "https://raw.githubusercontent.com/dasha-home/Soul-Art/main/data/artworks.json";

/**
 * Загружает список работ Даши из репозитория GitHub.
 * Даша может редактировать data/artworks.json и загружать картинки через Prose.io.
 */
async function fetchArtworks() {
  try {
    const response = await fetch(ARTWORKS_JSON + "?t=" + Date.now(), {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Не удалось загрузить список работ");
    const data = await response.json();
    if (Array.isArray(data.artworks) && data.artworks.length > 0) {
      return data.artworks;
    }
  } catch (_) {
    // Локальная разработка или нет сети — пробуем локальный файл
    try {
      const local = await fetch("./data/artworks.json", { cache: "no-store" });
      if (local.ok) {
        const data = await local.json();
        if (Array.isArray(data.artworks) && data.artworks.length > 0) {
          return data.artworks;
        }
      }
    } catch (_) {}
  }

  // Запасной вариант: минимум картинок с корня сайта
  return [
    { id: "fuji", title: "Фудзияма в тумане", subtitle: "Серия: Рисунки Даши", imageUrl: "./01_fuji.png" },
    { id: "clouds", title: "Свет в облаках", subtitle: "Эскиз", imageUrl: "./00_start_clouds.png" },
    { id: "dasha", title: "Даша", subtitle: "Автопортрет", imageUrl: "./02_dasha.png" },
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
      Живая коллекция иллюстраций. Новые работы подгружаются из репозитория — Даша может добавлять картинки и подписи через редактор Prose.
    </p>
    <p class="gallery-view__hint">
      Стрелки вверху кадра — листать рисунки.
    </p>
    <a href="https://prose.io/#dasha-home/Soul-Art" target="_blank" rel="noopener" class="gallery-view__prose-link" title="Открыть редактор Prose для этого репозитория">
      Добавить или изменить работы в галерее (Prose)
    </a>
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

// ---------- АДМИНКА: ЗАГРУЗКА ФОТО НА САЙТ (через GitHub API) ----------

function getStoredToken() {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY) || "";
  } catch (_) {
    return "";
  }
}

function setStoredToken(token) {
  try {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch (_) {}
}

async function githubApi(path, options, token) {
  const url = "https://api.github.com/repos/" + GITHUB_REPO.owner + "/" + GITHUB_REPO.repo + "/contents/" + path;
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: "token " + token,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || res.statusText || "Ошибка запроса");
  }
  return res.json();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.replace(/^data:[^;]+;base64,/, "");
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function sanitizeFilename(name) {
  const base = name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "image";
  const ext = (name.match(/\.[^.]+$/) || [".png"])[0].toLowerCase();
  return base + ext;
}

function renderAdmin() {
  clearView();

  const token = getStoredToken();
  const wrapper = document.createElement("section");
  wrapper.className = "admin-view";

  function renderTokenStep() {
    wrapper.innerHTML = `
      <div class="admin-view__eyebrow">для Даши</div>
      <h2 class="admin-view__title">Загрузить фото на сайт</h2>
      <p class="admin-view__text">Один раз введите токен GitHub — он сохранится до закрытия вкладки. Токен нужен, чтобы загружать файлы в репозиторий.</p>
      <p class="admin-view__hint">Как получить токен: GitHub → Настройки → Developer settings → Personal access tokens → создать токен с правом <strong>repo</strong>.</p>
      <div class="admin-view__form">
        <label class="admin-view__label">
          <span>Токен GitHub</span>
          <input type="password" id="admin-token" class="admin-view__input" placeholder="ghp_..." autocomplete="off" />
        </label>
        <button type="button" id="admin-save-token" class="admin-view__btn">Сохранить и открыть загрузчик</button>
      </div>
      <p class="admin-view__note">Токен хранится только в этой вкладке. Никому не передавайте его.</p>
    `;
    const btn = wrapper.querySelector("#admin-save-token");
    const input = wrapper.querySelector("#admin-token");
    btn.addEventListener("click", () => {
      const t = (input.value || "").trim();
      if (!t) return;
      setStoredToken(t);
      renderUploadForm();
    });
  }

  function renderUploadForm() {
    wrapper.innerHTML = `
      <div class="admin-view__eyebrow">для Даши</div>
      <h2 class="admin-view__title">Загрузить фото с компьютера</h2>
      <p class="admin-view__text">Выберите картинку, подпись — и она появится в галерее на сайте.</p>
      <form id="admin-upload-form" class="admin-view__form">
        <label class="admin-view__label">
          <span>Файл (фото)</span>
          <input type="file" id="admin-file" name="file" accept="image/*" required class="admin-view__input" />
        </label>
        <label class="admin-view__label">
          <span>Название работы</span>
          <input type="text" id="admin-title" name="title" placeholder="Например: Закат над морем" class="admin-view__input" required />
        </label>
        <label class="admin-view__label">
          <span>Подпись (необязательно)</span>
          <input type="text" id="admin-subtitle" name="subtitle" placeholder="Серия, год, техника" class="admin-view__input" />
        </label>
        <button type="submit" id="admin-upload-btn" class="admin-view__btn admin-view__btn--primary">Загрузить на сайт</button>
      </form>
      <p id="admin-message" class="admin-view__message" aria-live="polite"></p>
      <button type="button" id="admin-forget-token" class="admin-view__link">Выйти (удалить токен из этой вкладки)</button>
    `;

    const form = wrapper.querySelector("#admin-upload-form");
    const msgEl = wrapper.querySelector("#admin-message");
    const uploadBtn = wrapper.querySelector("#admin-upload-btn");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fileInput = wrapper.querySelector("#admin-file");
      const titleInput = wrapper.querySelector("#admin-title");
      const subtitleInput = wrapper.querySelector("#admin-subtitle");
      const file = fileInput.files[0];
      if (!file) {
        msgEl.textContent = "Выберите файл.";
        return;
      }
      const title = (titleInput.value || "").trim() || file.name;
      const subtitle = (subtitleInput.value || "").trim() || "";
      uploadBtn.disabled = true;
      msgEl.textContent = "Загружаю…";

      try {
        const token = getStoredToken();
        if (!token) throw new Error("Токен не найден. Введите его снова.");
        const base64 = await fileToBase64(file);
        const filename = sanitizeFilename(file.name);
        const imagePath = "data/images/" + filename;

        await githubApi(imagePath, {
          method: "PUT",
          body: JSON.stringify({
            message: "Добавить фото в галерею: " + filename,
            content: base64,
          }),
        }, token);

        const jsonPath = "data/artworks.json";
        let getRes;
        try {
          getRes = await githubApi(jsonPath, { method: "GET" }, token);
        } catch (_) {
          throw new Error("Не удалось прочитать список работ. Проверьте, что в репозитории есть data/artworks.json");
        }
        const content = JSON.parse(atob(getRes.content.replace(/\n/g, "")));
        const id = filename.replace(/\.[^.]+$/, "").replace(/[^a-z0-9]/gi, "-").toLowerCase() || "work";
        content.artworks = content.artworks || [];
        content.artworks.push({
          id: id,
          title: title,
          subtitle: subtitle,
          imageUrl: "./" + imagePath,
        });
        const newContent = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));
        await githubApi(jsonPath, {
          method: "PUT",
          body: JSON.stringify({
            message: "Добавить работу в галерею: " + title,
            content: newContent,
            sha: getRes.sha,
          }),
        }, token);

        msgEl.textContent = "Готово. Фото добавлено в галерею.";
        msgEl.className = "admin-view__message admin-view__message--success";
        form.reset();
      } catch (err) {
        msgEl.textContent = "Ошибка: " + (err.message || "не удалось загрузить");
        msgEl.className = "admin-view__message admin-view__message--error";
      }
      uploadBtn.disabled = false;
    });

    wrapper.querySelector("#admin-forget-token").addEventListener("click", () => {
      setStoredToken("");
      renderTokenStep();
    });
  }

  if (token) {
    renderUploadForm();
  } else {
    renderTokenStep();
  }

  appContent.appendChild(wrapper);
  currentViewCleanup = null;
}

async function renderState(state) {
  switch (state) {
    case APP_STATES.GALLERY:
      await renderGallery();
      break;
    case APP_STATES.ABOUT:
      renderAbout();
      break;
    case APP_STATES.ADMIN:
      renderAdmin();
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

      // Переход в галерею или в загрузчик, если в ссылке #admin
      AppState.setState(location.hash === "#admin" ? APP_STATES.ADMIN : APP_STATES.GALLERY);
    }, 1000);
  }

  const adminLink = document.getElementById("intro-admin-link");
  if (adminLink) {
    adminLink.addEventListener("click", (e) => {
      e.preventDefault();
      location.hash = "admin";
      startSequence();
    }, { once: true });
  }

  startButton.addEventListener("click", startSequence, { once: true });
  intro.addEventListener(
    "click",
    (event) => {
      if (event.target === startButton || event.target === adminLink) return;
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
    if (state === APP_STATES.ADMIN) {
      location.hash = "admin";
    } else {
      if (location.hash === "#admin") location.hash = "";
    }
    renderState(state);
  });

  window.addEventListener("hashchange", () => {
    if (location.hash === "#admin" && AppState.current !== APP_STATES.INTRO) {
      AppState.setState(APP_STATES.ADMIN);
    }
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

