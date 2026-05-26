import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import RelatorioView from '../../views/RelatorioView.vue'
import api from '../../api'

const produtosFake = [
  { id: 1, nome: 'Produto A' },
  { id: 2, nome: 'Produto B' },
]

const comprasFake = [
  {
    id: 1,
    fornecedor: 'Fornecedor X',
    total: '100.00',
    created_at: '2024-03-01T10:00:00.000000Z',
    produtos: [{ id: 1, nome: 'Produto A', pivot: { quantidade: 2, preco_unitario: '50.00' } }],
  },
  {
    id: 2,
    fornecedor: 'Fornecedor Y',
    total: '60.00',
    created_at: '2024-03-15T10:00:00.000000Z',
    produtos: [{ id: 2, nome: 'Produto B', pivot: { quantidade: 3, preco_unitario: '20.00' } }],
  },
]

const vendasFake = [
  {
    id: 1,
    cliente: 'Cliente A',
    total: '200.00',
    lucro: '80.00',
    cancelada: false,
    cancelada_em: null,
    created_at: '2024-03-05T10:00:00.000000Z',
    produtos: [{ id: 1, nome: 'Produto A', pivot: { quantidade: 2, preco_unitario: '100.00' } }],
  },
  {
    id: 2,
    cliente: 'Cliente B',
    total: '90.00',
    lucro: '30.00',
    cancelada: true,
    cancelada_em: '2024-03-10T12:00:00.000000Z',
    created_at: '2024-03-08T10:00:00.000000Z',
    produtos: [{ id: 2, nome: 'Produto B', pivot: { quantidade: 3, preco_unitario: '30.00' } }],
  },
]

describe('RelatorioView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get
      .mockResolvedValueOnce({ data: produtosFake })
      .mockResolvedValueOnce({ data: comprasFake })
      .mockResolvedValueOnce({ data: vendasFake })
  })

  it('exibe todos os dados ao carregar sem filtros', async () => {
    const wrapper = mount(RelatorioView)
    await flushPromises()

    expect(wrapper.text()).toContain('Fornecedor X')
    expect(wrapper.text()).toContain('Fornecedor Y')
    expect(wrapper.text()).toContain('Cliente A')
    expect(wrapper.text()).toContain('Cliente B')
  })

  it('filtra compras por nome do fornecedor', async () => {
    const wrapper = mount(RelatorioView)
    await flushPromises()

    await wrapper.find('input[placeholder="Nome do fornecedor"]').setValue('Fornecedor X')
    await flushPromises()

    expect(wrapper.text()).toContain('Fornecedor X')
    expect(wrapper.text()).not.toContain('Fornecedor Y')
  })

  it('filtra vendas por nome do cliente', async () => {
    const wrapper = mount(RelatorioView)
    await flushPromises()

    await wrapper.find('input[placeholder="Nome do cliente"]').setValue('Cliente A')
    await flushPromises()

    expect(wrapper.text()).toContain('Cliente A')
    expect(wrapper.text()).not.toContain('Cliente B')
  })

  it('calcula total de compras filtradas', async () => {
    const wrapper = mount(RelatorioView)
    await flushPromises()

    await wrapper.find('input[placeholder="Nome do fornecedor"]').setValue('Fornecedor X')
    await flushPromises()

    expect(wrapper.text()).toContain('100,00')
  })

  it('calcula total de vendas ativas (exclui canceladas)', async () => {
    const wrapper = mount(RelatorioView)
    await flushPromises()

    expect(wrapper.text()).toContain('Total em Vendas')
    expect(wrapper.text()).toContain('200,00')
  })

  it('exibe contagem de vendas canceladas', async () => {
    const wrapper = mount(RelatorioView)
    await flushPromises()

    expect(wrapper.text()).toContain('Vendas Canceladas')
    expect(wrapper.text()).toContain('1')
  })

  it('filtra por produto', async () => {
    const wrapper = mount(RelatorioView)
    await flushPromises()

    const select = wrapper.find('select')
    await select.setValue('1')
    await flushPromises()

    expect(wrapper.text()).toContain('Fornecedor X')
    expect(wrapper.text()).not.toContain('Fornecedor Y')
  })

  it('limpar filtros restaura todos os resultados', async () => {
    const wrapper = mount(RelatorioView)
    await flushPromises()

    await wrapper.find('input[placeholder="Nome do fornecedor"]').setValue('Fornecedor X')
    await flushPromises()

    await wrapper.find('button.btn-secundario').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Fornecedor X')
    expect(wrapper.text()).toContain('Fornecedor Y')
  })

  it('exibe botões de exportação PDF e Excel', async () => {
    const wrapper = mount(RelatorioView)
    await flushPromises()

    expect(wrapper.text()).toContain('Exportar PDF')
    expect(wrapper.text()).toContain('Exportar Excel')
  })
})
