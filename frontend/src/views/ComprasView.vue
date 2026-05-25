<template>
  <div>
    <h1 style="font-size:1.5rem; font-weight:700; margin-bottom:24px;">Compras</h1>

    <div v-if="mensagem" :class="['alerta', mensagem.tipo === 'sucesso' ? 'alerta-sucesso' : 'alerta-erro']">
      {{ mensagem.texto }}
    </div>

    <div class="card">
      <h2 class="card-titulo">Registrar Compra</h2>

      <div class="campo">
        <label for="fornecedor">Fornecedor</label>
        <input
          id="fornecedor"
          v-model="form.fornecedor"
          type="text"
          placeholder="Nome do fornecedor"
          :class="{ erro: erros.fornecedor }"
          data-testid="input-fornecedor"
        />
        <span v-if="erros.fornecedor" class="erro-campo">{{ erros.fornecedor }}</span>
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
            <option v-for="p in produtos" :key="p.id" :value="p.id">{{ p.nome }}</option>
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

      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
        <button
          class="btn-secundario"
          data-testid="btn-adicionar-item"
          @click="adicionarItem"
        >+ Adicionar item</button>

        <button
          class="btn-primario"
          :disabled="carregando"
          data-testid="btn-registrar"
          @click="registrarCompra"
        >
          {{ carregando ? 'Aguarde...' : 'Registrar Compra' }}
        </button>
      </div>
    </div>

    <div class="card">
      <h2 class="card-titulo">Histórico de Compras</h2>
      <div class="tabela-wrapper">
        <table>
          <thead>
            <tr>
              <th class="center">ID</th>
              <th>Fornecedor</th>
              <th class="right">Total</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody v-if="carregandoLista">
            <tr><td colspan="4" style="text-align:center; padding:24px; color:#9CA3AF;">Carregando...</td></tr>
          </tbody>
          <tbody v-else-if="compras.length === 0">
            <tr><td colspan="4" style="text-align:center; padding:24px; color:#9CA3AF;">Nenhuma compra registrada.</td></tr>
          </tbody>
          <tbody v-else>
            <tr v-for="compra in compras" :key="compra.id">
              <td class="center">{{ compra.id }}</td>
              <td>{{ compra.fornecedor }}</td>
              <td class="right">{{ formatarMoeda(compra.total) }}</td>
              <td>{{ formatarData(compra.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../api'
import { formatarMoeda } from '../utils/format'

const produtos        = ref([])
const compras         = ref([])
const carregando      = ref(false)
const carregandoLista = ref(false)
const mensagem        = ref(null)

const novoItem = () => ({ produto_id: '', quantidade: 1, preco_unitario: '' })

const form  = reactive({ fornecedor: '', itens: [novoItem()] })
const erros = reactive({ fornecedor: '', itens: [] })

onMounted(() => {
  carregarProdutos()
  carregarCompras()
})

async function carregarProdutos() {
  try {
    const { data } = await api.get('/produtos')
    produtos.value = data
  } catch {
    /* silencioso */
  }
}

async function carregarCompras() {
  carregandoLista.value = true
  try {
    const { data } = await api.get('/compras')
    compras.value = data
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
  erros.fornecedor = ''
  erros.itens      = form.itens.map(() => ({}))
  let valido       = true

  if (!form.fornecedor || form.fornecedor.trim().length < 2) {
    erros.fornecedor = 'Fornecedor deve ter pelo menos 2 caracteres.'
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

async function registrarCompra() {
  if (!validar()) return

  carregando.value = true
  mensagem.value   = null

  try {
    await api.post('/compras', {
      fornecedor: form.fornecedor.trim(),
      produtos:   form.itens.map(i => ({
        id:             i.produto_id,
        quantidade:     i.quantidade,
        preco_unitario: i.preco_unitario,
      })),
    })
    mensagem.value  = { tipo: 'sucesso', texto: 'Compra registrada com sucesso!' }
    form.fornecedor = ''
    form.itens      = [novoItem()]
    await Promise.all([carregarProdutos(), carregarCompras()])
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
