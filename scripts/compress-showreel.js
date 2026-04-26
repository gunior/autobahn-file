/**
 * AUTOBAHN — Compression automatique des showreels
 * ──────────────────────────────────────────────────
 * Lancé par GitHub Actions quand un créateur publie sa fiche dans Sanity.
 *
 *  1. Récupère le doc créateur depuis Sanity
 *  2. Vérifie si la version optimisée actuelle correspond bien à la vidéo brute
 *     courante (champ compressedFromRef). Si oui → skip.
 *  3. Télécharge la brute, encode en WebM VP9 1080p + MP4 H.264 1080p
 *  4. Upload les deux assets dans Sanity
 *  5. PATCH le doc créateur : showreelOptimizedWebm + showreelOptimizedMp4
 *     + compressedFromRef = ref de la brute
 *
 * Variables d'environnement attendues :
 *   SANITY_PROJECT_ID  — id du projet Sanity
 *   SANITY_DATASET     — production / staging
 *   SANITY_TOKEN       — token avec droit écriture
 *   CREATOR_ID         — _id du créateur à traiter (optionnel : si vide,
 *                        on traite tous les créateurs avec un showreel
 *                        non encore compressé pour leur source courante)
 */

const https        = require('https');
const fs           = require('fs');
const os           = require('os');
const path         = require('path');
const { execSync } = require('child_process');

const PROJECT_ID     = process.env.SANITY_PROJECT_ID;
const DATASET        = process.env.SANITY_DATASET || 'production';
const TOKEN          = process.env.SANITY_TOKEN;
const TARGET_CREATOR = (process.env.CREATOR_ID || '').trim();

if (!PROJECT_ID || !TOKEN) {
  console.error('✗ SANITY_PROJECT_ID ou SANITY_TOKEN manquant');
  process.exit(1);
}

const API_HOST = `${PROJECT_ID}.api.sanity.io`;
const API_VER  = '/v2024-01-01';

/* ══════════════════════════════════════════════════════
   HELPERS HTTP
══════════════════════════════════════════════════════ */

function request({ method, path: p, headers = {}, body }) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: API_HOST,
      method,
      path: p,
      headers: { 'Authorization': `Bearer ${TOKEN}`, ...headers },
    };
    const req = https.request(opts, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        let parsed;
        try { parsed = JSON.parse(buf.toString()); }
        catch { parsed = buf.toString(); }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function downloadFile(url, dest, redirects = 5) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (redirects <= 0) return reject(new Error('Trop de redirections'));
        return downloadFile(res.headers.location, dest, redirects - 1).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} sur ${url}`));
      }
      const f = fs.createWriteStream(dest);
      res.pipe(f);
      f.on('finish', () => f.close(() => resolve()));
      f.on('error', reject);
    }).on('error', reject);
  });
}

/* ══════════════════════════════════════════════════════
   SANITY API
══════════════════════════════════════════════════════ */

async function fetchCreators() {
  const filter = TARGET_CREATOR
    ? `*[_type == "creator" && _id == "${TARGET_CREATOR}"]`
    : `*[_type == "creator" && defined(showreel)]`;

  const projection = `{
    _id,
    "showreelRef":  showreel.asset._ref,
    "showreelUrl":  showreel.asset->url,
    compressedFromRef,
    "hasOptimizedWebm": defined(showreelOptimizedWebm),
    "hasOptimizedMp4":  defined(showreelOptimizedMp4)
  }`;

  const query = `${filter} ${projection}`;
  const r = await request({
    method: 'GET',
    path: `${API_VER}/data/query/${DATASET}?query=${encodeURIComponent(query)}`,
  });
  if (r.status !== 200) {
    throw new Error(`Query Sanity HS : ${r.status} ${JSON.stringify(r.body)}`);
  }
  const result = r.body.result;
  if (Array.isArray(result)) return result;
  return result ? [result] : [];
}

async function uploadFile(filePath, mimeType) {
  const data = fs.readFileSync(filePath);
  const r = await request({
    method: 'POST',
    path: `${API_VER}/assets/files/${DATASET}?filename=${encodeURIComponent(path.basename(filePath))}`,
    headers: {
      'Content-Type': mimeType,
      'Content-Length': data.length,
    },
    body: data,
  });
  if (r.status >= 300) {
    throw new Error(`Upload HS : ${r.status} ${JSON.stringify(r.body)}`);
  }
  return r.body.document._id;
}

async function patchCreator(creatorId, set) {
  const body = JSON.stringify({
    mutations: [{ patch: { id: creatorId, set } }],
  });
  const r = await request({
    method: 'POST',
    path: `${API_VER}/data/mutate/${DATASET}`,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
    body,
  });
  if (r.status >= 300) {
    throw new Error(`Patch HS : ${r.status} ${JSON.stringify(r.body)}`);
  }
  return r.body;
}

/* ══════════════════════════════════════════════════════
   FFMPEG
══════════════════════════════════════════════════════ */

function ffmpeg(args) {
  const cmdArgs = args.map(a => /[\s'"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a).join(' ');
  console.log(`  ffmpeg ${cmdArgs}`);
  execSync(`ffmpeg -y -hide_banner -loglevel warning ${cmdArgs}`, { stdio: 'inherit' });
}

function encodeWebm(srcPath, outPath) {
  // VP9 1080p, qualité haute, audio Opus 128k
  // -row-mt et -cpu-used 4 = bon compromis vitesse/qualité sur GH runners
  ffmpeg([
    '-i', srcPath,
    '-vf', "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2",
    '-c:v', 'libvpx-vp9',
    '-crf', '32',
    '-b:v', '4M',
    '-row-mt', '1',
    '-deadline', 'good',
    '-cpu-used', '4',
    '-g', '30',
    '-keyint_min', '30',
    '-c:a', 'libopus',
    '-b:a', '128k',
    outPath,
  ]);
}

function encodeMp4(srcPath, outPath) {
  // H.264 1080p, qualité haute, audio AAC 128k, faststart pour streaming
  ffmpeg([
    '-i', srcPath,
    '-vf', "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2",
    '-c:v', 'libx264',
    '-crf', '23',
    '-preset', 'medium',
    '-pix_fmt', 'yuv420p',
    '-g', '30',
    '-keyint_min', '30',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    outPath,
  ]);
}

/* ══════════════════════════════════════════════════════
   PROCESSING
══════════════════════════════════════════════════════ */

function fmtSize(bytes) {
  if (bytes > 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(1) + ' KB';
}

async function processCreator(creator) {
  const { _id, showreelRef, showreelUrl, compressedFromRef, hasOptimizedWebm, hasOptimizedMp4 } = creator;

  if (!showreelUrl || !showreelRef) {
    console.log(`→ ${_id} : pas de showreel, skip`);
    return;
  }

  const alreadyDone = compressedFromRef === showreelRef && hasOptimizedWebm && hasOptimizedMp4;
  if (alreadyDone) {
    console.log(`→ ${_id} : déjà compressé pour cette source, skip`);
    return;
  }

  console.log(`\n━━━ ${_id} ━━━`);
  console.log(`  source : ${showreelUrl}`);

  const tmpDir   = fs.mkdtempSync(path.join(os.tmpdir(), 'showreel-'));
  const srcPath  = path.join(tmpDir, 'source.bin');
  const webmPath = path.join(tmpDir, 'showreel.webm');
  const mp4Path  = path.join(tmpDir, 'showreel.mp4');

  try {
    console.log('  ↓ téléchargement source…');
    await downloadFile(showreelUrl, srcPath);
    console.log(`    ${fmtSize(fs.statSync(srcPath).size)}`);

    console.log('  ⚙ encodage WebM VP9…');
    encodeWebm(srcPath, webmPath);
    console.log(`    → ${fmtSize(fs.statSync(webmPath).size)}`);

    console.log('  ⚙ encodage MP4 H.264…');
    encodeMp4(srcPath, mp4Path);
    console.log(`    → ${fmtSize(fs.statSync(mp4Path).size)}`);

    console.log('  ↑ upload WebM dans Sanity…');
    const webmAssetId = await uploadFile(webmPath, 'video/webm');
    console.log(`    ${webmAssetId}`);

    console.log('  ↑ upload MP4 dans Sanity…');
    const mp4AssetId = await uploadFile(mp4Path, 'video/mp4');
    console.log(`    ${mp4AssetId}`);

    console.log('  ✎ patch document créateur…');
    await patchCreator(_id, {
      showreelOptimizedWebm: { _type: 'file', asset: { _type: 'reference', _ref: webmAssetId } },
      showreelOptimizedMp4:  { _type: 'file', asset: { _type: 'reference', _ref: mp4AssetId  } },
      compressedFromRef:     showreelRef,
    });

    console.log(`  ✓ ${_id} terminé`);
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

/* ══════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════ */

async function main() {
  console.log('── compress-showreel ──');
  console.log(`  projet  : ${PROJECT_ID}`);
  console.log(`  dataset : ${DATASET}`);
  console.log(`  cible   : ${TARGET_CREATOR || '(tous les créateurs avec showreel)'}`);
  console.log('───────────────────────');

  const creators = await fetchCreators();
  if (creators.length === 0) {
    console.log('Aucun créateur correspondant.');
    return;
  }
  console.log(`${creators.length} créateur(s) à examiner.`);

  let ok = 0, fail = 0, skip = 0;
  for (const c of creators) {
    try {
      const before = JSON.stringify(c);
      await processCreator(c);
      // On ne sait pas distinguer skip vs ok facilement ici, donc on log les deux
      ok++;
    } catch (err) {
      fail++;
      console.error(`✗ ${c._id} : ${err.message}`);
      console.error(err.stack);
    }
  }

  console.log(`\n── bilan : ${ok} traité(s), ${fail} échec(s) ──`);
  if (fail > 0) process.exit(1);
}

main().catch(err => {
  console.error('✗ fatal :', err);
  process.exit(1);
});
