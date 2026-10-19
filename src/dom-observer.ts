import { render as peleRender, supports as peleSupports, enableZoom } from 'pele'
import themeStyles from './pele-theme.css?inline'

const CODE_ATTR = 'data-pele-code'
const PREVIEW_CLASS = 'logseq-pele-preview'

function getTopContext(): { doc: Document; win: Window } {
  try {
    if (typeof window !== 'undefined' && window.top && window.top.document) {
      return { doc: window.top.document, win: window.top }
    }
  } catch (e) {
    //
  }
  return { doc: document, win: window }
}

function extractCode(cmEl: HTMLElement): string {
  try {
    if ((cmEl as any).CodeMirror?.getValue) {
      return (cmEl as any).CodeMirror.getValue()
    }
  } catch (e) {}

  const lines = cmEl.querySelectorAll('.CodeMirror-line')
  if (lines.length > 0) {
    return Array.from(lines)
      .map((l) => l.textContent || '')
      .join('\n')
  }
  return cmEl.innerText || ''
}

function isMermaidOrPele(blockEl: HTMLElement, code: string): boolean {
  const text = blockEl.innerText || ''
  const hasLangTag =
    /\b(pele|mermaid)\b/i.test(text) ||
    blockEl.querySelector('[data-lang*="pele"], [data-lang*="mermaid"]') !== null

  if (hasLangTag) return true

  try {
    return peleSupports(code)
  } catch {
    return false
  }
}

function renderPeleBlock(blockEl: HTMLElement) {
  const cmEl = blockEl.querySelector('.CodeMirror') as HTMLElement | null
  if (!cmEl) return

  const code = extractCode(cmEl).trim()
  if (!code) return

  if (!isMermaidOrPele(blockEl, code)) return

  // 防循环守卫：代码未改变且预览已存在时直接退出，不触碰任何 DOM
  const lastCode = blockEl.getAttribute(CODE_ATTR)
  const existingPreview = blockEl.querySelector(`.${PREVIEW_CLASS}`)
  if (lastCode === code && existingPreview) {
    return
  }

  // 记录当前代码
  blockEl.setAttribute(CODE_ATTR, code)

  let previewEl = existingPreview as HTMLElement | null
  if (!previewEl) {
    previewEl = blockEl.ownerDocument.createElement('div')
    previewEl.className = `${PREVIEW_CLASS} logseq-pele-wrapper`
    blockEl.appendChild(previewEl)
  }

  try {
    const result = peleRender(code, {
      fontSize: 14,
      responsive: true
    })

    previewEl.innerHTML = `
      <div class="logseq-pele-actions">
        <span class="logseq-pele-badge" title="Powered by Pele (Fast Mermaid)">Pele</span>
      </div>
      <div class="logseq-pele-container is-zoomable">
        ${result.svg}
      </div>
    `

    const containerEl = previewEl.querySelector('.logseq-pele-container') as HTMLElement
    if (containerEl) {
      try {
        enableZoom(containerEl)
      } catch (zErr) {
        // ignore
      }
    }
  } catch (err: any) {
    const msg = err?.message || String(err)
    previewEl.innerHTML = `
      <div class="logseq-pele-error">
        <div class="logseq-pele-error-title">⚠️ Mermaid 语法解析错误</div>
        <div>${msg}</div>
      </div>
    `
  }

  // 绑定编辑时防抖更新
  if (!(cmEl as any).__pele_bound) {
    ;(cmEl as any).__pele_bound = true
    let debounceTimer: any = null
    const onContentChange = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        // 用户输入修改了代码，重置缓存属性并重新渲染
        blockEl.removeAttribute(CODE_ATTR)
        renderPeleBlock(blockEl)
      }, 250)
    }

    cmEl.addEventListener('input', onContentChange)
    cmEl.addEventListener('keyup', onContentChange)
    try {
      if ((cmEl as any).CodeMirror?.on) {
        ;(cmEl as any).CodeMirror.on('change', onContentChange)
      }
    } catch {}
  }
}

export function scanAndRenderAll() {
  const { doc } = getTopContext()
  const blocks = doc.querySelectorAll('.extensions__code, .code-editor, [class*="extensions__code"]')
  blocks.forEach((el) => {
    const blockEl = el.closest('.extensions__code') || el
    renderPeleBlock(blockEl as HTMLElement)
  })
}

export function initDomObserver() {
  const { doc, win } = getTopContext()

  // 1. 注入 CSS 至宿主顶层 document.head
  try {
    const styleId = 'logseq-pele-dynamic-style'
    let styleTag = doc.getElementById(styleId)
    if (!styleTag) {
      styleTag = doc.createElement('style')
      styleTag.id = styleId
      styleTag.textContent = themeStyles
      doc.head.appendChild(styleTag)
    }
  } catch (e) {
    //
  }

  // 2. 首屏渲染
  scanAndRenderAll()

  // 3. 监听 DOM 树变化（过滤掉自身变动，防止无限死循环）
  let mutationTimer: any = null
  const observer = new win.MutationObserver((mutations) => {
    // 如果所有变化都发生在我们自己的预览容器内部，坚决不触发再次扫描
    const isSelfChange = mutations.every((m) => {
      const target = m.target as HTMLElement
      return target?.closest?.(`.${PREVIEW_CLASS}`) !== null
    })
    if (isSelfChange) return

    clearTimeout(mutationTimer)
    mutationTimer = setTimeout(() => {
      scanAndRenderAll()
    }, 300)
  })

  observer.observe(doc.body, {
    childList: true,
    subtree: true
  })

  return () => {
    observer.disconnect()
  }
}
