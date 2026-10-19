import '@logseq/libs'
import { LSPluginBaseInfo } from '@logseq/libs/dist/LSPlugin'
import { settingsSchema, PelePluginSettings } from './settings'
import PeleRenderer from './renderer'
import themeStyles from './pele-theme.css?inline'
import { initDomObserver } from './dom-observer'

const RENDERER_TYPES = {
  MERMAID: 'mermaid',
  PELE: 'pele'
}

function registerLegacyRenderers(settings: PelePluginSettings) {
  try {
    if (settings.overrideMermaid !== false) {
      logseq.Experiments.registerFencedCodeRenderer(RENDERER_TYPES.MERMAID, {
        edit: false,
        render: PeleRenderer
      })
    }
    if (settings.supportPele !== false) {
      logseq.Experiments.registerFencedCodeRenderer(RENDERER_TYPES.PELE, {
        edit: false,
        render: PeleRenderer
      })
    }
  } catch (e) {
    // legacy fallback
  }
}

function main(baseInfo: LSPluginBaseInfo) {
  try {
    if (typeof window !== 'undefined' && window.top?.console) {
      window.top.console.log('[logseq-pele] Pele Mermaid Renderer activated successfully.')
    }
  } catch {}

  // 1. 注入样式
  try {
    logseq.provideStyle(themeStyles)
  } catch (err) {}

  // 2. 传统注册兜底
  const settings = Object.assign({}, baseInfo?.settings, logseq.settings) as PelePluginSettings
  registerLegacyRenderers(settings)

  // 3. 启动 DOM 观测渲染器（完美适配 Logseq DB 版本与现代版本）
  initDomObserver()

  // 4. 用户右下角通知
  try {
    logseq.UI.showMsg('🚀 Pele Mermaid Renderer activated!', 'success', { timeout: 3000 })
  } catch {}
}

logseq
  .useSettingsSchema(settingsSchema)
  .ready(main)
  .catch((err) => {
    console.error('[logseq-pele] Startup error:', err)
  })
