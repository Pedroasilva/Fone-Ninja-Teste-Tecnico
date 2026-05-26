import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import VendasView from '../../views/VendasView.vue'
import api from '../../api'

const produtosFake = [
  { id: 1, nome: 'Produto A', custo_medio: '10.00', preco_venda: '20.00', estoque: 50 },
]

const vendasFake = [
  {
    id: 1,
    cliente: 'Cliente Y',
    total: '100.00',
    lucro: '50.00',
    cancelada: false,
    cancelada_em: null,
    created_at: '2024-01-01T10:00:00.000000Z',
    produtos: [
      { id: 1, nome: 'Produto A', pivot: { quantidade: 5, preco_unitario: '20.00' } },
    ],
  },
]

async function preencherFormulario(wrapper) {
  await wrapper.find('[data-testid="input-cliente"]').setValue('Cliente Y')
  await wrapper.find('[data-testid="select-produto"]').setValue('1')
  await wrapper.find('[data-testid="input-quantidade"]').setValue('5')
  await wrapper.find('[data-testid="input-preco-venda"]').setValue('2000')
}

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

    await wrapper.find('[data-testid="select-produto"]').setValue('1')
    await wrapper.find('[data-testid="input-quantidade"]').setValue('5')
    await wrapper.find('[data-testid="input-preco-venda"]').setValue('2000')
    await flushPromises()

    expect(wrapper.text()).toContain('100,00')
    expect(wrapper.text()).toContain('50,00')
  })

  it('exibe erro quando API retorna estoque insuficiente', async () => {
    api.get.mockResolvedValueOnce({ data: produtosFake })
              .mockResolvedValue({ data: [] })
    api.post.mockRejectedValue({
      response: { data: { message: 'Estoque insuficiente para o produto Produto A' } },
    })

    const wrapper = mount(VendasView)
    await flushPromises()

    await preencherFormulario(wrapper)
    await wrapper.find('[data-testid="btn-registrar"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Estoque insuficiente')
  })

  it('exibe mensagem de sucesso após registrar venda', async () => {
    api.get.mockResolvedValueOnce({ data: produtosFake })
              .mockResolvedValue({ data: [] })
    api.post.mockResolvedValue({
      data: {
        venda: { id: 1, cliente: 'Y', total: '100.00', lucro: '50.00', cancelada: false, cancelada_em: null, created_at: '2024-01-01T10:00:00.000000Z', produtos: [] },
        total: 100.0,
        lucro: 50.0,
      },
    })

    const wrapper = mount(VendasView)
    await flushPromises()

    await preencherFormulario(wrapper)
    await wrapper.find('[data-testid="btn-registrar"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Venda registrada!')
  })

  it('exibe itens vendidos no histórico', async () => {
    api.get.mockResolvedValueOnce({ data: produtosFake })
              .mockResolvedValueOnce({ data: vendasFake })

    const wrapper = mount(VendasView)
    await flushPromises()

    expect(wrapper.text()).toContain('Produto A')
    expect(wrapper.text()).toContain('× 5')
  })

  it('abre modal de confirmação ao clicar em Cancelar', async () => {
    api.get.mockResolvedValueOnce({ data: produtosFake })
              .mockResolvedValueOnce({ data: vendasFake })

    const wrapper = mount(VendasView)
    await flushPromises()

    // O primeiro btn-perigo é o ✕ do formulário; o segundo é o "Cancelar" da tabela
    const botoes = wrapper.findAll('button.btn-perigo')
    await botoes[botoes.length - 1].trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Confirmar cancelamento')
  })

  it('chama API de cancelamento ao confirmar no modal', async () => {
    api.get.mockResolvedValueOnce({ data: produtosFake })
              .mockResolvedValueOnce({ data: vendasFake })
              .mockResolvedValue({ data: [] })
    api.delete.mockResolvedValue({ data: { cancelada: true, cancelada_em: '2024-01-02T00:00:00.000000Z' } })

    const wrapper = mount(VendasView)
    await flushPromises()

    // abre o modal
    const botoes = wrapper.findAll('button.btn-perigo')
    await botoes[botoes.length - 1].trigger('click')
    await flushPromises()

    // confirma no modal (último btn-perigo agora é o "Confirmar cancelamento" do modal)
    const botoesAposModal = wrapper.findAll('button.btn-perigo')
    await botoesAposModal[botoesAposModal.length - 1].trigger('click')
    await flushPromises()

    expect(api.delete).toHaveBeenCalledWith('/vendas/1')
  })

  it('fecha modal ao clicar em Voltar', async () => {
    api.get.mockResolvedValueOnce({ data: produtosFake })
              .mockResolvedValueOnce({ data: vendasFake })

    const wrapper = mount(VendasView)
    await flushPromises()

    // abre modal
    const botoes = wrapper.findAll('button.btn-perigo')
    await botoes[botoes.length - 1].trigger('click')
    await flushPromises()

    expect(wrapper.find('.modal').exists()).toBe(true)

    // fecha com Voltar
    await wrapper.find('.modal button.btn-secundario').trigger('click')
    await flushPromises()

    expect(wrapper.find('.modal').exists()).toBe(false)
  })

  it('valida cliente com menos de 2 caracteres antes de submeter', async () => {
    api.get.mockResolvedValue({ data: produtosFake })

    const wrapper = mount(VendasView)
    await flushPromises()

    await wrapper.find('[data-testid="input-cliente"]').setValue('A')
    await wrapper.find('[data-testid="btn-registrar"]').trigger('click')
    await flushPromises()

    expect(api.post).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('2 caracteres')
  })
})
