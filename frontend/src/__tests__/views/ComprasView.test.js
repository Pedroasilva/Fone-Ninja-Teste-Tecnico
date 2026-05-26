import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ComprasView from '../../views/ComprasView.vue'
import api from '../../api'

const produtosFake = [
  { id: 1, nome: 'Produto A', custo_medio: '5.00', preco_venda: '10.00', estoque: 50 },
]

const comprasFake = [
  {
    id: 1,
    fornecedor: 'Fornecedor X',
    total: '50.00',
    created_at: '2024-01-01T10:00:00.000000Z',
    produtos: [
      { id: 1, nome: 'Produto A', pivot: { quantidade: 5, preco_unitario: '10.00' } },
    ],
  },
]

async function preencherFormulario(wrapper) {
  await wrapper.find('[data-testid="input-fornecedor"]').setValue('Fornecedor X')
  await wrapper.find('[data-testid="select-produto"]').setValue('1')
  await wrapper.find('[data-testid="input-quantidade"]').setValue('2')
  await wrapper.find('[data-testid="input-preco-venda"]').setValue('1000')
}

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

    await preencherFormulario(wrapper)
    await wrapper.find('[data-testid="btn-registrar"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('sucesso')
  })

  it('exibe itens comprados no histórico', async () => {
    api.get.mockResolvedValueOnce({ data: produtosFake })
              .mockResolvedValueOnce({ data: comprasFake })

    const wrapper = mount(ComprasView)
    await flushPromises()

    expect(wrapper.text()).toContain('Produto A')
    expect(wrapper.text()).toContain('× 5')
  })

  it('valida fornecedor com menos de 2 caracteres antes de submeter', async () => {
    const wrapper = mount(ComprasView)
    await flushPromises()

    await wrapper.find('[data-testid="input-fornecedor"]').setValue('A')
    await wrapper.find('[data-testid="btn-registrar"]').trigger('click')
    await flushPromises()

    expect(api.post).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('2 caracteres')
  })

  it('exibe mensagem de erro quando a API retorna falha', async () => {
    api.get.mockResolvedValueOnce({ data: produtosFake })
              .mockResolvedValue({ data: [] })
    api.post.mockRejectedValue({
      response: { data: { message: 'Erro ao registrar compra.' } },
    })

    const wrapper = mount(ComprasView)
    await flushPromises()

    await preencherFormulario(wrapper)
    await wrapper.find('[data-testid="btn-registrar"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Erro ao registrar')
  })
})
