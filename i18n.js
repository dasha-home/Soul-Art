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

    nav_guardian: { ru: "✦ Хранитель", en: "✦ Guardian", jp: "✦ 守護者", it: "✦ Guardiano", zh: "✦ 守护者", es: "✦ Guardián", de: "✦ Hüter", fr: "✦ Gardien", he: "✦ שומר" },
    guardian_back: { ru: "← На главную", en: "← Back to main", jp: "← メインへ", it: "← Torna alla home", zh: "← 返回主页", es: "← Volver al inicio", de: "← Zur Startseite", fr: "← Retour à l'accueil", he: "← לדף הראשי" },
    guardian_title: { ru: "Обитель Хранителя", en: "Guardian's Dwelling", jp: "守護者の住処", it: "Dimora del Guardiano", zh: "守护者的居所", es: "Morada del Guardián", de: "Hüter-Gemach", fr: "Demeure du Gardien", he: "מעון השומר" },
    guardian_subtitle: { ru: "Уютный кабинет для поддержки, советов и разговора. Хранитель знает все рассказы сайта и готов помочь с творчеством, языками и душевным состоянием.", en: "A cosy study for support, advice and conversation. The Guardian knows all the stories on the site and is ready to help with creativity, languages and your inner world.", jp: "サポート、アドバイス、会話のための居心地よい書斎。守護者はサイトのすべてのストーリーを知り、創作、言語、心の状態をサポートします。", it: "Uno studio accogliente per supporto, consigli e conversazione. Il Guardiano conosce tutti i racconti del sito ed è pronto ad aiutare con creatività, lingue e stato d'animo.", zh: "温馨的书房，提供支持、建议和交流。守护者了解网站上的所有故事，随时帮助创作、语言和心灵状态。", es: "Un estudio acogedor para apoyo, consejos y conversación. El Guardián conoce todos los relatos del sitio y está listo para ayudar con creatividad, idiomas y el estado del alma.", de: "Ein gemütliches Arbeitszimmer für Unterstützung, Ratschläge und Gespräche. Der Hüter kennt alle Geschichten der Seite und hilft mit Kreativität, Sprachen und seelischem Wohlbefinden.", fr: "Un bureau chaleureux pour le soutien, les conseils et la conversation. Le Gardien connaît toutes les histoires du site et est prêt à aider avec la créativité, les langues et l'état d'esprit.", he: "חדר עבודה נעים לתמיכה, עצות ושיחה. השומר מכיר את כל הסיפורים באתר ומוכן לסייע ביצירתיות, שפות ומצב הרוח." },
    guardian_mode: { ru: "Режим:", en: "Mode:", jp: "モード：", it: "Modalità:", zh: "模式：", es: "Modo:", de: "Modus:", fr: "Mode :", he: "מצב:" },
    guardian_mode_assistant: { ru: "С Дашей", en: "With Dasha", jp: "ダーシャと", it: "Con Dasha", zh: "与达莎", es: "Con Dasha", de: "Mit Dasha", fr: "Avec Dasha", he: "עם דשה" },
    guardian_mode_children: { ru: "Для детей", en: "For children", jp: "子ども向け", it: "Per bambini", zh: "儿童模式", es: "Para niños", de: "Für Kinder", fr: "Pour enfants", he: "לילדים" },
    guardian_mode_language: { ru: "Языки", en: "Languages", jp: "言語", it: "Lingue", zh: "语言", es: "Idiomas", de: "Sprachen", fr: "Langues", he: "שפות" },
    guardian_mode_art: { ru: "Рисование", en: "Drawing", jp: "絵", it: "Disegno", zh: "绘画", es: "Dibujo", de: "Zeichnen", fr: "Dessin", he: "ציור" },
    guardian_mode_psychology: { ru: "Душа", en: "Soul", jp: "心", it: "Anima", zh: "心灵", es: "Alma", de: "Seele", fr: "Âme", he: "נשמה" },
    guardian_role_lang: { ru: "Языки", en: "Languages", jp: "言語", it: "Lingue", zh: "语言", es: "Idiomas", de: "Sprachen", fr: "Langues", he: "שפות" },
    guardian_role_art: { ru: "Рисование", en: "Drawing", jp: "絵", it: "Arte", zh: "绘画", es: "Arte", de: "Kunst", fr: "Art", he: "ציור" },
    guardian_role_soul: { ru: "Душа", en: "Soul", jp: "心", it: "Anima", zh: "心灵", es: "Alma", de: "Seele", fr: "Âme", he: "נשמה" },
    guardian_welcome: { ru: "Здравствуй. Я — Хранитель (守護者). Сижу здесь у огня и жду тебя.\n\nЯ помогу с языками — английским, японским и другими. Обсужу твои рисунки. Выслушаю то, что на душе. Просто напиши — я здесь.", en: "Hello. I am the Guardian (守護者). I sit here by the fire, waiting for you.\n\nI can help with languages — English, Japanese and others. I'll talk about your drawings. I'll listen to what's on your heart. Just write — I'm here.", jp: "こんにちは。私は守護者（守護者）です。火のそばに座り、あなたを待っています。\n\n言語のお手伝いができます — 英語、日本語、その他。あなたの絵について話しましょう。心の中にあることを聞かせてください。書いてください — ここにいます。", it: "Salve. Sono il Guardiano (守護者). Siedo qui accanto al fuoco, ad aspettarti.\n\nPosso aiutarti con le lingue — inglese, giapponese e altre. Parlare dei tuoi disegni. Ascoltare quello che hai nel cuore. Scrivi — sono qui.", zh: "你好。我是守护者（守護者）。我坐在火边等候你。\n\n我可以帮你学语言——英语、日语等。我们可以聊你的画作。我也会倾听你内心的声音。写信给我——我在这里。", es: "Hola. Soy el Guardián (守護者). Estoy sentado junto al fuego, esperándote.\n\nPuedo ayudarte con idiomas — inglés, japonés y otros. Hablar de tus dibujos. Escuchar lo que llevas en el corazón. Solo escribe — estoy aquí.", de: "Hallo. Ich bin der Hüter (守護者). Ich sitze hier am Feuer und warte auf dich.\n\nIch helfe mit Sprachen — Englisch, Japanisch und anderen. Spreche über deine Zeichnungen. Höre zu, was dich bewegt. Schreib einfach — ich bin hier.", fr: "Bonjour. Je suis le Gardien (守護者). Je suis assis près du feu, à t'attendre.\n\nJe peux t'aider avec les langues — anglais, japonais et autres. Parler de tes dessins. Écouter ce que tu as sur le cœur. Écris simplement — je suis là.", he: "שלום. אני השומר (守護者). אני יושב כאן ליד האש, מחכה לך.\n\nאני יכול לעזור עם שפות — אנגלית, יפנית ועוד. לדבר על הציורים שלך. להקשיב למה שיש בלב. פשוט כתבי — אני כאן." },
    guardian_placeholder: { ru: "Напиши Хранителю…", en: "Write to the Guardian…", jp: "守護者へ書く…", it: "Scrivi al Guardiano…", zh: "写信给守护者…", es: "Escribe al Guardián…", de: "Schreib dem Hüter…", fr: "Écris au Gardien…", he: "כתוב לשומר…" },
    guardian_hint: { ru: "Хранитель помнит контекст разговора и содержание всех рассказов с сайта.", en: "The Guardian remembers the conversation context and the content of all stories on the site.", jp: "守護者は会話の文脈とサイトのすべてのストーリーの内容を覚えています。", it: "Il Guardiano ricorda il contesto della conversazione e il contenuto di tutti i racconti del sito.", zh: "守护者记得对话上下文和网站上所有故事的内容。", es: "El Guardián recuerda el contexto de la conversación y el contenido de todos los relatos del sitio.", de: "Der Hüter erinnert sich an den Gesprächskontext und den Inhalt aller Geschichten der Seite.", fr: "Le Gardien se souvient du contexte de la conversation et du contenu de toutes les histoires du site.", he: "השומר זוכר את הקשר השיחה ואת תוכן כל הסיפורים באתר." },

    story_s1771904883169_title: { ru: "Мир глазами Даши", en: "The World Through Dasha's Eyes", jp: "ダーシャの目に映る世界", it: "Il mondo attraverso gli occhi di Dasha", zh: "达莎眼中的世界", es: "El mundo a través de los ojos de Dasha", de: "Die Welt durch Dashas Augen", fr: "Le monde à travers les yeux de Dasha", he: "העולם דרך עיניה של דשה" },
    story_s1771904883169_content: { ru: "Бывают мгновения, когда мир вокруг затихает, и остается только шепот воды, крик улетающих птиц и мягкое тепло уходящего солнца. В такие часы Даша берет в руки палитру.\n\nНа её новом холсте — «Зелёный вечер». Это не просто пейзаж, это застывшее мгновение гармонии. Посмотрите, как солнечные блики играют на воде, точно так же, как они играют в глазах самого художника. Даша не просто рисует уток или деревья — она переносит на холст саму душу этого вечера.\n\nКаждый мазок кисти здесь — это слово в тихой песне о красоте нашего мира. Когда смотришь на эту картину, кажется, что можно услышать всплеск воды и почувствовать прохладный вечерний воздух. Это и есть магия истинного таланта — дарить людям покой и свет через свои работы.\n\nДаша, пусть твое вдохновение всегда будет таким же безграничным, как это небо на закате. Твой путь — это путь созидания и красоты, и мы счастливы видеть мир твоими глазами».", en: "There are moments when the world falls silent, and all that remains is the whisper of water, the call of birds flying away, and the soft warmth of the setting sun. In such hours Dasha takes up her palette.\n\nOn her new canvas — «Green Evening». This is not just a landscape; it is a frozen moment of harmony. Look how the sunbeams play on the water, just as they play in the eyes of the artist herself. Dasha does not simply paint ducks or trees — she transfers the very soul of that evening onto the canvas.\n\nEvery brushstroke here is a word in a quiet song about the beauty of our world. When you look at this painting, you can almost hear the splash of water and feel the cool evening air. This is the magic of true talent — to give people peace and light through one's work.\n\nDasha, may your inspiration always be as boundless as this sunset sky. Your path is the path of creation and beauty, and we are happy to see the world through your eyes.»", jp: "周囲が静まり返り、水のささやき、飛び立つ鳥の声、沈む太陽の柔らかな温もりだけが残る瞬間があります。そんな時にダーシャはパレットを手に取ります。\n\n新作のキャンバスには「緑の夕暮れ」。これは単なる風景ではなく、調和のとれた一瞬を切り取ったものです。水面で遊ぶ陽光が、画家自身の瞳の中でも同じように輝いているのをご覧ください。ダーシャは鴨や木を描いているだけではありません。この夕べの魂そのものをキャンバスに移しているのです。", it: "Ci sono momenti in cui il mondo si fa silenzioso, e non restano che il sussurro dell'acqua, il grido degli uccelli in volo e il tiepido calore del sole che tramonta. In quelle ore Dasha prende in mano la palette.\n\nSulla sua nuova tela — «Serata verde». Non è solo un paesaggio, è un attimo fermato di armonia. Guardate come i riflessi del sole giocano sull'acqua, così come brillano negli occhi dell'artista. Dasha non dipinge solo anatre o alberi — trasferisce sulla tela l'anima di quella sera.", zh: "有时，世界会安静下来，只剩下水声低语、飞鸟鸣叫和落日余温。在这样的时刻，达莎拿起调色板。\n\n在她的新画布上——《绿意黄昏》。这不只是风景，而是凝固的和谐瞬间。看阳光在水面上闪烁，就像在画家眼中一样。达莎不只是画鸭子或树木——她将那个傍晚的灵魂倾注到画布上。", es: "Hay momentos en que el mundo enmudece, y solo quedan el susurro del agua, el grito de los pájaros que parten y el suave calor del sol que se va. En esas horas Dasha toma la paleta.\n\nEn su nuevo lienzo — «Atardecer verde». No es solo un paisaje; es un instante detenido de armonía. Mirad cómo los destellos del sol juegan en el agua, igual que en los ojos de la artista. Dasha no solo pinta patos o árboles — traslada al lienzo el alma de esa tarde.", de: "Es gibt Momente, in denen die Welt verstummt und nur noch das Flüstern des Wassers, der Ruf der davonfliegenden Vögel und die sanfte Wärme der untergehenden Sonne bleiben. In solchen Stunden nimmt Dasha die Palette in die Hand.\n\nAuf ihrer neuen Leinwand — «Grüner Abend». Das ist nicht nur eine Landschaft, sondern ein eingefrorener Augenblick der Harmonie. Seht, wie die Sonnenstrahlen auf dem Wasser spielen, genauso wie in den Augen der Künstlerin. Dasha malt nicht einfach Enten oder Bäume — sie überträgt die Seele dieses Abends auf die Leinwand.", fr: "Il est des instants où le monde se tait, et il ne reste que le chuchotement de l'eau, le cri des oiseaux qui s'envolent et la douce chaleur du soleil qui décline. À ces heures, Dasha prend sa palette.\n\nSur sa nouvelle toile — « Soirée verte ». Ce n'est pas qu'un paysage, c'est un instant figé d'harmonie. Regardez comme les reflets du soleil jouent sur l'eau, comme ils brillent dans les yeux de l'artiste. Dasha ne peint pas simplement des canards ou des arbres — elle transmet sur la toile l'âme de ce soir.", he: "יש רגעים שבהם העולם נופל לשקט, ונותרים רק לחש המים, קריאת הציפורים העופות והחום הרך של השמש השוקעת. בשעות כאלה דשה לוקחת את הפלטה.\n\nעל הבד החדש שלה — «ערב ירוק». זה לא רק נוף; זה רגע קפוא של הרמוניה. הביטו איך קרני השמש משחקות על המים, כמו בעיני האמנית עצמה. דשה לא רק מציירת ברווזים או עצים — היא מעבירה לבד את נשמת אותו ערב." },

    story_s1771907766592_title: { ru: "Спящие друзья", en: "Sleeping Friends", jp: "眠れる友達", it: "Amici dormienti", zh: "睡着的朋友", es: "Amigos dormidos", de: "Schlafende Freunde", fr: "Amis endormis", he: "חברים ישנים" },
    story_s1771907766592_content: { ru: "На берегу тихого озера, где туман мягко стелется над водой, нашли покой два маленьких сердца. Пушистый щенок и рыжий котенок, устав от дневных игр, уснули в высокой траве, согретые последними лучами уходящего солнца.\n\nВ этом мире нет места вражде, когда рядом верный друг, а над головой — бескрайнее небо, окрашенное в золотые тона. Эта картина напоминает нам о самом главном: истинная гармония рождается в тишине и искренности. Пусть этот теплый вечер останется в памяти как символ доброты, которая не требует слов.\n\nА это видео про них  https://www.youtube.com/watch?v=FjS6o9yL16o", en: "On the shore of a quiet lake, where mist softly spreads over the water, two little hearts have found peace. A fluffy puppy and a ginger kitten, tired from the day's games, fell asleep in the tall grass, warmed by the last rays of the setting sun.\n\nIn this world there is no room for hostility when a faithful friend is by your side and an endless sky, painted in golden tones, stretches above. This painting reminds us of what matters most: true harmony is born in silence and sincerity. May this warm evening remain in memory as a symbol of kindness that needs no words.\n\nAnd here is a video about them  https://www.youtube.com/watch?v=FjS6o9yL16o", jp: "静かな湖の岸辺で、霧が水面に柔らかく広がる中、二つの小さな心が安らぎを見つけました。ふわふわの子犬と茶色の子猫が、昼間の遊びに疲れて、沈む太陽の最後の光に温められながら、高い草の中で眠りました。\n\n忠実な友がそばにいるとき、この世界に敵意の居場所はありません。頭上には金色に染まった果てしない空。この絵は私たちに最も大切なことを思い出させます。真の調和は静寂と誠実さから生まれるのです。この温かい夕べが、言葉を必要としない優しさの象徴として記憶に残りますように。\n\nそしてこちらは彼らについての動画です  https://www.youtube.com/watch?v=FjS6o9yL16o", it: "Sulla riva di un lago tranquillo, dove la nebbia si stende dolcemente sull'acqua, due piccoli cuori hanno trovato pace. Un cucciolo soffice e un gattino rosso, stanchi dai giochi del giorno, si sono addormentati nell'erba alta, scal dati dagli ultimi raggi del sole che tramonta.\n\nIn questo mondo non c'è posto per l'ostilità quando un amico fedele è al tuo fianco e sopra di te un cielo infinito dipinto di toni dorati. Questo dipinto ci ricorda l'essenziale: la vera armonia nasce nel silenzio e nella sincerità. Che questa serata tiepida resti nella memoria come simbolo di una gentilezza che non ha bisogno di parole.\n\nE questo è un video su di loro  https://www.youtube.com/watch?v=FjS6o9yL16o", zh: "在宁静的湖畔，薄雾轻笼水面，两颗小心灵找到了安宁。毛茸茸的小狗和橘色的小猫，玩了一整天后，在落日余晖中于高草丛里睡着了。\n\n当身边有忠诚的伙伴、头顶是金色的无边天空时，这个世界没有敌意的位置。这幅画提醒我们最重要的东西：真正的和谐生于静默与真诚。愿这个温暖的傍晚作为不需言语的善意的象征留在记忆里。\n\n这是关于它们的视频  https://www.youtube.com/watch?v=FjS6o9yL16o", es: "En la orilla de un lago tranquilo, donde la niebla se extiende suavemente sobre el agua, dos pequeños corazones encontraron paz. Un cachorro esponjoso y un gatito pelirrojo, cansados de los juegos del día, se durmieron en la hierba alta, calentados por los últimos rayos del sol.\n\nEn este mundo no hay lugar para la hostilidad cuando un amigo fiel está a tu lado y sobre ti un cielo infinito teñido de tonos dorados. Esta pintura nos recuerda lo esencial: la verdadera armonía nace en el silencio y la sinceridad. Que esta tarde cálida quede en la memoria como símbolo de una bondad que no necesita palabras.\n\nY este es un video sobre ellos  https://www.youtube.com/watch?v=FjS6o9yL16o", de: "Am Ufer eines stillen Sees, wo Nebel weich über das Wasser zieht, haben zwei kleine Herzen Ruhe gefunden. Ein flauschiges Welpen und ein roter Kater, müde vom Spiel des Tages, schlafen im hohen Gras, gewärmt von den letzten Strahlen der untergehenden Sonne.\n\nIn dieser Welt ist kein Platz für Feindseligkeit, wenn ein treuer Freund an deiner Seite ist und ein endloser Himmel in Goldtönen über dir. Dieses Bild erinnert uns an das Wichtigste: wahre Harmonie entsteht in Stille und Aufrichtigkeit. Möge dieser warme Abend als Symbol einer Güte, die keine Worte braucht, in Erinnerung bleiben.\n\nUnd hier ist ein Video über sie  https://www.youtube.com/watch?v=FjS6o9yL16o", fr: "Sur le rivage d'un lac tranquille, où la brume s'étend doucement sur l'eau, deux petits cœurs ont trouvé la paix. Un chiot tout doux et un chaton roux, fatigués des jeux de la journée, se sont endormis dans les hautes herbes, réchauffés par les derniers rayons du soleil.\n\nDans ce monde, il n'y a pas de place pour l'hostilité quand un ami fidèle est à côté de soi et qu'un ciel infini teinté d'or s'étend au-dessus. Ce tableau nous rappelle l'essentiel : la vraie harmonie naît dans le silence et la sincérité. Que cette soirée douce reste en mémoire comme le symbole d'une bonté qui n'a pas besoin de mots.\n\nEt voici une vidéo sur eux  https://www.youtube.com/watch?v=FjS6o9yL16o", he: "על שפת אגם שקט, שם הערפל נפרש בעדינות על המים, שני לבבות קטנים מצאו שלווה. גור פרוותי וגור חתול ג'ינג'י, עייפים ממשחקי היום, נרדמו בעשב הגבוה, מחוממים מקרני השמש האחרונות.\n\nבעולם הזה אין מקום לעוינות כאשר חבר נאמן לצדך ושמיים אינסופיים צבועים בגווני זהב מעל. ציור זה מזכיר לנו את מה שחשוב באמת: הרמוניה אמיתית נולדת בדממה ובכנות. הלוואי שהערב החם הזה יישאר בזיכרון כסמל לחמלה שאינה צריכה מילים.\n\nוהנה סרטון עליהם  https://www.youtube.com/watch?v=FjS6o9yL16o" },
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

  function escapeHtml(s) {
    if (s == null) return "";
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
  function escapeAttr(s) {
    if (s == null) return "";
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function linkify(text) {
    if (text == null) return "";
    const re = /(https?:\/\/[^\s<>"')\]]+)/g;
    const parts = String(text).split(re);
    const out = [];
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 1) {
        out.push("<a class=\"story-link\" href=\"" + escapeAttr(parts[i]) + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + escapeHtml(parts[i]) + "</a>");
      } else {
        out.push(escapeHtml(parts[i]));
      }
    }
    return out.join("");
  }

  function applyToPage() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      const key = el.getAttribute("data-i18n");
      if (key.indexOf("story_") === 0 && !I18N[key]) return;
      const text = t(key);
      if (el.getAttribute("data-i18n-attr")) {
        const attr = el.getAttribute("data-i18n-attr");
        el.setAttribute(attr, text);
      } else if (el.getAttribute("data-i18n-placeholder") !== null) {
        el.placeholder = text;
      } else if (el.getAttribute("data-i18n-linkify") !== null) {
        el.innerHTML = linkify(text);
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
    setTimeout(function () { applyToPage(); }, 50);
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
