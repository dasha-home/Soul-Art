/**
 * Total site translation: 9 languages, globe in top-right, papyrus menu, localStorage sync.
 * RU, EN, JP, IT, CN, ES, DE, FR, HE
 */
(function () {
  const LANG_STORAGE_KEY = "soulart_lang";
  const SUPPORTED = [
    { code: "ru", name: "Русский", flag: "🇷🇺" },
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "jp", name: "日本語", flag: "🇯🇵" },
    { code: "it", name: "Italiano", flag: "🇮🇹" },
    { code: "zh", name: "中文", flag: "🇨🇳" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "he", name: "עברית", flag: "🇮🇱" },
  ];
  const DEFAULT_LANG = "ru";

  const I18N = {
    brand: { ru: "Даша Художник", en: "Dasha Artist", jp: "ダーシャ・アーティスト", it: "Dasha Artista", zh: "达莎·画家", es: "Dasha Artista", de: "Dasha Künstlerin", fr: "Dasha Artiste", he: "דשה אמן" },
    intro_btn_zastavka: { ru: "Заставка", en: "Screensaver", jp: "スクリーンセーバー", it: "Salvaschermo", zh: "屏保", es: "Salvapantallas", de: "Bildschirmschoner", fr: "Écran de veille", he: "מסך נעילה" },
    intro_btn_site: { ru: "Сайт", en: "Site", jp: "サイト", it: "Sito", zh: "网站", es: "Sitio", de: "Seite", fr: "Site", he: "אתר" },
    intro_aria_zastavka: { ru: "Смотреть заставку", en: "Watch screensaver", jp: "スクリーンセーバーを見る", it: "Guarda salvaschermo", zh: "观看屏保", es: "Ver salvapantallas", de: "Bildschirmschoner ansehen", fr: "Voir l'écran de veille", he: "צפה במסך נעילה" },
    intro_aria_site: { ru: "Перейти на сайт", en: "Go to site", jp: "サイトへ", it: "Vai al sito", zh: "进入网站", es: "Ir al sitio", de: "Zur Seite", fr: "Aller au site", he: "עבור לאתר" },
    nav_gallery: { ru: "Галерея", en: "Gallery", jp: "ギャラリー", it: "Galleria", zh: "画廊", es: "Galería", de: "Galerie", fr: "Galerie", he: "גלריה" },
    nav_stories: { ru: "Рассказы", en: "Stories", jp: "ストーリー", it: "Racconti", zh: "故事", es: "Relatos", de: "Geschichten", fr: "Histoires", he: "סיפורים" },
    nav_about: { ru: "О Даше", en: "About Dasha", jp: "ダーシャについて", it: "Su Dasha", zh: "关于达莎", es: "Sobre Dasha", de: "Über Dasha", fr: "À propos de Dasha", he: "על דשה" },
    footer_studio: { ru: "Derev Studio ©", en: "Derev Studio ©", jp: "Derev Studio ©", it: "Derev Studio ©", zh: "Derev Studio ©", es: "Derev Studio ©", de: "Derev Studio ©", fr: "Derev Studio ©", he: "Derev Studio ©" },
    gallery_heading: { ru: "Рисунки Даши", en: "Dasha's Drawings", jp: "ダーシャの絵", it: "Disegni di Dasha", zh: "达莎的画", es: "Dibujos de Dasha", de: "Dashas Zeichnungen", fr: "Dessins de Dasha", he: "הציורים של דשה" },
    gallery_heading_accent: { ru: "Даши", en: "Dasha", jp: "ダーシャ", it: "Dasha", zh: "达莎", es: "Dasha", de: "Dasha", fr: "Dasha", he: "דשה" },
    gallery_empty: { ru: "Пока нет ни одной работы. Как только JSON с рисунками появится в GitHub, этот блок автоматически превратится в интерактивную галерею.", en: "No artworks yet. Once the JSON with drawings appears on GitHub, this block will become an interactive gallery.", jp: "まだ作品がありません。", it: "Nessuna opera ancora.", zh: "暂无作品。", es: "Aún no hay obras.", de: "Noch keine Werke.", fr: "Pas encore d'œuvres.", he: "אין עדיין יצירות." },
    gallery_prev: { ru: "Предыдущий рисунок", en: "Previous", jp: "前へ", it: "Precedente", zh: "上一张", es: "Anterior", de: "Vorheriges", fr: "Précédent", he: "הקודם" },
    gallery_next: { ru: "Следующий рисунок", en: "Next", jp: "次へ", it: "Successivo", zh: "下一张", es: "Siguiente", de: "Nächstes", fr: "Suivant", he: "הבא" },
    lightbox_aria: { ru: "Просмотр в полном размере", en: "Full size view", jp: "全画面表示", it: "Vista a grandezza intera", zh: "全屏查看", es: "Vista a tamaño completo", de: "Vollansicht", fr: "Vue pleine taille", he: "תצוגה מלאה" },
    lightbox_close: { ru: "Закрыть", en: "Close", jp: "閉じる", it: "Chiudi", zh: "关闭", es: "Cerrar", de: "Schließen", fr: "Fermer", he: "סגור" },
    lightbox_prev: { ru: "Предыдущее", en: "Previous", jp: "前へ", it: "Precedente", zh: "上一张", es: "Anterior", de: "Vorheriges", fr: "Précédent", he: "הקודם" },
    lightbox_next: { ru: "Следующее", en: "Next", jp: "次へ", it: "Successivo", zh: "下一张", es: "Siguiente", de: "Nächstes", fr: "Suivant", he: "הבא" },
    about_title: { ru: "Даша и её мир", en: "Dasha and Her World", jp: "ダーシャと彼女の世界", it: "Dasha e il suo mondo", zh: "达莎和她的世界", es: "Dasha y su mundo", de: "Dasha und ihre Welt", fr: "Dasha et son monde", he: "דשה ועולם שלה" },
    about_text: { ru: "Искусство рождается там, где сердце встречается с тишиной. Для Даши каждый рисунок — это не просто линии, а поиск гармонии, красоты и чистого света. В её работах оживают мечты, природа и те самые искренние чувства, которые сложно передать словами.", en: "Art is born where the heart meets silence. For Dasha, every drawing is not just lines but a search for harmony, beauty, and pure light. In her works come to life dreams, nature, and those sincere feelings that are hard to put into words.", jp: "アートは心が静寂と出会うところで生まれます。", it: "L'arte nasce dove il cuore incontra il silenzio.", zh: "艺术在心灵与静默相遇之处诞生。", es: "El arte nace donde el corazón encuentra el silencio.", de: "Kunst entsteht, wo das Herz die Stille trifft.", fr: "L'art naît où le cœur rencontre le silence.", he: "אמנות נולדת במקום שבו הלב נפגש עם השקט." },
    petals_label: { ru: "Лепестки", en: "Petals", jp: "花びら", it: "Petali", zh: "花瓣", es: "Pétalos", de: "Blütenblätter", fr: "Pétales", he: "עלי כותרת" },
    wind_label: { ru: "Ветер", en: "Wind", jp: "風", it: "Vento", zh: "风", es: "Viento", de: "Wind", fr: "Vent", he: "רוח" },
    music_label: { ru: "Музыка", en: "Music", jp: "音楽", it: "Musica", zh: "音乐", es: "Música", de: "Musik", fr: "Musique", he: "מוזיקה" },
    track: { ru: "Трек", en: "Track", jp: "トラック", it: "Traccia", zh: "曲目", es: "Pista", de: "Track", fr: "Piste", he: "מסלול" },
    track_1: { ru: "Трек 1", en: "Track 1", jp: "トラック1", it: "Traccia 1", zh: "曲目 1", es: "Pista 1", de: "Track 1", fr: "Piste 1", he: "מסלול 1" },
    track_2: { ru: "Трек 2", en: "Track 2", jp: "トラック2", it: "Traccia 2", zh: "曲目 2", es: "Pista 2", de: "Track 2", fr: "Piste 2", he: "מסלול 2" },
    sound: { ru: "Звук", en: "Sound", jp: "サウンド", it: "Suono", zh: "声音", es: "Sonido", de: "Sound", fr: "Son", he: "צליל" },
    volume: { ru: "Громкость", en: "Volume", jp: "音量", it: "Volume", zh: "音量", es: "Volumen", de: "Lautstärke", fr: "Volume", he: "עוצמה" },
    on: { ru: "Вкл", en: "On", jp: "オン", it: "On", zh: "开", es: "On", de: "An", fr: "On", he: "פעיל" },
    off: { ru: "Выкл", en: "Off", jp: "オフ", it: "Off", zh: "关", es: "Off", de: "Aus", fr: "Off", he: "כבוי" },
    petals_aria: { ru: "Лепестки и ветер", en: "Petals and wind", jp: "花びらと風", it: "Petali e vento", zh: "花瓣与风", es: "Pétalos y viento", de: "Blütenblätter und Wind", fr: "Pétales et vent", he: "עלי כותרת ורוח" },
    music_aria: { ru: "Музыка", en: "Music", jp: "音楽", it: "Musica", zh: "音乐", es: "Música", de: "Musik", fr: "Musique", he: "מוזיקה" },
    volume_wind_aria: { ru: "Громкость ветра", en: "Wind volume", jp: "風の音量", it: "Volume vento", zh: "风声音量", es: "Volumen del viento", de: "Windlautstärke", fr: "Volume du vent", he: "עוצמת רוח" },
    volume_music_aria: { ru: "Громкость музыки", en: "Music volume", jp: "音楽の音量", it: "Volume musica", zh: "音乐音量", es: "Volumen de música", de: "Musiklautstärke", fr: "Volume de la musique", he: "עוצמת מוזיקה" },
    turn_on_music: { ru: "Включить музыку", en: "Turn on music", jp: "音楽をオン", it: "Accendi musica", zh: "打开音乐", es: "Encender música", de: "Musik einschalten", fr: "Activer la musique", he: "הפעל מוזיקה" },
    turn_off_music: { ru: "Выключить музыку", en: "Turn off music", jp: "音楽をオフ", it: "Spegni musica", zh: "关闭音乐", es: "Apagar música", de: "Musik ausschalten", fr: "Désactiver la musique", he: "כבה מוזיקה" },
    more_petals: { ru: "Больше", en: "More", jp: "増やす", it: "Più", zh: "更多", es: "Más", de: "Mehr", fr: "Plus", he: "עוד" },
    less_petals: { ru: "Меньше", en: "Less", jp: "減らす", it: "Meno", zh: "更少", es: "Menos", de: "Weniger", fr: "Moins", he: "פחות" },
    fuji_magic_aria: { ru: "Магия Fuji: лепестки, звуки", en: "Fuji magic: petals, sounds", jp: "富士マジック: 花びら、音", it: "Magia Fuji: petali, suoni", zh: "富士魔法：花瓣与声音", es: "Magia Fuji: pétalos, sonidos", de: "Fuji-Magie: Blütenblätter, Klänge", fr: "Magie Fuji : pétales, sons", he: "קסם פוג'י: עלי כותרת, צלילים" },
    video_not_supported: { ru: "Ваш браузер не поддерживает воспроизведение видео.", en: "Your browser does not support video playback.", jp: "お使いのブラウザは動画再生に対応していません。", it: "Il browser non supporta la riproduzione video.", zh: "您的浏览器不支持视频播放。", es: "Tu navegador no soporta la reproducción de video.", de: "Ihr Browser unterstützt keine Videowiedergabe.", fr: "Votre navigateur ne prend pas en charge la lecture vidéo.", he: "הדפדפן שלך לא תומך בהשמעת וידאו." },
    stories_back: { ru: "← На главную", en: "← Back to main", jp: "← メインへ", it: "← Torna alla home", zh: "← 返回主页", es: "← Volver al inicio", de: "← Zur Startseite", fr: "← Retour à l'accueil", he: "← לדף הראשי" },
    stories_loading: { ru: "Загрузка рассказов…", en: "Loading stories…", jp: "ストーリーを読み込み中…", it: "Caricamento racconti…", zh: "加载故事中…", es: "Cargando relatos…", de: "Geschichten werden geladen…", fr: "Chargement des histoires…", he: "טוען סיפורים…" },
    stories_no: { ru: "Пока нет рассказов.", en: "No stories yet.", jp: "まだストーリーがありません。", it: "Nessun racconto ancora.", zh: "暂无故事。", es: "Aún no hay relatos.", de: "Noch keine Geschichten.", fr: "Pas encore d'histoires.", he: "אין עדיין סיפורים." },
    stories_error: { ru: "Не удалось загрузить рассказы.", en: "Failed to load stories.", jp: "ストーリーの読み込みに失敗しました。", it: "Impossibile caricare i racconti.", zh: "加载故事失败。", es: "Error al cargar relatos.", de: "Geschichten konnten nicht geladen werden.", fr: "Échec du chargement des histoires.", he: "טעינת הסיפורים נכשלה." },
    stories_nav_main: { ru: "На главную", en: "To main", jp: "メインへ", it: "Alla home", zh: "回主页", es: "Al inicio", de: "Zur Startseite", fr: "À l'accueil", he: "לדף הראשי" },
    stories_nav_start: { ru: "На стартовую", en: "To start", jp: "スタートへ", it: "Alla pagina iniziale", zh: "到启动页", es: "Al inicio", de: "Zur Startseite", fr: "À la page d'accueil", he: "לעמוד הפתיחה" },
    derev_p1: { ru: "Создание этого пространства для работ художника Даши стало для меня особенным временем. Общение с ней — это огромный подарок. Её талант, доброта и искренность достойны восхищения и самого лучшего воплощения.", en: "Creating this space for artist Dasha's works has been a special time for me. Communicating with her is a great gift. Her talent, kindness, and sincerity deserve admiration and the best possible embodiment.", jp: "ダーシャの作品のためのこの空間を作ることは、私にとって特別な時間でした。", it: "Creare questo spazio per le opere di Dasha è stato per me un tempo speciale.", zh: "为达莎的作品创建这个空间对我来说是一段特别的时光。", es: "Crear este espacio para las obras de Dasha ha sido un tiempo especial para mí.", de: "Die Schaffung dieses Raums für Dashas Werke war eine besondere Zeit für mich.", fr: "Créer cet espace pour les œuvres de Dasha a été un moment spécial pour moi.", he: "יצירת המרחב הזה ליצירות של דשה הייתה עבורי תקופה מיוחדת." },
    derev_p2: { ru: "Я был счастлив строить этот цифровой дом, стараясь сделать его таким же искренним и глубоким, как и сами картины. Надеюсь, что каждый гость почувствует здесь ту гармонию, которую мы искали.", en: "I was happy to build this digital home, trying to make it as sincere and deep as the paintings themselves. I hope every guest will feel here the harmony we sought.", jp: "このデジタルな家を、絵と同じように誠実で深く作りたかった。", it: "Sono stato felice di costruire questa casa digitale, cercando di renderla sincera e profonda come i dipinti.", zh: "我很高兴建造这个数字之家，力求让它像画作一样真诚而深刻。", es: "Fui feliz de construir este hogar digital, intentando hacerlo tan sincero y profundo como las pinturas.", de: "Ich war glücklich, dieses digitale Zuhause zu bauen, so aufrichtig und tief wie die Bilder.", fr: "J'étais heureux de construire cette maison numérique, aussi sincère et profonde que les tableaux.", he: "שמחתי לבנות את הבית הדיגיטלי הזה, כנה ועמוק כמו הציורים." },
    derev_sign: { ru: "С благодарностью и уважением,", en: "With gratitude and respect,", jp: "感謝と敬意を込めて、", it: "Con gratitudine e rispetto,", zh: "谨致谢意与敬意，", es: "Con gratitud y respeto,", de: "Mit Dankbarkeit und Respekt,", fr: "Avec gratitude et respect,", he: "בתודה ובכבוד," },
    derev_back: { ru: "Вернуться к картинам", en: "Back to paintings", jp: "絵に戻る", it: "Torna ai dipinti", zh: "返回画作", es: "Volver a las pinturas", de: "Zurück zu den Bildern", fr: "Retour aux tableaux", he: "חזרה לציורים" },
    globe_aria: { ru: "Выбор языка", en: "Choose language", jp: "言語を選択", it: "Scegli lingua", zh: "选择语言", es: "Elegir idioma", de: "Sprache wählen", fr: "Choisir la langue", he: "בחירת שפה" },
  };

  function getStoredLang() {
    try {
      const v = localStorage.getItem(LANG_STORAGE_KEY);
      if (v && SUPPORTED.some(function (s) { return s.code === v; })) return v;
    } catch (_) {}
    return DEFAULT_LANG;
  }

  function setStoredLang(code) {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, code);
    } catch (_) {}
  }

  let currentLang = getStoredLang();

  function t(key) {
    const row = I18N[key];
    if (!row) return key;
    return row[currentLang] != null ? row[currentLang] : (row[DEFAULT_LANG] || key);
  }

  function getLang() {
    return currentLang;
  }

  function setLang(code) {
    if (!SUPPORTED.some(function (s) { return s.code === code; })) return;
    currentLang = code;
    setStoredLang(code);
    applyToPage();
    try {
      window.dispatchEvent(new CustomEvent("soulart-language-change", { detail: { lang: code } }));
    } catch (_) {}
  }

  function applyToPage() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      const key = el.getAttribute("data-i18n");
      const text = t(key);
      if (el.getAttribute("data-i18n-attr")) {
        const attr = el.getAttribute("data-i18n-attr");
        el.setAttribute(attr, text);
      } else if (el.getAttribute("data-i18n-placeholder") !== null) {
        el.placeholder = text;
      } else {
        el.textContent = text;
      }
    });
    document.documentElement.lang = currentLang === "zh" ? "zh-Hans" : currentLang;
  }

  function createGlobeWidget() {
    const wrap = document.createElement("div");
    wrap.className = "globe-wrap";
    wrap.setAttribute("data-i18n", "globe_aria");
    wrap.setAttribute("data-i18n-attr", "aria-label");
    wrap.setAttribute("aria-label", t("globe_aria"));

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "globe-btn";
    btn.setAttribute("data-i18n", "globe_aria");
    btn.setAttribute("data-i18n-attr", "aria-label");
    btn.setAttribute("aria-label", t("globe_aria"));
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = "<span class=\"globe-btn__icon\" aria-hidden=\"true\">🌐</span>";
    wrap.appendChild(btn);

    const menu = document.createElement("div");
    menu.className = "globe-menu globe-menu--papyrus";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-hidden", "true");
    menu.innerHTML = SUPPORTED.map(function (s) {
      return "<button type=\"button\" class=\"globe-menu__item\" role=\"menuitem\" data-lang=\"" + s.code + "\"><span class=\"globe-menu__flag\">" + s.flag + "</span> " + s.name + "</button>";
    }).join("");
    wrap.appendChild(menu);

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const open = menu.getAttribute("aria-hidden") !== "true";
      menu.setAttribute("aria-hidden", open ? "true" : "false");
      menu.classList.toggle("globe-menu--open", !open);
      btn.setAttribute("aria-expanded", !open);
    });

    document.addEventListener("click", function () {
      menu.setAttribute("aria-hidden", "true");
      menu.classList.remove("globe-menu--open");
      btn.setAttribute("aria-expanded", "false");
    });

    menu.addEventListener("click", function (e) {
      const item = e.target.closest("[data-lang]");
      if (!item) return;
      e.stopPropagation();
      const code = item.getAttribute("data-lang");
      setLang(code);
      menu.setAttribute("aria-hidden", "true");
      menu.classList.remove("globe-menu--open");
      btn.setAttribute("aria-expanded", "false");
    });

    return wrap;
  }

  function init(container) {
    applyToPage();
    const globe = createGlobeWidget();
    if (container && container.appendChild) {
      container.appendChild(globe);
    } else {
      document.body.appendChild(globe);
    }
  }

  window.I18n = {
    t: t,
    getLang: getLang,
    setLang: setLang,
    applyToPage: applyToPage,
    init: init,
    SUPPORTED: SUPPORTED,
  };
})();
