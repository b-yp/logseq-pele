import '@logseq/libs'

const HostReactDOM =
  (typeof logseq !== 'undefined' && (logseq.Experiments as any)?.ReactDOM) ||
  (window as any).ReactDOM ||
  {}

export default HostReactDOM
