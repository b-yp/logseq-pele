import { render as peleRender, supports as peleSupports, detectType as peleDetectType } from 'pele'
import themeStyles from './pele-theme.css?inline'
import { copySvgToClipboard, downloadSvgFile, downloadPngFile } from './export-utils'
import { ICONS } from './icons'

const CODE_ATTR = 'data-pele-code'
const PREVIEW_CLASS = 'logseq-pele-preview'
const COLLAPSED_CLASS = 'pele-code-collapsed'
const HIDE_CHART_CLASS = 'pele-chart-hidden'
const PELE_RENDER_VERSION = '2.5'

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

function formatDiagramType(type: string | null): string {
  if (!type) return ''
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function renderPeleBlock(blockEl: HTMLElement) {
  const cmEl = blockEl.querySelector('.CodeMirror') as HTMLElement | null
  if (!cmEl) return

  const code = extractCode(cmEl).trim()
  if (!code) return

  if (!isMermaidOrPele(blockEl, code)) return

  // 防循环守卫：不仅检查代码，还要检查渲染版本以及所有操作按钮是否齐备
  const lastCode = blockEl.getAttribute(CODE_ATTR)
  const lastVer = blockEl.getAttribute('data-pele-ver')
  const existingPreview = blockEl.querySelector(`.${PREVIEW_CLASS}`)
  const hasExportBtns = existingPreview?.querySelector('.logseq-pele-copy-btn') !== null
  const hasToggleChartBtn = existingPreview?.querySelector('.logseq-pele-toggle-chart-btn') !== null

  if (lastCode === code && existingPreview && lastVer === PELE_RENDER_VERSION && hasExportBtns && hasToggleChartBtn) {
    return
  }

  // 记录当前代码与渲染版本
  blockEl.setAttribute(CODE_ATTR, code)
  blockEl.setAttribute('data-pele-ver', PELE_RENDER_VERSION)

  let previewEl = existingPreview as HTMLElement | null
  if (!previewEl) {
    previewEl = blockEl.ownerDocument.createElement('div')
    previewEl.className = `${PREVIEW_CLASS} logseq-pele-wrapper`
    blockEl.appendChild(previewEl)
  }

  blockEl.setAttribute('data-pele-rendered', 'true')

  const isCollapsed = blockEl.classList.contains(COLLAPSED_CLASS)
  const isChartHidden = blockEl.classList.contains(HIDE_CHART_CLASS)
  const detectedType = peleDetectType(code)
  const badgeLabel = formatDiagramType(detectedType)
  const toggleCodeIcon = isCollapsed ? ICONS.expand : ICONS.collapse
  const toggleCodeLabel = isCollapsed ? '展开代码' : '收起代码'
  const toggleChartIcon = isChartHidden ? ICONS.eye : ICONS.eyeOff
  const toggleChartLabel = isChartHidden ? '显示图表' : '隐藏图表'

  try {
    const result = peleRender(code, {
      fontSize: 14,
      responsive: true
    })

    const badgeHtml = badgeLabel
      ? `<span class="logseq-pele-badge" title="图表类型: ${badgeLabel}">${badgeLabel}</span>`
      : ''

    previewEl.innerHTML = `
      <div class="logseq-pele-actions">
        <button class="logseq-pele-btn logseq-pele-toggle-btn" type="button" title="点击折叠或展开源码">
          <span class="pele-btn-icon">${toggleCodeIcon}</span>
          <span class="pele-btn-label">${toggleCodeLabel}</span>
        </button>
        <button class="logseq-pele-btn logseq-pele-toggle-chart-btn" type="button" title="${isChartHidden ? '点击显示渲染图表' : '点击隐藏渲染图表，只看代码'}">
          <span class="pele-btn-icon">${toggleChartIcon}</span>
          <span class="pele-btn-label">${toggleChartLabel}</span>
        </button>
        <button class="logseq-pele-btn logseq-pele-copy-btn" type="button" title="复制 SVG 矢量代码到剪贴板">
          <span class="pele-btn-icon">${ICONS.copy}</span>
          <span class="pele-btn-label">复制 SVG</span>
        </button>
        <button class="logseq-pele-btn logseq-pele-svg-btn" type="button" title="下载为 .svg 矢量文件">
          <span class="pele-btn-icon">${ICONS.downloadSvg}</span>
          <span class="pele-btn-label">SVG</span>
        </button>
        <button class="logseq-pele-btn logseq-pele-png-btn" type="button" title="下载为高清 .png 图片">
          <span class="pele-btn-icon">${ICONS.downloadPng}</span>
          <span class="pele-btn-label">PNG</span>
        </button>
        ${badgeHtml}
      </div>
      <div class="logseq-pele-container">
        ${result.svg}
      </div>
    `

    // 1. 绑定折叠/展开源码按钮事件
    const toggleBtn = previewEl.querySelector('.logseq-pele-toggle-btn') as HTMLButtonElement | null
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        e.preventDefault()
        const nowCollapsed = blockEl.classList.toggle(COLLAPSED_CLASS)
        const labelEl = toggleBtn.querySelector('.pele-btn-label')
        const iconEl = toggleBtn.querySelector('.pele-btn-icon')
        if (labelEl) {
          labelEl.textContent = nowCollapsed ? '展开代码' : '收起代码'
        }
        if (iconEl) {
          iconEl.innerHTML = nowCollapsed ? ICONS.expand : ICONS.collapse
        }
      })
    }

    // 2. 绑定隐藏/显示图表按钮事件
    const toggleChartBtn = previewEl.querySelector('.logseq-pele-toggle-chart-btn') as HTMLButtonElement | null
    if (toggleChartBtn) {
      toggleChartBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        e.preventDefault()
        const nowHidden = blockEl.classList.toggle(HIDE_CHART_CLASS)

        // 若隐藏图表时源码处于折叠状态，则自动展开源码，避免用户什么都看不到
        if (nowHidden && blockEl.classList.contains(COLLAPSED_CLASS)) {
          blockEl.classList.remove(COLLAPSED_CLASS)
          if (toggleBtn) {
            const codeLabel = toggleBtn.querySelector('.pele-btn-label')
            const codeIcon = toggleBtn.querySelector('.pele-btn-icon')
            if (codeLabel) codeLabel.textContent = '收起代码'
            if (codeIcon) codeIcon.innerHTML = ICONS.collapse
          }
        }

        const labelEl = toggleChartBtn.querySelector('.pele-btn-label')
        const iconEl = toggleChartBtn.querySelector('.pele-btn-icon')
        if (labelEl) {
          labelEl.textContent = nowHidden ? '显示图表' : '隐藏图表'
        }
        if (iconEl) {
          iconEl.innerHTML = nowHidden ? ICONS.eye : ICONS.eyeOff
        }
        toggleChartBtn.title = nowHidden ? '点击显示渲染图表' : '点击隐藏渲染图表，只看代码'
      })
    }

    // 2. 绑定复制与下载事件
    const svgEl = previewEl.querySelector('svg')
    if (svgEl) {
      const copyBtn = previewEl.querySelector('.logseq-pele-copy-btn') as HTMLButtonElement | null
      copyBtn?.addEventListener('click', (e) => {
        e.stopPropagation()
        e.preventDefault()
        copySvgToClipboard(svgEl, copyBtn)
      })

      const svgBtn = previewEl.querySelector('.logseq-pele-svg-btn') as HTMLButtonElement | null
      svgBtn?.addEventListener('click', (e) => {
        e.stopPropagation()
        e.preventDefault()
        downloadSvgFile(svgEl, detectedType || 'diagram')
      })

      const pngBtn = previewEl.querySelector('.logseq-pele-png-btn') as HTMLButtonElement | null
      pngBtn?.addEventListener('click', (e) => {
        e.stopPropagation()
        e.preventDefault()
        downloadPngFile(svgEl, detectedType || 'diagram')
      })
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
    let styleTag = doc.getElementById(styleId) as HTMLStyleElement | null
    if (!styleTag) {
      styleTag = doc.createElement('style')
      styleTag.id = styleId
      doc.head.appendChild(styleTag)
    }
    // 每次重新加载插件均强制刷新最新样式
    styleTag.textContent = themeStyles
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
