<template>
  <div>
    <h1 style="font-size:1.5rem; font-weight:700; margin-bottom:24px;">Produtos</h1>

    <div v-if="mensagem" :class="['alerta', mensagem.tipo === 'sucesso' ? 'alerta-sucesso' : 'alerta-erro']">
      {{ mensagem.texto }}
    </div>

    <div class="card">
      <h2 class="card-titulo">Cadastrar Produto</h2>

      <div class="campo">
        <label for="nome">Nome</label>
        <input
          id="nome"
          v-model="form.nome"
          type="text"
          placeholder="Nome do produto"
          :class="{ erro: erros.nome }"
          data-testid="input-nome"
        />
        <span v-if="erros.nome" class="erro-campo">{{ erros.nome }}</span>
      </div>

      <div class="campo">
        <label for="preco_venda">Preço de Venda (R$)</label>
        <input
          id="preco_venda"
          type="text"
          inputmode="numeric"
          :value="valorParaMascara(form.preco_venda)"
          @input="form.preco_venda = onMoedaInput($event)"
          placeholder="0,00"
          :class="{ erro: erros.preco_venda }"
          data-testid="input-preco"
        />
        <span v-if="erros.preco_venda" class="erro-campo">{{ erros.preco_venda }}</span>
      </div>

      <button
        class="btn-primario"
        :disabled="carregando"
        data-testid="btn-cadastrar"
        @click="cadastrarProduto"
      >
        {{ carregando ? 'Aguarde...' : 'Cadastrar' }}
      </button>
    </div>

    <div class="card">
      <h2 class="card-titulo">Lista de Produtos</h2>
      <div class="tabela-wrapper">
        <table>
          <thead>
            <tr>
              <th class="center">ID</th>
              <th>Nome</th>
              <th class="right">Custo Médio</th>
              <th class="right">Preço Venda</th>
              <th class="center">Estoque</th>
              <th>Cadastrado em</th>
            </tr>
          </thead>
          <tbody v-if="carregandoLista">
            <tr><td colspan="6" style="text-align:center; padding:24px; color:#9CA3AF;">Carregando...</td></tr>
          </tbody>
          <tbody v-else-if="produtos.length === 0">
            <tr><td colspan="6" style="text-align:center; padding:24px; color:#9CA3AF;">Nenhum produto cadastrado.</td></tr>
          </tbody>
          <tbody v-else>
            <tr v-for="produto in produtos" :key="produto.id">
              <td class="center">{{ produto.id }}</td>
              <td>{{ produto.nome }}</td>
              <td class="right">{{ formatarMoeda(produto.custo_medio) }}</td>
              <td class="right">{{ formatarMoeda(produto.preco_venda) }}</td>
              <td class="center">{{ produto.estoque }}</td>
              <td>{{ formatarData(produto.created_at) }}</td>
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
import { formatarMoeda, valorParaMascara, onMoedaInput } from '../utils/format'

const produtos        = ref([])
const carregando      = ref(false)
const carregandoLista = ref(false)
const mensagem        = ref(null)
const erros           = reactive({ nome: '', preco_venda: '' })
const form            = reactive({ nome: '', preco_venda: '' })

onMounted(() => carregarProdutos())

async function carregarProdutos() {
  carregandoLista.value = true
  try {
    const { data } = await api.get('/produtos')
    produtos.value = data
  } catch {
    mensagem.value = { tipo: 'erro', texto: 'Erro ao carregar produtos.' }
  } finally {
    carregandoLista.value = false
  }
}

function validar() {
  erros.nome        = ''
  erros.preco_venda = ''
  let valido        = true

  if (!form.nome || form.nome.trim().length < 3) {
    erros.nome = 'O nome deve ter pelo menos 3 caracteres.'
    valido = false
  }
  if (form.preco_venda === '' || form.preco_venda < 0) {
    erros.preco_venda = 'O preço de venda deve ser >= 0.'
    valido = false
  }

  return valido
}

function formatarData(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

async function cadastrarProduto() {
  if (!validar()) return

  carregando.value = true
  mensagem.value   = null

  try {
    await api.post('/produtos', {
      nome:        form.nome.trim(),
      preco_venda: parseFloat(form.preco_venda),
    })
    mensagem.value  = { tipo: 'sucesso', texto: 'Produto cadastrado com sucesso!' }
    form.nome        = ''
    form.preco_venda = ''
    await carregarProdutos()
    setTimeout(() => { mensagem.value = null }, 5000)
  } catch (error) {
    const errosApi = error.response?.data?.errors ?? {}
    if (errosApi.nome)        erros.nome        = errosApi.nome[0]
    if (errosApi.preco_venda) erros.preco_venda = errosApi.preco_venda[0]
    if (!Object.keys(errosApi).length) {
      mensagem.value = { tipo: 'erro', texto: error.response?.data?.message ?? 'Erro inesperado. Tente novamente.' }
    }
  } finally {
    carregando.value = false
  }
}
</script>
