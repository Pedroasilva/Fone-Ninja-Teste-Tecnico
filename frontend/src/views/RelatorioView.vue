<template>
  <div>
    <h1 style="font-size:1.5rem; font-weight:700; margin-bottom:24px;">Relatório</h1>

    <!-- Filtros -->
    <div class="card">
      <h2 class="card-titulo">Filtros</h2>
      <div class="filtros-grid">
        <div class="campo">
          <label>Produto</label>
          <select v-model="filtros.produto_id">
            <option value="">Todos os produtos</option>
            <option v-for="p in produtos" :key="p.id" :value="p.id">{{ p.nome }}</option>
          </select>
        </div>
        <div class="campo">
          <label>Cliente</label>
          <input v-model="filtros.cliente" type="text" placeholder="Nome do cliente" />
        </div>
        <div class="campo">
          <label>Fornecedor</label>
          <input v-model="filtros.fornecedor" type="text" placeholder="Nome do fornecedor" />
        </div>
        <div class="campo">
          <label>Data início</label>
          <input v-model="filtros.dataInicio" type="date" />
        </div>
        <div class="campo">
          <label>Data fim</label>
          <input v-model="filtros.dataFim" type="date" />
        </div>
        <div class="campo campo-limpar">
          <button class="btn-secundario" @click="limparFiltros">Limpar filtros</button>
        </div>
      </div>
    </div>

    <!-- Cards de resumo -->
    <div class="resumo-grid">
      <div class="resumo-card">
        <span class="resumo-card-label">Total em Compras</span>
        <span class="resumo-card-valor azul">{{ formatarMoeda(totalCompras) }}</span>
        <span class="resumo-card-sub">{{ comprasFiltradas.length }} compra{{ comprasFiltradas.length !== 1 ? 's' : '' }}</span>
      </div>
      <div class="resumo-card">
        <span class="resumo-card-label">Total em Vendas</span>
        <span class="resumo-card-valor verde">{{ formatarMoeda(totalVendas) }}</span>
        <span class="resumo-card-sub">{{ vendasFiltradas.length }} venda{{ vendasFiltradas.length !== 1 ? 's' : '' }}</span>
      </div>
      <div class="resumo-card">
        <span class="resumo-card-label">Lucro Total</span>
        <span :class="['resumo-card-valor', lucroTotal >= 0 ? 'verde' : 'vermelho']">{{ formatarMoeda(lucroTotal) }}</span>
        <span class="resumo-card-sub">vendas ativas</span>
      </div>
      <div class="resumo-card">
        <span class="resumo-card-label">Vendas Canceladas</span>
        <span class="resumo-card-valor vermelho">{{ vendasFiltradas.filter(v => v.cancelada).length }}</span>
        <span class="resumo-card-sub">{{ formatarMoeda(totalVendasCanceladas) }} revertidos</span>
      </div>
    </div>

    <!-- Tabela de Compras -->
    <div class="card">
      <h2 class="card-titulo">
        Compras
        <span class="badge-count">{{ comprasFiltradas.length }}</span>
      </h2>
      <div class="tabela-wrapper">
        <table>
          <thead>
            <tr>
              <th class="center">ID</th>
              <th>Fornecedor</th>
              <th>Itens</th>
              <th class="right">Total</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody v-if="carregando">
            <tr><td colspan="5" class="td-vazio">Carregando...</td></tr>
          </tbody>
          <tbody v-else-if="comprasFiltradas.length === 0">
            <tr><td colspan="5" class="td-vazio">Nenhuma compra encontrada.</td></tr>
          </tbody>
          <tbody v-else>
            <tr v-for="compra in comprasFiltradas" :key="compra.id">
              <td class="center">{{ compra.id }}</td>
              <td>{{ compra.fornecedor }}</td>
              <td>
                <ul class="lista-itens">
                  <li v-for="produto in compra.produtos" :key="produto.id">
                    {{ produto.nome }}
                    <span class="qtd">× {{ produto.pivot.quantidade }}</span>
                    <span class="preco">({{ formatarMoeda(produto.pivot.preco_unitario) }}/un)</span>
                  </li>
                </ul>
              </td>
              <td class="right">{{ formatarMoeda(compra.total) }}</td>
              <td>{{ formatarData(compra.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tabela de Vendas -->
    <div class="card">
      <h2 class="card-titulo">
        Vendas
        <span class="badge-count">{{ vendasFiltradas.length }}</span>
      </h2>
      <div class="tabela-wrapper">
        <table>
          <thead>
            <tr>
              <th class="center">ID</th>
              <th>Cliente</th>
              <th>Itens</th>
              <th class="right">Total</th>
              <th class="right">Lucro</th>
              <th class="center">Status</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody v-if="carregando">
            <tr><td colspan="7" class="td-vazio">Carregando...</td></tr>
          </tbody>
          <tbody v-else-if="vendasFiltradas.length === 0">
            <tr><td colspan="7" class="td-vazio">Nenhuma venda encontrada.</td></tr>
          </tbody>
          <tbody v-else>
            <tr v-for="venda in vendasFiltradas" :key="venda.id" :class="{ 'linha-cancelada': venda.cancelada }">
              <td class="center">{{ venda.id }}</td>
              <td>{{ venda.cliente }}</td>
              <td>
                <ul class="lista-itens">
                  <li v-for="produto in venda.produtos" :key="produto.id">
                    {{ produto.nome }}
                    <span class="qtd">× {{ produto.pivot.quantidade }}</span>
                    <span class="preco">({{ formatarMoeda(produto.pivot.preco_unitario) }}/un)</span>
                  </li>
                </ul>
              </td>
              <td class="right">{{ formatarMoeda(venda.total) }}</td>
              <td class="right" :style="{ color: venda.cancelada ? '#9CA3AF' : (parseFloat(venda.lucro) >= 0 ? '#15803D' : '#DC2626') }">
                {{ formatarMoeda(venda.lucro) }}
              </td>
              <td class="center">
                <span :class="venda.cancelada ? 'badge-cancelada' : 'badge-ativa'">
                  {{ venda.cancelada ? 'Cancelada' : 'Ativa' }}
                </span>
              </td>
              <td>
                <div style="font-size:0.8125rem; color:#374151;">
                  <span style="color:#6B7280; font-size:0.75rem;">Compra</span><br>
                  {{ formatarData(venda.created_at) }}
                </div>
                <div v-if="venda.cancelada_em" style="margin-top:6px; font-size:0.8125rem; color:#DC2626;">
                  <span style="color:#9CA3AF; font-size:0.75rem;">Cancelamento</span><br>
                  {{ formatarData(venda.cancelada_em) }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../api'
import { formatarMoeda } from '../utils/format'

const produtos = ref([])
const compras  = ref([])
const vendas   = ref([])
const carregando = ref(false)

const filtros = reactive({
  produto_id: '',
  cliente:    '',
  fornecedor: '',
  dataInicio: '',
  dataFim:    '',
})

onMounted(async () => {
  carregando.value = true
  try {
    const [rProdutos, rCompras, rVendas] = await Promise.all([
      api.get('/produtos'),
      api.get('/compras'),
      api.get('/vendas'),
    ])
    produtos.value = rProdutos.data
    compras.value  = rCompras.data
    vendas.value   = rVendas.data
  } finally {
    carregando.value = false
  }
})

function limparFiltros() {
  filtros.produto_id = ''
  filtros.cliente    = ''
  filtros.fornecedor = ''
  filtros.dataInicio = ''
  filtros.dataFim    = ''
}

function dentroDoPeriodo(dateStr) {
  if (!filtros.dataInicio && !filtros.dataFim) return true
  const data = new Date(dateStr)
  data.setHours(0, 0, 0, 0)
  if (filtros.dataInicio) {
    const inicio = new Date(filtros.dataInicio + 'T00:00:00')
    if (data < inicio) return false
  }
  if (filtros.dataFim) {
    const fim = new Date(filtros.dataFim + 'T23:59:59')
    if (data > fim) return false
  }
  return true
}

function temProduto(itens) {
  if (!filtros.produto_id) return true
  return itens.some(p => p.id == filtros.produto_id)
}

const comprasFiltradas = computed(() =>
  compras.value.filter(c => {
    if (filtros.fornecedor && !c.fornecedor.toLowerCase().includes(filtros.fornecedor.toLowerCase())) return false
    if (!temProduto(c.produtos)) return false
    if (!dentroDoPeriodo(c.created_at)) return false
    return true
  })
)

const vendasFiltradas = computed(() =>
  vendas.value.filter(v => {
    if (filtros.cliente && !v.cliente.toLowerCase().includes(filtros.cliente.toLowerCase())) return false
    if (!temProduto(v.produtos)) return false
    if (!dentroDoPeriodo(v.created_at)) return false
    return true
  })
)

const totalCompras = computed(() =>
  comprasFiltradas.value.reduce((acc, c) => acc + parseFloat(c.total), 0)
)

const vendasAtivas = computed(() => vendasFiltradas.value.filter(v => !v.cancelada))

const totalVendas = computed(() =>
  vendasAtivas.value.reduce((acc, v) => acc + parseFloat(v.total), 0)
)

const lucroTotal = computed(() =>
  vendasAtivas.value.reduce((acc, v) => acc + parseFloat(v.lucro), 0)
)

const totalVendasCanceladas = computed(() =>
  vendasFiltradas.value.filter(v => v.cancelada).reduce((acc, v) => acc + parseFloat(v.total), 0)
)

function formatarData(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
</script>

<style scoped>
.filtros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  align-items: end;
}

.campo-limpar {
  display: flex;
  align-items: flex-end;
}

.campo-limpar .btn-secundario {
  width: 100%;
}

.resumo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.resumo-card {
  background: #fff;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.resumo-card-label {
  font-size: 0.8125rem;
  color: #6B7280;
  font-weight: 500;
}

.resumo-card-valor {
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 1.2;
}

.resumo-card-sub {
  font-size: 0.75rem;
  color: #9CA3AF;
}

.azul   { color: #1D4ED8; }
.verde  { color: #15803D; }
.vermelho { color: #DC2626; }

.badge-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #E5E7EB;
  color: #374151;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 999px;
  padding: 1px 8px;
  margin-left: 8px;
  vertical-align: middle;
}

.lista-itens {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lista-itens li {
  font-size: 0.8125rem;
  color: #374151;
  white-space: nowrap;
}

.qtd   { color: #6B7280; }
.preco { color: #9CA3AF; margin-left: 4px; }

.td-vazio {
  text-align: center;
  padding: 24px;
  color: #9CA3AF;
}

.linha-cancelada td {
  opacity: 0.55;
}
</style>
