/**
 * 截图颜色状态回归测试（bounded visual-evidence repair）。
 *
 * 目标：截图的像素级断言（蓝/红存在性、灰度无饱和色）不能靠"computed 正确"糊弄——
 * 这里用合成 PNG 编码→共享解码器→断言，验证 png-pixels.mjs 的判定逻辑本身可靠，
 * 并由 capture-redblue.mjs 在每次截图后用它检查真实 PNG 内容。
 */

import { describe, expect, it } from 'vitest'
import { deflateSync } from 'node:zlib'
import { decodePng, hasColorNear, hasSaturation } from '../../scripts/png-pixels.mjs'

/* ── 最小 PNG 编码器（测试用；colorType 6 RGBA，支持 filter 0/1/2） ── */
function crc32(buf: Buffer): number {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return (~c) >>> 0
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

/** pixels: rows of [r,g,b,a]；filters: 每行 filter 字节（默认 0=None）。 */
function encodePng(width: number, height: number, pixels: number[][][], filters?: number[]): Buffer {
  const channels = 4
  const stride = width * channels
  const raw = Buffer.alloc(height * (stride + 1))
  for (let y = 0; y < height; y++) {
    const filter = filters?.[y] ?? 0
    raw[y * (stride + 1)] = filter
    const rowBuf = Buffer.alloc(stride)
    for (let x = 0; x < width; x++) {
      const p = pixels[y][x]
      rowBuf[x * channels] = p[0]
      rowBuf[x * channels + 1] = p[1]
      rowBuf[x * channels + 2] = p[2]
      rowBuf[x * channels + 3] = p[3] ?? 255
    }
    for (let i = 0; i < stride; i++) {
      const left = i >= channels ? rowBuf[i - channels] : 0
      const above = y > 0 ? raw[(y - 1) * (stride + 1) + 1 + i] : 0
      let v = rowBuf[i]
      if (filter === 1) v = (v - left) & 0xff
      else if (filter === 2) v = (v - above) & 0xff
      raw[y * (stride + 1) + 1 + i] = v
    }
  }
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6 // RGBA
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

describe('PNG 像素颜色断言（截图 color-state 回归）', () => {
  it('解码彩色 PNG 并检出 blue(#2F5FD7) 与 red(#D4473F)', () => {
    const png = encodePng(3, 1, [
      [
        [47, 95, 215, 255],
        [212, 71, 63, 255],
        [128, 128, 128, 255],
      ],
    ])
    const dec = decodePng(png)
    expect(dec.width).toBe(3)
    expect(dec.height).toBe(1)
    expect(dec.channels).toBe(4)
    // 精确命中
    expect(hasColorNear(dec, [47, 95, 215], 2)).toBe(1)
    expect(hasColorNear(dec, [212, 71, 63], 2)).toBe(1)
    // 灰色不得误判为蓝/红（即使放宽容差）
    expect(hasColorNear(dec, [47, 95, 215], 48)).toBe(1)
    expect(hasColorNear(dec, [212, 71, 63], 48)).toBe(1)
    // 饱和度：蓝 + 红 = 2 个饱和像素，灰不计
    expect(hasSaturation(dec, 24)).toBe(2)
  })

  it('灰度图无饱和色，且不误报蓝/红', () => {
    const png = encodePng(2, 1, [
      [
        [100, 100, 100, 255],
        [200, 200, 200, 255],
      ],
    ])
    const dec = decodePng(png)
    expect(hasSaturation(dec, 24)).toBe(0)
    expect(hasColorNear(dec, [47, 95, 215], 48)).toBe(0)
    expect(hasColorNear(dec, [212, 71, 63], 48)).toBe(0)
  })

  it('Sub 滤波（filter=1）行正确解滤波', () => {
    // 3 行各 2 像素，第二行用 Sub 滤波编码。
    const png = encodePng(
      2,
      2,
      [
        [
          [10, 20, 30, 255],
          [40, 50, 60, 255],
        ],
        [
          [47, 95, 215, 255],
          [212, 71, 63, 255],
        ],
      ],
      [0, 1],
    )
    const dec = decodePng(png)
    expect(hasColorNear(dec, [47, 95, 215], 2)).toBe(1)
    expect(hasColorNear(dec, [212, 71, 63], 2)).toBe(1)
    expect(hasColorNear(dec, [10, 20, 30], 2)).toBe(1)
  })

  it('Up 滤波（filter=2）行正确解滤波', () => {
    const png = encodePng(
      1,
      2,
      [
        [[47, 95, 215, 255]],
        [[212, 71, 63, 255]],
      ],
      [0, 2],
    )
    const dec = decodePng(png)
    expect(hasColorNear(dec, [47, 95, 215], 2)).toBe(1)
    expect(hasColorNear(dec, [212, 71, 63], 2)).toBe(1)
  })

  it('抗锯齿邻近色在 ±48 容差内被检到（捕捉边缘）', () => {
    // 抗锯齿蓝边缘像素：蓝 #2F5FD7 与纸面混合的典型边缘色 (90, 140, 225)，三通道都在 ±48 内。
    const png = encodePng(1, 1, [[[90, 140, 225, 255]]])
    const dec = decodePng(png)
    expect(hasColorNear(dec, [47, 95, 215], 48)).toBe(1)
  })
})
