import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ItemList from '../../components/ItemList.vue'

const produtosFake = [
  { id: 1, nome: 'Produto A', pivot: { quantidade: 3, preco_unitario: '10.00' } },
  { id: 2, nome: 'Produto B', pivot: { quantidade: 1, preco_unitario: '25.50' } },
]

describe('ItemList', () => {
  it('renderiza um item por produto', () => {
    const wrapper = mount(ItemList, { props: { produtos: produtosFake } })
    expect(wrapper.findAll('li')).toHaveLength(2)
  })

  it('exibe o nome do produto', () => {
    const wrapper = mount(ItemList, { props: { produtos: produtosFake } })
    expect(wrapper.text()).toContain('Produto A')
    expect(wrapper.text()).toContain('Produto B')
  })

  it('exibe a quantidade via pivot', () => {
    const wrapper = mount(ItemList, { props: { produtos: produtosFake } })
    expect(wrapper.text()).toContain('× 3')
    expect(wrapper.text()).toContain('× 1')
  })

  it('exibe o preço unitário formatado', () => {
    const wrapper = mount(ItemList, { props: { produtos: produtosFake } })
    expect(wrapper.text()).toContain('10,00')
    expect(wrapper.text()).toContain('25,50')
  })

  it('renderiza lista vazia sem erros', () => {
    const wrapper = mount(ItemList, { props: { produtos: [] } })
    expect(wrapper.findAll('li')).toHaveLength(0)
  })
})
