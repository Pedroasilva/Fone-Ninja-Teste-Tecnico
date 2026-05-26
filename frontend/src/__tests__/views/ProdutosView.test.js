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
      data: [{ id: 1, nome: 'Produto A', preco_venda: '10.00', custo_medio: '5.00', estoque: 20, created_at: '2024-01-01T10:00:00.000000Z' }],
    })

    const wrapper = mount(ProdutosView)
    await flushPromises()

    expect(wrapper.text()).toContain('Produto A')
  })

  it('exibe coluna de data de cadastro na listagem', async () => {
    api.get.mockResolvedValue({
      data: [{ id: 1, nome: 'Produto A', preco_venda: '10.00', custo_medio: '5.00', estoque: 20, created_at: '2024-01-01T10:00:00.000000Z' }],
    })

    const wrapper = mount(ProdutosView)
    await flushPromises()

    expect(wrapper.text()).toContain('Cadastrado em')
  })

  it('exibe mensagem de sucesso após cadastro', async () => {
    api.post.mockResolvedValue({
      data: { id: 2, nome: 'Produto Novo', preco_venda: '15.00', custo_medio: '0.00', estoque: 0 },
    })

    const wrapper = mount(ProdutosView)
    await flushPromises()

    await wrapper.find('[data-testid="input-nome"]').setValue('Produto Novo')
    await wrapper.find('[data-testid="input-preco"]').setValue('1500')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('sucesso')
  })

  it('exibe mensagem de erro se a API retornar 422', async () => {
    api.post.mockRejectedValue({
      response: { data: { message: 'Erro inesperado. Tente novamente.' } },
    })

    const wrapper = mount(ProdutosView)
    await flushPromises()

    await wrapper.find('[data-testid="input-nome"]').setValue('Produto Z')
    await wrapper.find('[data-testid="input-preco"]').setValue('1000')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Erro inesperado')
  })

  it('exibe erro no campo nome quando API retorna nome duplicado', async () => {
    api.post.mockRejectedValue({
      response: {
        data: {
          errors: { nome: ['Já existe um produto cadastrado com esse nome.'] },
        },
      },
    })

    const wrapper = mount(ProdutosView)
    await flushPromises()

    await wrapper.find('[data-testid="input-nome"]').setValue('Produto X')
    await wrapper.find('[data-testid="input-preco"]').setValue('1000')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Já existe um produto')
  })

  it('valida nome com menos de 3 caracteres antes de submeter', async () => {
    const wrapper = mount(ProdutosView)
    await flushPromises()

    await wrapper.find('[data-testid="input-nome"]').setValue('AB')
    await wrapper.find('[data-testid="input-preco"]').setValue('1000')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(api.post).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('3 caracteres')
  })

  it('submit via Enter chama cadastrarProduto com dados válidos', async () => {
    api.post.mockResolvedValue({
      data: { id: 3, nome: 'Via Enter', preco_venda: '20.00', custo_medio: '0.00', estoque: 0 },
    })

    const wrapper = mount(ProdutosView)
    await flushPromises()

    await wrapper.find('[data-testid="input-nome"]').setValue('Via Enter')
    await wrapper.find('[data-testid="input-preco"]').setValue('2000')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(api.post).toHaveBeenCalledWith('/produtos', expect.objectContaining({ nome: 'Via Enter' }))
  })
})
