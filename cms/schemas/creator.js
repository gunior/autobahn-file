export default {
  name: 'creator',
  title: 'Créateur',
  type: 'document',

  fields: [
    {
      name: 'order',
      title: "Ordre d'affichage",
      description: "Position dans la liste (1 = premier)",
      type: 'number',
    },
    {
      name: 'name',
      title: 'Nom complet',
      description: 'Ex : ESTRADE Guillaume',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'role',
      title: 'Rôle',
      description: 'Ex : Motion Designer & Director',
      type: 'string',
    },
    {
      name: 'bio',
      title: 'Bio (EN)',
      description: 'Short description of your practice in English (2-3 sentences)',
      type: 'text',
      rows: 4,
    },
    {
      name: 'bioFr',
      title: 'Bio (FR)',
      description: 'Version française de ta bio (2-3 phrases). Si vide, la version anglaise sera utilisée.',
      type: 'text',
      rows: 4,
    },

    // ── MÉDIAS ──────────────────────────────────────────────────────
    {
      name: 'photo',
      title: 'Photo de profil',
      description: 'Portrait carré ou format libre — apparaît dans la liste des créateurs',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'heroPhoto',
      title: 'Photo bannière',
      description: 'Image grand format affichée en haut de la page profil (format paysage recommandé)',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'showreel',
      title: 'Showreel (vidéo brute)',
      description: 'Upload sans te soucier du poids — la version finale est compressée automatiquement (1080p WebM + MP4). Idéalement < 30s.',
      type: 'file',
      options: { accept: 'video/*' },
    },

    // ── AUTO — rempli par le pipeline GitHub Actions, masqué tant que vide ──
    {
      name: 'showreelOptimizedWebm',
      title: 'Showreel optimisé · WebM (auto)',
      description: 'Généré automatiquement par le pipeline de compression. Ne pas modifier à la main.',
      type: 'file',
      options: { accept: 'video/webm' },
      readOnly: true,
      hidden: ({ document }) => !document?.showreelOptimizedWebm,
    },
    {
      name: 'showreelOptimizedMp4',
      title: 'Showreel optimisé · MP4 (auto)',
      description: 'Fallback Safari/anciens navigateurs. Généré automatiquement.',
      type: 'file',
      options: { accept: 'video/mp4' },
      readOnly: true,
      hidden: ({ document }) => !document?.showreelOptimizedMp4,
    },
    {
      name: 'compressedFromRef',
      title: 'Source de compression (interne)',
      description: 'Référence de la vidéo brute déjà compressée — sert à éviter de recompresser à chaque édition.',
      type: 'string',
      readOnly: true,
      hidden: true,
    },

    // ── COMPÉTENCES ─────────────────────────────────────────────────
    {
      name: 'disciplines',
      title: 'Disciplines',
      description: 'Ex : motion, 3D, vfx...',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    },
    {
      name: 'skills',
      title: 'Compétences détaillées',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    },
    {
      name: 'tools',
      title: 'Outils & logiciels',
      description: 'Ex : After Effects, Cinema 4D...',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    },

    // ── LIENS ───────────────────────────────────────────────────────
    {
      name: 'links',
      title: 'Liens sociaux / portfolio',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'link',
          fields: [
            {
              name: 'label',
              title: 'Label',
              description: 'Ex : Instagram, Vimeo, Behance...',
              type: 'string',
            },
            {
              name: 'url',
              title: 'URL',
              type: 'url',
            },
          ],
          preview: {
            select: { title: 'label', subtitle: 'url' },
          },
        },
      ],
    },

    // ── PROJETS ─────────────────────────────────────────────────────
    {
      name: 'projects',
      title: 'Projets sélectionnés',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'project',
          fields: [
            {
              name: 'name',
              title: 'Titre du projet',
              type: 'string',
            },
            {
              name: 'type',
              title: 'Type',
              description: 'Ex : Motion / Brand, VFX / Compositing...',
              type: 'string',
            },
            {
              name: 'url',
              title: 'Lien (optionnel)',
              type: 'url',
            },
            {
              name: 'thumb',
              title: 'Miniature',
              type: 'image',
              options: { hotspot: true },
            },
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'type',
              media: 'thumb',
            },
          },
        },
      ],
    },
  ],

  preview: {
    select: {
      title: 'name',
      subtitle: 'role',
      media: 'photo',
    },
  },
}
