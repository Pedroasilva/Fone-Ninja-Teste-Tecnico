import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DataCell from '../../components/DataCell.vue'

describe('DataCell', () => {
  it('formata e exibe a data principal', () => {
    const wrapper = mount(DataCell, { props: { data: '2024-03-15T10:30:00.000000Z' } })
    expect(wrapper.text()).toContain('15/03/2024')
  })

  it('exibe label quando labelCompra é fornecido', () => {
    const wrapper = mount(DataCell, {
      props: { data: '2024-03-15T10:30:00.000000Z', labelCompra: 'Compra' },
    })
    expect(wrapper.text()).toContain('Compra')
  })

  it('não exibe label quando labelCompra não é fornecido', () => {
    const wrapper = mount(DataCell, { props: { data: '2024-03-15T10:30:00.000000Z' } })
    expect(wrapper.text()).not.toContain('Compra')
  })

  it('exibe data de cancelamento quando fornecida', () => {
    const wrapper = mount(DataCell, {
      props: {
        data: '2024-03-15T10:30:00.000000Z',
        dataCancelamento: '2024-03-16T14:00:00.000000Z',
      },
    })
    expect(wrapper.text()).toContain('Cancelamento')
    expect(wrapper.text()).toContain('16/03/2024')
  })

  it('não exibe bloco de cancelamento quando dataCancelamento é null', () => {
    const wrapper = mount(DataCell, {
      props: { data: '2024-03-15T10:30:00.000000Z', dataCancelamento: null },
    })
    expect(wrapper.text()).not.toContain('Cancelamento')
  })

  it('exibe traço para data inválida', () => {
    const wrapper = mount(DataCell, { props: { data: '' } })
    expect(wrapper.text()).toContain('-')
  })
})
