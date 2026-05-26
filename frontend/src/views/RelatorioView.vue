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

    <!-- Botões de exportação -->
    <div class="exportar-acoes">
      <button class="btn-exportar btn-pdf" @click="exportarPDF">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        Exportar PDF
      </button>
      <button class="btn-exportar btn-excel" @click="exportarExcel">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>
        Exportar Excel
      </button>
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
              <td><ItemList :produtos="compra.produtos" /></td>
              <td class="right">{{ formatarMoeda(compra.total) }}</td>
              <td><DataCell :data="compra.created_at" /></td>
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
              <td><ItemList :produtos="venda.produtos" /></td>
              <td class="right">{{ formatarMoeda(venda.total) }}</td>
              <td class="right" :style="{ color: venda.cancelada ? '#9CA3AF' : (parseFloat(venda.lucro) >= 0 ? '#15803D' : '#DC2626') }">
                {{ formatarMoeda(venda.lucro) }}
              </td>
              <td class="center"><StatusBadge :cancelada="venda.cancelada" /></td>
              <td><DataCell :data="venda.created_at" label-compra="Compra" :data-cancelamento="venda.cancelada_em" /></td>
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
import ItemList   from '../components/ItemList.vue'
import StatusBadge from '../components/StatusBadge.vue'
import DataCell   from '../components/DataCell.vue'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

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

function formatarDataExport(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function itensTexto(produtos) {
  return produtos.map(p => `${p.nome} × ${p.pivot.quantidade}`).join(', ')
}

function exportarPDF() {
  const doc = new jsPDF({ orientation: 'landscape' })
  const titulo = 'Relatório de Estoque'
  const geradoEm = `Gerado em: ${new Date().toLocaleString('pt-BR')}`

  doc.setFontSize(16)
  doc.text(titulo, 14, 16)
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(geradoEm, 14, 23)

  // resumo
  const resumo = [
    ['Total em Compras', formatarMoeda(totalCompras.value), `${comprasFiltradas.value.length} compra(s)`],
    ['Total em Vendas', formatarMoeda(totalVendas.value), `${vendasAtivas.value.length} venda(s) ativas`],
    ['Lucro Total', formatarMoeda(lucroTotal.value), ''],
    ['Vendas Canceladas', String(vendasFiltradas.value.filter(v => v.cancelada).length), formatarMoeda(totalVendasCanceladas.value) + ' revertidos'],
  ]
  autoTable(doc, {
    startY: 28,
    head: [['Indicador', 'Valor', 'Detalhe']],
    body: resumo,
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175] },
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  })

  // compras
  const comprasY = doc.lastAutoTable.finalY + 10
  doc.setFontSize(11)
  doc.setTextColor(0)
  doc.text(`Compras (${comprasFiltradas.value.length})`, 14, comprasY)
  autoTable(doc, {
    startY: comprasY + 4,
    head: [['ID', 'Fornecedor', 'Itens', 'Total', 'Data']],
    body: comprasFiltradas.value.map(c => [
      String(c.id),
      c.fornecedor,
      itensTexto(c.produtos),
      formatarMoeda(c.total),
      formatarDataExport(c.created_at),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [30, 64, 175] },
    styles: { fontSize: 8 },
    columnStyles: { 2: { cellWidth: 80 } },
    margin: { left: 14, right: 14 },
  })

  // vendas
  const vendasY = doc.lastAutoTable.finalY + 10
  doc.setFontSize(11)
  doc.text(`Vendas (${vendasFiltradas.value.length})`, 14, vendasY)
  autoTable(doc, {
    startY: vendasY + 4,
    head: [['ID', 'Cliente', 'Itens', 'Total', 'Lucro', 'Status', 'Data']],
    body: vendasFiltradas.value.map(v => [
      String(v.id),
      v.cliente,
      itensTexto(v.produtos),
      formatarMoeda(v.total),
      formatarMoeda(v.lucro),
      v.cancelada ? 'Cancelada' : 'Ativa',
      formatarDataExport(v.created_at),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [30, 64, 175] },
    styles: { fontSize: 8 },
    columnStyles: { 2: { cellWidth: 80 } },
    margin: { left: 14, right: 14 },
  })

  doc.save('relatorio.pdf')
}

function exportarExcel() {
  const wb = XLSX.utils.book_new()

  // aba resumo
  const resumoData = [
    ['Indicador', 'Valor', 'Detalhe'],
    ['Total em Compras', totalCompras.value, `${comprasFiltradas.value.length} compra(s)`],
    ['Total em Vendas', totalVendas.value, `${vendasAtivas.value.length} venda(s) ativas`],
    ['Lucro Total', lucroTotal.value, ''],
    ['Vendas Canceladas', vendasFiltradas.value.filter(v => v.cancelada).length, `${totalVendasCanceladas.value} revertidos`],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumoData), 'Resumo')

  // aba compras
  const comprasData = [
    ['ID', 'Fornecedor', 'Itens', 'Total', 'Data'],
    ...comprasFiltradas.value.map(c => [
      c.id,
      c.fornecedor,
      itensTexto(c.produtos),
      parseFloat(c.total),
      formatarDataExport(c.created_at),
    ]),
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(comprasData), 'Compras')

  // aba vendas
  const vendasData = [
    ['ID', 'Cliente', 'Itens', 'Total', 'Lucro', 'Status', 'Data', 'Data Cancelamento'],
    ...vendasFiltradas.value.map(v => [
      v.id,
      v.cliente,
      itensTexto(v.produtos),
      parseFloat(v.total),
      parseFloat(v.lucro),
      v.cancelada ? 'Cancelada' : 'Ativa',
      formatarDataExport(v.created_at),
      v.cancelada_em ? formatarDataExport(v.cancelada_em) : '',
    ]),
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(vendasData), 'Vendas')

  XLSX.writeFile(wb, 'relatorio.xlsx')
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

.td-vazio {
  text-align: center;
  padding: 24px;
  color: #9CA3AF;
}

.linha-cancelada td {
  opacity: 0.55;
}

.exportar-acoes {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-bottom: 24px;
}

.btn-exportar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-exportar:hover {
  opacity: 0.85;
}

.btn-pdf {
  background: #DC2626;
  color: #fff;
}

.btn-excel {
  background: #15803D;
  color: #fff;
}
</style>
