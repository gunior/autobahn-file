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
  /* Asset8.png est maintenant inliné en base64 dans buildPTOverlay — plus de prefetch nécessaire. */

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
     le haut au clic sur un lien / logo, puis se retire vers le haut sur
     la nouvelle page. Logo Asset8.png centré.

     Principe fondamental : on crée un NOUVEL élément DOM à chaque
     déclenchement. Un élément neuf n'a aucun historique GPU — aucun
     état en cache, aucun compositor stale, aucun glitch possible peu
     importe le nombre d'utilisations consécutives.
  ──────────────────────────────────────────────────────────────────── */

  /* ── Overlay de transition de page ──────────────────────────────────
     Deux éléments permanents (un par thème), toujours dans le DOM.
     Animés via CSS @keyframes avec from/to absolus — pas de WAAPI seek,
     pas de CSS transition, pas d'état calculé depuis le courant.
     Le from: d'un @keyframes est une valeur absolue définie en CSS :
     aucune ambiguïté possible quel que soit l'état GPU précédent.
  ──────────────────────────────────────────────────────────────────── */
  function buildPTOverlay(themeAttr) {
    const el = document.createElement('div');
    el.className = 'pt-overlay';
    el.setAttribute('data-overlay-theme', themeAttr);
    /* src inline base64 → données disponibles instantanément (zéro réseau).
       img.decode() démarre le décodage PNG en arrière-plan dès la création ;
       par construction l'overlay n'est jamais affiché avant que ce décodage
       soit terminé (humain réaction ~200 ms > décodage <5 ms pour 4 KB).    */
    const PT_B64 = 'data:image/png;base64,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';
    const logoImg = document.createElement('img');
    logoImg.className  = 'pt-logo';
    logoImg.src        = PT_B64;
    logoImg.alt        = 'Autobahn';
    logoImg.decode().catch(function() {}); // pré-décode le PNG maintenant
    el.appendChild(logoImg);
    document.body.appendChild(el);
    return el;
  }

  const ptLight = buildPTOverlay('light');
  const ptDark  = buildPTOverlay('dark');

  /* Sortie : hard-reset de toute animation en cours, puis pt-entering */
  function triggerPageTransition(href) {
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    document.body.style.overflow = '';
    const el = theme === 'dark' ? ptDark : ptLight;

    /* Stoppe toute animation CSS en cours (y compris fill: forwards),
       force un reflow → élément revient au CSS par défaut translateY(100%),
       puis relance depuis le from keyframe absolu — même comportement
       à la 1ère comme à la 10ème utilisation                            */
    el.style.animation = 'none';
    el.classList.remove('pt-entering', 'pt-exiting');
    void el.offsetWidth;
    el.style.removeProperty('animation');
    el.classList.add('pt-entering');

    sessionStorage.setItem('page-transition-theme', theme);
    setTimeout(() => { window.location.href = href; }, 560);
  }

  /* Entrée (nouvelle page) : le ::before CSS (posé par le micro-script head)
     couvre déjà l'écran. On démarre pt-exiting (from:translateY(0) absolu),
     puis on retire data-pt — les deux couvrent le même pixel au même moment,
     aucun flash visible. */
  const transIncoming = sessionStorage.getItem('page-transition-theme');
  if (transIncoming) {
    sessionStorage.removeItem('page-transition-theme');
    const el = transIncoming === 'dark' ? ptDark : ptLight;
    el.classList.add('pt-exiting');                        /* overlay en place  */
    document.documentElement.removeAttribute('data-pt');   /* retire ::before   */
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
      const target = href.replace(/\.html$/, '').replace(/\/$/, '') || '/';
      if (target === page) { closeMenu(); return; }
      e.preventDefault();
      triggerPageTransition(href);
    });
  });

  /* Logo nav (haut gauche) → transition vers l'accueil */
  logoEl.addEventListener('click', function (e) {
    if (page === '/') return; /* déjà sur l'accueil, comportement normal */
    e.preventDefault();
    triggerPageTransition('/');
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
