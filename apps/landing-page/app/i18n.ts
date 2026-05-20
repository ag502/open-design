export const DEFAULT_LOCALE = 'en';

export const LANDING_LOCALES = [
  {
    code: 'en',
    htmlLang: 'en',
    ogLocale: 'en_US',
    label: 'English',
    shortLabel: 'EN',
    dir: 'ltr',
  },
  {
    code: 'zh',
    htmlLang: 'zh-CN',
    ogLocale: 'zh_CN',
    label: '简体中文',
    shortLabel: '简中',
    dir: 'ltr',
  },
  {
    code: 'zh-tw',
    htmlLang: 'zh-TW',
    ogLocale: 'zh_TW',
    label: '繁體中文',
    shortLabel: '繁中',
    dir: 'ltr',
  },
  {
    code: 'ja',
    htmlLang: 'ja',
    ogLocale: 'ja_JP',
    label: '日本語',
    shortLabel: 'JA',
    dir: 'ltr',
  },
  {
    code: 'ko',
    htmlLang: 'ko',
    ogLocale: 'ko_KR',
    label: '한국어',
    shortLabel: 'KO',
    dir: 'ltr',
  },
  {
    code: 'de',
    htmlLang: 'de',
    ogLocale: 'de_DE',
    label: 'Deutsch',
    shortLabel: 'DE',
    dir: 'ltr',
  },
  {
    code: 'fr',
    htmlLang: 'fr',
    ogLocale: 'fr_FR',
    label: 'Français',
    shortLabel: 'FR',
    dir: 'ltr',
  },
  {
    code: 'ru',
    htmlLang: 'ru',
    ogLocale: 'ru_RU',
    label: 'Русский',
    shortLabel: 'RU',
    dir: 'ltr',
  },
  {
    code: 'es',
    htmlLang: 'es',
    ogLocale: 'es_ES',
    label: 'Español',
    shortLabel: 'ES',
    dir: 'ltr',
  },
  {
    code: 'pt-br',
    htmlLang: 'pt-BR',
    ogLocale: 'pt_BR',
    label: 'Português (BR)',
    shortLabel: 'PT-BR',
    dir: 'ltr',
  },
  {
    code: 'it',
    htmlLang: 'it',
    ogLocale: 'it_IT',
    label: 'Italiano',
    shortLabel: 'IT',
    dir: 'ltr',
  },
  {
    code: 'vi',
    htmlLang: 'vi',
    ogLocale: 'vi_VN',
    label: 'Tiếng Việt',
    shortLabel: 'VI',
    dir: 'ltr',
  },
  {
    code: 'pl',
    htmlLang: 'pl',
    ogLocale: 'pl_PL',
    label: 'Polski',
    shortLabel: 'PL',
    dir: 'ltr',
  },
  {
    code: 'id',
    htmlLang: 'id',
    ogLocale: 'id_ID',
    label: 'Bahasa Indonesia',
    shortLabel: 'ID',
    dir: 'ltr',
  },
  {
    code: 'nl',
    htmlLang: 'nl',
    ogLocale: 'nl_NL',
    label: 'Nederlands',
    shortLabel: 'NL',
    dir: 'ltr',
  },
  {
    code: 'ar',
    htmlLang: 'ar',
    ogLocale: 'ar_AR',
    label: 'العربية',
    shortLabel: 'AR',
    dir: 'rtl',
  },
  {
    code: 'tr',
    htmlLang: 'tr',
    ogLocale: 'tr_TR',
    label: 'Türkçe',
    shortLabel: 'TR',
    dir: 'ltr',
  },
  {
    code: 'uk',
    htmlLang: 'uk',
    ogLocale: 'uk_UA',
    label: 'Українська',
    shortLabel: 'UK',
    dir: 'ltr',
  },
] as const;

export type LandingLocaleCode = (typeof LANDING_LOCALES)[number]['code'];
export type LandingLocale = (typeof LANDING_LOCALES)[number];

export interface HeaderCopy {
  brandMetaTitle: string;
  brandMetaBody: string;
  nav: {
    skills: string;
    systems: string;
    templates: string;
    craft: string;
    blog: string;
    contact: string;
  };
  download: string;
  downloadAria: string;
  downloadTitle: string;
  starAria: string;
  starTitle: string;
  starPrefix: string;
}

export interface CommonCopy {
  topbar: {
    filedUnder: string;
    category: string;
    madeOnEarth: string;
    live: string;
    languageSwitcherLabel: string;
  };
  header: HeaderCopy;
}

export interface HomeSeoCopy {
  title: string;
  description: string;
}

export interface HomeFaqEntry {
  q: string;
  a: string;
}

type HomeFaqTemplate = {
  q: string;
  a: string;
  official?: boolean;
};

const COMMON_COPY: Record<LandingLocaleCode, CommonCopy> = {
  en: {
    topbar: {
      filedUnder: 'Filed under',
      category: 'Design · Intelligence',
      madeOnEarth: 'Apache-2.0 · Made on Earth',
      live: 'Live',
      languageSwitcherLabel: 'Switch language',
    },
    header: {
      brandMetaTitle: 'Studio Nº 01',
      brandMetaBody: 'Berlin / Open / Earth',
      nav: {
        skills: 'Skills',
        systems: 'Systems',
        templates: 'Templates',
        craft: 'Craft',
        blog: 'Blog',
        contact: 'Contact',
      },
      download: 'Download',
      downloadAria: 'Download Open Design desktop',
      downloadTitle: 'Download the desktop app',
      starAria: 'Star Open Design on GitHub',
      starTitle: 'Click to star us on GitHub',
      starPrefix: 'Star',
    },
  },
  zh: {
    topbar: {
      filedUnder: '归档于',
      category: '设计 · 智能',
      madeOnEarth: 'Apache-2.0 · 来自地球',
      live: '在线',
      languageSwitcherLabel: '切换语言',
    },
    header: {
      brandMetaTitle: '工作室 Nº 01',
      brandMetaBody: '柏林 / 开放 / 地球',
      nav: {
        skills: 'Skill',
        systems: '设计系统',
        templates: '模板',
        craft: '工艺',
        blog: '博客',
        contact: '联系',
      },
      download: '下载',
      downloadAria: '下载 Open Design 桌面端',
      downloadTitle: '下载桌面应用',
      starAria: '在 GitHub 为 Open Design 点 Star',
      starTitle: '去 GitHub 点 Star',
      starPrefix: 'Star',
    },
  },
  'zh-tw': {
    topbar: {
      filedUnder: '歸檔於',
      category: '設計 · 智能',
      madeOnEarth: 'Apache-2.0 · 來自地球',
      live: '在線',
      languageSwitcherLabel: '切換語言',
    },
    header: {
      brandMetaTitle: '工作室 Nº 01',
      brandMetaBody: '柏林 / 開放 / 地球',
      nav: {
        skills: 'Skill',
        systems: '設計系統',
        templates: '模板',
        craft: '工藝',
        blog: '部落格',
        contact: '聯絡',
      },
      download: '下載',
      downloadAria: '下載 Open Design 桌面端',
      downloadTitle: '下載桌面應用',
      starAria: '在 GitHub 為 Open Design 按 Star',
      starTitle: '去 GitHub 按 Star',
      starPrefix: 'Star',
    },
  },
  ja: {
    topbar: {
      filedUnder: '分類',
      category: 'デザイン · インテリジェンス',
      madeOnEarth: 'Apache-2.0 · 地球製',
      live: 'ライブ',
      languageSwitcherLabel: '言語を切り替え',
    },
    header: {
      brandMetaTitle: 'Studio Nº 01',
      brandMetaBody: 'Berlin / Open / Earth',
      nav: {
        skills: 'スキル',
        systems: 'システム',
        templates: 'テンプレート',
        craft: 'クラフト',
        blog: 'ブログ',
        contact: '連絡',
      },
      download: 'ダウンロード',
      downloadAria: 'Open Design デスクトップをダウンロード',
      downloadTitle: 'デスクトップアプリをダウンロード',
      starAria: 'GitHub で Open Design にスター',
      starTitle: 'GitHub でスターする',
      starPrefix: 'Star',
    },
  },
  ko: {
    topbar: {
      filedUnder: '분류',
      category: '디자인 · 인텔리전스',
      madeOnEarth: 'Apache-2.0 · 지구에서 제작',
      live: '라이브',
      languageSwitcherLabel: '언어 전환',
    },
    header: {
      brandMetaTitle: 'Studio Nº 01',
      brandMetaBody: 'Berlin / Open / Earth',
      nav: {
        skills: '스킬',
        systems: '시스템',
        templates: '템플릿',
        craft: '크래프트',
        blog: '블로그',
        contact: '문의',
      },
      download: '다운로드',
      downloadAria: 'Open Design 데스크톱 다운로드',
      downloadTitle: '데스크톱 앱 다운로드',
      starAria: 'GitHub에서 Open Design에 스타 주기',
      starTitle: 'GitHub에서 스타 주기',
      starPrefix: 'Star',
    },
  },
  de: {
    topbar: {
      filedUnder: 'Kategorie',
      category: 'Design · Intelligenz',
      madeOnEarth: 'Apache-2.0 · Made on Earth',
      live: 'Live',
      languageSwitcherLabel: 'Sprache wechseln',
    },
    header: {
      brandMetaTitle: 'Studio Nº 01',
      brandMetaBody: 'Berlin / Offen / Erde',
      nav: {
        skills: 'Skills',
        systems: 'Systeme',
        templates: 'Vorlagen',
        craft: 'Craft',
        blog: 'Blog',
        contact: 'Kontakt',
      },
      download: 'Download',
      downloadAria: 'Open Design Desktop herunterladen',
      downloadTitle: 'Desktop-App herunterladen',
      starAria: 'Open Design auf GitHub mit Stern markieren',
      starTitle: 'Auf GitHub sternen',
      starPrefix: 'Star',
    },
  },
  fr: {
    topbar: {
      filedUnder: 'Classé dans',
      category: 'Design · Intelligence',
      madeOnEarth: 'Apache-2.0 · Fait sur Terre',
      live: 'Live',
      languageSwitcherLabel: 'Changer de langue',
    },
    header: {
      brandMetaTitle: 'Studio Nº 01',
      brandMetaBody: 'Berlin / Ouvert / Terre',
      nav: {
        skills: 'Skills',
        systems: 'Systèmes',
        templates: 'Modèles',
        craft: 'Craft',
        blog: 'Blog',
        contact: 'Contact',
      },
      download: 'Télécharger',
      downloadAria: 'Télécharger Open Design Desktop',
      downloadTitle: "Télécharger l'application desktop",
      starAria: 'Ajouter une étoile à Open Design sur GitHub',
      starTitle: 'Mettre une étoile sur GitHub',
      starPrefix: 'Star',
    },
  },
  ru: {
    topbar: {
      filedUnder: 'Раздел',
      category: 'Дизайн · Интеллект',
      madeOnEarth: 'Apache-2.0 · Сделано на Земле',
      live: 'Live',
      languageSwitcherLabel: 'Сменить язык',
    },
    header: {
      brandMetaTitle: 'Studio Nº 01',
      brandMetaBody: 'Берлин / Open / Earth',
      nav: {
        skills: 'Skills',
        systems: 'Системы',
        templates: 'Шаблоны',
        craft: 'Craft',
        blog: 'Блог',
        contact: 'Контакт',
      },
      download: 'Скачать',
      downloadAria: 'Скачать Open Design Desktop',
      downloadTitle: 'Скачать desktop-приложение',
      starAria: 'Поставить звезду Open Design на GitHub',
      starTitle: 'Поставить звезду на GitHub',
      starPrefix: 'Star',
    },
  },
  es: {
    topbar: {
      filedUnder: 'Categoría',
      category: 'Diseño · Inteligencia',
      madeOnEarth: 'Apache-2.0 · Hecho en la Tierra',
      live: 'Live',
      languageSwitcherLabel: 'Cambiar idioma',
    },
    header: {
      brandMetaTitle: 'Studio Nº 01',
      brandMetaBody: 'Berlín / Abierto / Tierra',
      nav: {
        skills: 'Skills',
        systems: 'Sistemas',
        templates: 'Plantillas',
        craft: 'Craft',
        blog: 'Blog',
        contact: 'Contacto',
      },
      download: 'Descargar',
      downloadAria: 'Descargar Open Design Desktop',
      downloadTitle: 'Descargar la app de escritorio',
      starAria: 'Dar Star a Open Design en GitHub',
      starTitle: 'Dar Star en GitHub',
      starPrefix: 'Star',
    },
  },
  'pt-br': {
    topbar: {
      filedUnder: 'Categoria',
      category: 'Design · Inteligência',
      madeOnEarth: 'Apache-2.0 · Feito na Terra',
      live: 'Live',
      languageSwitcherLabel: 'Trocar idioma',
    },
    header: {
      brandMetaTitle: 'Studio Nº 01',
      brandMetaBody: 'Berlim / Aberto / Terra',
      nav: {
        skills: 'Skills',
        systems: 'Sistemas',
        templates: 'Templates',
        craft: 'Craft',
        blog: 'Blog',
        contact: 'Contato',
      },
      download: 'Baixar',
      downloadAria: 'Baixar Open Design Desktop',
      downloadTitle: 'Baixar o app desktop',
      starAria: 'Dar Star no Open Design no GitHub',
      starTitle: 'Dar Star no GitHub',
      starPrefix: 'Star',
    },
  },
  it: {
    topbar: {
      filedUnder: 'Categoria',
      category: 'Design · Intelligenza',
      madeOnEarth: 'Apache-2.0 · Fatto sulla Terra',
      live: 'Live',
      languageSwitcherLabel: 'Cambia lingua',
    },
    header: {
      brandMetaTitle: 'Studio Nº 01',
      brandMetaBody: 'Berlino / Aperto / Terra',
      nav: {
        skills: 'Skill',
        systems: 'Sistemi',
        templates: 'Template',
        craft: 'Craft',
        blog: 'Blog',
        contact: 'Contatto',
      },
      download: 'Scarica',
      downloadAria: 'Scarica Open Design Desktop',
      downloadTitle: "Scarica l'app desktop",
      starAria: 'Metti una Star a Open Design su GitHub',
      starTitle: 'Metti una Star su GitHub',
      starPrefix: 'Star',
    },
  },
  vi: {
    topbar: {
      filedUnder: 'Chủ đề',
      category: 'Thiết kế · Trí tuệ',
      madeOnEarth: 'Apache-2.0 · Làm trên Trái Đất',
      live: 'Live',
      languageSwitcherLabel: 'Đổi ngôn ngữ',
    },
    header: {
      brandMetaTitle: 'Studio Nº 01',
      brandMetaBody: 'Berlin / Mở / Trái Đất',
      nav: {
        skills: 'Skill',
        systems: 'Hệ thống',
        templates: 'Mẫu',
        craft: 'Craft',
        blog: 'Blog',
        contact: 'Liên hệ',
      },
      download: 'Tải xuống',
      downloadAria: 'Tải Open Design Desktop',
      downloadTitle: 'Tải ứng dụng desktop',
      starAria: 'Star Open Design trên GitHub',
      starTitle: 'Star trên GitHub',
      starPrefix: 'Star',
    },
  },
  pl: {
    topbar: {
      filedUnder: 'Kategoria',
      category: 'Design · Inteligencja',
      madeOnEarth: 'Apache-2.0 · Made on Earth',
      live: 'Live',
      languageSwitcherLabel: 'Zmień język',
    },
    header: {
      brandMetaTitle: 'Studio Nº 01',
      brandMetaBody: 'Berlin / Otwarte / Ziemia',
      nav: {
        skills: 'Skills',
        systems: 'Systemy',
        templates: 'Szablony',
        craft: 'Craft',
        blog: 'Blog',
        contact: 'Kontakt',
      },
      download: 'Pobierz',
      downloadAria: 'Pobierz Open Design Desktop',
      downloadTitle: 'Pobierz aplikację desktop',
      starAria: 'Daj gwiazdkę Open Design na GitHubie',
      starTitle: 'Daj gwiazdkę na GitHubie',
      starPrefix: 'Star',
    },
  },
  id: {
    topbar: {
      filedUnder: 'Kategori',
      category: 'Desain · Inteligensi',
      madeOnEarth: 'Apache-2.0 · Dibuat di Bumi',
      live: 'Live',
      languageSwitcherLabel: 'Ganti bahasa',
    },
    header: {
      brandMetaTitle: 'Studio Nº 01',
      brandMetaBody: 'Berlin / Terbuka / Bumi',
      nav: {
        skills: 'Skill',
        systems: 'Sistem',
        templates: 'Templat',
        craft: 'Craft',
        blog: 'Blog',
        contact: 'Kontak',
      },
      download: 'Unduh',
      downloadAria: 'Unduh Open Design Desktop',
      downloadTitle: 'Unduh aplikasi desktop',
      starAria: 'Beri Star Open Design di GitHub',
      starTitle: 'Beri Star di GitHub',
      starPrefix: 'Star',
    },
  },
  nl: {
    topbar: {
      filedUnder: 'Categorie',
      category: 'Design · Intelligentie',
      madeOnEarth: 'Apache-2.0 · Made on Earth',
      live: 'Live',
      languageSwitcherLabel: 'Taal wisselen',
    },
    header: {
      brandMetaTitle: 'Studio Nº 01',
      brandMetaBody: 'Berlijn / Open / Aarde',
      nav: {
        skills: 'Skills',
        systems: 'Systemen',
        templates: 'Templates',
        craft: 'Craft',
        blog: 'Blog',
        contact: 'Contact',
      },
      download: 'Download',
      downloadAria: 'Open Design Desktop downloaden',
      downloadTitle: 'Desktop-app downloaden',
      starAria: 'Geef Open Design een Star op GitHub',
      starTitle: 'Star op GitHub',
      starPrefix: 'Star',
    },
  },
  ar: {
    topbar: {
      filedUnder: 'ضمن',
      category: 'تصميم · ذكاء',
      madeOnEarth: 'Apache-2.0 · صنع على الأرض',
      live: 'مباشر',
      languageSwitcherLabel: 'تبديل اللغة',
    },
    header: {
      brandMetaTitle: 'Studio Nº 01',
      brandMetaBody: 'برلين / مفتوح / الأرض',
      nav: {
        skills: 'Skills',
        systems: 'أنظمة',
        templates: 'قوالب',
        craft: 'حرفة',
        blog: 'المدونة',
        contact: 'تواصل',
      },
      download: 'تنزيل',
      downloadAria: 'تنزيل Open Design Desktop',
      downloadTitle: 'تنزيل تطبيق سطح المكتب',
      starAria: 'ضع نجمة لـ Open Design على GitHub',
      starTitle: 'ضع نجمة على GitHub',
      starPrefix: 'Star',
    },
  },
  tr: {
    topbar: {
      filedUnder: 'Kategori',
      category: 'Tasarım · Zeka',
      madeOnEarth: 'Apache-2.0 · Dünya üzerinde yapıldı',
      live: 'Canlı',
      languageSwitcherLabel: 'Dili değiştir',
    },
    header: {
      brandMetaTitle: 'Studio Nº 01',
      brandMetaBody: 'Berlin / Açık / Dünya',
      nav: {
        skills: 'Skill',
        systems: 'Sistemler',
        templates: 'Şablonlar',
        craft: 'Craft',
        blog: 'Blog',
        contact: 'İletişim',
      },
      download: 'İndir',
      downloadAria: 'Open Design Desktop indir',
      downloadTitle: 'Desktop uygulamasını indir',
      starAria: "GitHub'da Open Design'a Star ver",
      starTitle: "GitHub'da Star ver",
      starPrefix: 'Star',
    },
  },
  uk: {
    topbar: {
      filedUnder: 'Розділ',
      category: 'Дизайн · Інтелект',
      madeOnEarth: 'Apache-2.0 · Зроблено на Землі',
      live: 'Live',
      languageSwitcherLabel: 'Змінити мову',
    },
    header: {
      brandMetaTitle: 'Studio Nº 01',
      brandMetaBody: 'Берлін / Open / Earth',
      nav: {
        skills: 'Skills',
        systems: 'Системи',
        templates: 'Шаблони',
        craft: 'Craft',
        blog: 'Блог',
        contact: 'Контакт',
      },
      download: 'Завантажити',
      downloadAria: 'Завантажити Open Design Desktop',
      downloadTitle: 'Завантажити desktop-застосунок',
      starAria: 'Поставити зірку Open Design на GitHub',
      starTitle: 'Поставити зірку на GitHub',
      starPrefix: 'Star',
    },
  },
};

const HOME_SEO_COPY: Record<LandingLocaleCode, HomeSeoCopy> = {
  en: {
    title: 'Open Design — Official open-source Claude Design alternative',
    description:
      'Open Design is the official open-source, local-first Claude Design alternative. Generate decks, landing pages, dashboards, and brand systems with Claude Code, Codex, Cursor, Gemini, OpenCode, or Qwen — driven by {skills} composable skills and {systems} portable DESIGN.md systems.',
  },
  zh: {
    title: 'Open Design —— 官方 Claude Design 开源替代',
    description:
      'Open Design 是官方的开源、本地优先 Claude Design 替代方案。用 Claude Code、Codex、Cursor、Gemini、OpenCode 或 Qwen 生成演示文稿、落地页、仪表盘和品牌系统，背后由 {skills} 个可组合 Skill 与 {systems} 套 DESIGN.md 系统驱动。',
  },
  'zh-tw': {
    title: 'Open Design —— 官方 Claude Design 開源替代',
    description:
      'Open Design 是官方的開源、本地優先 Claude Design 替代方案。用 Claude Code、Codex、Cursor、Gemini、OpenCode 或 Qwen 生成簡報、落地頁、儀表板與品牌系統，背後由 {skills} 個可組合 Skill 與 {systems} 套 DESIGN.md 系統驅動。',
  },
  ja: {
    title: 'Open Design — 公式のオープンソース Claude Design 代替',
    description:
      'Open Design は公式のオープンソースかつローカル優先の Claude Design 代替です。Claude Code、Codex、Cursor、Gemini、OpenCode、Qwen と {skills} 個のスキル、{systems} 個の DESIGN.md システムでデッキ、ランディングページ、ダッシュボード、ブランドシステムを生成します。',
  },
  ko: {
    title: 'Open Design — 공식 오픈소스 Claude Design 대안',
    description:
      'Open Design은 공식 오픈소스, 로컬 우선 Claude Design 대안입니다. Claude Code, Codex, Cursor, Gemini, OpenCode, Qwen과 {skills}개의 조합형 스킬, {systems}개의 DESIGN.md 시스템으로 덱, 랜딩 페이지, 대시보드, 브랜드 시스템을 만듭니다.',
  },
  de: {
    title: 'Open Design — offizielle Open-Source-Alternative zu Claude Design',
    description:
      'Open Design ist die offizielle Open-Source- und Local-first-Alternative zu Claude Design. Erzeuge Decks, Landingpages, Dashboards und Brand-Systeme mit Claude Code, Codex, Cursor, Gemini, OpenCode oder Qwen — mit {skills} kombinierbaren Skills und {systems} portablen DESIGN.md-Systemen.',
  },
  fr: {
    title: "Open Design — l'alternative open source officielle à Claude Design",
    description:
      "Open Design est l'alternative officielle, open source et local-first à Claude Design. Générez des decks, landing pages, dashboards et systèmes de marque avec Claude Code, Codex, Cursor, Gemini, OpenCode ou Qwen — grâce à {skills} skills composables et {systems} systèmes DESIGN.md portables.",
  },
  ru: {
    title: 'Open Design — официальная open-source альтернатива Claude Design',
    description:
      'Open Design — официальная open-source и local-first альтернатива Claude Design. Создавайте презентации, лендинги, дашборды и бренд-системы через Claude Code, Codex, Cursor, Gemini, OpenCode или Qwen на базе {skills} skills и {systems} DESIGN.md-систем.',
  },
  es: {
    title: 'Open Design — alternativa open source oficial a Claude Design',
    description:
      'Open Design es la alternativa oficial, open source y local-first a Claude Design. Genera decks, landing pages, dashboards y sistemas de marca con Claude Code, Codex, Cursor, Gemini, OpenCode o Qwen, impulsado por {skills} skills componibles y {systems} sistemas DESIGN.md portables.',
  },
  'pt-br': {
    title: 'Open Design — alternativa open source oficial ao Claude Design',
    description:
      'Open Design é a alternativa oficial, open source e local-first ao Claude Design. Gere decks, landing pages, dashboards e sistemas de marca com Claude Code, Codex, Cursor, Gemini, OpenCode ou Qwen, usando {skills} skills combináveis e {systems} sistemas DESIGN.md portáteis.',
  },
  it: {
    title: "Open Design — l'alternativa open source ufficiale a Claude Design",
    description:
      "Open Design è l'alternativa ufficiale, open source e local-first a Claude Design. Genera deck, landing page, dashboard e sistemi di marca con Claude Code, Codex, Cursor, Gemini, OpenCode o Qwen, usando {skills} skill componibili e {systems} sistemi DESIGN.md portabili.",
  },
  vi: {
    title: 'Open Design — lựa chọn mã nguồn mở chính thức thay Claude Design',
    description:
      'Open Design là lựa chọn mã nguồn mở, local-first chính thức thay Claude Design. Tạo deck, landing page, dashboard và hệ thống thương hiệu bằng Claude Code, Codex, Cursor, Gemini, OpenCode hoặc Qwen, với {skills} skill có thể ghép và {systems} hệ DESIGN.md di động.',
  },
  pl: {
    title: 'Open Design — oficjalna open-source alternatywa dla Claude Design',
    description:
      'Open Design to oficjalna, open-source i local-first alternatywa dla Claude Design. Twórz decki, landing page, dashboardy i systemy marki z Claude Code, Codex, Cursor, Gemini, OpenCode lub Qwen, używając {skills} kompozycyjnych skills i {systems} przenośnych systemów DESIGN.md.',
  },
  id: {
    title: 'Open Design — alternatif open source resmi untuk Claude Design',
    description:
      'Open Design adalah alternatif resmi, open source, dan local-first untuk Claude Design. Buat deck, landing page, dashboard, dan sistem merek dengan Claude Code, Codex, Cursor, Gemini, OpenCode, atau Qwen, didukung {skills} skill komposable dan {systems} sistem DESIGN.md portabel.',
  },
  nl: {
    title: 'Open Design — officieel open-source alternatief voor Claude Design',
    description:
      'Open Design is het officiële open-source en local-first alternatief voor Claude Design. Maak decks, landingspagina’s, dashboards en merksystemen met Claude Code, Codex, Cursor, Gemini, OpenCode of Qwen, aangedreven door {skills} combineerbare skills en {systems} draagbare DESIGN.md-systemen.',
  },
  ar: {
    title: 'Open Design — البديل الرسمي مفتوح المصدر لـ Claude Design',
    description:
      'Open Design هو البديل الرسمي مفتوح المصدر والمحلي أولاً لـ Claude Design. أنشئ عروضاً وصفحات هبوط ولوحات بيانات وأنظمة علامة عبر Claude Code أو Codex أو Cursor أو Gemini أو OpenCode أو Qwen، مع {skills} مهارة قابلة للتركيب و {systems} نظام DESIGN.md قابل للنقل.',
  },
  tr: {
    title: "Open Design — Claude Design'ın resmi açık kaynak alternatifi",
    description:
      "Open Design, Claude Design'ın resmi, açık kaynak ve local-first alternatifidir. Claude Code, Codex, Cursor, Gemini, OpenCode veya Qwen ile deck, landing page, dashboard ve marka sistemleri üretin; {skills} birleştirilebilir skill ve {systems} taşınabilir DESIGN.md sistemiyle çalışır.",
  },
  uk: {
    title: 'Open Design — офіційна open-source альтернатива Claude Design',
    description:
      'Open Design — офіційна open-source і local-first альтернатива Claude Design. Створюйте презентації, лендинги, дашборди та бренд-системи через Claude Code, Codex, Cursor, Gemini, OpenCode або Qwen на базі {skills} skills і {systems} DESIGN.md-систем.',
  },
};

const HOME_FAQ_COPY: Record<LandingLocaleCode, HomeFaqTemplate[]> = {
  en: [
    {
      q: 'What is Open Design?',
      a: 'Open Design is the official open-source AI design workspace from the nexu-io/open-design project. It turns a local coding agent — Claude Code, Codex, Cursor, Gemini CLI, OpenCode, or Qwen — into a design engine driven by composable skills and portable DESIGN.md systems.',
    },
    {
      q: 'Is Open Design official?',
      a: 'Yes. The canonical project lives at {origin} and the source is on GitHub at {repo}. "Open Design", "OpenDesign", "open-design", and "Open Design AI" all refer to this same project.',
      official: true,
    },
    {
      q: 'How is Open Design different from Claude Design?',
      a: 'Claude Design is a hosted product tied to a single vendor. Open Design is local-first, open source under Apache-2.0, and BYOK: you bring your own agent, credentials, and DESIGN.md system.',
    },
    {
      q: 'Does Open Design run locally?',
      a: 'Yes. The desktop app, daemon, and skill runtime run on your machine. Generated artifacts land in your project directory instead of being forced through a vendor cloud.',
    },
    {
      q: 'Which coding agents does Open Design support?',
      a: 'Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Qwen, and other adapters that speak the same skill protocol. Switching agents does not require redesigning your skill library.',
    },
    {
      q: 'Can I self-host or fork it?',
      a: 'Yes. The code is Apache-2.0. You can fork the repo, edit skills, add your own DESIGN.md systems, or run the daemon on your own machines.',
    },
  ],
  zh: [
    {
      q: 'Open Design 是什么？',
      a: 'Open Design 是 nexu-io/open-design 项目的官方开源 AI 设计工作台。它把本地编码 Agent（Claude Code、Codex、Cursor、Gemini CLI、OpenCode 或 Qwen）变成设计引擎，并由可组合 Skill 与可移植 DESIGN.md 系统驱动。',
    },
    {
      q: 'Open Design 是官方项目吗？',
      a: '是。官方站点是 {origin}，源代码在 GitHub：{repo}。"Open Design"、"OpenDesign"、"open-design" 和 "Open Design AI" 都指向同一个项目。',
      official: true,
    },
    {
      q: '它和 Claude Design 有什么不同？',
      a: 'Claude Design 是绑定单一厂商的云端产品。Open Design 本地优先、Apache-2.0 开源，并且 BYOK：你使用自己的 Agent、密钥和 DESIGN.md 设计系统。',
    },
    {
      q: 'Open Design 可以本地运行吗？',
      a: '可以。桌面端、daemon 和 Skill 运行时都在你的机器上运行，生成的 artifact 会落在你的项目目录里。',
    },
    {
      q: '支持哪些编码 Agent？',
      a: '支持 Claude Code、Codex、Cursor、Gemini CLI、OpenCode、Qwen，以及遵循同一 Skill 协议的其它适配器。',
    },
    {
      q: '可以自托管或 fork 吗？',
      a: '可以。代码采用 Apache-2.0 协议，你可以 fork 仓库、编辑 Skill、添加自己的 DESIGN.md 系统，或在自己的机器上运行 daemon。',
    },
  ],
  'zh-tw': [
    {
      q: 'Open Design 是什麼？',
      a: 'Open Design 是 nexu-io/open-design 專案的官方開源 AI 設計工作台。它把本地 coding agent（Claude Code、Codex、Cursor、Gemini CLI、OpenCode 或 Qwen）變成設計引擎，並由可組合 Skill 與可攜式 DESIGN.md 系統驅動。',
    },
    {
      q: 'Open Design 是官方專案嗎？',
      a: '是。官方站點是 {origin}，原始碼在 GitHub：{repo}。"Open Design"、"OpenDesign"、"open-design" 與 "Open Design AI" 都指同一個專案。',
      official: true,
    },
    {
      q: '它和 Claude Design 有什麼不同？',
      a: 'Claude Design 是綁定單一供應商的雲端產品。Open Design 本地優先、Apache-2.0 開源，並且 BYOK：你使用自己的 agent、密鑰與 DESIGN.md 設計系統。',
    },
    {
      q: 'Open Design 可以本地執行嗎？',
      a: '可以。桌面端、daemon 與 Skill runtime 都在你的機器上執行，生成的 artifact 會落在你的專案目錄。',
    },
    {
      q: '支援哪些 coding agent？',
      a: '支援 Claude Code、Codex、Cursor、Gemini CLI、OpenCode、Qwen，以及遵循同一 Skill 協議的其他 adapter。',
    },
    {
      q: '可以自架或 fork 嗎？',
      a: '可以。程式碼採 Apache-2.0，你可以 fork repo、編輯 Skill、加入自己的 DESIGN.md 系統，或在自己的機器上跑 daemon。',
    },
  ],
  ja: [
    {
      q: 'Open Design とは何ですか？',
      a: 'Open Design は nexu-io/open-design プロジェクト公式のオープンソース AI デザインワークスペースです。Claude Code、Codex、Cursor、Gemini CLI、OpenCode、Qwen などのローカル coding agent を、スキルと DESIGN.md システムで動くデザインエンジンにします。',
    },
    {
      q: 'Open Design は公式ですか？',
      a: 'はい。公式サイトは {origin}、ソースコードは GitHub の {repo} です。"Open Design"、"OpenDesign"、"open-design"、"Open Design AI" は同じプロジェクトを指します。',
      official: true,
    },
    {
      q: 'Claude Design と何が違いますか？',
      a: 'Claude Design は単一ベンダーに紐づくホスト型製品です。Open Design はローカル優先、Apache-2.0 のオープンソース、BYOK で、自分の agent、鍵、DESIGN.md を使います。',
    },
    {
      q: 'ローカルで動きますか？',
      a: 'はい。デスクトップアプリ、daemon、スキル runtime はすべて自分のマシン上で動き、生成物はプロジェクトディレクトリに保存されます。',
    },
    {
      q: '対応している coding agent は？',
      a: 'Claude Code、Codex、Cursor、Gemini CLI、OpenCode、Qwen と、同じ skill protocol を話す adapter に対応します。',
    },
    {
      q: 'セルフホストや fork はできますか？',
      a: 'できます。Apache-2.0 のコードなので、repo を fork し、skill を編集し、独自の DESIGN.md システムを追加できます。',
    },
  ],
  ko: [
    {
      q: 'Open Design은 무엇인가요?',
      a: 'Open Design은 nexu-io/open-design 프로젝트의 공식 오픈소스 AI 디자인 워크스페이스입니다. Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Qwen 같은 로컬 coding agent를 조합형 skill과 DESIGN.md 시스템으로 구동되는 디자인 엔진으로 바꿉니다.',
    },
    {
      q: 'Open Design은 공식 프로젝트인가요?',
      a: '네. 공식 사이트는 {origin}이고 소스는 GitHub의 {repo}에 있습니다. "Open Design", "OpenDesign", "open-design", "Open Design AI"는 같은 프로젝트를 가리킵니다.',
      official: true,
    },
    {
      q: 'Claude Design과 무엇이 다른가요?',
      a: 'Claude Design은 단일 벤더에 묶인 호스팅 제품입니다. Open Design은 로컬 우선, Apache-2.0 오픈소스, BYOK이며 사용자의 agent, 키, DESIGN.md 시스템을 그대로 씁니다.',
    },
    {
      q: '로컬에서 실행되나요?',
      a: '네. 데스크톱 앱, daemon, skill runtime이 모두 사용자 컴퓨터에서 실행되고 생성 artifact는 프로젝트 디렉터리에 저장됩니다.',
    },
    {
      q: '어떤 coding agent를 지원하나요?',
      a: 'Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Qwen 및 같은 skill protocol을 사용하는 adapter를 지원합니다.',
    },
    {
      q: '셀프호스팅이나 fork가 가능한가요?',
      a: '가능합니다. Apache-2.0 코드라 repo를 fork하고, skill을 편집하고, 자체 DESIGN.md 시스템을 추가할 수 있습니다.',
    },
  ],
  de: [
    {
      q: 'Was ist Open Design?',
      a: 'Open Design ist der offizielle Open-Source-AI-Design-Workspace des Projekts nexu-io/open-design. Es macht lokale Coding-Agents wie Claude Code, Codex, Cursor, Gemini CLI, OpenCode oder Qwen zu einer Design-Engine auf Basis von Skills und DESIGN.md-Systemen.',
    },
    {
      q: 'Ist Open Design offiziell?',
      a: 'Ja. Die kanonische Website ist {origin}, der Quellcode liegt auf GitHub unter {repo}. "Open Design", "OpenDesign", "open-design" und "Open Design AI" meinen dasselbe Projekt.',
      official: true,
    },
    {
      q: 'Worin unterscheidet es sich von Claude Design?',
      a: 'Claude Design ist ein gehostetes Produkt eines einzelnen Anbieters. Open Design ist local-first, Apache-2.0 Open Source und BYOK: Sie bringen Agent, Schlüssel und DESIGN.md-System selbst mit.',
    },
    {
      q: 'Läuft Open Design lokal?',
      a: 'Ja. Desktop-App, Daemon und Skill-Runtime laufen auf Ihrem Rechner. Generierte Artifacts landen in Ihrem Projektverzeichnis.',
    },
    {
      q: 'Welche Coding-Agents werden unterstützt?',
      a: 'Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Qwen und weitere Adapter mit demselben Skill-Protokoll.',
    },
    {
      q: 'Kann ich es selbst hosten oder forken?',
      a: 'Ja. Der Code ist Apache-2.0. Sie können das Repo forken, Skills bearbeiten, eigene DESIGN.md-Systeme hinzufügen oder den Daemon selbst betreiben.',
    },
  ],
  fr: [
    {
      q: "Qu'est-ce qu'Open Design ?",
      a: "Open Design est l'espace de travail officiel et open source du projet nexu-io/open-design. Il transforme un agent local — Claude Code, Codex, Cursor, Gemini CLI, OpenCode ou Qwen — en moteur de design piloté par des skills composables et des systèmes DESIGN.md portables.",
    },
    {
      q: 'Open Design est-il officiel ?',
      a: 'Oui. Le site canonique est {origin} et le code source est sur GitHub à {repo}. "Open Design", "OpenDesign", "open-design" et "Open Design AI" désignent le même projet.',
      official: true,
    },
    {
      q: 'Quelle différence avec Claude Design ?',
      a: 'Claude Design est un produit hébergé lié à un fournisseur unique. Open Design est local-first, open source Apache-2.0 et BYOK : vous apportez votre agent, vos clés et votre système DESIGN.md.',
    },
    {
      q: 'Open Design fonctionne-t-il en local ?',
      a: 'Oui. L’app desktop, le daemon et le runtime de skills tournent sur votre machine, et les artifacts générés restent dans votre répertoire de projet.',
    },
    {
      q: 'Quels agents de coding sont supportés ?',
      a: 'Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Qwen et les autres adaptateurs qui parlent le même protocole de skills.',
    },
    {
      q: "Puis-je l'auto-héberger ou le forker ?",
      a: 'Oui. Le code est Apache-2.0. Vous pouvez forker le repo, modifier les skills, ajouter vos systèmes DESIGN.md ou exécuter le daemon sur vos machines.',
    },
  ],
  ru: [
    {
      q: 'Что такое Open Design?',
      a: 'Open Design — официальный open-source AI design workspace проекта nexu-io/open-design. Он превращает локальный coding agent — Claude Code, Codex, Cursor, Gemini CLI, OpenCode или Qwen — в design-движок на базе composable skills и переносимых DESIGN.md-систем.',
    },
    {
      q: 'Open Design официальный?',
      a: 'Да. Канонический сайт — {origin}, исходный код — на GitHub: {repo}. "Open Design", "OpenDesign", "open-design" и "Open Design AI" обозначают один проект.',
      official: true,
    },
    {
      q: 'Чем он отличается от Claude Design?',
      a: 'Claude Design — hosted-продукт одного вендора. Open Design — local-first, Apache-2.0 open source и BYOK: вы используете своего agent, свои ключи и свою DESIGN.md-систему.',
    },
    {
      q: 'Open Design запускается локально?',
      a: 'Да. Desktop app, daemon и skill runtime работают на вашей машине, а generated artifacts сохраняются в папку проекта.',
    },
    {
      q: 'Какие coding agents поддерживаются?',
      a: 'Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Qwen и другие adapters, которые говорят на том же skill protocol.',
    },
    {
      q: 'Можно self-host или fork?',
      a: 'Да. Код Apache-2.0. Можно fork-нуть repo, менять skills, добавлять свои DESIGN.md-системы и запускать daemon на своих машинах.',
    },
  ],
  es: [
    {
      q: '¿Qué es Open Design?',
      a: 'Open Design es el workspace oficial y open source de IA de diseño del proyecto nexu-io/open-design. Convierte un coding agent local — Claude Code, Codex, Cursor, Gemini CLI, OpenCode o Qwen — en un motor de diseño con skills componibles y sistemas DESIGN.md portables.',
    },
    {
      q: '¿Open Design es oficial?',
      a: 'Sí. El sitio canónico es {origin} y el código fuente está en GitHub en {repo}. "Open Design", "OpenDesign", "open-design" y "Open Design AI" apuntan al mismo proyecto.',
      official: true,
    },
    {
      q: '¿En qué se diferencia de Claude Design?',
      a: 'Claude Design es un producto alojado ligado a un solo proveedor. Open Design es local-first, open source Apache-2.0 y BYOK: usas tu propio agent, claves y sistema DESIGN.md.',
    },
    {
      q: '¿Open Design corre localmente?',
      a: 'Sí. La app desktop, el daemon y el runtime de skills corren en tu máquina. Los artifacts generados quedan en tu directorio de proyecto.',
    },
    {
      q: '¿Qué coding agents soporta?',
      a: 'Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Qwen y otros adaptadores que hablen el mismo protocolo de skills.',
    },
    {
      q: '¿Puedo autoalojarlo o hacer fork?',
      a: 'Sí. El código es Apache-2.0. Puedes hacer fork del repo, editar skills, añadir sistemas DESIGN.md propios o ejecutar el daemon en tus máquinas.',
    },
  ],
  'pt-br': [
    {
      q: 'O que é Open Design?',
      a: 'Open Design é o workspace oficial, open source, de design com IA do projeto nexu-io/open-design. Ele transforma um coding agent local — Claude Code, Codex, Cursor, Gemini CLI, OpenCode ou Qwen — em um motor de design movido por skills componíveis e sistemas DESIGN.md portáteis.',
    },
    {
      q: 'Open Design é oficial?',
      a: 'Sim. O site canônico é {origin} e o código-fonte está no GitHub em {repo}. "Open Design", "OpenDesign", "open-design" e "Open Design AI" apontam para o mesmo projeto.',
      official: true,
    },
    {
      q: 'Qual a diferença para o Claude Design?',
      a: 'Claude Design é um produto hospedado preso a um fornecedor. Open Design é local-first, open source Apache-2.0 e BYOK: você traz seu agent, suas chaves e seu sistema DESIGN.md.',
    },
    {
      q: 'Open Design roda localmente?',
      a: 'Sim. O app desktop, o daemon e o runtime de skills rodam na sua máquina, e os artifacts gerados ficam no diretório do projeto.',
    },
    {
      q: 'Quais coding agents são suportados?',
      a: 'Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Qwen e outros adaptadores que falam o mesmo protocolo de skills.',
    },
    {
      q: 'Posso auto-hospedar ou fazer fork?',
      a: 'Sim. O código é Apache-2.0. Você pode fazer fork do repo, editar skills, adicionar seus sistemas DESIGN.md ou rodar o daemon nas suas máquinas.',
    },
  ],
  it: [
    {
      q: "Cos'è Open Design?",
      a: 'Open Design è il workspace ufficiale e open source di AI design del progetto nexu-io/open-design. Trasforma un coding agent locale — Claude Code, Codex, Cursor, Gemini CLI, OpenCode o Qwen — in un motore di design guidato da skill componibili e sistemi DESIGN.md portabili.',
    },
    {
      q: 'Open Design è ufficiale?',
      a: 'Sì. Il sito canonico è {origin} e il codice sorgente è su GitHub in {repo}. "Open Design", "OpenDesign", "open-design" e "Open Design AI" indicano lo stesso progetto.',
      official: true,
    },
    {
      q: 'In cosa differisce da Claude Design?',
      a: 'Claude Design è un prodotto hosted legato a un solo vendor. Open Design è local-first, open source Apache-2.0 e BYOK: usi il tuo agent, le tue chiavi e il tuo sistema DESIGN.md.',
    },
    {
      q: 'Open Design gira in locale?',
      a: "Sì. App desktop, daemon e runtime delle skill girano sulla tua macchina. Gli artifact generati restano nella directory del progetto.",
    },
    {
      q: 'Quali coding agent supporta?',
      a: 'Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Qwen e altri adapter che parlano lo stesso protocollo di skill.',
    },
    {
      q: 'Posso self-hostarlo o fare fork?',
      a: 'Sì. Il codice è Apache-2.0. Puoi fare fork del repo, modificare le skill, aggiungere sistemi DESIGN.md o eseguire il daemon sui tuoi server.',
    },
  ],
  vi: [
    {
      q: 'Open Design là gì?',
      a: 'Open Design là workspace thiết kế AI mã nguồn mở chính thức của dự án nexu-io/open-design. Nó biến coding agent chạy trên máy bạn — Claude Code, Codex, Cursor, Gemini CLI, OpenCode hoặc Qwen — thành engine thiết kế dựa trên skill ghép được và hệ DESIGN.md di động.',
    },
    {
      q: 'Open Design có phải dự án chính thức không?',
      a: 'Có. Trang canonical là {origin}, mã nguồn ở GitHub: {repo}. "Open Design", "OpenDesign", "open-design" và "Open Design AI" đều chỉ cùng một dự án.',
      official: true,
    },
    {
      q: 'Khác gì Claude Design?',
      a: 'Claude Design là sản phẩm hosted gắn với một nhà cung cấp. Open Design local-first, open source Apache-2.0 và BYOK: bạn dùng agent, key và hệ DESIGN.md của chính mình.',
    },
    {
      q: 'Open Design chạy local được không?',
      a: 'Có. Ứng dụng desktop, daemon và skill runtime chạy trên máy bạn. Artifact tạo ra nằm trong thư mục dự án của bạn.',
    },
    {
      q: 'Hỗ trợ coding agent nào?',
      a: 'Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Qwen và adapter khác dùng cùng skill protocol.',
    },
    {
      q: 'Có thể self-host hoặc fork không?',
      a: 'Có. Mã nguồn Apache-2.0. Bạn có thể fork repo, sửa skill, thêm hệ DESIGN.md riêng hoặc chạy daemon trên máy của mình.',
    },
  ],
  pl: [
    {
      q: 'Czym jest Open Design?',
      a: 'Open Design to oficjalny, open-source workspace AI design projektu nexu-io/open-design. Zamienia lokalnego coding agenta — Claude Code, Codex, Cursor, Gemini CLI, OpenCode albo Qwen — w silnik designu oparty o kompozycyjne skills i przenośne systemy DESIGN.md.',
    },
    {
      q: 'Czy Open Design jest oficjalne?',
      a: 'Tak. Kanoniczna strona to {origin}, a kod źródłowy jest na GitHubie: {repo}. "Open Design", "OpenDesign", "open-design" i "Open Design AI" oznaczają ten sam projekt.',
      official: true,
    },
    {
      q: 'Czym różni się od Claude Design?',
      a: 'Claude Design to hostowany produkt jednego dostawcy. Open Design jest local-first, open source Apache-2.0 i BYOK: używasz własnego agenta, kluczy i systemu DESIGN.md.',
    },
    {
      q: 'Czy Open Design działa lokalnie?',
      a: 'Tak. Aplikacja desktop, daemon i runtime skills działają na Twojej maszynie, a wygenerowane artifacts trafiają do katalogu projektu.',
    },
    {
      q: 'Jakie coding agents są wspierane?',
      a: 'Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Qwen i inne adaptery używające tego samego skill protocol.',
    },
    {
      q: 'Czy mogę self-hostować albo zrobić fork?',
      a: 'Tak. Kod jest Apache-2.0. Możesz forkować repo, edytować skills, dodawać własne systemy DESIGN.md lub uruchomić daemon u siebie.',
    },
  ],
  id: [
    {
      q: 'Apa itu Open Design?',
      a: 'Open Design adalah workspace AI design resmi dan open source dari proyek nexu-io/open-design. Ia mengubah coding agent lokal — Claude Code, Codex, Cursor, Gemini CLI, OpenCode, atau Qwen — menjadi mesin desain berbasis skill komposable dan sistem DESIGN.md portabel.',
    },
    {
      q: 'Apakah Open Design resmi?',
      a: 'Ya. Situs canonical ada di {origin} dan source code ada di GitHub: {repo}. "Open Design", "OpenDesign", "open-design", dan "Open Design AI" merujuk ke proyek yang sama.',
      official: true,
    },
    {
      q: 'Apa bedanya dengan Claude Design?',
      a: 'Claude Design adalah produk hosted yang terikat pada satu vendor. Open Design local-first, open source Apache-2.0, dan BYOK: Anda memakai agent, key, dan sistem DESIGN.md sendiri.',
    },
    {
      q: 'Apakah Open Design berjalan lokal?',
      a: 'Ya. Aplikasi desktop, daemon, dan skill runtime berjalan di mesin Anda. Artifact yang dibuat masuk ke direktori proyek Anda.',
    },
    {
      q: 'Coding agent apa yang didukung?',
      a: 'Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Qwen, dan adapter lain yang memakai skill protocol yang sama.',
    },
    {
      q: 'Bisakah self-host atau fork?',
      a: 'Bisa. Kodenya Apache-2.0. Anda bisa fork repo, mengedit skill, menambah sistem DESIGN.md sendiri, atau menjalankan daemon di mesin Anda.',
    },
  ],
  nl: [
    {
      q: 'Wat is Open Design?',
      a: 'Open Design is de officiële open-source AI design workspace van het project nexu-io/open-design. Het verandert een lokale coding agent — Claude Code, Codex, Cursor, Gemini CLI, OpenCode of Qwen — in een design-engine met combineerbare skills en draagbare DESIGN.md-systemen.',
    },
    {
      q: 'Is Open Design officieel?',
      a: 'Ja. De canonieke site is {origin} en de broncode staat op GitHub: {repo}. "Open Design", "OpenDesign", "open-design" en "Open Design AI" verwijzen naar hetzelfde project.',
      official: true,
    },
    {
      q: 'Wat is het verschil met Claude Design?',
      a: 'Claude Design is een hosted product van één leverancier. Open Design is local-first, Apache-2.0 open source en BYOK: je gebruikt je eigen agent, sleutels en DESIGN.md-systeem.',
    },
    {
      q: 'Draait Open Design lokaal?',
      a: 'Ja. De desktop-app, daemon en skill runtime draaien op je eigen machine. Gegenereerde artifacts komen in je projectdirectory terecht.',
    },
    {
      q: 'Welke coding agents worden ondersteund?',
      a: 'Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Qwen en andere adapters die hetzelfde skill protocol spreken.',
    },
    {
      q: 'Kan ik self-hosten of forken?',
      a: 'Ja. De code is Apache-2.0. Je kunt de repo forken, skills aanpassen, eigen DESIGN.md-systemen toevoegen of de daemon zelf draaien.',
    },
  ],
  ar: [
    {
      q: 'ما هو Open Design؟',
      a: 'Open Design هو مساحة عمل تصميم بالذكاء الاصطناعي رسمية ومفتوحة المصدر من مشروع nexu-io/open-design. يحوّل coding agent محلياً مثل Claude Code أو Codex أو Cursor أو Gemini CLI أو OpenCode أو Qwen إلى محرك تصميم يعمل عبر skills قابلة للتركيب وأنظمة DESIGN.md قابلة للنقل.',
    },
    {
      q: 'هل Open Design رسمي؟',
      a: 'نعم. الموقع canonical هو {origin} والمصدر على GitHub في {repo}. تشير "Open Design" و"OpenDesign" و"open-design" و"Open Design AI" إلى المشروع نفسه.',
      official: true,
    },
    {
      q: 'ما الفرق عن Claude Design؟',
      a: 'Claude Design منتج مستضاف مرتبط بمورّد واحد. Open Design محلي أولاً، مفتوح المصدر وفق Apache-2.0، وBYOK: تستخدم agent ومفاتيحك ونظام DESIGN.md الخاص بك.',
    },
    {
      q: 'هل يعمل Open Design محلياً؟',
      a: 'نعم. تطبيق سطح المكتب والdaemon وskill runtime تعمل على جهازك، والartifacts الناتجة تحفظ في مجلد مشروعك.',
    },
    {
      q: 'ما هي coding agents المدعومة؟',
      a: 'Claude Code وCodex وCursor وGemini CLI وOpenCode وQwen وأي adapter يستخدم skill protocol نفسه.',
    },
    {
      q: 'هل يمكنني الاستضافة الذاتية أو عمل fork؟',
      a: 'نعم. الكود Apache-2.0. يمكنك fork للrepo، تعديل skills، إضافة أنظمة DESIGN.md، أو تشغيل الdaemon على أجهزتك.',
    },
  ],
  tr: [
    {
      q: 'Open Design nedir?',
      a: "Open Design, nexu-io/open-design projesinin resmi açık kaynak AI design workspace'idir. Claude Code, Codex, Cursor, Gemini CLI, OpenCode veya Qwen gibi yerel coding agent'ları, birleştirilebilir skill'ler ve taşınabilir DESIGN.md sistemleriyle çalışan bir tasarım motoruna dönüştürür.",
    },
    {
      q: 'Open Design resmi mi?',
      a: 'Evet. Kanonik site {origin}, kaynak kod GitHub üzerinde {repo}. "Open Design", "OpenDesign", "open-design" ve "Open Design AI" aynı projeyi anlatır.',
      official: true,
    },
    {
      q: "Claude Design'dan farkı ne?",
      a: 'Claude Design tek bir vendor’a bağlı hosted bir üründür. Open Design local-first, Apache-2.0 açık kaynak ve BYOK’tur: kendi agent’ını, anahtarlarını ve DESIGN.md sistemini kullanırsın.',
    },
    {
      q: 'Open Design yerelde çalışır mı?',
      a: 'Evet. Desktop app, daemon ve skill runtime kendi makinenizde çalışır. Üretilen artifact’ler proje dizininize düşer.',
    },
    {
      q: 'Hangi coding agent’lar desteklenir?',
      a: 'Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Qwen ve aynı skill protocol’ü konuşan diğer adapter’lar.',
    },
    {
      q: 'Self-host veya fork mümkün mü?',
      a: 'Evet. Kod Apache-2.0. Repo’yu fork edebilir, skill’leri düzenleyebilir, kendi DESIGN.md sistemlerinizi ekleyebilir veya daemon’ı kendi makinelerinizde çalıştırabilirsiniz.',
    },
  ],
  uk: [
    {
      q: 'Що таке Open Design?',
      a: 'Open Design — офіційний open-source AI design workspace проєкту nexu-io/open-design. Він перетворює локальний coding agent — Claude Code, Codex, Cursor, Gemini CLI, OpenCode або Qwen — на design-двигун із composable skills і переносними DESIGN.md-системами.',
    },
    {
      q: 'Open Design офіційний?',
      a: 'Так. Канонічний сайт — {origin}, вихідний код на GitHub: {repo}. "Open Design", "OpenDesign", "open-design" і "Open Design AI" означають один проєкт.',
      official: true,
    },
    {
      q: 'Чим він відрізняється від Claude Design?',
      a: 'Claude Design — hosted-продукт одного вендора. Open Design — local-first, Apache-2.0 open source і BYOK: ви використовуєте свого agent, свої ключі та свою DESIGN.md-систему.',
    },
    {
      q: 'Open Design запускається локально?',
      a: 'Так. Desktop app, daemon і skill runtime працюють на вашій машині, а generated artifacts зберігаються в папку проєкту.',
    },
    {
      q: 'Які coding agents підтримуються?',
      a: 'Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Qwen та інші adapters, які говорять тим самим skill protocol.',
    },
    {
      q: 'Можна self-host або fork?',
      a: 'Так. Код Apache-2.0. Можна fork-нути repo, змінювати skills, додавати власні DESIGN.md-системи й запускати daemon на своїх машинах.',
    },
  ],
};

const localeByCode = new Map<string, LandingLocale>(
  LANDING_LOCALES.map((locale) => [locale.code, locale]),
);

export function isLandingLocale(value: string | undefined): value is LandingLocaleCode {
  return typeof value === 'string' && localeByCode.has(value);
}

export function getLocaleDefinition(code: LandingLocaleCode): LandingLocale {
  return localeByCode.get(code)!;
}

export function getCommonCopy(locale: LandingLocaleCode): CommonCopy {
  return COMMON_COPY[locale] ?? COMMON_COPY[DEFAULT_LOCALE];
}

export function getHomeSeo(
  locale: LandingLocaleCode,
  counts: { skills: number; systems: number },
): HomeSeoCopy {
  const copy = HOME_SEO_COPY[locale] ?? HOME_SEO_COPY[DEFAULT_LOCALE];
  return {
    title: copy.title,
    description: copy.description
      .replaceAll('{skills}', String(counts.skills))
      .replaceAll('{systems}', String(counts.systems)),
  };
}

export function getHomeFaq(
  locale: LandingLocaleCode,
  replacements: { origin: string; repo: string },
): HomeFaqEntry[] {
  const templates = HOME_FAQ_COPY[locale] ?? HOME_FAQ_COPY[DEFAULT_LOCALE];
  return templates.map((entry) => ({
    q: entry.q,
    a: entry.a
      .replaceAll('{origin}', replacements.origin)
      .replaceAll('{repo}', replacements.repo),
  }));
}

export function localePath(locale: LandingLocaleCode, pathname = '/'): string {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (locale === DEFAULT_LOCALE) return normalized;
  if (normalized === '/') return `/${locale}/`;
  return `/${locale}${normalized}`;
}

export function alternateLinksForPath(pathname = '/'): Array<{
  hreflang: string;
  hrefPath: string;
  locale: LandingLocale;
}> {
  return LANDING_LOCALES.map((locale) => ({
    hreflang: locale.htmlLang,
    hrefPath: localePath(locale.code, pathname),
    locale,
  }));
}
