import { describe, it, expect } from 'vitest'
import { formatarMoeda } from '../../utils/format'

describe('formatarMoeda', () => {
  it('formata valor positivo em reais', () => {
    expect(formatarMoeda(10)).toBe('R$ 10,00')
  })

  it('formata zero', () => {
    expect(formatarMoeda(0)).toBe('R$ 0,00')
  })

  it('formata null como zero', () => {
    expect(formatarMoeda(null)).toBe('R$ 0,00')
  })

  it('formata valor negativo', () => {
    const resultado = formatarMoeda(-50)
    expect(resultado).toContain('50,00')
  })
})
