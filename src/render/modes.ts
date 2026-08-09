import type { PreviewMode, Viewport } from '../engine/types'

export type { PreviewMode, Viewport } from '../engine/types'

export interface ModeTokens {
  showMasthead: boolean
  showTagline: boolean
  metricScale: number
  bodySize: string
}

/** 同一个视觉系统，两种密度。EDITORIAL 是旗舰密度；NORMAL 更紧凑、装饰更少。 */
export function getModeTokens(mode: PreviewMode): ModeTokens {
  if (mode === 'editorial') {
    return { showMasthead: true, showTagline: true, metricScale: 1, bodySize: '17px' }
  }
  return { showMasthead: false, showTagline: false, metricScale: 0.78, bodySize: '15.5px' }
}

export interface ViewportInfo {
  scale: number
  chrome: 'desktop' | 'wechat' | 'mobile'
  label: string
}

export const VIEWPORTS: Record<Viewport, ViewportInfo> = {
  desktop: { scale: 1, chrome: 'desktop', label: 'DESKTOP' },
  wechat: { scale: 0.94, chrome: 'wechat', label: 'WECHAT' },
  mobile: { scale: 0.94, chrome: 'mobile', label: 'MOBILE' },
}

export function getViewportInfo(v: Viewport): ViewportInfo {
  return VIEWPORTS[v]
}
