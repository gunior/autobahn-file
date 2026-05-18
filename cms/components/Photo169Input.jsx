import React from 'react'
import { Stack, Card, Flex, Text, Box } from '@sanity/ui'

/**
 * Custom input pour le champ photo de profil.
 * Affiche un guide visuel 16:9 pour que chaque créateur
 * recadre sa photo exactement au format des cartes sur le site.
 */
export function Photo169Input(props) {
  return (
    <Stack space={3}>
      {/* Guide visuel */}
      <Card padding={3} radius={2} tone="primary" border>
        <Stack space={2}>
          <Text size={1} weight="semibold">
            📐 Format 16:9 — recadre dans ce format
          </Text>
          <Text size={1} muted>
            La zone ci-dessous représente exactement comment ta photo apparaîtra
            dans la roue des créateurs. Quand tu cliques sur l'image pour recadrer,
            vise ce même format paysage.
          </Text>

          {/* Aperçu 16:9 */}
          <Box
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              border: '1.5px dashed #4f60ff',
              borderRadius: 3,
              background: 'rgba(79,96,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 4,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Lignes des tiers */}
            {[33.3, 66.6].map(pct => (
              <React.Fragment key={pct}>
                <div style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: `${pct}%`, width: 1,
                  background: 'rgba(79,96,255,0.2)',
                }} />
                <div style={{
                  position: 'absolute', left: 0, right: 0,
                  top: `${pct}%`, height: 1,
                  background: 'rgba(79,96,255,0.2)',
                }} />
              </React.Fragment>
            ))}
            <Text size={0} style={{ color: 'rgba(79,96,255,0.5)', letterSpacing: '0.14em' }}>
              16 : 9
            </Text>
          </Box>
        </Stack>
      </Card>

      {/* Input Sanity standard (crop + hotspot) */}
      {props.renderDefault(props)}
    </Stack>
  )
}
