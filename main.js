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
  let expanded = false;

  const expandBtn = document.createElement("button");
  expandBtn.type = "button";
  expandBtn.className = "art-slider__expand";
  expandBtn.setAttribute("aria-label", "Развернуть слайдер");
  expandBtn.innerHTML = `<span class="art-slider__expand-icon" aria-hidden="true">⊞</span>`;

  const frame = document.createElement("div");
  frame.className = "art-slider__frame";

  const images = artworks.map((art, i) => {
    const img = document.createElement("img");
    img.className = "art-slider__img" + (i === 0 ? " art-slider__img--active" : "");
    img.src = art.imageUrl;
    img.alt = art.title;
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
  sliderWrap.appendChild(expandBtn);
  root.append(sliderWrap, captionBlock);

  function renderMeta() {
    const art = artworks[index];
    titleSpan.textContent = art.title;
    subtitleSpan.textContent = art.subtitle || "";
    indexSpan.textContent = `${index + 1} / ${artworks.length}`;
  }

  expandBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    expanded = !expanded;
    dragOffsetX = 0;
    sliderWrap.style.removeProperty("transform");
    sliderWrap.classList.toggle("gallery-view__slider-wrap--expanded", expanded);
    expandBtn.setAttribute("aria-label", expanded ? "Свернуть слайдер" : "Развернуть слайдер");
    expandBtn.querySelector(".art-slider__expand-icon").textContent = expanded ? "⊟" : "⊞";
  });

  let dragOffsetX = 0;
  let isDragging = false;
  let startClientX = 0;
  let startTranslateX = 0;

  function onDragStart(e) {
    if (e.target.closest(".art-slider__btn, .art-slider__expand") || e.target.closest(".art-slider__frame")) return;
    isDragging = true;
    startClientX = e.type.indexOf("touch") >= 0 ? e.touches[0].clientX : e.clientX;
    startTranslateX = dragOffsetX;
    sliderWrap.classList.add("gallery-view__slider-wrap--dragging");
  }
  function onDragMove(e) {
    if (!isDragging) return;
    const clientX = e.type.indexOf("touch") >= 0 ? e.touches[0].clientX : e.clientX;
    const dx = clientX - startClientX;
    const max = Math.max(0, (window.innerWidth - sliderWrap.offsetWidth) / 2);
    dragOffsetX = Math.max(-max, Math.min(max, startTranslateX + dx));
    sliderWrap.style.transform = "translateX(" + dragOffsetX + "px)";
  }
  function onDragEnd() {
    isDragging = false;
    sliderWrap.classList.remove("gallery-view__slider-wrap--dragging");
  }

  sliderWrap.addEventListener("mousedown", onDragStart);
  sliderWrap.addEventListener("touchstart", onDragStart, { passive: true });
  document.addEventListener("mousemove", onDragMove);
  document.addEventListener("touchmove", onDragMove, { passive: true });
  document.addEventListener("mouseup", onDragEnd);
  document.addEventListener("touchend", onDragEnd);

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
    const art = artworks[index];
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
          <button type="button" class="lightbox__zoom-btn" aria-label="Увеличить или уменьшить"></button>
        </div>
        <button type="button" class="lightbox__prev" aria-label="Предыдущее"></button>
        <button type="button" class="lightbox__next" aria-label="Следующее"></button>
      `;
      document.body.appendChild(lightboxEl);
      const closeBtn = lightboxEl.querySelector(".lightbox__close");
      const prevBtnLb = lightboxEl.querySelector(".lightbox__prev");
      const nextBtnLb = lightboxEl.querySelector(".lightbox__next");
      const zoomWrap = lightboxEl.querySelector(".lightbox__zoom-wrap");
      const zoomBtn = lightboxEl.querySelector(".lightbox__zoom-btn");
      const img = lightboxEl.querySelector(".lightbox__img");
      let scale = 1;
      let pinchStartScale = 1;
      let pinchStartDist = 0;
      const setZoom = (s) => {
        scale = Math.max(0.5, Math.min(4, s));
        zoomWrap.style.transform = "scale(" + scale + ")";
        zoomBtn.textContent = scale > 1 ? "−" : "+";
        zoomBtn.setAttribute("aria-label", scale > 1 ? "Уменьшить" : "Увеличить");
      };
      const resetZoom = () => { setZoom(1); };
      zoomBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        setZoom(scale > 1 ? 1 : 2);
      });
      img.addEventListener("click", (e) => {
        e.stopPropagation();
        setZoom(scale > 1 ? 1 : 2);
      });
      img.addEventListener("touchstart", (e) => {
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
      const updateLightbox = () => {
        const a = artworks[index];
        img.src = a.imageUrl;
        img.alt = a.title;
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
      sliderWrap.removeEventListener("mousedown", onDragStart);
      sliderWrap.removeEventListener("touchstart", onDragStart);
      document.removeEventListener("mousemove", onDragMove);
      document.removeEventListener("touchmove", onDragMove);
      document.removeEventListener("mouseup", onDragEnd);
      document.removeEventListener("touchend", onDragEnd);
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

function setupIntroScene() {
  const intro = document.getElementById("intro-layer");
  const buttonsWrap = document.getElementById("intro-buttons");
  const btnZastavka = document.getElementById("intro-btn-zastavka");
  const btnSite = document.getElementById("intro-btn-site");
  const videoWrap = document.getElementById("intro-video-wrap");
  const video = document.getElementById("intro-video");
  const appShell = document.getElementById("app-shell");

  if (!intro || !buttonsWrap || !btnZastavka || !btnSite || !videoWrap || !video || !appShell) return;

  function goToMain() {
    intro.classList.remove("intro--active");
    intro.classList.add("intro--hidden");
    appShell.classList.add("app-shell--active");
    AppState.setState(APP_STATES.MAIN);
  }

  function onZastavkaClick() {
    buttonsWrap.classList.add("intro__buttons--hidden");
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
        buttonsWrap.classList.remove("intro__buttons--hidden");
      });
    }
  }

  function onSiteClick() {
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

// ---------- НАВИГАЦИЯ (кнопки в шапке) ----------

function setupTopNav() {
  const navButtons = document.querySelectorAll(".top-nav__link");

  setupSakuraOnNav();

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

function setupAtmosphereWidget() {
  const container = document.getElementById("atmosphere-widget");
  if (!container) return;

  container.innerHTML = `
    <button type="button" class="atmosphere-widget__trigger" id="atmosphere-trigger" aria-label="Настройки атмосферы" aria-expanded="false">
      <span class="atmosphere-widget__sun" aria-hidden="true">☀</span>
    </button>
    <div class="atmosphere-widget__panel" id="atmosphere-panel" role="dialog" aria-label="Настройки яркости" hidden>
      <div class="atmosphere-widget__panel-inner">
        <span class="atmosphere-widget__panel-title">Атмосфера</span>
        <label class="brightness-control" for="brightness-mountain-slider">
          <span class="brightness-control__label">Фон</span>
          <input id="brightness-mountain-slider" class="brightness-control__range" type="range" min="40" max="200" value="120" aria-label="Яркость фона" />
        </label>
        <label class="brightness-control" for="brightness-text-slider">
          <span class="brightness-control__label">Текст</span>
          <input id="brightness-text-slider" class="brightness-control__range" type="range" min="40" max="200" value="120" aria-label="Прозрачность текста" />
        </label>
      </div>
    </div>
  `;

  const trigger = document.getElementById("atmosphere-trigger");
  const panel = document.getElementById("atmosphere-panel");

  if (trigger && panel) {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const willBeOpen = panel.hidden;
      panel.hidden = !willBeOpen;
      trigger.setAttribute("aria-expanded", String(willBeOpen));
    });
    document.addEventListener("click", (e) => {
      if (!panel.hidden && container && !container.contains(e.target)) {
        panel.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      }
    });
  }

  setupMountainBrightnessControl();
  setupTextBrightnessControl();
}

function setupBrightnessControl() {
  setupAtmosphereWidget();
}

// ---------- ИНИЦИАЛИЗАЦИЯ ----------

window.addEventListener("DOMContentLoaded", () => {
  setupIntroScene();
  setupTopNav();
  setupBrightnessControl();

  const intro = document.getElementById("intro-layer");
  const appShell = document.getElementById("app-shell");
  const hash = location.hash;

  if ((hash === "#gallery" || hash === "#about") && intro && appShell) {
    intro.classList.remove("intro--active");
    intro.classList.add("intro--hidden");
    appShell.classList.add("app-shell--active");
    AppState.setState(hash === "#gallery" ? APP_STATES.GALLERY : APP_STATES.ABOUT);
  }
});

