import { describe, it, expect } from 'vitest'
import { formatarMoeda, mascararMoeda, valorParaMascara, onMoedaInput } from '../../utils/format'

describe('formatarMoeda', () => {
  it('formata valor positivo em reais', () => {
    expect(formatarMoeda(10)).toBe('R$\xa010,00')
  })

  it('formata zero', () => {
    expect(formatarMoeda(0)).toBe('R$\xa00,00')
  })

  it('formata null como zero', () => {
    expect(formatarMoeda(null)).toBe('R$\xa00,00')
  })

  it('formata valor negativo', () => {
    const resultado = formatarMoeda(-50)
    expect(resultado).toContain('50,00')
  })
})

describe('mascararMoeda', () => {
  it('converte dígitos brutos para formato decimal pt-BR', () => {
    expect(mascararMoeda('1000')).toBe('10,00')
  })

  it('retorna string vazia para entrada vazia', () => {
    expect(mascararMoeda('')).toBe('')
  })

  it('formata centavos sem parte inteira', () => {
    expect(mascararMoeda('50')).toBe('0,50')
  })

  it('formata valores grandes com separador de milhar', () => {
    expect(mascararMoeda('100000')).toBe('1.000,00')
  })
})

describe('valorParaMascara', () => {
  it('retorna string vazia para valor vazio', () => {
    expect(valorParaMascara('')).toBe('')
    expect(valorParaMascara(null)).toBe('')
    expect(valorParaMascara(undefined)).toBe('')
  })

  it('converte número inteiro para formato mascarado', () => {
    expect(valorParaMascara(10)).toBe('10,00')
  })

  it('converte número decimal corretamente', () => {
    expect(valorParaMascara(9.99)).toBe('9,99')
  })
})

describe('onMoedaInput', () => {
  it('extrai dígitos, formata o campo e retorna número', () => {
    const event = { target: { value: '1000' } }
    const resultado = onMoedaInput(event)
    expect(resultado).toBe(10)
    expect(event.target.value).toBe('10,00')
  })

  it('retorna string vazia e limpa campo quando não há dígitos', () => {
    const event = { target: { value: 'abc' } }
    const resultado = onMoedaInput(event)
    expect(resultado).toBe('')
    expect(event.target.value).toBe('')
  })

  it('ignora caracteres não numéricos na entrada', () => {
    const event = { target: { value: 'R$ 5,00' } }
    const resultado = onMoedaInput(event)
    expect(resultado).toBe(5)
  })
})
