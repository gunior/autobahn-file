/**
 * migrate.js — Import all creators from hardcoded data into Sanity
 *
 * Usage (from the cms/ folder):
 *   SANITY_TOKEN=<your-token> node migrate.js
 *
 * Get a token at: https://www.sanity.io/manage/project/a6p7i4un/api
 *   → API → Tokens → Add API token → Role: Editor
 */

import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─── Sanity client ────────────────────────────────────────────────────────────
const token = process.env.SANITY_TOKEN
if (!token) {
  console.error('❌  Missing SANITY_TOKEN environment variable.')
  console.error('   Run: SANITY_TOKEN=<token> node migrate.js')
  process.exit(1)
}

const client = createClient({
  projectId: 'a6p7i4un',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Root of the site (one level up from cms/)
const SITE_ROOT = path.resolve(__dirname, '..')

/** Upload a local file to Sanity and return an asset reference object */
async function uploadLocalFile(relativePath, label) {
  if (!relativePath) return null
  const fullPath = path.join(SITE_ROOT, relativePath)
  if (!fs.existsSync(fullPath)) {
    console.log(`   ⚠️  File not found, skipping: ${relativePath}`)
    return null
  }
  const ext = path.extname(relativePath).toLowerCase().replace('.', '')
  const isVideo = ['mp4', 'webm', 'mov'].includes(ext)
  const stream = fs.createReadStream(fullPath)
  const filename = path.basename(fullPath)
  console.log(`   📤 Uploading ${label}: ${filename}`)
  try {
    if (isVideo) {
      const asset = await client.assets.upload('file', stream, { filename })
      return { _type: 'file', asset: { _type: 'reference', _ref: asset._id } }
    } else {
      const asset = await client.assets.upload('image', stream, { filename })
      return { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
    }
  } catch (err) {
    console.error(`   ❌ Upload failed for ${filename}:`, err.message)
    return null
  }
}

/** Convert a tags array (strings) to Sanity array of strings — direct pass-through */
function tags(arr) {
  return (arr || []).filter(Boolean)
}

// ─── Creator data (from creators.html _CREATORS_PLACEHOLDER) ─────────────────
const creators = [
  {
    order: 1,
    name: 'ESTRADE Guillaume',
    role: 'Motion Designer & Director',
    disciplines: ['motion', 'graphics', 'brand identity'],
    skills: ['motion design', '3D animation', 'kinetic type', 'brand animation', 'immersive direction'],
    bio: 'Guillaume works at the intersection of brand and motion, crafting visual narratives that move with intention. His work spans broadcast design, title sequences and digital campaigns for clients across the world.',
    tools: ['After Effects', 'Cinema 4D', 'Illustrator', 'TouchDesigner', 'Unreal Engine'],
    photo: './creators/guillaume/creator-pp-guillaume.jpg',
    heroPhoto: './creators/guillaume/creator-hero-guillaume.png',
    showreel: './creators/guillaume/creator-showreel-guillaume.mp4',
    hoverBg: null,
    links: [
      { label: 'Instagram', url: 'https://instagram.com/g_estrade' },
      { label: 'Behance', url: 'https://behance.net/estradeguillaume' },
    ],
    projects: [
      { name: 'ESPN - NBA Channel Rebrand',  type: 'Motion / Brand',           url: 'https://futuredeluxe.com/work/espn',                  thumb: './creators/guillaume/thumbs/ESPN_Brand-Film_9.jpg' },
      { name: 'BMW C3 - Partner convention', type: 'Motion / Event broadcast', url: 'https://blit.studio/work/bmw-c3-partner-convention/', thumb: './creators/guillaume/thumbs/BLIT_bmw.jpg' },
      { name: 'Santander Universia Summit',  type: 'Motion / Event broadcast', url: 'https://blit.studio/work/universia/',                 thumb: './creators/guillaume/thumbs/BLIT_universia.jpg' },
      { name: 'TIKTOK x Olympic Games',      type: 'Motion / VFX',             url: 'https://www.youtube.com/watch?v=T1uiOCHVd3w',        thumb: './creators/guillaume/thumbs/TIKTOKxJO.png' },
      { name: 'CashApp',                     type: 'Motion / VFX',             url: 'https://www.instagram.com/p/DR2uELXDOV7/?img_index=1', thumb: './creators/guillaume/thumbs/CASHAPP4.jpg' },
      { name: 'CashApp',                     type: 'Motion / VFX',             url: 'https://www.instagram.com/p/DRnU8rCEcaZ/?img_index=1', thumb: './creators/guillaume/thumbs/CASHAPP2.png' },
      { name: 'CashApp',                     type: 'Motion / VFX',             url: 'https://www.instagram.com/p/DRVs-CRkY_i/?img_index=1', thumb: './creators/guillaume/thumbs/CASHAPP3.png' },
    ],
  },
  {
    order: 2,
    name: 'REBIC Antonin',
    role: 'Creative Technologist – Motion & VFX',
    disciplines: ['Technical direction', 'Creative Direction', 'Visual Development', 'VFX & 3D', 'Motion Design', 'Editing'],
    skills: ['VFX', 'Compositing', '3D'],
    bio: 'Creative Technologist specializing in Motion Design and VFX, with a focus on visual development and workflow optimization.',
    tools: ['After Effects', 'Unreal Engine', 'Cinema 4D', 'Octane Render', 'DaVinci Resolve'],
    photo: './creators/antonin/creator-pp-antonin.jpg',
    heroPhoto: './creators/antonin/creator-pp-antonin.jpg',
    showreel: null, // mini-vid.mp4 not in repo
    hoverBg: null,
    links: [
      { label: 'Website',   url: 'https://antonin-motion.com/' },
      { label: 'Instagram', url: 'https://www.instagram.com/antoninmotion/' },
    ],
    projects: [
      { name: 'Renault — Product film', type: 'VFX / Compositing', url: 'https://vimeo.com/', thumb: null },
      { name: 'Dior — CGI campaign',    type: '3D / VFX',          url: null,                 thumb: null },
      { name: 'Fluid simulations',      type: 'R&D',               url: null,                 thumb: null },
      { name: 'Short film',             type: 'VFX',               url: null,                 thumb: null },
    ],
  },
  {
    order: 3,
    name: 'Marine',
    role: 'Creative Producer IA & 3D Motion Designer',
    disciplines: ['Creative production', 'Project management', 'AI-assisted creative production', '3D motion design', 'Digital art direction', 'Generative design'],
    skills: ['AI-driven visual', 'AI-driven animation', 'AI pipeline development', '3D modeling', '3D texturing', '3D lighting', '3D rendering', 'Creative production management', 'Team leadership', 'Cross-functional coordination', 'Project management', 'Visual storytelling & branding'],
    bio: 'Marine compose des identités sonores pour des marques et des projets d\'image en mouvement.',
    tools: ['Pro Tools', 'Ableton Live', 'Logic Pro', 'Max/MSP', 'Reaper'],
    photo: './creators/marine/creator-pp-marine.png',
    heroPhoto: './creators/marine/creator-hero-marine.png',
    showreel: null,
    hoverBg: './creators/marine/creator-hover-marine.jpg',
    links: [
      { label: 'SoundCloud', url: 'https://soundcloud.com/' },
      { label: 'Instagram',  url: 'https://instagram.com/' },
    ],
    projects: [
      { name: 'Jacquemus — Sound identity', type: 'SFX / Brand', url: null, thumb: null },
      { name: 'Short film — Score',         type: 'Music / SFX', url: null, thumb: null },
      { name: 'Installation — Spatial',     type: 'Immersive',   url: null, thumb: null },
      { name: 'Field recordings',           type: 'Personal',    url: null, thumb: null },
    ],
  },
  {
    order: 4,
    name: 'DURENDEAU Simon',
    role: '3D Artist',
    disciplines: ['3D', 'motion'],
    skills: ['3D', '3D modeling', 'Lighting', 'rendering', '3D animation'],
    bio: 'Simon leads visual concepts from brief to final render.',
    tools: ['Cinema 4D', 'Houdini', 'Photoshop', 'After Effects', 'FL Studio'],
    photo: './creators/simon/creator-pp-simon.png',
    heroPhoto: './creators/simon/creator-hero-simon.png',
    showreel: './creators/simon/creator-showreel-simon.mp4',
    hoverBg: null,
    links: [
      { label: 'Instagram', url: 'https://instagram.com/' },
      { label: 'Portfolio', url: 'https://example.com/' },
    ],
    projects: [
      { name: 'Chanel — Cosmetics CGI',    type: '3D / Brand', url: null, thumb: null },
      { name: 'Tech brand — Product vis.', type: '3D',         url: null, thumb: null },
      { name: 'Abstract sculptures',       type: 'Personal',   url: null, thumb: null },
      { name: 'Gallery — Digital install.',type: 'Art / 3D',  url: null, thumb: null },
    ],
  },
  {
    order: 5,
    name: 'LE GAD Clément',
    role: '3D Artist',
    disciplines: ['3D', 'motion'],
    skills: ['3D', '3D modeling', 'Lighting', 'rendering', '3D animation', 'motion design'],
    bio: 'Clément leads visual concepts from brief to final render.',
    tools: ['Cinema4D', 'Redshift', 'After Effects', 'Houdini', 'Davinci Resolve'],
    photo: './creators/clement/creator-pp-clement.png',
    heroPhoto: './creators/clement/creator-hero-clement.png',
    showreel: './creators/clement/creator-showreel-clement.mp4',
    hoverBg: null,
    links: [
      { label: 'Instagram', url: 'https://instagram.com/' },
      { label: 'Website',   url: 'https://legadclement.com/' },
    ],
    projects: [
      { name: 'Vinae',          type: 'Motion / 3D modeling / 3D animation', url: 'https://vimeo.com/1010494024',                       thumb: './creators/clement/thumbs/vinae_thumb.png' },
      { name: 'Gun Piou Piou',  type: 'Motion / 3D modeling / 3D animation', url: 'https://www.instagram.com/p/DNikgvYCgcZ/',           thumb: './creators/clement/thumbs/pioupiou_thumb.png' },
      { name: 'Nymbosys',       type: 'Motion / 3D modeling / 3D animation', url: 'https://vimeo.com/865895695?fl=pl&fe=sh',            thumb: './creators/clement/thumbs/nymbosys_thumb.png' },
      { name: 'Zine series',    type: 'Personal',                             url: null,                                                 thumb: null },
    ],
  },
  {
    order: 6,
    name: 'PETIT Johan',
    role: 'Motion Designer & Art Director',
    disciplines: ['motion', 'vfx'],
    skills: ['Direction', 'Motion', 'VFX', '3D', '2D', 'music composition'],
    bio: 'Johan directs and animates with a filmmaker\'s eye.',
    tools: ['After Effects', 'Premiere Pro', 'Cinema 4D', 'Notch', 'TouchDesigner'],
    photo: './creators/johan/creator-pp-johan.jpg',
    heroPhoto: './creators/johan/creator-hero-johan.jpg',
    showreel: './creators/johan/creator-showreel-johan.mp4',
    hoverBg: null,
    links: [
      { label: 'Vimeo',     url: 'https://vimeo.com/' },
      { label: 'Instagram', url: 'https://www.instagram.com/johanpetit_/' },
      { label: 'Spotify',   url: 'https://open.spotify.com/intl-fr/track/1T1fJazeRdDg9omvXLtfYm?si=W_Xmq1lYR4eiJnMVz2QUwQ' },
    ],
    projects: [
      { name: 'ANNIHILATION (feat Antonin Rebic)', type: 'Motion / Direction / Music production', url: 'https://vimeo.com/513458694?&login=true', thumb: './creators/johan/thumbs/annihilation_thumb.png' },
      { name: 'BURDEN (feat Oelhan)',              type: 'Motion / Direction / Music production', url: 'https://vimeo.com/952618012',              thumb: './creators/johan/thumbs/burden_thumb.png' },
      { name: 'The Hedrals - Atonement',           type: 'Motion / Direction / Music production', url: 'https://vimeo.com/368133951',              thumb: './creators/johan/thumbs/hedrals_thumbs.png' },
      { name: 'Generative loops',                  type: 'R&D',                                   url: null,                                       thumb: null },
    ],
  },
  {
    order: 7,
    name: 'PESSET Océane',
    role: 'Motion design & Illustration',
    disciplines: ['graphic design', 'illustration', 'motion design', 'editing'],
    skills: ['graphics', 'character design', 'character rigging & animation', 'mixed media', 'interface design & animation'],
    bio: 'Océane directs and animates with a filmmaker\'s eye.',
    tools: ['After Effects', 'Illustrator', 'Photoshop', 'Premiere Pro', 'Procreate'],
    photo: './creators/oceane/creator-pp-oceane.webp',
    heroPhoto: './creators/oceane/creator-hero-oceane.png',
    showreel: './creators/oceane/OCE_HIGHLIGHT_SHOTS_16x9.mp4',
    hoverBg: null,
    links: [
      { label: 'Behance',   url: 'https://www.behance.net/oceanepst' },
      { label: 'Instagram', url: 'https://www.instagram.com/oce.pst/' },
    ],
    projects: [
      { name: 'TedX Nantes - Jeanette', type: 'Art Direction',                    url: 'https://vimeo.com/963046311',                    thumb: './creators/oceane/thumbs/tedx1_thumb.png' },
      { name: 'Groupe Estille',         type: 'Art Direction / Rigging / Animation', url: 'https://www.youtube.com/watch?v=6vvmxU3fIoE', thumb: './creators/oceane/thumbs/estille2_thumb.png' },
      { name: 'Satisfying - Agio',      type: 'Art Direction',                    url: 'https://www.behance.net/gallery/210396405/Satisfying', thumb: './creators/oceane/thumbs/agio2_thumb.png' },
      { name: 'Generative loops',       type: 'R&D',                              url: null,                                              thumb: null },
    ],
  },
  {
    order: 8,
    name: 'BRIOIS Delphy',
    role: 'Motion & Graphic Design',
    disciplines: ['graphic design', 'illustration', 'motion design'],
    skills: ['graphics', 'chara design', 'interface design', '2D', '3D'],
    bio: 'Delphy directs and animates with a filmmaker\'s eye.',
    tools: ['Cinema 4D', 'Adobe Suite', 'Redshift', 'Octane Render', 'Figma', 'Canva'],
    photo: './creators/delphy/creator-pp-delphy.jpg',
    heroPhoto: './creators/delphy/creator-hero-delphy.jpg',
    showreel: './creators/delphy/creator-showreel-delphy.mp4',
    hoverBg: null,
    links: [
      { label: 'Behance',   url: 'https://www.behance.net/derufy' },
      { label: 'Instagram', url: 'https://www.instagram.com/derufyy/' },
    ],
    projects: [
      { name: 'Région Bretagne - CEP',            type: 'Animation / Art Direction',    url: 'https://www.behance.net/gallery/186307145/REGION-BRETAGNE-CEP', thumb: './creators/delphy/thumbs/region-bretagne-cep.png' },
      { name: 'Powens - Open Finance',            type: '3D Art Direction',             url: 'https://www.behance.net/gallery/190316969/Powens-Open-Finance',  thumb: './creators/delphy/thumbs/powens-open-finance.png' },
      { name: 'Studio de l\'Ouest - Inauguration',type: '3D Art Direction / Animation', url: null,                                                             thumb: null },
      { name: 'Generative loops',                 type: 'R&D',                          url: null,                                                             thumb: null },
    ],
  },
  {
    order: 9,
    name: 'MAÎTRE Victor',
    role: 'Music & Sound design',
    disciplines: ['music creation', 'sound design'],
    skills: ['musician', 'recording', 'sound crafting'],
    bio: 'Victor compose des musiques et identités sonores pour des marques et projets visuels.',
    tools: ['Ableton Live', 'Pro Tools', 'Logic Pro', 'Max/MSP', 'Reaktor'],
    photo: './creators/victor/creator-pp-victor.jpg',
    heroPhoto: './creators/victor/creator-hero-victor.webp',
    showreel: null,
    hoverBg: './creators/victor/creator-hero-victor.webp',
    links: [
      { label: 'Instagram', url: 'https://www.instagram.com/row_m1' },
      { label: 'Behance',   url: 'https://www.behance.net/Rowm1' },
      { label: 'Website',   url: 'https://rowm1.com/' },
    ],
    projects: [
      { name: 'KENZO x Levi\'s Campaign',             type: 'Music / Sound Design', url: 'https://www.youtube.com/watch?v=bOFqxrAYKN8', thumb: './creators/victor/thumbs/kenzo-levis.png' },
      { name: 'Prada SS23 Collection by David Sims', type: 'Music / Sound Design', url: 'https://www.youtube.com/watch?v=gqGZZoKGI1Q', thumb: './creators/victor/thumbs/prada-ss23.png' },
      { name: 'Acne Studio - Fluid Ensembles',       type: 'Music / Sound Design', url: 'https://www.youtube.com/watch?v=uJEm9CXOfOo', thumb: './creators/victor/thumbs/acne.png' },
      { name: 'YSL - Black Opium 2017',              type: 'Music / Sound Design', url: 'https://www.youtube.com/watch?v=xAGQd1miTwA', thumb: './creators/victor/thumbs/black-opium.png' },
      { name: 'Dampa - Le Tunnel',                   type: 'Music / Sound Design', url: 'https://www.youtube.com/watch?v=a8kQ6FCTCr4', thumb: './creators/victor/thumbs/tunnel.png' },
      { name: 'Jetzt Ôko',                           type: 'Music / Sound Design', url: 'https://www.youtube.com/watch?v=-bAEkyDu_8M', thumb: './creators/victor/thumbs/jetzt.png' },
    ],
  },
  {
    order: 10,
    name: 'DIJON Romain',
    role: 'VFX Artist',
    disciplines: ['vfx', '3d', 'editing'],
    skills: ['VFX', 'Compositing', '3D'],
    bio: 'With a background in film production, Romain specialises in visual effects and compositing.',
    tools: ['Nuke', 'Houdini', 'Maya', 'After Effects', 'DaVinci Resolve'],
    photo: './creators/antonin/creator-pp-antonin.jpg',
    heroPhoto: './creators/antonin/creator-pp-antonin.jpg',
    showreel: null,
    hoverBg: null,
    links: [
      { label: 'Website',   url: 'https://antonin-motion.com/' },
      { label: 'Instagram', url: 'https://www.instagram.com/antoninmotion/' },
    ],
    projects: [
      { name: 'Renault — Product film', type: 'VFX / Compositing', url: 'https://vimeo.com/', thumb: null },
      { name: 'Dior — CGI campaign',    type: '3D / VFX',          url: null,                 thumb: null },
      { name: 'Fluid simulations',      type: 'R&D',               url: null,                 thumb: null },
      { name: 'Short film',             type: 'VFX',               url: null,                 thumb: null },
    ],
  },
  {
    order: 11,
    name: 'PARAGEAUD Alexandre',
    role: 'Motion & Graphic Designer 3D',
    disciplines: ['vfx', '3d', 'editing'],
    skills: ['VFX', 'Compositing', '3D'],
    bio: 'With a background in film production, Alexandre specialises in visual effects and compositing.',
    tools: ['Nuke', 'Houdini', 'Maya', 'After Effects', 'DaVinci Resolve'],
    photo: './creators/antonin/creator-pp-antonin.jpg',
    heroPhoto: './creators/antonin/creator-pp-antonin.jpg',
    showreel: null,
    hoverBg: null,
    links: [
      { label: 'Instagram', url: 'https://www.instagram.com/apara_io' },
      { label: 'Behance',   url: 'https://www.behance.net/alexandreparageaud' },
    ],
    projects: [
      { name: 'Renault — Product film', type: 'VFX / Compositing', url: 'https://vimeo.com/', thumb: null },
      { name: 'Dior — CGI campaign',    type: '3D / VFX',          url: null,                 thumb: null },
      { name: 'Fluid simulations',      type: 'R&D',               url: null,                 thumb: null },
      { name: 'Short film',             type: 'VFX',               url: null,                 thumb: null },
    ],
  },
]

// ─── Main migration ───────────────────────────────────────────────────────────

async function migrateCreator(c) {
  console.log(`\n🎨 [${c.order}/11] ${c.name}`)

  // Upload main assets
  const photo     = await uploadLocalFile(c.photo,     'photo')
  const heroPhoto = await uploadLocalFile(c.heroPhoto, 'heroPhoto')
  const hoverBg   = await uploadLocalFile(c.hoverBg,   'hoverBg')

  // Showreel — skip huge files that aren't committed (they'll be uploaded manually)
  let showreel = null
  if (c.showreel && !c.showreel.includes('mini-vid') && !c.showreel.includes('OCE_HIGHLIGHT')) {
    showreel = await uploadLocalFile(c.showreel, 'showreel')
  } else if (c.showreel) {
    console.log(`   ⏭️  Skipping large/missing showreel: ${c.showreel}`)
  }

  // Upload project thumbnails
  const projects = []
  for (const p of c.projects) {
    const thumb = p.thumb ? await uploadLocalFile(p.thumb, `thumb "${p.name}"`) : null
    projects.push({
      _type: 'project',
      _key: p.name.replace(/\s+/g, '-').toLowerCase().slice(0, 40),
      name: p.name,
      type: p.type || '',
      url: p.url || '',
      ...(thumb ? { thumb } : {}),
    })
  }

  // Build Sanity document
  const doc = {
    _type: 'creator',
    order: c.order,
    name: c.name,
    role: c.role,
    bio: c.bio,
    disciplines: tags(c.disciplines),
    skills: tags(c.skills),
    tools: tags(c.tools),
    links: (c.links || []).map((l, i) => ({
      _type: 'link',
      _key: `link-${i}`,
      label: l.label,
      url: l.url,
    })),
    projects,
    ...(photo     ? { photo }     : {}),
    ...(heroPhoto ? { heroPhoto } : {}),
    ...(hoverBg   ? { hoverBg }   : {}),
    ...(showreel  ? { showreel }  : {}),
  }

  // Check if creator already exists (by order) to avoid duplicates
  const existing = await client.fetch(`*[_type == "creator" && order == $order][0]._id`, { order: c.order })
  if (existing) {
    console.log(`   ♻️  Updating existing document ${existing}`)
    await client.createOrReplace({ ...doc, _id: existing })
  } else {
    const result = await client.create(doc)
    console.log(`   ✅ Created ${result._id}`)
  }
}

async function main() {
  console.log('🚀 Starting migration — 11 creators')
  console.log(`   Project: a6p7i4un  Dataset: production\n`)

  let success = 0
  let errors = 0

  for (const creator of creators) {
    try {
      await migrateCreator(creator)
      success++
    } catch (err) {
      console.error(`   ❌ Failed for ${creator.name}:`, err.message)
      errors++
    }
  }

  console.log(`\n✨ Migration complete — ${success} ok, ${errors} errors`)
  if (errors === 0) {
    console.log('   → Trigger a Vercel redeploy (or push a commit) to see the changes live.')
  }
}

main()
