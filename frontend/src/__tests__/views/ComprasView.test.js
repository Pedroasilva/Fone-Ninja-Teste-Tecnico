import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ComprasView from '../../views/ComprasView.vue'
import api from '../../api'

const produtosFake = [
  { id: 1, nome: 'Produto A', custo_medio: '5.00', preco_venda: '10.00', estoque: 50 },
]

describe('ComprasView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: [] })
  })

  it('inicia com um item na lista de itens', async () => {
    const wrapper = mount(ComprasView)
    await flushPromises()
    expect(wrapper.findAll('[data-testid="linha-item"]')).toHaveLength(1)
  })

  it('adiciona nova linha ao clicar em Adicionar item', async () => {
    const wrapper = mount(ComprasView)
    await flushPromises()

    await wrapper.find('[data-testid="btn-adicionar-item"]').trigger('click')
    expect(wrapper.findAll('[data-testid="linha-item"]')).toHaveLength(2)
  })

  it('remove linha ao clicar em remover', async () => {
    const wrapper = mount(ComprasView)
    await flushPromises()

    await wrapper.find('[data-testid="btn-adicionar-item"]').trigger('click')
    await wrapper.findAll('[data-testid="btn-remover-item"]')[1].trigger('click')
    expect(wrapper.findAll('[data-testid="linha-item"]')).toHaveLength(1)
  })

  it('não permite remover o último item', async () => {
    const wrapper = mount(ComprasView)
    await flushPromises()

    await wrapper.find('[data-testid="btn-remover-item"]').trigger('click')
    expect(wrapper.findAll('[data-testid="linha-item"]')).toHaveLength(1)
  })

  it('exibe sucesso após registrar compra', async () => {
    api.get.mockResolvedValueOnce({ data: produtosFake })
              .mockResolvedValue({ data: [] })
    api.post.mockResolvedValue({ data: { id: 1, fornecedor: 'X', total: '50.00' } })

    const wrapper = mount(ComprasView)
    await flushPromises()

    await wrapper.find('[data-testid="input-fornecedor"]').setValue('Fornecedor X')
    await wrapper.find('[data-testid="btn-registrar"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('sucesso')
  })
})
