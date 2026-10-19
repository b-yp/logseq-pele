import '@logseq/libs'
import { render as peleRender, detectType as peleDetectType } from 'pele'

export interface PeleRendererProps {
  content: string
}

let cachedReact: any = null

function getHostReact() {
  if (cachedReact) return cachedReact

  if (typeof window !== 'undefined' && (window as any).React) {
    cachedReact = (window as any).React
    return cachedReact
  }

  try {
    if (typeof top !== 'undefined' && (top as any).React) {
      cachedReact = (top as any).React
      return cachedReact
    }
  } catch (e) {}

  try {
    if (typeof logseq !== 'undefined' && (logseq.Experiments as any)?.React) {
      cachedReact = (logseq.Experiments as any).React
      return cachedReact
    }
  } catch (e) {}

  return null
}

export default function PeleRenderer(props: PeleRendererProps) {
  const React = getHostReact()
  if (!React) {
    console.error('[logseq-pele] Failed to resolve React from Logseq host')
    return null
  }

  const { useEffect, useRef } = React
  const { content } = props

  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const trimmed = (content || '').trim()
    if (!trimmed) {
      el.innerHTML = ''
      return
    }

    try {
      const settings = (typeof logseq !== 'undefined' && logseq.settings) || {}
      const fontSize = Number(settings.fontSize) || 14
      const responsive = settings.responsive !== false

      const result = peleRender(trimmed, {
        fontSize,
        responsive
      })

      el.innerHTML = result.svg
    } catch (err: any) {
      const message = err?.message || String(err)
      el.innerHTML = `
        <div class="logseq-pele-error">
          <div class="logseq-pele-error-title">⚠️ Mermaid Syntax Error</div>
          <div>${message}</div>
        </div>
      `
    }
  }, [content])

  const detectedType = peleDetectType(content || '')
  const badgeLabel = detectedType
    ? `Pele · ${detectedType.charAt(0).toUpperCase() + detectedType.slice(1)}`
    : 'Pele'

  return React.createElement(
    'div',
    { className: 'logseq-pele-wrapper' },
    React.createElement(
      'div',
      { className: 'logseq-pele-actions' },
      React.createElement(
        'span',
        { className: 'logseq-pele-badge', title: 'Powered by Pele (Fast Mermaid)' },
        badgeLabel
      )
    ),
    React.createElement('div', {
      ref: containerRef,
      className: 'logseq-pele-container'
    })
  )
}
