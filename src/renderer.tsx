import React, { useEffect, useRef, useState } from './React'
import { mount, Mounted } from 'pele'

export interface PeleRendererProps {
  content: string
}

export default function PeleRenderer(props: PeleRendererProps) {
  const { content } = props
  const containerRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef<Mounted | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const settings = (typeof logseq !== 'undefined' && logseq.settings) || {}
  const enableZoom = settings.enableZoom !== false
  const fontSize = Number(settings.fontSize) || 14
  const responsive = settings.responsive !== false

  useEffect(() => {
    if (!containerRef.current) return
    const trimmed = content?.trim()
    if (!trimmed) {
      containerRef.current.innerHTML = ''
      setErrorMsg(null)
      return
    }

    try {
      if (mountedRef.current) {
        mountedRef.current.update(trimmed, {
          zoom: enableZoom,
          fontSize,
          responsive,
          onError: (err: unknown) => {
            setErrorMsg(err instanceof Error ? err.message : String(err))
          }
        })
      } else {
        containerRef.current.innerHTML = ''
        mountedRef.current = mount(containerRef.current, trimmed, {
          zoom: enableZoom,
          fontSize,
          responsive,
          onError: (err: unknown) => {
            setErrorMsg(err instanceof Error ? err.message : String(err))
          }
        })
      }
      setErrorMsg(null)
    } catch (err: any) {
      setErrorMsg(err?.message || String(err))
    }
  }, [content, enableZoom, fontSize, responsive])

  useEffect(() => {
    return () => {
      if (mountedRef.current) {
        try {
          mountedRef.current.destroy()
        } catch (e) {
          // ignore cleanup errors
        }
        mountedRef.current = null
      }
    }
  }, [])

  return (
    <div className="logseq-pele-wrapper">
      <div className="logseq-pele-actions">
        <span className="logseq-pele-badge" title="Powered by Pele (Fast Mermaid)">
          Pele
        </span>
      </div>
      {errorMsg ? (
        <div className="logseq-pele-error">
          <div className="logseq-pele-error-title">⚠️ Mermaid 语法解析错误</div>
          <div>{errorMsg}</div>
        </div>
      ) : (
        <div
          ref={containerRef}
          className={`logseq-pele-container ${enableZoom ? 'is-zoomable' : ''}`}
        />
      )}
    </div>
  )
}
