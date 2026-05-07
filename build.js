/**
 * AUTOBAHN — Script de build Vercel
 * ─────────────────────────────────
 * 1. Récupère les créateurs depuis Sanity et génère creators.json
 * 2. Génère le manifest du Lab (images + vidéos)
 * 3. Génère le manifest du Studio (photos carousel)
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PROJECT_ID = process.env.SANITY_PROJECT_ID;
const DATASET    = process.env.SANITY_DATASET || 'production';

/* ══════════════════════════════════════════════════════
   1. SANITY — Fetch creators
══════════════════════════════════════════════════════ */

/* Sanity sert ses images via cdn.sanity.io et accepte des paramètres de
 * transformation à la volée (auto=format → WebP/AVIF si supporté, fit=max
 * préserve le ratio, q= la qualité, w= la largeur max). Cache CDN ensuite,
 * donc le coût n'est payé qu'à la 1ʳᵉ requête. */
const IMG_PHOTO     = '?auto=format&fit=max&q=85&w=400';   // mini-cartes carousel + roue mobile
const IMG_HERO      = '?auto=format&fit=max&q=85&w=1920';  // bannière profil + poster vidéo + fallback co lente
const IMG_PROJECT   = '?auto=format&fit=max&q=85&w=1200';  // thumbnails portfolio (grille 2 col desktop)

const GROQ = `*[_type == "creator"] | order(order asc) {
  name, email, role, bio, bioFr,
  "photo":                  photo.asset->url + "${IMG_PHOTO}",
  "heroPhoto":              heroPhoto.asset->url + "${IMG_HERO}",
  "showreel":               showreel.asset->url,
  "showreelOptimizedWebm":  showreelOptimizedWebm.asset->url,
  "showreelOptimizedMp4":   showreelOptimizedMp4.asset->url,
  tools, disciplines, skills, links,
  projects[] {
    name, type, url,
    "thumb": thumb.asset->url + "${IMG_PROJECT}"
  }
}`;

function fetchCreators() {
  return new Promise((resolve, reject) => {
    if (!PROJECT_ID) {
      console.warn('⚠  SANITY_PROJECT_ID manquant — creators.json non généré');
      resolve(null);
      return;
    }

    const url = `https://${PROJECT_ID}.apicdn.sanity.io/v2024-01-01/data/query/${DATASET}?query=${encodeURIComponent(GROQ)}`;

    https.get(url, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(raw);
          if (data.error) { reject(new Error(data.error.description)); return; }
          resolve(data.result || []);
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

/* ══════════════════════════════════════════════════════
   2. LAB — Récupère les médias depuis Sanity
      (fallback sur les fichiers locaux si Sanity indispo)
══════════════════════════════════════════════════════ */

/* Lab : images potentiellement plein écran, on autorise jusqu'à 2400px (DPR 2 sur 1920) */
const IMG_LAB = '?auto=format&fit=max&q=85&w=2400';

const GROQ_LAB = `*[_type == "lab"][0] {
  items[] {
    mediaType,
    "imageUrl":  image.asset->url + "${IMG_LAB}",
    "imageDate": image.asset->_createdAt,
    "videoUrl":  video.asset->url,
    "videoDate": video.asset->_createdAt
  }
}`;

function fetchLabItems() {
  return new Promise((resolve, reject) => {
    if (!PROJECT_ID) { resolve(null); return; }

    const url = `https://${PROJECT_ID}.apicdn.sanity.io/v2024-01-01/data/query/${DATASET}?query=${encodeURIComponent(GROQ_LAB)}`;

    https.get(url, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(raw);
          if (data.error) { reject(new Error(data.error.description)); return; }
          resolve(data.result || null);
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function generateLabManifest() {
  const labDir  = path.join(__dirname, 'lab');
  const outFile = path.join(labDir, 'manifest.json');

  if (!fs.existsSync(labDir)) fs.mkdirSync(labDir, { recursive: true });

  /* ── Essaie d'abord Sanity ── */
  let sanityDoc = null;
  try { sanityDoc = await fetchLabItems(); } catch (e) { /* fallback local */ }

  if (sanityDoc && Array.isArray(sanityDoc.items) && sanityDoc.items.length > 0) {
    const items = sanityDoc.items
      .filter(i => (i.mediaType === 'image' && i.imageUrl) || (i.mediaType === 'video' && i.videoUrl))
      .map(i => ({
        url:  i.mediaType === 'image' ? i.imageUrl  : i.videoUrl,
        type: i.mediaType,
        date: i.mediaType === 'image' ? i.imageDate : i.videoDate, // ISO _createdAt de l'asset
      }))
      .reverse(); // plus récent en premier (items ajoutés à la fin dans Sanity)

    fs.writeFileSync(outFile, JSON.stringify(items, null, 2));
    const imgs = items.filter(i => i.type === 'image').length;
    const vids = items.filter(i => i.type === 'video').length;
    console.log(`✓  Lab manifest (Sanity) — ${items.length} items (${imgs} images, ${vids} vidéos)`);
    return;
  }

  /* ── Fallback : fichiers locaux dans lab/, triés par date de modification décroissante ── */
  const imageExts = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']);
  const videoExts = new Set(['.mp4', '.webm']);

  fs.readdirSync(labDir).forEach(f => {
    const lower = f.toLowerCase();
    if (f !== lower) fs.renameSync(path.join(labDir, f), path.join(labDir, lower));
  });

  const files = fs.readdirSync(labDir)
    .filter(f => {
      const ext = path.extname(f).toLowerCase();
      return imageExts.has(ext) || videoExts.has(ext);
    })
    .map(f => ({
      file: f,
      type: videoExts.has(path.extname(f).toLowerCase()) ? 'video' : 'image',
      mtime: fs.statSync(path.join(labDir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime) // plus récent en premier
    .map(({ file, type, mtime }) => ({
      file,
      type,
      date: new Date(mtime).toISOString(), // pour les marqueurs de mois côté front
    }));

  fs.writeFileSync(outFile, JSON.stringify(files, null, 2));
  const imgs = files.filter(f => f.type === 'image').length;
  const vids = files.filter(f => f.type === 'video').length;
  console.log(`✓  Lab manifest (local) — ${files.length} items (${imgs} images, ${vids} vidéos)`);
}

/* ══════════════════════════════════════════════════════
   3. STUDIO — Manifest photos carousel
══════════════════════════════════════════════════════ */

function generateStudioManifest() {
  const studioDir = path.join(__dirname, 'photos-studio');
  const outFile   = path.join(studioDir, 'manifest.json');

  if (!fs.existsSync(studioDir)) {
    console.log('ℹ  Dossier photos-studio/ absent — manifest ignoré');
    return;
  }

  const imageExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

  // On ne garde QUE les versions optimisées (-opt). Les originaux lourds restent
  // dans le dossier (sources de retraitement éventuel) mais ne sont jamais servis.
  const allOpts = fs.readdirSync(studioDir)
    .filter(f => imageExts.has(path.extname(f).toLowerCase()))
    .filter(f => /-opt\.[a-z]+$/i.test(f))
    .sort();

  // Sépare verticales (xxx_vert-opt.ext) et horizontales (xxx-opt.ext)
  // Convention : si une image a la même racine + suffixe `_vert`, on l'utilise
  // comme version mobile (portrait). Le default sert sur desktop/tablette.
  const verts = new Map(); // baseName → fichier vertical
  const horizontals = []; // [{ base, file }]

  allOpts.forEach(f => {
    const vertMatch = f.match(/^(.+)_vert-opt\.[a-z]+$/i);
    if (vertMatch) {
      verts.set(vertMatch[1], f);
      return;
    }
    const baseMatch = f.match(/^(.+)-opt\.[a-z]+$/i);
    if (baseMatch) horizontals.push({ base: baseMatch[1], file: f });
  });

  // Pour chaque horizontale, on attache la version verticale si elle existe
  const slides = horizontals.map(({ base, file }) => {
    const vert = verts.get(base);
    return vert ? { default: file, vert } : { default: file };
  });

  // Verticales orphelines (pas de pendant horizontal) — affichées partout
  const usedVerts = new Set(slides.map(s => s.vert).filter(Boolean));
  for (const [, file] of verts) {
    if (!usedVerts.has(file)) slides.push({ default: file });
  }

  fs.writeFileSync(outFile, JSON.stringify({ slides }, null, 2));
  const withVert = slides.filter(s => s.vert).length;
  console.log(`✓  Studio manifest — ${slides.length} slides (${withVert} avec version mobile)`);
}

/* ══════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════ */

async function build() {
  console.log('── Build Autobahn ──────────────────────────');

  // Lab manifest
  generateLabManifest();

  // Studio manifest
  generateStudioManifest();

  // Creators depuis Sanity
  const creators = await fetchCreators();
  if (creators !== null) {
    fs.writeFileSync('creators.json', JSON.stringify(creators, null, 2));
    console.log(`✓  Creators — ${creators.length} profils récupérés depuis Sanity`);
  }

  console.log('── Build terminé ───────────────────────────');
}

build().catch(err => {
  console.error('✗  Build error:', err.message);
  process.exit(1);
});
