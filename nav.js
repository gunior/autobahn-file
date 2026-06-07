/* ============================================================
   AUTOBAHN — nav.js
   Navigation partagée, injectée automatiquement sur toutes les pages.
   ============================================================ */

(function () {

  /* ── CONFIGURATION LOGO ──────────────────────────────────── */
  const LOGO_IMAGE_SRC          = './assets/Asset8.png'; // desktop (mix-blend)
  const LOGO_IMAGE_MOBILE_LIGHT = './assets/a-b.png';    // mobile, light mode
  const LOGO_IMAGE_MOBILE_DARK  = './assets/a-w.png';    // mobile, dark mode
  const LOGO_IMAGE_ALT          = 'Autobahn';

  /* ── PAGES & LIENS ───────────────────────────────────────── */
  /* URLs propres : Vercel cleanUrls sert /creators → creators.html, etc. */
  const LINKS = [
    { href: '/creators', en: 'Team',    fr: 'Tchim'   },
    { href: '/lab',      en: 'Lab',     fr: 'Lab',    logoLight: './assets/Lab-b.png', logoDark: './assets/Lab-w.png' },
    { href: '/studio',   en: 'Studio',  fr: 'Studio'  },
    { href: '/contact',  en: 'Contact', fr: 'Contact' },
  ];

  /* ── PRÉCHARGEMENT — logos hover + overlay transition ───────────── */
  LINKS.forEach(l => {
    if (l.logoLight) { new Image().src = l.logoLight; }
    if (l.logoDark)  { new Image().src = l.logoDark;  }
  });
  new Image().src = './assets/Asset8.png'; // logo de l'overlay de transition

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

  /* Nav reste vide et transparente.
     Le hamburger est un enfant DIRECT de body → son z-index: 520 est dans
     le contexte racine du document, pas dans celui de <nav> (position:fixed
     crée toujours son propre stacking context, peu importe son z-index).
     Ça garantit qu'il est au-dessus du menu overlay (z-index: 500). */
  navEl.innerHTML = '';

  const hamburgerEl = document.createElement('button');
  hamburgerEl.className = 'nav-hamburger';
  hamburgerEl.id = 'navHamburger';
  hamburgerEl.setAttribute('aria-label', 'Menu');
  hamburgerEl.innerHTML = '<span></span><span></span>';
  document.body.appendChild(hamburgerEl);

  /* Nav toujours transparente — le burger et le logo sont fixed indépendants */
  navEl.style.setProperty('background',              'transparent', 'important');
  navEl.style.setProperty('backdrop-filter',         'none',        'important');
  navEl.style.setProperty('-webkit-backdrop-filter', 'none',        'important');
  navEl.style.setProperty('border-bottom',           'none',        'important');

  const isMobile = window.innerWidth <= 768;
  // Sur mobile, le logo dépend du thème : a-b en light, a-w en dark.
  // Sur desktop on garde l'asset unique + mix-blend-mode défini en CSS.
  const initialTheme = localStorage.getItem('autobahn-theme') || 'dark';
  const mobileLogoFor = (theme) => theme === 'light' ? LOGO_IMAGE_MOBILE_LIGHT : LOGO_IMAGE_MOBILE_DARK;
  const logoSrc    = isMobile ? mobileLogoFor(initialTheme) : LOGO_IMAGE_SRC;
  const logoHeight = isMobile ? 14 : 10;
  const logoEl = document.createElement('a');
  logoEl.href = 'index.html';
  logoEl.className = 'nav-logo';
  logoEl.innerHTML = `<img src="${logoSrc}" alt="${LOGO_IMAGE_ALT}" height="${logoHeight}" style="display:block">`;
  document.body.prepend(logoEl);

  /* ── Menu overlay ── */
  const mobileMenuLinks = LINKS.map(l => {
    const active = page === l.href ? 'mobile-active' : '';
    /* Logo hover pour les items qui en ont un (Lab) */
    const labLogoSrc = l.logoLight
      ? (initialTheme === 'light' ? l.logoLight : l.logoDark)
      : '';
    const hoverLogo = l.logoLight
      ? `<img class="link-hover-logo" src="${labLogoSrc}" alt="${l.en}">`
      : '';
    return `<a href="${l.href}" class="${active}">
      <span class="link-text">
        <span class="en">${l.en}</span>
        <span class="fr">${l.fr}</span>
      </span>
      ${hoverLogo}
    </a>`;
  }).join('');

  /* Toggle toujours présent dans l'overlay, quelle que soit la page */
  const mobileThemeRow = `<button class="mobile-theme-btn" id="mobileThemeToggle" aria-label="Toggle theme"><div class="gooey-thumb"></div></button>`;

  const menuLogoSrc = initialTheme === 'light' ? LOGO_IMAGE_MOBILE_LIGHT : LOGO_IMAGE_MOBILE_DARK;

  const mobileMenuEl = document.createElement('div');
  mobileMenuEl.id = 'mobileMenu';
  mobileMenuEl.innerHTML = `
    <div class="menu-logo-top">
      <a href="/">
        <img id="menuLogoImg" src="${menuLogoSrc}" alt="Autobahn" height="26" style="display:block">
      </a>
    </div>
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

  /* ── Overlay de transition de page ──────────────────────────────────
     Volet noir (light mode) ou blanc (dark mode) qui glisse du bas vers
     le haut au clic sur un lien du menu, puis se retire vers le haut
     sur la nouvelle page. Logo Asset8.png centré pendant l'animation.
  ──────────────────────────────────────────────────────────────────── */
  const transitionEl = document.createElement('div');
  transitionEl.id = 'pageTransition';
  transitionEl.innerHTML = '<img class="pt-logo" src="./assets/Asset8.png" alt="Autobahn">';

  /* Si on arrive ici depuis une transition (flag sessionStorage) :
     on positionne l'overlay couvrant l'écran SANS animation, puis on
     le fait glisser vers le haut pour révéler la page. */
  const transIncoming = sessionStorage.getItem('page-transition-theme');
  if (transIncoming) {
    transitionEl.setAttribute('data-overlay-theme', transIncoming);
    /* Positionne immédiatement à translateY(0) sans transition */
    transitionEl.style.transition = 'none';
    transitionEl.style.transform  = 'translateY(0)';
    transitionEl.style.pointerEvents = 'none';
    sessionStorage.removeItem('page-transition-theme');
  }
  document.body.appendChild(transitionEl);

  if (transIncoming) {
    /* Force un reflow pour que les styles inline soient peints avant
       de retirer la transition=none et lancer l'animation de sortie */
    void transitionEl.offsetWidth;
    transitionEl.style.removeProperty('transition');
    transitionEl.style.removeProperty('transform');
    transitionEl.style.removeProperty('pointer-events');
    transitionEl.classList.add('pt-exit');
    /* On ne retire PAS pt-exit : l'overlay reste garé au-dessus du viewport
       (translateY(-100%), invisible). Le retirer déclencherait un retour
       animé vers translateY(100%) visible à l'écran — c'est le bug. */
  }

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

  /* Gestion des clics sur les liens du menu :
     - Même page → ferme simplement le menu
     - Page différente → lance l'animation de transition puis navigue */
  mobileMenuEl.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href) { closeMenu(); return; }

      /* Normalise l'href pour comparaison (retire .html, trailing slash) */
      const target = href.replace(/\.html$/, '').replace(/\/$/, '') || '/';
      if (target === page) { closeMenu(); return; }

      e.preventDefault();
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      transitionEl.setAttribute('data-overlay-theme', currentTheme);

      /* Si pt-exit est encore là (usage précédent), on le retire SANS animation
         pour repositionner l'overlay sous le viewport avant de relancer l'entrée.
         Sans ce reset, pt-exit écrase pt-enter (ordre CSS) et le volet reste
         coincé à translateY(-100%) — seule la fin de l'anim est visible. */
      if (transitionEl.classList.contains('pt-exit')) {
        transitionEl.style.transition = 'none';
        transitionEl.classList.remove('pt-exit');
        void transitionEl.offsetWidth; /* force reflow → overlay snappe à translateY(100%) */
        transitionEl.style.removeProperty('transition');
      }

      transitionEl.classList.add('pt-enter');
      /* Le flag transmet la couleur d'overlay à la page suivante */
      sessionStorage.setItem('page-transition-theme', currentTheme);
      setTimeout(() => { window.location.href = href; }, 580);
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });

  /* ── Lab : swap logo au hover (image suit le fond inversé) ── */
  const labLink = mobileMenuEl.querySelector('a[href="/lab"]');
  if (labLink) {
    const labLogo = labLink.querySelector('.link-hover-logo');
    if (labLogo) {
      labLink.addEventListener('mouseenter', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        /* Sur hover le fond devient c-ink : clair en dark, sombre en light → logo opposé */
        labLogo.src = isDark ? './assets/Lab-b.png' : './assets/Lab-w.png';
      });
      labLink.addEventListener('mouseleave', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        labLogo.src = isDark ? './assets/Lab-w.png' : './assets/Lab-b.png';
      });
    }
  }

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
    if (isMobile) {
      const img = logoEl.querySelector('img');
      if (img) img.src = mobileLogoFor(next);
    }
    const menuLogoImg = document.getElementById('menuLogoImg');
    if (menuLogoImg) menuLogoImg.src = next === 'light' ? LOGO_IMAGE_MOBILE_LIGHT : LOGO_IMAGE_MOBILE_DARK;
    /* Squish directionnel : keyframe différent selon le sens */
    const thumb = document.querySelector('.gooey-thumb');
    if (thumb) {
      const cls = next === 'dark' ? 'to-right' : 'to-left';
      thumb.classList.remove('to-right', 'to-left');
      void thumb.offsetWidth; /* force reflow pour re-déclencher si clic rapide */
      thumb.classList.add(cls);
      setTimeout(() => thumb.classList.remove('to-right', 'to-left'), 460);
    }
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
