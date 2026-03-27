// ─────────────────────────────────────────────────────────────────
// generate-manifest.js
//
// Scanne le dossier ./lab/ et génère ./lab/manifest.json
// avec la liste de toutes les images trouvées.
//
// Usage local :
//   node generate-manifest.js
//
// Sur Netlify, ce script tourne automatiquement à chaque déploiement
// via le netlify.toml — tu n'as rien à faire manuellement.
// ─────────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');

const LAB_DIR = './lab';
const OUT     = './lab/manifest.json';
const EXTS    = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];

// Crée le dossier lab/ s'il n'existe pas encore
if (!fs.existsSync(LAB_DIR)) {
  fs.mkdirSync(LAB_DIR);
  console.log('📁 Dossier lab/ créé.');
}

const files = fs.readdirSync(LAB_DIR)
  .filter(f => {
    // Ignore manifest.json lui-même et les fichiers cachés
    if (f === 'manifest.json') return false;
    if (f.startsWith('.'))     return false;
    return EXTS.includes(path.extname(f).toLowerCase());
  })
  // Tri par date de modification — les plus récentes en premier
  .sort((a, b) => {
    const statA = fs.statSync(path.join(LAB_DIR, a)).mtimeMs;
    const statB = fs.statSync(path.join(LAB_DIR, b)).mtimeMs;
    return statB - statA;
  })
  .map(f => ({ file: f }));

fs.writeFileSync(OUT, JSON.stringify(files, null, 2));
console.log(`✓ manifest.json généré — ${files.length} image${files.length !== 1 ? 's' : ''}`);
