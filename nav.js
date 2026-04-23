/* ============================================================
   AUTOBAHN — nav.js
   Navigation partagée, injectée automatiquement sur toutes les pages.
   ============================================================ */

(function () {

  /* ── CONFIGURATION LOGO ──────────────────────────────────── */
  const LOGO_IMAGE_SRC    = './assets/Asset8.png';   // desktop
  const LOGO_IMAGE_MOBILE = './assets/Asset5.png';   // mobile
  const LOGO_IMAGE_ALT    = 'Autobahn';

  /* ── PAGES & LIENS ───────────────────────────────────────── */
  const LINKS = [
    { href: 'creators.html', en: 'Team', fr: 'Team' },
    { href: 'lab.html',      en: 'Lab',      fr: 'Lab'       },
    { href: 'studio.html',   en: 'Studio',   fr: 'Studio'    },
    { href: 'contact.html',  en: 'Contact',  fr: 'Contact'   },
  ];

  /* ── PAGES SANS DARK TOGGLE (fond fixe) ─────────────────── */
  const NO_THEME_TOGGLE = ['studio.html', 'index.html'];

  /* ──────────────────────────────────────────────────────────
     Construction du HTML de navigation
  ────────────────────────────────────────────────────────── */
  const page = window.location.pathname.split('/').pop() || 'index.html';

  const linksHTML = LINKS.map(l => {
    const active = page === l.href ? 'class="active"' : '';
    return `<a href="${l.href}" ${active}>
      <span class="en">${l.en}</span>
      <span class="fr">${l.fr}</span>
    </a>`;
  }).join('');

  const showTheme = !NO_THEME_TOGGLE.includes(page);

  const themeToggleHTML = showTheme
    ? `<button class="theme-toggle" id="themeToggle" aria-label="Toggle dark mode"></button>`
    : '';

  const navEl = document.querySelector('nav');
  if (!navEl) return;

  navEl.innerHTML = `
  <div class="nav-links" id="navLinks">${linksHTML}</div>
  <div class="nav-controls">
    <div class="lang-switch">
      <button class="lang-btn" id="btnEN" onclick="setLang('en')">EN</button>
      <button class="lang-btn" id="btnFR" onclick="setLang('fr')">FR</button>
    </div>
    ${themeToggleHTML}
  </div>
  <button class="nav-hamburger" id="navHamburger" aria-label="Menu">
    <span></span><span></span>
  </button>`;

  /* ── Sur mobile : nav transparente (logo + burger sont fixed indépendants) ── */
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    navEl.style.setProperty('background',           'transparent', 'important');
    navEl.style.setProperty('backdrop-filter',      'none',        'important');
    navEl.style.setProperty('-webkit-backdrop-filter', 'none',     'important');
    navEl.style.setProperty('border-bottom',        'none',        'important');
  }
  const logoSrc    = isMobile ? LOGO_IMAGE_MOBILE : LOGO_IMAGE_SRC;
  const logoHeight = isMobile ? 14 : 10;
  const logoEl = document.createElement('a');
  logoEl.href = 'index.html';
  logoEl.className = 'nav-logo';
  logoEl.innerHTML = `<img src="${logoSrc}" alt="${LOGO_IMAGE_ALT}" height="${logoHeight}" style="display:block">`;
  document.body.prepend(logoEl);

  /* ── Menu mobile plein écran ── */
  const mobileMenuLinks = LINKS.map(l => {
    const active = page === l.href ? 'mobile-active' : '';
    return `<a href="${l.href}" class="${active}">
      <span class="en">${l.en}</span>
      <span class="fr">${l.fr}</span>
    </a>`;
  }).join('');

  const mobileThemeRow = showTheme ? `
    <button class="mobile-theme-btn" id="mobileThemeToggle">
      <span class="mobile-theme-label en">Theme</span>
      <span class="mobile-theme-label fr">Thème</span>
      <span class="mobile-theme-icon" id="mobileThemeIcon">○</span>
    </button>` : '';

  const mobileMenuEl = document.createElement('div');
  mobileMenuEl.id = 'mobileMenu';
  mobileMenuEl.innerHTML = `
    <nav class="mobile-nav-links">${mobileMenuLinks}</nav>
    <div class="mobile-menu-bottom">
      <div class="mobile-lang">
        <button class="mobile-lang-btn" id="mBtnEN" onclick="setLang('en')">EN</button>
        <span class="mobile-lang-sep">/</span>
        <button class="mobile-lang-btn" id="mBtnFR" onclick="setLang('fr')">FR</button>
      </div>
      ${mobileThemeRow}
    </div>`;
  document.body.appendChild(mobileMenuEl);

  /* ── Hamburger toggle ── */
  const hamburger  = document.getElementById('navHamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  function openMenu() {
    mobileMenu.classList.add('open');
    hamburger.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
  });

  mobileMenuEl.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });

  /* ──────────────────────────────────────────────────────────
     DARK MODE
  ────────────────────────────────────────────────────────── */
  const html   = document.documentElement;
  const stored = localStorage.getItem('autobahn-theme') || 'light';
  html.setAttribute('data-theme', stored);

  function updateThemeIcon() {
    const icon = document.getElementById('mobileThemeIcon');
    if (icon) icon.textContent = html.getAttribute('data-theme') === 'dark' ? '●' : '○';
  }
  updateThemeIcon();

  function toggleTheme() {
    const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    localStorage.setItem('autobahn-theme', next);
    updateThemeIcon();
  }

  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
  document.getElementById('mobileThemeToggle')?.addEventListener('click', toggleTheme);

  /* ──────────────────────────────────────────────────────────
     LANGUE
  ────────────────────────────────────────────────────────── */
  window.setLang = function (lang) {
    document.body.className = document.body.className
      .replace(/\blang-\w+\b/, '')
      .trim() + ' lang-' + lang;
    ['btnEN','btnFR','mBtnEN','mBtnFR'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.classList.toggle('active', btn.id.toLowerCase().includes(lang));
    });
    localStorage.setItem('autobahn-lang', lang);
  };

  const savedLang = localStorage.getItem('autobahn-lang') || 'fr';
  setLang(savedLang);

})();
