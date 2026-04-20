const fs   = require('fs');
const path = require('path');

const labDir  = path.join(__dirname, 'lab');
const outFile = path.join(labDir, 'manifest.json');

const imageExts = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']);
const videoExts = new Set(['.mp4', '.webm']);

// Renomme les fichiers en minuscules sur le serveur Netlify
fs.readdirSync(labDir).forEach(f => {
  const lower = f.toLowerCase();
  if (f !== lower) {
    fs.renameSync(path.join(labDir, f), path.join(labDir, lower));
  }
});

const files = fs.readdirSync(labDir)
  .filter(f => {
    const ext = path.extname(f).toLowerCase();
    return imageExts.has(ext) || videoExts.has(ext);
  })
  .map(f => {
    const ext = path.extname(f).toLowerCase();
    return { file: f, type: videoExts.has(ext) ? 'video' : 'image' };
  });

fs.writeFileSync(outFile, JSON.stringify(files, null, 2));

const imgCount = files.filter(f => f.type === 'image').length;
const vidCount = files.filter(f => f.type === 'video').length;
console.log(`Manifest generated — ${files.length} items (${imgCount} images, ${vidCount} videos)`);
