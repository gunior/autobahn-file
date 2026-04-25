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

const GROQ = `*[_type == "creator"] | order(order asc) {
  name, role, bio,
  "photo":     photo.asset->url,
  "heroPhoto": heroPhoto.asset->url,
  "showreel":  showreel.asset->url,
  "hoverBg":   hoverBg.asset->url,
  tools, disciplines, skills, links,
  projects[] {
    name, type, url,
    "thumb": thumb.asset->url
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

const GROQ_LAB = `*[_type == "lab"][0] {
  items[] {
    mediaType,
    "imageUrl": image.asset->url,
    "videoUrl": video.asset->url
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
        url:  i.mediaType === 'image' ? i.imageUrl : i.videoUrl,
        type: i.mediaType,
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
    .map(({ file, type }) => ({ file, type }));

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

  const images = fs.readdirSync(studioDir)
    .filter(f => imageExts.has(path.extname(f).toLowerCase()))
    .sort();

  fs.writeFileSync(outFile, JSON.stringify({ images }, null, 2));
  console.log(`✓  Studio manifest — ${images.length} photos`);
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
