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
    title: 'Override Mermaid Code Blocks',
    description: 'Use the fast Pele engine instead of Logseq native Mermaid renderer for ```mermaid',
    default: true
  },
  {
    key: 'supportPele',
    type: 'boolean',
    title: 'Support Pele Code Blocks',
    description: 'Enable rendering for explicit ```pele code blocks',
    default: true
  },
  {
    key: 'enableZoom',
    type: 'boolean',
    title: 'Enable Pan and Zoom',
    description: 'Allow panning by mouse drag and zooming with scroll wheel',
    default: true
  },
  {
    key: 'fontSize',
    type: 'number',
    title: 'Base Font Size (px)',
    description: 'Base font size used by Pele renderer (default: 14)',
    default: 14
  },
  {
    key: 'responsive',
    type: 'boolean',
    title: 'Responsive Width',
    description: 'Automatically adjust diagram size to fit container width',
    default: true
  }
]
