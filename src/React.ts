import '@logseq/libs'

const HostReact =
  (typeof logseq !== 'undefined' && (logseq.Experiments as any)?.React) ||
  (window as any).React ||
  {}

export default HostReact
export const useState = HostReact.useState
export const useEffect = HostReact.useEffect
export const useRef = HostReact.useRef
export const useCallback = HostReact.useCallback
export const useMemo = HostReact.useMemo
export const useContext = HostReact.useContext
export const useReducer = HostReact.useReducer
export const createElement = HostReact.createElement
export const Fragment = HostReact.Fragment
