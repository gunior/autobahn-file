import React, { useEffect, useRef } from 'react'
import { useFormValue } from 'sanity'

export function Photo169Input(props) {
  const name      = useFormValue(['name']) || ''
  const role      = useFormValue(['role']) || ''
  const firstName = name.split(' ').pop()
  const obsRef    = useRef(null)

  useEffect(() => {
    const inject = () => {
      obsRef.current?.disconnect()

      document.querySelectorAll('[data-ui="Dialog"], [role="dialog"]').forEach(dialog => {
        // Trouve le h4 "16:9" → navigue jusqu'au RatioBox/container de la miniature
        const h4 = Array.from(dialog.querySelectorAll('h4'))
          .find(el => el.textContent.trim() === '16:9')
        if (!h4) return

        // Monte dans le DOM pour trouver le conteneur qui englobe h4 + thumbnail
        // Structure : Box > [h4, Box > RatioBox > Card]
        const parentBox = h4.parentElement
        if (!parentBox) return

        // Cherche le premier conteneur avec une hauteur définie (le RatioBox)
        const ratioBox = parentBox.querySelector('[style*="padding"]')
          || parentBox.querySelector('div > div > div')

        // Cible : le dernier div imbriqué dans le parentBox après le h4
        // On prend simplement le deuxième enfant du parentBox (celui qui contient la miniature)
        const thumbWrapper = Array.from(parentBox.children).find(c => c !== h4)
        if (!thumbWrapper) return

        // Évite les doublons
        if (thumbWrapper.querySelector('.ab-overlay')) {
          const n = thumbWrapper.querySelector('.ab-name')
          const r = thumbWrapper.querySelector('.ab-role')
          if (n) n.textContent = firstName
          if (r) r.textContent = role
          obsRef.current?.observe(document.body, { childList: true, subtree: true })
          return
        }

        // Rend le wrapper relative pour positionner l'overlay
        thumbWrapper.style.position = 'relative'

        const overlay = document.createElement('div')
        overlay.className = 'ab-overlay'
        overlay.style.cssText = [
          'position:absolute', 'inset:0', 'z-index:999',
          'pointer-events:none',
          'background:linear-gradient(to top,rgba(0,0,0,.88) 0%,rgba(0,0,0,.3) 45%,transparent 75%)',
        ].join(';')

        const text = document.createElement('div')
        text.style.cssText = 'position:absolute;bottom:0;left:0;right:0;padding:5px 8px 7px'

        const nameEl = document.createElement('div')
        nameEl.className = 'ab-name'
        nameEl.style.cssText = 'font-weight:600;font-size:10px;letter-spacing:-.01em;color:rgba(255,255,255,.95);font-family:Inter,sans-serif;line-height:1.1'
        nameEl.textContent = firstName

        const roleEl = document.createElement('div')
        roleEl.className = 'ab-role'
        roleEl.style.cssText = 'font-weight:300;font-size:7px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.5);margin-top:2px;font-family:Inter,sans-serif'
        roleEl.textContent = role

        text.appendChild(nameEl)
        text.appendChild(roleEl)
        overlay.appendChild(text)
        thumbWrapper.appendChild(overlay)
      })

      obsRef.current?.observe(document.body, { childList: true, subtree: true })
    }

    const observer = new MutationObserver(inject)
    obsRef.current = observer
    observer.observe(document.body, { childList: true, subtree: true })
    inject()

    return () => { observer.disconnect(); obsRef.current = null }
  }, [firstName, role])

  return props.renderDefault(props)
}
