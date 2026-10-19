import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin'

export interface PelePluginSettings {
  overrideMermaid?: boolean
  supportPele?: boolean
  enableZoom?: boolean
  fontSize?: number
  responsive?: boolean
}

export const settingsSchema: Array<SettingSchemaDesc> = [
  {
    key: 'overrideMermaid',
    type: 'boolean',
    title: '接管 mermaid 代码块',
    description: '使用 Pele 极速引擎替代 Logseq 原生的 Mermaid 渲染器（支持 ```mermaid）',
    default: true
  },
  {
    key: 'supportPele',
    type: 'boolean',
    title: '支持 pele 代码块',
    description: '显式使用 ```pele 代码块进行渲染',
    default: true
  },
  {
    key: 'enableZoom',
    type: 'boolean',
    title: '启用平移与缩放 (Zoom & Pan)',
    description: '支持按住鼠标拖拽平移和滚轮无级缩放图表',
    default: true
  },
  {
    key: 'fontSize',
    type: 'number',
    title: '图表基础字号 (px)',
    description: 'Pele 渲染图表时的基准字体大小，默认 14',
    default: 14
  },
  {
    key: 'responsive',
    type: 'boolean',
    title: '自适应宽度 (Responsive)',
    description: '自适应容器宽度，避免大图溢出当前页面',
    default: true
  }
]
