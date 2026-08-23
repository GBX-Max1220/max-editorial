export interface PngPixels {
  width: number
  height: number
  channels: number
  data: Uint8Array
}

export function decodePng(buf: Uint8Array): PngPixels
export function hasColorNear(png: PngPixels, rgb: [number, number, number], tol?: number): number
export function hasSaturation(png: PngPixels, threshold?: number): number
