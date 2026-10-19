import '@logseq/libs'
import { LSPluginBaseInfo } from '@logseq/libs/dist/LSPlugin'
import { settingsSchema, PelePluginSettings } from './settings'
import PeleRenderer from './renderer'
import themeStyles from './pele-theme.css?inline'

const RENDERER_TYPES = {
  MERMAID: 'mermaid',
  PELE: 'pele'
}

function registerRenderers(settings: PelePluginSettings) {
  // 接管 ```mermaid
  if (settings.overrideMermaid !== false) {
    try {
      logseq.Experiments.registerFencedCodeRenderer(RENDERER_TYPES.MERMAID, {
        edit: false,
        render: PeleRenderer
      })
      console.log('[logseq-pele] Registered renderer for ```mermaid')
    } catch (e) {
      console.error('[logseq-pele] Failed to register mermaid renderer:', e)
    }
  }

  // 支持 ```pele
  if (settings.supportPele !== false) {
    try {
      logseq.Experiments.registerFencedCodeRenderer(RENDERER_TYPES.PELE, {
        edit: false,
        render: PeleRenderer
      })
      console.log('[logseq-pele] Registered renderer for ```pele')
    } catch (e) {
      console.error('[logseq-pele] Failed to register pele renderer:', e)
    }
  }
}

function main(baseInfo: LSPluginBaseInfo) {
  console.log('[logseq-pele] Initializing plugin...', baseInfo)

  // 1. 注入主题样式至 Logseq 宿主主窗口
  logseq.provideStyle(themeStyles)

  // 2. 根据设置注册代码块渲染器
  const settings = (logseq.settings || {}) as PelePluginSettings
  registerRenderers(settings)

  // 3. 监听设置变动
  logseq.onSettingsChanged((newSettings: PelePluginSettings, oldSettings: PelePluginSettings) => {
    console.log('[logseq-pele] Settings updated:', { oldSettings, newSettings })
    // 如果启用了新的代码块类型，注册它
    registerRenderers(newSettings)
  })
}

// 插件入口
logseq
  .useSettingsSchema(settingsSchema)
  .ready(main)
  .catch((err) => {
    console.error('[logseq-pele] Startup error:', err)
  })
