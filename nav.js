/* ============================================================
   AUTOBAHN — nav.js
   Navigation partagée, injectée automatiquement sur toutes les pages.

   POUR CHANGER LE LOGO :
     → Texte seul  : modifiez LOGO_TEXT ci-dessous
     → Image SVG   : passez LOGO_USE_IMAGE à true et renseignez LOGO_IMAGE_SRC
   ============================================================ */

(function () {

  /* ── CONFIGURATION LOGO ──────────────────────────────────── */
  const LOGO_TEXT       = 'Autobahn —';
  const LOGO_USE_IMAGE  = true;
  const LOGO_IMAGE_SRC  = './assets/Asset8.png';
  const LOGO_IMAGE_ALT  = 'Autobahn';
  const LOGO_IMAGE_H    = 10;

  /* ── PAGES & LIENS ───────────────────────────────────────── */
  const LINKS = [
    { href: 'creators.html', en: 'Creators', fr: 'Créateurs' },
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

  const logoHTML = LOGO_USE_IMAGE
    ? `<img src="${LOGO_IMAGE_SRC}" alt="${LOGO_IMAGE_ALT}" height="${LOGO_IMAGE_H}" style="display:block">`
    : LOGO_TEXT;

  const linksHTML = LINKS.map(l => {
    const active = page === l.href ? 'class="active"' : '';
    return `<a href="${l.href}" ${active}>
      <span class="en">${l.en}</span>
      <span class="fr">${l.fr}</span>
    </a>`;
  }).join('');

  const themeToggleHTML = NO_THEME_TOGGLE.includes(page)
    ? ''
    : `<button class="theme-toggle" id="themeToggle" aria-label="Toggle dark mode"></button>`;

  const navEl = document.querySelector('nav');
  if (!navEl) return;

  navEl.innerHTML = `
  <div class="nav-links">${linksHTML}</div>
  <div class="nav-controls">
    <div class="lang-switch">
      <button class="lang-btn" id="btnEN" onclick="setLang('en')">EN</button>
      <button class="lang-btn" id="btnFR" onclick="setLang('fr')">FR</button>
    </div>
    ${themeToggleHTML}
  </div>`;

  /* Logo injecté hors de la nav pour que mix-blend-mode:difference
     se blende contre le fond de page et non contre le flou de la nav */
  const logoEl = document.createElement('a');
  logoEl.href = 'index.html';
  logoEl.className = 'nav-logo';
  logoEl.innerHTML = logoHTML;
  document.body.prepend(logoEl);

  /* ──────────────────────────────────────────────────────────
     DARK MODE
  ────────────────────────────────────────────────────────── */
  const html   = document.documentElement;
  const stored = localStorage.getItem('autobahn-theme') || 'light';
  html.setAttribute('data-theme', stored);

  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      html.setAttribute('data-theme', next);
      localStorage.setItem('autobahn-theme', next);
    });
  }

  /* ──────────────────────────────────────────────────────────
     LANGUE
  ────────────────────────────────────────────────────────── */
  window.setLang = function (lang) {
    document.body.className = document.body.className
      .replace(/\blang-\w+\b/, '')
      .trim() + ' lang-' + lang;
    document.getElementById('btnEN')?.classList.toggle('active', lang === 'en');
    document.getElementById('btnFR')?.classList.toggle('active', lang === 'fr');
    localStorage.setItem('autobahn-lang', lang);
  };

  const savedLang = localStorage.getItem('autobahn-lang') || 'fr';
  setLang(savedLang);

})();
