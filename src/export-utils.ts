/**
 * 图表导出与复制辅助工具
 */

export function getExportableSvg(svgEl: SVGElement): string {
  const clone = svgEl.cloneNode(true) as SVGElement
  const comp = window.getComputedStyle(svgEl)

  // 注入当前实际生效的主题颜色变量，确保脱离宿主渲染后样式与当前主题 100% 一致
  const peleVars = [
    '--pele-bg',
    '--pele-fg',
    '--pele-muted',
    '--pele-line',
    '--pele-border',
    '--pele-surface',
    '--pele-surface-alt',
    '--pele-accent',
    '--pele-error',
    '--pele-critical',
    '--pele-font',
    '--pele-font-mono'
  ]

  const inlineStyles: string[] = []
  for (const v of peleVars) {
    const val = comp.getPropertyValue(v).trim()
    if (val) {
      inlineStyles.push(`${v}:${val}`)
    }
  }

  const existingStyle = clone.getAttribute('style') || ''
  clone.setAttribute('style', `${existingStyle};${inlineStyles.join(';')}`)

  // 确保命名空间
  if (!clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  }

  return clone.outerHTML
}

export async function copySvgToClipboard(svgEl: SVGElement, btnEl: HTMLElement): Promise<void> {
  const svgText = getExportableSvg(svgEl)
  const doc = svgEl.ownerDocument || document
  const win = doc.defaultView || window

  let success = false

  // 1. 尝试宿主环境的 navigator.clipboard
  try {
    if (win.navigator?.clipboard?.writeText) {
      await win.navigator.clipboard.writeText(svgText)
      success = true
    }
  } catch (e) {
    //
  }

  // 2. 降级方案：使用具有当前焦点的宿主 document.execCommand('copy')
  if (!success) {
    try {
      const textarea = doc.createElement('textarea')
      textarea.value = svgText
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      textarea.style.top = '-9999px'
      textarea.style.opacity = '0'
      doc.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      success = doc.execCommand('copy')
      doc.body.removeChild(textarea)
    } catch (e) {
      console.error('[logseq-pele] Fallback execCommand copy failed:', e)
    }
  }

  if (success) {
    const label = btnEl.querySelector('.pele-btn-label')
    const icon = btnEl.querySelector('.pele-btn-icon')
    if (label && icon) {
      const originalText = label.textContent
      const originalIcon = icon.innerHTML
      label.textContent = 'Copied!'
      icon.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
      setTimeout(() => {
        label.textContent = originalText
        icon.innerHTML = originalIcon
      }, 1500)
    }
  } else {
    console.error('[logseq-pele] All copy methods failed')
  }
}

export function downloadSvgFile(svgEl: SVGElement, type: string): void {
  const svgText = getExportableSvg(svgEl)
  const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mermaid-${type || 'diagram'}-${Date.now()}.svg`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadPngFile(svgEl: SVGElement, type: string): void {
  const svgText = getExportableSvg(svgEl)
  const width = parseFloat(svgEl.getAttribute('width') || '') || svgEl.clientWidth || 800
  const height = parseFloat(svgEl.getAttribute('height') || '') || svgEl.clientHeight || 600
  const scale = 2 // 2倍高清视网膜渲染

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 填充底色（避免深色主题导出的图片在白色底上文字看不清）
  const comp = window.getComputedStyle(svgEl)
  const bg = comp.getPropertyValue('--pele-bg').trim()
  if (bg && bg !== 'transparent') {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  const img = new Image()

  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    URL.revokeObjectURL(url)
    canvas.toBlob((blob) => {
      if (!blob) return
      const pngUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = pngUrl
      a.download = `mermaid-${type || 'diagram'}-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(pngUrl)
    }, 'image/png')
  }
  img.src = url
}
