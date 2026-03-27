const fs   = require('fs');
const path = require('path');

const labDir  = path.join(__dirname, 'lab');
const outFile = path.join(labDir, 'manifest.json');

const exts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];

const files = fs.readdirSync(labDir)
  .filter(f => exts.includes(path.extname(f).toLowerCase()))
  .map(f => ({ file: f }));

fs.writeFileSync(outFile, JSON.stringify(files, null, 2));
console.log(`Manifest generated — ${files.length} images`);
