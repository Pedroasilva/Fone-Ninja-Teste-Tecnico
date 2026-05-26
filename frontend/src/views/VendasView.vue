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
            type="text"
            inputmode="numeric"
            :value="valorParaMascara(item.preco_unitario)"
            @input="item.preco_unitario = onMoedaInput($event)"
            placeholder="0,00"
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
              <th>Itens</th>
              <th class="right">Total</th>
              <th class="right">Lucro</th>
              <th class="center">Status</th>
              <th>Data</th>
              <th></th>
            </tr>
          </thead>
          <tbody v-if="carregandoLista">
            <tr><td colspan="8" style="text-align:center; padding:24px; color:#9CA3AF;">Carregando...</td></tr>
          </tbody>
          <tbody v-else-if="vendas.length === 0">
            <tr><td colspan="8" style="text-align:center; padding:24px; color:#9CA3AF;">Nenhuma venda registrada.</td></tr>
          </tbody>
          <tbody v-else>
            <tr v-for="venda in vendas" :key="venda.id">
              <td class="center">{{ venda.id }}</td>
              <td>{{ venda.cliente }}</td>
              <td>
                <ul style="margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:2px;">
                  <li
                    v-for="produto in venda.produtos"
                    :key="produto.id"
                    style="font-size:0.8125rem; color:#374151; white-space:nowrap;"
                  >
                    {{ produto.nome }}
                    <span style="color:#6B7280;">× {{ produto.pivot.quantidade }}</span>
                    <span style="color:#9CA3AF; margin-left:4px;">({{ formatarMoeda(produto.pivot.preco_unitario) }}/un)</span>
                  </li>
                </ul>
              </td>
              <td class="right">{{ formatarMoeda(venda.total) }}</td>
              <td class="right" :style="{ color: parseFloat(venda.lucro) >= 0 ? '#15803D' : '#DC2626' }">
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
              <td class="center">
                <button
                  v-if="!venda.cancelada"
                  class="btn-perigo"
                  :disabled="cancelando === venda.id"
                  style="font-size:0.75rem; padding:4px 10px;"
                  @click="cancelarVenda(venda.id)"
                >
                  {{ cancelando === venda.id ? '...' : 'Cancelar' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Transition name="modal">
      <div v-if="modalVendaId !== null" class="modal-overlay" @click.self="modalVendaId = null">
        <div class="modal">
          <h3 class="modal-titulo">Cancelar venda</h3>
          <p class="modal-texto">Tem certeza que deseja cancelar a venda <strong>#{{ modalVendaId }}</strong>? O estoque dos itens será revertido.</p>
          <div class="modal-acoes">
            <button class="btn-secundario" @click="modalVendaId = null">Voltar</button>
            <button class="btn-perigo" :disabled="cancelando !== null" @click="confirmarCancelamento">
              {{ cancelando !== null ? 'Cancelando...' : 'Confirmar cancelamento' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../api'
import { formatarMoeda, valorParaMascara, onMoedaInput } from '../utils/format'

const produtos        = ref([])
const vendas          = ref([])
const carregando      = ref(false)
const carregandoLista = ref(false)
const cancelando      = ref(null)
const modalVendaId    = ref(null)
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

function cancelarVenda(id) {
  modalVendaId.value = id
}

async function confirmarCancelamento() {
  cancelando.value = modalVendaId.value
  mensagem.value   = null

  try {
    await api.delete(`/vendas/${modalVendaId.value}`)
    modalVendaId.value = null
    mensagem.value = { tipo: 'sucesso', texto: 'Venda cancelada. Estoque revertido.' }
    await Promise.all([carregarProdutos(), carregarVendas()])
    setTimeout(() => { mensagem.value = null }, 5000)
  } catch (error) {
    modalVendaId.value = null
    mensagem.value = { tipo: 'erro', texto: error.response?.data?.message ?? 'Erro ao cancelar a venda.' }
  } finally {
    cancelando.value = null
  }
}

function formatarData(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: #fff;
  border-radius: 8px;
  padding: 28px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-titulo {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 12px;
}

.modal-texto {
  font-size: 0.9375rem;
  color: #4B5563;
  margin: 0 0 24px;
  line-height: 1.5;
}

.modal-acoes {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}
.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.15s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.95);
}
</style>
