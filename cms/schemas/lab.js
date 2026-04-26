/* ============================================================
   AUTOBAHN — Schema Lab
   Un seul document "Lab" qui contient la liste ordonnée
   des médias à afficher sur la page Lab.
   Les créateurs drag & drop leurs images/vidéos ici
   et peuvent les réordonner par glisser-déposer.
   ============================================================ */

export default {
  name: 'lab',
  title: 'Lab',
  type: 'document',

  fields: [
    {
      name: 'items',
      title: 'Médias',
      type: 'array',
      description: 'Drag & drop pour réordonner. Cliquez sur + pour ajouter une image ou une vidéo.',
      of: [
        {
          type: 'object',
          name: 'labMedia',
          title: 'Média',
          fields: [
            {
              name: 'mediaType',
              title: 'Type de média',
              type: 'string',
              options: {
                list: [
                  { title: '🖼  Image', value: 'image' },
                  { title: '🎬  Vidéo', value: 'video' },
                ],
                layout: 'radio',
              },
              initialValue: 'image',
              validation: Rule => Rule.required(),
            },
            {
              name: 'image',
              title: 'Image',
              type: 'image',
              description: '📐 Format : JPG ou WebP recommandé — pas de PNG sauf transparence nécessaire. 📏 Résolution max : 2560px sur le côté le plus long. ⚖️ Poids cible : < 500 Ko. Utilisez squoosh.app ou tinypng.com pour compresser avant d\'importer.',
              options: { hotspot: true },
              hidden: ({ parent }) => parent?.mediaType !== 'image',
            },
            {
              name: 'video',
              title: 'Vidéo',
              type: 'file',
              description: '📐 Format : MP4 (H.264) ou WebM (VP9). 📏 Résolution max : 1920×1080 (1080p). ⚖️ Poids cible : < 20 Mo — compressez avec HandBrake (CRF 28, preset Fast) ou Clideo.com. Évitez les fichiers ProRes ou RAW directement exportés depuis votre logiciel de montage.',
              options: { accept: 'video/mp4,video/webm' },
              hidden: ({ parent }) => parent?.mediaType !== 'video',
            },
          ],
          preview: {
            select: {
              mediaType: 'mediaType',
              image:     'image',
            },
            prepare({ mediaType, image }) {
              return {
                title:  mediaType === 'video' ? '🎬 Vidéo' : '🖼 Image',
                media:  image,
              }
            },
          },
        },
      ],
    },
  ],

  preview: {
    prepare() {
      return { title: 'Lab — Médias' }
    },
  },
}
