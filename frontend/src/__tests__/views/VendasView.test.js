import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import VendasView from '../../views/VendasView.vue'
import api from '../../api'

const produtosFake = [
  { id: 1, nome: 'Produto A', custo_medio: '10.00', preco_venda: '20.00', estoque: 50 },
]

describe('VendasView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: [] })
  })

  it('calcula total e lucro estimados em tempo real', async () => {
    api.get.mockResolvedValueOnce({ data: produtosFake })
              .mockResolvedValue({ data: [] })

    const wrapper = mount(VendasView)
    await flushPromises()

    const select = wrapper.find('[data-testid="select-produto"]')
    await select.setValue('1')

    await wrapper.find('[data-testid="input-quantidade"]').setValue('5')
    await wrapper.find('[data-testid="input-preco-venda"]').setValue('20')
    await flushPromises()

    expect(wrapper.text()).toContain('100')
    expect(wrapper.text()).toContain('50')
  })

  it('exibe erro quando API retorna estoque insuficiente', async () => {
    api.get.mockResolvedValue({ data: produtosFake })
    api.post.mockRejectedValue({
      response: { data: { message: 'Estoque insuficiente para o produto Produto A' } },
    })

    const wrapper = mount(VendasView)
    await flushPromises()

    await wrapper.find('[data-testid="btn-registrar"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Estoque insuficiente')
  })

  it('exibe mensagem de sucesso após registrar venda', async () => {
    api.get.mockResolvedValue({ data: produtosFake })
    api.post.mockResolvedValue({
      data: {
        venda: { id: 1, cliente: 'Y', total: '100.00', lucro: '50.00', cancelada: false },
        total: 100.0,
        lucro: 50.0,
      },
    })

    const wrapper = mount(VendasView)
    await flushPromises()

    await wrapper.find('[data-testid="input-cliente"]').setValue('Cliente Y')
    await wrapper.find('[data-testid="btn-registrar"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('sucesso')
  })
})
