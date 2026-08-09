import { describe, expect, it } from 'vitest'
import { countWords } from './words'

describe('word count', () => {
  it('counts cjk and latin separately', () => {
    const c = countWords('你好 world 测试 123')
    expect(c.cjk).toBe(4)
    expect(c.latin).toBe(2)
    expect(c.total).toBe(6)
  })

  it('counts hyphenated / apostrophe latin words as one', () => {
    const c = countWords("don't know well-being")
    expect(c.latin).toBe(3)
  })
})
