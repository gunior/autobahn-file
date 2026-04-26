import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'

export default defineConfig({
  name: 'autobahn',
  title: 'Autobahn Studio — Admin',

  projectId: 'a6p7i4un',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Contenu')
          .items([
            S.listItem()
              .title('Créateurs')
              .icon(() => '👤')
              .child(
                S.documentList()
                  .title('Créateurs')
                  .filter('_type == "creator"')
                  .defaultOrdering([{ field: 'order', direction: 'asc' }])
              ),
            S.listItem()
              .title('Lab')
              .icon(() => '🎬')
              .child(
                S.document()
                  .title('Lab — Médias')
                  .schemaType('lab')
                  .documentId('lab-singleton')
              ),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
