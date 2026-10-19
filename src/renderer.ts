import '@logseq/libs'
import { render as peleRender, enableZoom } from 'pele'

export interface PeleRendererProps {
  content: string
}

let cachedReact: any = null

function getHostReact() {
  if (cachedReact) return cachedReact

  // 1. 如果在宿主环境中运行，window.React 即宿主 React
  if (typeof window !== 'undefined' && (window as any).React) {
    cachedReact = (window as any).React
    return cachedReact
  }

  // 2. 尝试从 top 窗口获取
  try {
    if (typeof top !== 'undefined' && (top as any).React) {
      cachedReact = (top as any).React
      return cachedReact
    }
  } catch (e) {
    // ignore cross-origin error if any
  }

  // 3. 尝试从 logseq.Experiments.React 获取 (仅在插件 iframe 环境下有效)
  try {
    if (typeof logseq !== 'undefined' && (logseq.Experiments as any)?.React) {
      cachedReact = (logseq.Experiments as any).React
      return cachedReact
    }
  } catch (e) {
    // ignore Can not access host scope error
  }

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
  const zoomInstanceRef = useRef<any>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const trimmed = (content || '').trim()
    if (!trimmed) {
      el.innerHTML = ''
      return
    }

    console.log('[logseq-pele] Rendering diagram with Pele, length:', trimmed.length)

    try {
      // 销毁旧的 zoom 实例
      if (zoomInstanceRef.current) {
        try {
          zoomInstanceRef.current.destroy()
        } catch {
          // ignore
        }
        zoomInstanceRef.current = null
      }

      const settings = (typeof logseq !== 'undefined' && logseq.settings) || {}
      const fontSize = Number(settings.fontSize) || 14
      const responsive = settings.responsive !== false
      const enableZoomOption = settings.enableZoom !== false

      // 使用 Pele 核心生成 SVG
      const result = peleRender(trimmed, {
        fontSize,
        responsive
      })

      el.innerHTML = result.svg

      // 绑定平移缩放
      if (enableZoomOption) {
        try {
          zoomInstanceRef.current = enableZoom(el)
        } catch (zErr) {
          console.warn('[logseq-pele] enableZoom warning:', zErr)
        }
      }
    } catch (err: any) {
      console.error('[logseq-pele] Pele render error:', err)
      const message = err?.message || String(err)
      el.innerHTML = `
        <div class="logseq-pele-error">
          <div class="logseq-pele-error-title">⚠️ Mermaid 语法解析错误</div>
          <div>${message}</div>
        </div>
      `
    }
  }, [content])

  useEffect(() => {
    return () => {
      if (zoomInstanceRef.current) {
        try {
          zoomInstanceRef.current.destroy()
        } catch {
          // ignore
        }
        zoomInstanceRef.current = null
      }
    }
  }, [])

  const settings = (typeof logseq !== 'undefined' && logseq.settings) || {}
  const isZoomable = settings.enableZoom !== false

  return React.createElement(
    'div',
    { className: 'logseq-pele-wrapper' },
    React.createElement(
      'div',
      { className: 'logseq-pele-actions' },
      React.createElement(
        'span',
        { className: 'logseq-pele-badge', title: 'Powered by Pele (Fast Mermaid)' },
        'Pele'
      )
    ),
    React.createElement('div', {
      ref: containerRef,
      className: `logseq-pele-container ${isZoomable ? 'is-zoomable' : ''}`
    })
  )
}
