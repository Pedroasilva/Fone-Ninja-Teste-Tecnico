import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ProdutosView from '../../views/ProdutosView.vue'
import api from '../../api'

describe('ProdutosView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: [] })
  })

  it('renderiza formulário de cadastro', () => {
    const wrapper = mount(ProdutosView)
    expect(wrapper.find('[data-testid="input-nome"]').exists()).toBe(true)
  })

  it('carrega e exibe lista de produtos ao montar', async () => {
    api.get.mockResolvedValue({
      data: [{ id: 1, nome: 'Produto A', preco_venda: '10.00', custo_medio: '5.00', estoque: 20 }],
    })

    const wrapper = mount(ProdutosView)
    await flushPromises()

    expect(wrapper.text()).toContain('Produto A')
  })

  it('exibe mensagem de sucesso após cadastro', async () => {
    api.post.mockResolvedValue({
      data: { id: 2, nome: 'Novo', preco_venda: '15.00', custo_medio: '0.00', estoque: 0 },
    })

    const wrapper = mount(ProdutosView)
    await flushPromises()

    await wrapper.find('[data-testid="input-nome"]').setValue('Produto Novo')
    await wrapper.find('[data-testid="input-preco"]').setValue('15')
    await wrapper.find('[data-testid="btn-cadastrar"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('sucesso')
  })

  it('exibe mensagem de erro se a API retornar 422', async () => {
    api.post.mockRejectedValue({
      response: { data: { message: 'O nome do produto é obrigatório.' } },
    })

    const wrapper = mount(ProdutosView)
    await flushPromises()

    await wrapper.find('[data-testid="btn-cadastrar"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('obrigatório')
  })
})
