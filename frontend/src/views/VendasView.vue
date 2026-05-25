<template>
  <div>
    <h1 style="font-size:1.5rem; font-weight:700; margin-bottom:24px;">Vendas</h1>

    <div v-if="mensagem" :class="['alerta', mensagem.tipo === 'sucesso' ? 'alerta-sucesso' : 'alerta-erro']">
      {{ mensagem.texto }}
    </div>

    <div class="card">
      <h2 class="card-titulo">Registrar Venda</h2>

      <div class="campo">
        <label for="cliente">Cliente</label>
        <input
          id="cliente"
          v-model="form.cliente"
          type="text"
          placeholder="Nome do cliente"
          :class="{ erro: erros.cliente }"
          data-testid="input-cliente"
        />
        <span v-if="erros.cliente" class="erro-campo">{{ erros.cliente }}</span>
      </div>

      <label style="font-size:0.875rem; font-weight:500; color:#374151; margin-bottom:8px; display:block;">Itens</label>

      <div
        v-for="(item, index) in form.itens"
        :key="index"
        class="linha-item"
        data-testid="linha-item"
      >
        <div>
          <select
            v-model="item.produto_id"
            :class="{ erro: erros.itens[index]?.produto_id }"
            data-testid="select-produto"
          >
            <option value="">Selecione um produto</option>
            <option v-for="p in produtos" :key="p.id" :value="p.id">
              {{ p.nome }} (estoque: {{ p.estoque }})
            </option>
          </select>
          <span v-if="erros.itens[index]?.produto_id" class="erro-campo">{{ erros.itens[index].produto_id }}</span>
        </div>

        <div>
          <input
            v-model.number="item.quantidade"
            type="number"
            min="1"
            placeholder="Qtd"
            :class="{ erro: erros.itens[index]?.quantidade }"
            data-testid="input-quantidade"
          />
          <span v-if="erros.itens[index]?.quantidade" class="erro-campo">{{ erros.itens[index].quantidade }}</span>
        </div>

        <div>
          <input
            v-model.number="item.preco_unitario"
            type="number"
            min="0"
            step="0.01"
            placeholder="R$/un"
            :class="{ erro: erros.itens[index]?.preco_unitario }"
            data-testid="input-preco-venda"
          />
          <span v-if="erros.itens[index]?.preco_unitario" class="erro-campo">{{ erros.itens[index].preco_unitario }}</span>
        </div>

        <button
          class="btn-perigo"
          data-testid="btn-remover-item"
          @click="removerItem(index)"
          title="Remover item"
        >✕</button>
      </div>

      <button
        class="btn-secundario"
        style="margin-top:8px;"
        data-testid="btn-adicionar-item"
        @click="adicionarItem"
      >+ Adicionar item</button>

      <div class="resumo-venda">
        <div class="resumo-item">
          <span class="resumo-label">Total estimado</span>
          <span class="resumo-valor">{{ formatarMoeda(totalEstimado) }}</span>
        </div>
        <div class="resumo-item">
          <span class="resumo-label">Lucro estimado</span>
          <span :class="['resumo-valor', lucroEstimado >= 0 ? 'lucro-positivo' : 'lucro-negativo']">
            {{ formatarMoeda(lucroEstimado) }}
          </span>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; margin-top:8px;">
        <button
          class="btn-primario"
          :disabled="carregando"
          data-testid="btn-registrar"
          @click="registrarVenda"
        >
          {{ carregando ? 'Aguarde...' : 'Registrar Venda' }}
        </button>
      </div>
    </div>

    <div class="card">
      <h2 class="card-titulo">Histórico de Vendas</h2>
      <div class="tabela-wrapper">
        <table>
          <thead>
            <tr>
              <th class="center">ID</th>
              <th>Cliente</th>
              <th class="right">Total</th>
              <th class="right">Lucro</th>
              <th class="center">Status</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody v-if="carregandoLista">
            <tr><td colspan="6" style="text-align:center; padding:24px; color:#9CA3AF;">Carregando...</td></tr>
          </tbody>
          <tbody v-else-if="vendas.length === 0">
            <tr><td colspan="6" style="text-align:center; padding:24px; color:#9CA3AF;">Nenhuma venda registrada.</td></tr>
          </tbody>
          <tbody v-else>
            <tr v-for="venda in vendas" :key="venda.id">
              <td class="center">{{ venda.id }}</td>
              <td>{{ venda.cliente }}</td>
              <td class="right">{{ formatarMoeda(venda.total) }}</td>
              <td class="right" :style="{ color: parseFloat(venda.lucro) >= 0 ? '#15803D' : '#DC2626' }">
                {{ formatarMoeda(venda.lucro) }}
              </td>
              <td class="center">
                <span :class="venda.cancelada ? 'badge-cancelada' : 'badge-ativa'">
                  {{ venda.cancelada ? 'Cancelada' : 'Ativa' }}
                </span>
              </td>
              <td>{{ formatarData(venda.created_at) }}</td>
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

const produtos        = ref([])
const vendas          = ref([])
const carregando      = ref(false)
const carregandoLista = ref(false)
const mensagem        = ref(null)

const novoItem = () => ({ produto_id: '', quantidade: 1, preco_unitario: '' })

const form  = reactive({ cliente: '', itens: [novoItem()] })
const erros = reactive({ cliente: '', itens: [] })

const totalEstimado = computed(() =>
  form.itens.reduce((acc, item) =>
    acc + (parseFloat(item.preco_unitario) || 0) * (parseInt(item.quantidade) || 0), 0)
)

const lucroEstimado = computed(() =>
  form.itens.reduce((acc, item) => {
    const produto = produtos.value.find(p => p.id == item.produto_id)
    if (!produto) return acc
    const custo = parseFloat(produto.custo_medio) || 0
    const preco = parseFloat(item.preco_unitario) || 0
    const qtd   = parseInt(item.quantidade) || 0
    return acc + (preco - custo) * qtd
  }, 0)
)

onMounted(() => {
  carregarProdutos()
  carregarVendas()
})

async function carregarProdutos() {
  try {
    const { data } = await api.get('/produtos')
    produtos.value = data
  } catch {
    /* silencioso */
  }
}

async function carregarVendas() {
  carregandoLista.value = true
  try {
    const { data } = await api.get('/vendas')
    vendas.value = data
  } catch {
    /* silencioso */
  } finally {
    carregandoLista.value = false
  }
}

function adicionarItem() {
  form.itens.push(novoItem())
}

function removerItem(index) {
  if (form.itens.length === 1) return
  form.itens.splice(index, 1)
}

function validar() {
  erros.cliente = ''
  erros.itens   = form.itens.map(() => ({}))
  let valido    = true

  if (!form.cliente || form.cliente.trim().length < 2) {
    erros.cliente = 'Cliente deve ter pelo menos 2 caracteres.'
    valido = false
  }

  form.itens.forEach((item, i) => {
    if (!item.produto_id) {
      erros.itens[i].produto_id = 'Selecione um produto.'
      valido = false
    }
    if (!item.quantidade || item.quantidade < 1) {
      erros.itens[i].quantidade = 'Quantidade mínima: 1.'
      valido = false
    }
    if (item.preco_unitario === '' || item.preco_unitario < 0) {
      erros.itens[i].preco_unitario = 'Preço deve ser >= 0.'
      valido = false
    }
  })

  return valido
}

async function registrarVenda() {
  if (!validar()) return

  carregando.value = true
  mensagem.value   = null

  try {
    const { data } = await api.post('/vendas', {
      cliente:  form.cliente.trim(),
      produtos: form.itens.map(i => ({
        id:             i.produto_id,
        quantidade:     i.quantidade,
        preco_unitario: i.preco_unitario,
      })),
    })
    mensagem.value = {
      tipo:  'sucesso',
      texto: `Venda registrada! Total: ${formatarMoeda(data.total)} | Lucro: ${formatarMoeda(data.lucro)}`,
    }
    form.cliente = ''
    form.itens   = [novoItem()]
    await Promise.all([carregarProdutos(), carregarVendas()])
    setTimeout(() => { mensagem.value = null }, 5000)
  } catch (error) {
    const texto = error.response?.data?.message ?? 'Erro inesperado. Tente novamente.'
    mensagem.value = { tipo: 'erro', texto }
  } finally {
    carregando.value = false
  }
}

function formatarData(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}
</script>
