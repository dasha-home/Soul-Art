// Центральное описание возможных состояний приложения.
const APP_STATES = {
  INTRO: "INTRO",
  MAIN: "MAIN",
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

const GALLERY_JSON = "https://raw.githubusercontent.com/dasha-home/Soul-Art/main/data/gallery.json";
const ARTWORKS_JSON = "https://raw.githubusercontent.com/dasha-home/Soul-Art/main/data/artworks.json";
/** Базовый URL картинок галереи — один и тот же репозиторий, чтобы работало с file://, планшета и телефона. */
const GALLERY_IMAGES_BASE = "https://dasha-home.github.io/Soul-Art";

/** При ошибке загрузки пробуем те же имена с расширениями .png, .jpg, .jpeg (золотой стандарт). */
function imageFallbackUrls(url) {
  if (!url || typeof url !== "string") return [];
  const base = url.replace(/\.(jpe?g|png)$/i, "");
  return [base + ".png", base + ".jpg", base + ".jpeg"].filter(function (u) { return u !== url; });
}

/** Относительные пути к картинкам всегда грузим с GitHub Pages. Сегменты пути кодируем, чтобы буквы не ломали ссылку. */
function resolveGalleryImageUrl(url) {
  if (!url || typeof url !== "string") return url;
  var s = url.trim();
  if (s.indexOf("http://") === 0 || s.indexOf("https://") === 0) return s;
  var path = s.replace(/^\.\/?/, "").replace(/^\//, "");
  var encoded = path.split("/").map(function (seg) { return encodeURIComponent(seg); }).join("/");
  return GALLERY_IMAGES_BASE + "/" + encoded;
}

/**
 * Загружает список работ: сначала data/gallery.json (админка), затем data/artworks.json.
 */
async function fetchArtworks() {
  for (const url of [GALLERY_JSON, ARTWORKS_JSON]) {
    try {
      const response = await fetch(url + "?t=" + Date.now(), {
        cache: "no-store",
        headers: { Accept: "application/json; charset=utf-8" },
      });
      if (!response.ok) continue;
      const text = await response.text();
      const data = JSON.parse(text);
      if (Array.isArray(data.artworks) && data.artworks.length > 0) {
        return data.artworks;
      }
    } catch (_) {}
  }
  try {
    const local = await fetch("./data/gallery.json", { cache: "no-store" });
    if (local.ok) {
      const data = JSON.parse(await local.text());
      if (Array.isArray(data.artworks) && data.artworks.length > 0) return data.artworks;
    }
  } catch (_) {}
  try {
    const local = await fetch("./data/artworks.json", { cache: "no-store" });
    if (local.ok) {
      const data = JSON.parse(await local.text());
      if (Array.isArray(data.artworks) && data.artworks.length > 0) return data.artworks;
    }
  } catch (_) {}

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

  const sliderWrap = document.createElement("div");
  sliderWrap.className = "gallery-view__slider-wrap";

  const slider = document.createElement("div");
  slider.className = "art-slider";

  if (!artworks || artworks.length === 0) {
    slider.innerHTML = `
      <div class="art-slider__empty">
        Пока нет ни одной работы. Как только JSON с рисунками появится в GitHub,
        этот блок автоматически превратится в интерактивную галерею.
      </div>
    `;
    sliderWrap.appendChild(slider);
    root.append(sliderWrap);
    return { root, destroy() {} };
  }

  let index = 0;

  const frame = document.createElement("div");
  frame.className = "art-slider__frame";

  const images = artworks.map((art, i) => {
    const img = document.createElement("img");
    img.className = "art-slider__img" + (i === 0 ? " art-slider__img--active" : "");
    const primaryUrl = art.imageUrl;
    let rawUrls = [primaryUrl];
    imageFallbackUrls(art.imageUrl).forEach(function (u) { if (rawUrls.indexOf(u) === -1) rawUrls.push(u); });
    let urlsToTry = rawUrls.map(resolveGalleryImageUrl);
    urlsToTry = urlsToTry.filter(function (u, idx) { return urlsToTry.indexOf(u) === idx; });
    img._galleryTryIndex = 0;
    img.src = urlsToTry[0];
    img.alt = art.title;
    img.onerror = function () {
      img._galleryTryIndex = (img._galleryTryIndex || 0) + 1;
      if (img._galleryTryIndex < urlsToTry.length) img.src = urlsToTry[img._galleryTryIndex];
    };
    img.setAttribute("data-index", String(i));
    frame.appendChild(img);
    return img;
  });

  frame.classList.add("art-slider__frame--clickable");
  frame.setAttribute("role", "button");
  frame.setAttribute("tabindex", "0");
  frame.setAttribute("aria-label", "Открыть в полном размере");

  const captionBlock = document.createElement("div");
  captionBlock.className = "gallery-view__caption";
  const headingEl = document.createElement("h2");
  headingEl.className = "gallery-view__heading";
  headingEl.innerHTML = 'Рисунки <span class="gallery-view__accent">Даши</span>';
  const titleSpan = document.createElement("div");
  titleSpan.className = "gallery-view__caption-title";
  const subtitleSpan = document.createElement("div");
  subtitleSpan.className = "gallery-view__caption-subtitle";
  const indexSpan = document.createElement("div");
  indexSpan.className = "gallery-view__caption-index";
  captionBlock.appendChild(headingEl);
  captionBlock.appendChild(titleSpan);
  captionBlock.appendChild(subtitleSpan);
  captionBlock.appendChild(indexSpan);

  const controls = document.createElement("div");
  controls.className = "art-slider__controls";

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "art-slider__btn art-slider__btn--nav";
  prevBtn.innerHTML = `<span class="art-slider__btn-icon">←</span>`;
  prevBtn.setAttribute("aria-label", "Предыдущий рисунок");

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "art-slider__btn art-slider__btn--nav";
  nextBtn.innerHTML = `<span class="art-slider__btn-icon">→</span>`;
  nextBtn.setAttribute("aria-label", "Следующий рисунок");

  controls.append(prevBtn, nextBtn);

  slider.append(frame, controls);
  sliderWrap.appendChild(slider);
  root.append(sliderWrap, captionBlock);

  function renderMeta() {
    const art = artworks[index];
    titleSpan.textContent = art.title;
    subtitleSpan.textContent = art.subtitle || "";
    indexSpan.textContent = `${index + 1} / ${artworks.length}`;
  }

  function goTo(delta) {
    const prevIndex = index;
    index = (index + delta + artworks.length) % artworks.length;

    images[prevIndex].classList.remove("art-slider__img--active");
    images[index].classList.add("art-slider__img--active");
    renderMeta();
    if (lightboxEl && lightboxEl.classList.contains("lightbox--open")) lightboxEl._update();
  }

  prevBtn.addEventListener("click", (e) => { e.stopPropagation(); goTo(-1); });
  nextBtn.addEventListener("click", (e) => { e.stopPropagation(); goTo(1); });

  let lightboxEl = null;

  function openFullscreen() {
    if (!lightboxEl) {
      lightboxEl = document.createElement("div");
      lightboxEl.className = "lightbox";
      lightboxEl.setAttribute("role", "dialog");
      lightboxEl.setAttribute("aria-modal", "true");
      lightboxEl.setAttribute("aria-label", "Просмотр в полном размере");
      lightboxEl.innerHTML = `
        <button type="button" class="lightbox__close" aria-label="Закрыть"></button>
        <div class="lightbox__content">
          <div class="lightbox__zoom-wrap">
            <img class="lightbox__img" src="" alt="" draggable="false" />
          </div>
          <div class="lightbox__meta">
            <div class="lightbox__title"></div>
            <div class="lightbox__subtitle"></div>
            <div class="lightbox__counter"></div>
          </div>
        </div>
        <button type="button" class="lightbox__prev" aria-label="Предыдущее"></button>
        <button type="button" class="lightbox__next" aria-label="Следующее"></button>
      `;
      document.body.appendChild(lightboxEl);
      const closeBtn = lightboxEl.querySelector(".lightbox__close");
      const prevBtnLb = lightboxEl.querySelector(".lightbox__prev");
      const nextBtnLb = lightboxEl.querySelector(".lightbox__next");
      const zoomWrap = lightboxEl.querySelector(".lightbox__zoom-wrap");
      const img = lightboxEl.querySelector(".lightbox__img");
      let scale = 1;
      let pinchStartScale = 1;
      let pinchStartDist = 0;
      let touchStartX = 0;
      const setZoom = (s) => {
        scale = Math.max(0.5, Math.min(4, s));
        zoomWrap.style.transform = "scale(" + scale + ")";
      };
      const resetZoom = () => { setZoom(1); };
      img.addEventListener("click", (e) => {
        e.stopPropagation();
        setZoom(scale > 1 ? 1 : 2);
      });
      img.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) touchStartX = e.touches[0].clientX;
        if (e.touches.length === 2) {
          pinchStartScale = scale;
          pinchStartDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        }
      }, { passive: true });
      img.addEventListener("touchmove", (e) => {
        if (e.touches.length === 2 && pinchStartDist > 0) {
          const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          setZoom(pinchStartScale * (d / pinchStartDist));
        }
      }, { passive: true });
      img.addEventListener("touchend", () => { pinchStartDist = 0; }, { passive: true });
      zoomWrap.addEventListener("touchstart", (e) => { if (e.touches.length === 1) touchStartX = e.touches[0].clientX; }, { passive: true });
      zoomWrap.addEventListener("touchend", (e) => {
        if (e.changedTouches.length === 1 && pinchStartDist === 0) {
          const dx = e.changedTouches[0].clientX - touchStartX;
          if (Math.abs(dx) > 50) goTo(dx > 0 ? -1 : 1);
        }
      }, { passive: true });
      const updateLightbox = () => {
        const a = artworks[index];
        const primaryUrl = a.imageUrl;
        let rawUrls = [primaryUrl];
        imageFallbackUrls(a.imageUrl).forEach(function (u) { if (rawUrls.indexOf(u) === -1) rawUrls.push(u); });
        let urlsToTry = rawUrls.map(resolveGalleryImageUrl);
        urlsToTry = urlsToTry.filter(function (u, idx) { return urlsToTry.indexOf(u) === idx; });
        img._lightboxTryIndex = 0;
        img.src = urlsToTry[0];
        img.alt = a.title;
        img.onerror = function () {
          img._lightboxTryIndex = (img._lightboxTryIndex || 0) + 1;
          if (img._lightboxTryIndex < urlsToTry.length) img.src = urlsToTry[img._lightboxTryIndex];
        };
        lightboxEl.querySelector(".lightbox__title").textContent = a.title;
        lightboxEl.querySelector(".lightbox__subtitle").textContent = a.subtitle;
        lightboxEl.querySelector(".lightbox__counter").textContent = `${index + 1} / ${artworks.length}`;
        resetZoom();
      };
      const close = () => {
        lightboxEl.classList.remove("lightbox--open");
        document.body.style.overflow = "";
        document.removeEventListener("keydown", onKey);
        resetZoom();
      };
      const onKey = (e) => {
        if (e.key === "Escape") close();
        else if (e.key === "ArrowLeft") goTo(-1);
        else if (e.key === "ArrowRight") goTo(1);
      };
      closeBtn.addEventListener("click", close);
      lightboxEl.addEventListener("click", (e) => { if (e.target === lightboxEl) close(); });
      prevBtnLb.addEventListener("click", (e) => { e.stopPropagation(); goTo(-1); });
      nextBtnLb.addEventListener("click", (e) => { e.stopPropagation(); goTo(1); });
      lightboxEl._update = updateLightbox;
      lightboxEl._close = close;
      lightboxEl._onKey = onKey;
    }
    lightboxEl._update();
    lightboxEl.classList.add("lightbox--open");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", lightboxEl._onKey);
  }

  function onFrameClick() {
    createSakuraPetals(frame);
    openFullscreen();
  }

  frame.addEventListener("click", onFrameClick);
  frame.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFrameClick(); } });

  let touchStartX = 0;
  frame.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  frame.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) goTo(dx > 0 ? -1 : 1);
  }, { passive: true });

  renderMeta();

  return {
    root,
    destroy() {
      if (lightboxEl && lightboxEl.classList.contains("lightbox--open")) {
        lightboxEl._close();
      }
      prevBtn.replaceWith(prevBtn.cloneNode(true));
      nextBtn.replaceWith(nextBtn.cloneNode(true));
      frame.removeEventListener("click", onFrameClick);
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

function renderMain() {
  clearView();
  appContent.classList.remove("app-content--gallery", "app-content--about");
  appContent.classList.add("app-content--main");
}

async function renderGallery() {
  clearView();

  appContent.classList.remove("app-content--main", "app-content--about");
  appContent.classList.add("app-content--gallery");

  const artworks = await fetchArtworks();
  const sliderComponent = createArtSlider(artworks);
  appContent.appendChild(sliderComponent.root);

  currentViewCleanup = () => sliderComponent.destroy();
}

function renderAbout() {
  clearView();

  appContent.classList.remove("app-content--main", "app-content--gallery");
  appContent.classList.add("app-content--about");

  const wrapper = document.createElement("section");
  wrapper.className = "about-view";

  wrapper.innerHTML = `
    <h2 class="about-view__title">Даша и её мир</h2>
    <p class="about-view__text">
      Искусство рождается там, где сердце встречается с тишиной. Для Даши каждый рисунок — это не просто линии, а поиск гармонии, красоты и чистого света. В её работах оживают мечты, природа и те самые искренние чувства, которые сложно передать словами.
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
    case APP_STATES.MAIN:
      renderMain();
      break;
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

// ---------- СТАРТОВАЯ СТРАНИЦА: start.png, кнопки Заставка / Сайт ----------

function playClickSound() {
  playPapyrusClick(0);
}

function playPapyrusClick(variant) {
  try {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    const ctx = new C();
    const duration = 0.055;
    const buf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    const decay = 0.012 + variant * 0.003;
    const freq = 600 + variant * 120;
    for (let i = 0; i < buf.length; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * decay));
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(0);
    src.stop(duration);
  } catch (_) {}
}

function setupIntroScene() {
  const intro = document.getElementById("intro-layer");
  const contentEl = document.getElementById("intro-content");
  const buttonsWrap = document.getElementById("intro-buttons");
  const btnZastavka = document.getElementById("intro-btn-zastavka");
  const btnSite = document.getElementById("intro-btn-site");
  const videoWrap = document.getElementById("intro-video-wrap");
  const video = document.getElementById("intro-video");
  const appShell = document.getElementById("app-shell");

  if (!intro || !contentEl || !buttonsWrap || !btnZastavka || !btnSite || !videoWrap || !video || !appShell) return;

  function goToMain() {
    intro.classList.remove("intro--active");
    intro.classList.add("intro--hidden");
    appShell.classList.add("app-shell--active");
    AppState.setState(APP_STATES.MAIN);
  }

  function onZastavkaClick() {
    playClickSound();
    contentEl.classList.add("intro__content--hidden");
    videoWrap.classList.add("intro__video-wrap--active");

    const onEnded = () => {
      video.removeEventListener("ended", onEnded);
      videoWrap.classList.remove("intro__video-wrap--active");
      goToMain();
    };
    video.addEventListener("ended", onEnded, { once: true });

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        videoWrap.classList.remove("intro__video-wrap--active");
        contentEl.classList.remove("intro__content--hidden");
      });
    }
  }

  function onSiteClick() {
    playClickSound();
    goToMain();
  }

  btnZastavka.addEventListener("click", onZastavkaClick, { once: true });
  btnSite.addEventListener("click", onSiteClick, { once: true });
}

// ---------- МАГИЯ САКУРЫ (лепестки при клике по меню) ----------

function createSakuraPetals(originEl) {
  const container = document.getElementById("sakura-container");
  if (!container) return;

  const rect = originEl.getBoundingClientRect();
  const count = 14;
  const petalSize = 10;

  for (let i = 0; i < count; i++) {
    const petal = document.createElement("div");
    petal.className = "sakura-petal";
    const x = rect.left + Math.random() * rect.width;
    const y = rect.top + Math.random() * rect.height;
    const drift = (Math.random() - 0.5) * 120;
    const duration = 2.2 + Math.random() * 1.4;
    const delay = Math.random() * 0.3;
    petal.style.setProperty("--sakura-x", x + "px");
    petal.style.setProperty("--sakura-y", y + "px");
    petal.style.setProperty("--sakura-drift", drift + "px");
    petal.style.setProperty("--sakura-duration", duration + "s");
    petal.style.setProperty("--sakura-delay", delay + "s");
    petal.style.setProperty("--sakura-size", (petalSize + Math.random() * 6) + "px");
    container.appendChild(petal);
    petal.addEventListener("animationend", () => petal.remove());
  }

  document.body.classList.add("sakura-sway");
  setTimeout(() => document.body.classList.remove("sakura-sway"), 600);
}

function setupSakuraOnNav() {
  const links = document.querySelectorAll(".top-nav__link");
  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      createSakuraPetals(link);
    });
  });
}

// ---------- МАГИЯ FUJI: живые лепестки, шорох, музыка (по умолчанию всё выключено) ----------

const FUJI_STORAGE = { petals: "soulart_fuji_petals", wind: "soulart_fuji_wind", music: "soulart_fuji_music", track: "soulart_fuji_track" };
const FUJI_TRACKS = ["./audio/fuji-1.mp3", "./audio/fuji-2.mp3"];
const PETAL_COUNT_MIN = 0;
const PETAL_COUNT_MAX = 30;
const FUJI_FADE_DURATION_MS = 400;

function getFujiPrefs() {
  const p = parseInt(localStorage.getItem(FUJI_STORAGE.petals), 10);
  const w = parseInt(localStorage.getItem(FUJI_STORAGE.wind), 10);
  const m = parseInt(localStorage.getItem(FUJI_STORAGE.music), 10);
  const t = parseInt(localStorage.getItem(FUJI_STORAGE.track), 10);
  return {
    petals: isNaN(p) || p < PETAL_COUNT_MIN ? 0 : Math.min(p, PETAL_COUNT_MAX),
    wind: isNaN(w) || w < 0 ? 0 : Math.min(100, w),
    music: isNaN(m) || m < 0 ? 0 : Math.min(100, m),
    track: (t === 1 || t === 2) ? t : 1,
  };
}

function setFujiPref(key, value) {
  try {
    localStorage.setItem(FUJI_STORAGE[key], String(value));
  } catch (_) {}
}

let fujiMagicState = {
  petalCount: 0,
  windVolume: 0,
  musicVolume: 0,
  currentTrack: 1,
  petalInterval: null,
  windNode: null,
  windGain: null,
  audioContext: null,
  musicEl: null,
  panelPetalsOpen: false,
  panelMusicOpen: false,
};

function spawnLivingPetal() {
  const container = document.getElementById("sakura-container");
  if (!container) return null;
  const petal = document.createElement("div");
  petal.className = "sakura-petal sakura-petal--living";
  const x = Math.random() * (typeof window !== "undefined" ? window.innerWidth : 400);
  const size = 6 + Math.random() * 14;
  const opacity = 0.35 + Math.random() * 0.6;
  const drift = (Math.random() - 0.5) * 140;
  const duration = 2.5 + Math.random() * 2;
  const delay = Math.random() * 0.2;
  petal.style.setProperty("--sakura-x", x + "px");
  petal.style.setProperty("--sakura-y", "-30px");
  petal.style.setProperty("--sakura-drift", drift + "px");
  petal.style.setProperty("--sakura-duration", duration + "s");
  petal.style.setProperty("--sakura-delay", delay + "s");
  petal.style.setProperty("--sakura-size", size + "px");
  petal.style.setProperty("--sakura-opacity", String(opacity));
  container.appendChild(petal);
  petal.addEventListener("animationend", () => petal.remove());
  return petal;
}

function startPetalLoop(count) {
  stopPetalLoop();
  if (count <= 0) return;
  const container = document.getElementById("sakura-container");
  if (!container) return;
  let spawned = 0;
  function tick() {
    if (AppState.current !== APP_STATES.MAIN) return;
    const current = container.querySelectorAll(".sakura-petal--living").length;
    if (current < fujiMagicState.petalCount) {
      spawnLivingPetal();
    }
  }
  fujiMagicState.petalInterval = setInterval(tick, 500);
  for (let i = 0; i < Math.min(count, 5); i++) spawnLivingPetal();
}

function stopPetalLoop() {
  if (fujiMagicState.petalInterval) {
    clearInterval(fujiMagicState.petalInterval);
    fujiMagicState.petalInterval = null;
  }
}

function getWindNode() {
  if (!fujiMagicState.audioContext) {
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      fujiMagicState.audioContext = new C();
    } catch (_) {
      return null;
    }
  }
  if (fujiMagicState.windNode) return fujiMagicState.windGain;
  try {
    const ctx = fujiMagicState.audioContext;
    const duration = 2;
    const sampleRate = ctx.sampleRate;
    const buf = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const ch = buf.getChannelData(0);
    let b = 0;
    for (let i = 0; i < ch.length; i++) {
      b = 0.98 * b + (Math.random() * 2 - 1) * 0.02;
      ch[i] = b * 0.4;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800;
    fujiMagicState.windGain = ctx.createGain();
    fujiMagicState.windGain.gain.value = 0;
    src.connect(filter);
    filter.connect(fujiMagicState.windGain);
    fujiMagicState.windGain.connect(ctx.destination);
    src.start(0);
    fujiMagicState.windNode = src;
  } catch (_) {}
  return fujiMagicState.windGain;
}

function setWindVolume(vol) {
  fujiMagicState.windVolume = vol;
  const g = getWindNode();
  if (g) g.gain.setTargetAtTime((vol / 100) * 0.22, fujiMagicState.audioContext.currentTime, 0.05);
}

function stopWind() {
  setWindVolume(0);
}

function getMusicEl() {
  if (fujiMagicState.musicEl) return fujiMagicState.musicEl;
  fujiMagicState.musicEl = new window.Audio();
  fujiMagicState.musicEl.loop = true;
  fujiMagicState.musicEl.volume = 0;
  const idx = fujiMagicState.currentTrack - 1;
  if (FUJI_TRACKS[idx]) fujiMagicState.musicEl.src = FUJI_TRACKS[idx];
  return fujiMagicState.musicEl;
}

function setMusicVolume(vol) {
  fujiMagicState.musicVolume = vol;
  const el = getMusicEl();
  el.volume = Math.min(1, vol / 100);
  if (vol > 0) {
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } else {
    el.pause();
  }
}

function fadeMusicTo(targetVolume, onDone) {
  const el = fujiMagicState.musicEl;
  if (!el) {
    if (onDone) onDone();
    return;
  }
  const startVol = el.volume;
  const start = performance.now();
  function tick(now) {
    const elapsed = now - start;
    const t = Math.min(1, elapsed / FUJI_FADE_DURATION_MS);
    const smooth = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    el.volume = startVol + (targetVolume - startVol) * smooth;
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      if (onDone) onDone();
    }
  }
  requestAnimationFrame(tick);
}

function setFujiMusicTrack(trackNum) {
  if (trackNum !== 1 && trackNum !== 2) return;
  if (fujiMagicState.currentTrack === trackNum) return;
  const el = getMusicEl();
  const currentVol = fujiMagicState.musicVolume / 100;
  const playing = currentVol > 0 && !el.paused;
  if (playing) {
    fadeMusicTo(0, () => {
      fujiMagicState.currentTrack = trackNum;
      el.src = FUJI_TRACKS[trackNum - 1];
      el.play().catch(() => {});
      el.volume = 0;
      fadeMusicTo(currentVol, null);
    });
  } else {
    fujiMagicState.currentTrack = trackNum;
    el.src = FUJI_TRACKS[trackNum - 1];
    el.volume = currentVol;
    if (currentVol > 0) el.play().catch(() => {});
  }
  setFujiPref("track", trackNum);
}

function stopMusic() {
  setMusicVolume(0);
  if (fujiMagicState.musicEl) fujiMagicState.musicEl.pause();
}

function buildFujiMagicPanel() {
  const wrap = document.getElementById("fuji-magic-widget");
  if (!wrap) return;
  const prefs = getFujiPrefs();
  fujiMagicState.petalCount = prefs.petals;
  fujiMagicState.windVolume = prefs.wind;
  fujiMagicState.musicVolume = prefs.music;
  fujiMagicState.currentTrack = prefs.track;

  wrap.innerHTML =
    '<div class="fuji-magic__ball-wrap fuji-magic__ball-wrap--left">' +
    '<div class="fuji-ball fuji-ball--petals" id="fuji-ball-petals" role="button" tabindex="0" aria-label="Лепестки и ветер" aria-expanded="false">' +
    '<span class="fuji-ball__icon" aria-hidden="true">🌸</span>' +
    '<span class="fuji-ball__label">Лепестки</span>' +
    '<div class="fuji-ball__panel fuji-magic__panel" id="fuji-panel-petals">' +
    '<div class="fuji-magic__row"><span class="fuji-magic__label">Лепестки</span>' +
    '<div class="fuji-magic__count">' +
    '<button type="button" class="fuji-magic__btn" id="fuji-petals-minus" aria-label="Меньше">−</button>' +
    '<span class="fuji-magic__num" id="fuji-petals-num">' + prefs.petals + "</span>" +
    '<button type="button" class="fuji-magic__btn" id="fuji-petals-plus" aria-label="Больше">+</button>' +
    "</div></div>" +
    '<div class="fuji-magic__row"><span class="fuji-magic__label">Ветер</span>' +
    '<label class="fuji-magic__slider-wrap">' +
    '<input type="range" class="fuji-magic__range" id="fuji-wind-slider" min="0" max="100" value="' + prefs.wind + '" aria-label="Громкость ветра" />' +
    "</label></div></div></div>" +
    '</div>' +
    '<div class="fuji-magic__ball-wrap fuji-magic__ball-wrap--right">' +
    '<div class="fuji-ball fuji-ball--music" id="fuji-ball-music" role="button" tabindex="0" aria-label="Музыка" aria-expanded="false">' +
    '<span class="fuji-ball__icon" aria-hidden="true">♪</span>' +
    '<span class="fuji-ball__label">Музыка</span>' +
    '<div class="fuji-ball__panel fuji-magic__panel" id="fuji-panel-music">' +
    '<div class="fuji-magic__row"><span class="fuji-magic__label">Трек</span>' +
    '<div class="fuji-magic__tracks">' +
    '<button type="button" class="fuji-magic__track-btn' + (prefs.track === 1 ? ' fuji-magic__track-btn--active' : '') + '" id="fuji-track-1" data-track="1">Трек 1</button>' +
    '<button type="button" class="fuji-magic__track-btn' + (prefs.track === 2 ? ' fuji-magic__track-btn--active' : '') + '" id="fuji-track-2" data-track="2">Трек 2</button>' +
    "</div></div>" +
    '<div class="fuji-magic__row fuji-magic__row--toggle">' +
    '<span class="fuji-magic__label">Звук</span>' +
    '<button type="button" class="fuji-magic__onoff" id="fuji-music-onoff" aria-label="Включить или выключить музыку">Вкл</button>' +
    "</div>" +
    '<div class="fuji-magic__row"><span class="fuji-magic__label">Громкость</span>' +
    '<label class="fuji-magic__slider-wrap">' +
    '<input type="range" class="fuji-magic__range" id="fuji-music-slider" min="0" max="100" value="' + prefs.music + '" aria-label="Громкость музыки" />' +
    "</label></div></div></div></div></div>";

  const ballPetals = document.getElementById("fuji-ball-petals");
  const ballMusic = document.getElementById("fuji-ball-music");
  const panelPetals = document.getElementById("fuji-panel-petals");
  const panelMusic = document.getElementById("fuji-panel-music");
  const minusBtn = document.getElementById("fuji-petals-minus");
  const plusBtn = document.getElementById("fuji-petals-plus");
  const numEl = document.getElementById("fuji-petals-num");
  const windSlider = document.getElementById("fuji-wind-slider");
  const musicSlider = document.getElementById("fuji-music-slider");
  const track1Btn = document.getElementById("fuji-track-1");
  const track2Btn = document.getElementById("fuji-track-2");
  const musicOnOffBtn = document.getElementById("fuji-music-onoff");

  function isMusicPlaying() {
    const el = fujiMagicState.musicEl;
    return el && el.volume > 0 && !el.paused;
  }

  function updateMusicOnOffLabel() {
    if (!musicOnOffBtn) return;
    const on = isMusicPlaying();
    musicOnOffBtn.textContent = on ? "Выкл" : "Вкл";
    musicOnOffBtn.classList.toggle("fuji-magic__onoff--on", on);
    musicOnOffBtn.setAttribute("aria-label", on ? "Выключить музыку" : "Включить музыку");
  }

  function togglePanel(ball, panel, isOpenKey, onClose) {
    return function (e) {
      if (e.target.closest(".fuji-magic__panel")) return;
      const wasOpen = fujiMagicState[isOpenKey];
      fujiMagicState[isOpenKey] = !fujiMagicState[isOpenKey];
      panel.classList.toggle("fuji-ball__panel--open", fujiMagicState[isOpenKey]);
      ball.setAttribute("aria-expanded", fujiMagicState[isOpenKey]);
      if (wasOpen && !fujiMagicState[isOpenKey] && onClose) onClose();
    };
  }
  if (ballPetals && panelPetals) {
    ballPetals.addEventListener("click", togglePanel(ballPetals, panelPetals, "panelPetalsOpen", null));
    ballPetals.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ballPetals.click(); } });
  }
  if (ballMusic && panelMusic) {
    ballMusic.addEventListener("click", togglePanel(ballMusic, panelMusic, "panelMusicOpen", function () {
      setMusicVolume(0);
      setFujiPref("music", 0);
      if (musicSlider) musicSlider.value = 0;
      updateMusicOnOffLabel();
    }));
    ballMusic.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ballMusic.click(); } });
  }

  function updatePetalCount(delta) {
    let n = fujiMagicState.petalCount + delta;
    n = Math.max(PETAL_COUNT_MIN, Math.min(PETAL_COUNT_MAX, n));
    fujiMagicState.petalCount = n;
    setFujiPref("petals", n);
    if (numEl) numEl.textContent = n;
    if (AppState.current === APP_STATES.MAIN) startPetalLoop(n);
  }
  if (minusBtn) minusBtn.addEventListener("click", (e) => { e.stopPropagation(); updatePetalCount(-1); });
  if (plusBtn) plusBtn.addEventListener("click", (e) => { e.stopPropagation(); updatePetalCount(1); });
  if (numEl) numEl.textContent = fujiMagicState.petalCount;

  if (windSlider) {
    windSlider.addEventListener("input", () => {
      const v = parseInt(windSlider.value, 10) || 0;
      setFujiPref("wind", v);
      setWindVolume(v);
    });
    windSlider.addEventListener("click", (e) => e.stopPropagation());
  }
  if (musicSlider) {
    musicSlider.addEventListener("input", () => {
      const v = parseInt(musicSlider.value, 10) || 0;
      setFujiPref("music", v);
      setMusicVolume(v);
      updateMusicOnOffLabel();
    });
    musicSlider.addEventListener("click", (e) => e.stopPropagation());
  }

  if (musicOnOffBtn) {
    musicOnOffBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isMusicPlaying()) {
        setMusicVolume(0);
        setFujiPref("music", 0);
        // Ползунок не трогаем — при «Вкл» снова будет прежняя громкость
      } else {
        const v = Math.max(parseInt(musicSlider?.value, 10) || 50, 10);
        setFujiPref("music", v);
        setMusicVolume(v);
        if (musicSlider) musicSlider.value = v;
      }
      updateMusicOnOffLabel();
    });
    updateMusicOnOffLabel();
  }

  function setTrackActive(trackNum) {
    [track1Btn, track2Btn].forEach((btn, i) => {
      if (btn) btn.classList.toggle("fuji-magic__track-btn--active", i + 1 === trackNum);
    });
    setFujiMusicTrack(trackNum);
  }
  if (track1Btn) track1Btn.addEventListener("click", (e) => { e.stopPropagation(); setTrackActive(1); });
  if (track2Btn) track2Btn.addEventListener("click", (e) => { e.stopPropagation(); setTrackActive(2); });
}

function setupFujiMagic() {
  buildFujiMagicPanel();
  AppState.subscribe((state) => {
    const wrap = document.getElementById("fuji-magic-widget");
    if (!wrap) return;
    if (state === APP_STATES.MAIN) {
      wrap.removeAttribute("aria-hidden");
      wrap.classList.add("fuji-magic-widget--visible");
      const prefs = getFujiPrefs();
      fujiMagicState.petalCount = prefs.petals;
      fujiMagicState.windVolume = prefs.wind;
      fujiMagicState.musicVolume = prefs.music;
      fujiMagicState.currentTrack = prefs.track;
      startPetalLoop(prefs.petals);
      setWindVolume(prefs.wind);
      // Музыка не включается автоматически — пользователь включает сам через кнопку «Музыка» и ползунок
      if (fujiMagicState.musicEl) {
        fujiMagicState.musicEl.volume = 0;
        fujiMagicState.musicEl.pause();
      }
    } else {
      wrap.setAttribute("aria-hidden", "true");
      wrap.classList.remove("fuji-magic-widget--visible");
      stopPetalLoop();
      stopWind();
      stopMusic();
    }
  });
}

// ---------- НАВИГАЦИЯ (кнопки в шапке) ----------

function setupTopNav() {
  const navButtons = document.querySelectorAll(".top-nav__link");

  setupSakuraOnNav();

  navButtons.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href") || "";
      const sound = link.getAttribute("data-sound") || "gallery";
      const soundIndex = sound === "gallery" ? 0 : sound === "stories" ? 1 : 2;
      playPapyrusClick(soundIndex);
      if (href.indexOf("stories.html") !== -1) {
        e.preventDefault();
        setTimeout(() => { window.location.href = href; }, 120);
        return;
      }
      const hash = href.split("#")[1];
      if (hash) {
        e.preventDefault();
        setTimeout(() => { window.location.hash = hash; }, 80);
      }
    });
  });

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

  AppState.subscribe((state) => {
    if (state === APP_STATES.INTRO) return;
    updateActiveButton(state);
    document.body.classList.toggle("fuji-visible", state === APP_STATES.MAIN);
    if (location.hash === "#admin") location.hash = "";
    renderState(state);
  });

  window.addEventListener("hashchange", () => {
    if (location.hash === "#admin" && AppState.current !== APP_STATES.INTRO) {
      location.hash = "";
      AppState.setState(APP_STATES.GALLERY);
    }
    if (location.hash === "#gallery" && AppState.current !== APP_STATES.INTRO) {
      AppState.setState(APP_STATES.GALLERY);
    }
    if (location.hash === "#about" && AppState.current !== APP_STATES.INTRO) {
      AppState.setState(APP_STATES.ABOUT);
    }
  });
}

// ---------- ИНИЦИАЛИЗАЦИЯ ----------
// Атмосфера (Фон и Текст) подключается через atmosphere.js и сохраняется в localStorage.

window.addEventListener("DOMContentLoaded", () => {
  setupIntroScene();
  setupTopNav();
  setupFujiMagic();

  const intro = document.getElementById("intro-layer");
  const appShell = document.getElementById("app-shell");
  const hash = location.hash;

  if ((hash === "#gallery" || hash === "#about") && intro && appShell) {
    intro.classList.remove("intro--active");
    intro.classList.add("intro--hidden");
    appShell.classList.add("app-shell--active");
    AppState.setState(hash === "#gallery" ? APP_STATES.GALLERY : APP_STATES.ABOUT);
  }

  const studioLink = document.getElementById("footer-studio-link");
  if (studioLink) {
    studioLink.addEventListener("click", (e) => {
      e.preventDefault();
      playPapyrusClick(3);
      setTimeout(() => { window.location.href = studioLink.getAttribute("href"); }, 120);
    });
  }
});

