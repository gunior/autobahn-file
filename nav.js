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
  /* Logos inline base64 — données disponibles instantanément (zéro réseau).
     Asset8-b.png = logo blanc  → fond noir  (overlay mode light)
     Asset8-w.png = logo sombre → fond blanc (overlay mode dark)              */
  var PT_LOGO_LIGHT = 'data:image/png;base64,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';
  var PT_LOGO_DARK  = 'data:image/png;base64,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';

  function buildPTOverlay(themeAttr, logoSrc) {
    var el = document.createElement('div');
    el.className = 'pt-overlay';
    el.setAttribute('data-overlay-theme', themeAttr);
    /* img.decode() démarre le décodage PNG dès la création de l'élément   */
    var logoImg = document.createElement('img');
    logoImg.className = 'pt-logo';
    logoImg.src       = logoSrc;
    logoImg.alt       = 'Autobahn';
    logoImg.decode().catch(function() {});
    el.appendChild(logoImg);
    document.body.appendChild(el);
    return el;
  }

  var ptLight = buildPTOverlay('light', PT_LOGO_DARK);   /* Asset8-w.png : logo blanc sur fond noir  */
  var ptDark  = buildPTOverlay('dark',  PT_LOGO_LIGHT);  /* Asset8-b.png : logo sombre sur fond blanc */

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
