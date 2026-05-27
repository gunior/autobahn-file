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
  /* URLs propres : Vercel cleanUrls sert /creators → creators.html, etc. */
  const LINKS = [
    { href: '/creators', en: 'Team',    fr: 'Tchim'   },
    { href: '/lab',      en: 'Lab',     fr: 'Lab'     },
    { href: '/studio',   en: 'Studio',  fr: 'Studio'  },
    { href: '/contact',  en: 'Contact', fr: 'Contact' },
  ];

  /* ── PAGES SANS DARK TOGGLE (fond fixe) ─────────────────── */
  const NO_THEME_TOGGLE = ['/studio', '/', '/creators'];

  /* ──────────────────────────────────────────────────────────
     Construction du HTML de navigation
  ────────────────────────────────────────────────────────── */
  /* On normalise : pathname sans extension .html ni trailing slash */
  let page = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
  if (page === '') page = '/';

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
    <div class="mobile-nav-links">${mobileMenuLinks}</div>
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
  const stored = localStorage.getItem('autobahn-theme') || 'dark';
  html.setAttribute('data-theme', stored);

  function updateThemeIcon() {
    const icon = document.getElementById('mobileThemeIcon');
    if (icon) icon.textContent = html.getAttribute('data-theme') === 'dark' ? '●' : '○';
  }
  updateThemeIcon();

  // Favicon suit le toggle avec un léger crossfade (rendu via canvas).
  document.querySelectorAll('link[rel="icon"][media]').forEach(l => l.remove());
  let favicon = document.querySelector('link[rel="icon"]');
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/png';
    document.head.appendChild(favicon);
  }
  const faviconImgs = { dark: new Image(), light: new Image() };
  faviconImgs.dark.src  = 'assets/a-w.png';
  faviconImgs.light.src = 'assets/a-b.png';
  const faviconCanvas = document.createElement('canvas');
  faviconCanvas.width = faviconCanvas.height = 64;
  const fctx = faviconCanvas.getContext('2d');
  let faviconAnimId = 0;
  function drawFaviconFrame(fromImg, toImg, t) {
    fctx.clearRect(0, 0, 64, 64);
    if (fromImg.complete && fromImg.naturalWidth) {
      fctx.globalAlpha = 1 - t;
      fctx.drawImage(fromImg, 0, 0, 64, 64);
    }
    if (toImg.complete && toImg.naturalWidth) {
      fctx.globalAlpha = t;
      fctx.drawImage(toImg, 0, 0, 64, 64);
    }
    fctx.globalAlpha = 1;
    favicon.href = faviconCanvas.toDataURL('image/png');
  }
  function setFavicon(theme, animate) {
    const toImg   = theme === 'dark' ? faviconImgs.dark : faviconImgs.light;
    const fromImg = theme === 'dark' ? faviconImgs.light : faviconImgs.dark;
    cancelAnimationFrame(faviconAnimId);
    if (!animate) { drawFaviconFrame(fromImg, toImg, 1); return; }
    const start = performance.now();
    const dur = 260;
    (function step(now) {
      const t = Math.min(1, (now - start) / dur);
      drawFaviconFrame(fromImg, toImg, t);
      if (t < 1) faviconAnimId = requestAnimationFrame(step);
    })(start);
  }
  let faviconReady = 0;
  function onFaviconImgLoad() {
    faviconReady++;
    if (faviconReady === 2) setFavicon(html.getAttribute('data-theme'), false);
  }
  faviconImgs.dark.onload  = onFaviconImgLoad;
  faviconImgs.light.onload = onFaviconImgLoad;

  function toggleTheme() {
    const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    localStorage.setItem('autobahn-theme', next);
    updateThemeIcon();
    setFavicon(next, true);
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

  const savedLang = localStorage.getItem('autobahn-lang') || 'en';
  setLang(savedLang);

  /* ──────────────────────────────────────────────────────────
     MINI FOOTER GLOBAL — bandeau noir, slide-in au scroll down.
     Injecté sur les pages qui n'ont pas leur propre <footer>.
     Lab et Contact gèrent le lien dans leur footer en flux.
  ────────────────────────────────────────────────────────── */
  if (!document.querySelector('footer')) {
    const isLegalPage = /mentions-legales/.test(window.location.pathname);

    const miniFooter = document.createElement('footer');
    miniFooter.className = 'mini-footer';
    miniFooter.innerHTML = `
      <span class="mini-footer-copy">© 2026 Autobahn</span>
      ${isLegalPage ? '<span></span>' : `<a class="mini-footer-link" href="/mentions-legales">
        <span class="en">Legal notices</span>
        <span class="fr">Mentions légales</span>
      </a>`}`;
    document.body.appendChild(miniFooter);

    // Détection : la page est-elle scrollable ?
    // - Oui → bandeau caché par défaut, slide-in au scroll vers le bas,
    //   slide-out au scroll vers le haut ou retour au top.
    // - Non (index/creators/studio en overflow:hidden) sur DESKTOP →
    //   bandeau visible en permanence.
    // - Non sur MOBILE → on écoute les touchmove pour détecter la direction
    //   du swipe et révéler/cacher le bandeau (même si la page ne scroll pas).
    function setupScrollBehavior() {
      const isScrollable = document.documentElement.scrollHeight > window.innerHeight + 8;
      const isMobile = window.matchMedia('(max-width: 768px)').matches;

      // Cas 1 — page scrollable : on suit le scrollY
      if (isScrollable) {
        let lastY = window.scrollY;
        let ticking = false;
        function update() {
          const y = window.scrollY;
          const goingDown = y > lastY + 2;
          const goingUp   = y < lastY - 2;
          if (y < 60)            miniFooter.classList.remove('visible');
          else if (goingDown)    miniFooter.classList.add('visible');
          else if (goingUp)      miniFooter.classList.remove('visible');
          lastY = y;
          ticking = false;
        }
        window.addEventListener('scroll', () => {
          if (!ticking) { requestAnimationFrame(update); ticking = true; }
        }, { passive: true });
        update();
        return;
      }

      // Cas 2 — page non-scrollable + DESKTOP : bandeau permanent
      if (!isMobile) {
        miniFooter.classList.add('visible');
        return;
      }

      // Cas 3 — page non-scrollable + MOBILE : touch-aware
      // Le doigt monte (dy négatif) = direction "scroll vers le bas" = on montre
      // Le doigt descend (dy positif) = direction "scroll vers le haut" = on cache
      let lastTouchY = null;
      document.addEventListener('touchstart', (e) => {
        lastTouchY = e.touches[0].clientY;
      }, { passive: true });
      document.addEventListener('touchmove', (e) => {
        if (lastTouchY === null) return;
        const y = e.touches[0].clientY;
        const dy = y - lastTouchY;
        if (dy < -8)       miniFooter.classList.add('visible');
        else if (dy > 8)   miniFooter.classList.remove('visible');
        lastTouchY = y;
      }, { passive: true });
      document.addEventListener('touchend', () => { lastTouchY = null; }, { passive: true });
    }

    // Le DOM peut encore changer (images qui se chargent, lazy content) →
    // re-évalue après load + sur resize.
    setupScrollBehavior();
    window.addEventListener('load', setupScrollBehavior);
    window.addEventListener('resize', () => {
      // Sur resize, si la page bascule scrollable/non-scrollable, on rebascule.
      const wasVisible = miniFooter.classList.contains('visible');
      setupScrollBehavior();
      // setupScrollBehavior remettra à 0 — pas de souci
    });
  }

})();
