/**
 * 最小 PNG 像素解码器（bitDepth 8，colorType 2=RGB / 6=RGBA）+ 颜色断言工具。
 * 供截图脚本（capture-redblue.mjs）与 vitest 回归测试共用。
 * 零依赖：只用 node:zlib 解压 IDAT。
 */

import { inflateSync } from 'node:zlib'

export function decodePng(buf) {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  for (let i = 0; i < 8; i++) if (buf[i] !== sig[i]) throw new Error('not a png')
  let pos = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  const idat = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    pos += 12 + len
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
    } else if (type === 'IDAT') {
      idat.push(data)
    } else if (type === 'IEND') {
      break
    }
  }
  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
    throw new Error(`unsupported png: bitDepth=${bitDepth} colorType=${colorType}`)
  }
  const channels = colorType === 6 ? 4 : 3
  const stride = width * channels
  const raw = inflateSync(Buffer.concat(idat))
  const out = Buffer.alloc(height * stride)
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    const dst = out.subarray(y * stride, (y + 1) * stride)
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? dst[x - channels] : 0
      const b = prev ? prev[x] : 0
      const c = x >= channels && prev ? prev[x - channels] : 0
      let v = row[x]
      switch (filter) {
        case 0:
          break
        case 1:
          v = (v + a) & 0xff
          break
        case 2:
          v = (v + b) & 0xff
          break
        case 3:
          v = (v + ((a + b) >> 1)) & 0xff
          break
        case 4: {
          const p = a + b - c
          const pa = Math.abs(p - a)
          const pb = Math.abs(p - b)
          const pc = Math.abs(p - c)
          const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c
          v = (v + pr) & 0xff
          break
        }
        default:
          throw new Error(`unknown filter ${filter}`)
      }
      dst[x] = v
    }
  }
  return { width, height, channels, data: out }
}

/** 统计 RGB 目标色（含 ±tol 邻近色，捕捉抗锯齿边缘）的像素数。 */
export function hasColorNear(png, rgb, tol = 48) {
  const { width, height, channels, data } = png
  let count = 0
  for (let i = 0; i < width * height; i++) {
    const j = i * channels
    const r = data[j]
    const g = data[j + 1]
    const b = data[j + 2]
    if (Math.abs(r - rgb[0]) <= tol && Math.abs(g - rgb[1]) <= tol && Math.abs(b - rgb[2]) <= tol) count++
  }
  return count
}

/** 统计饱和度明显（max-min > threshold）的像素数。灰度图应约等于 0。 */
export function hasSaturation(png, threshold = 24) {
  const { width, height, channels, data } = png
  let count = 0
  for (let i = 0; i < width * height; i++) {
    const j = i * channels
    const r = data[j]
    const g = data[j + 1]
    const b = data[j + 2]
    if (Math.max(r, g, b) - Math.min(r, g, b) > threshold) count++
  }
  return count
}
