# Especificação — Frontend Vue 3

## Estrutura de Diretórios

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── api.js                  # instância Axios centralizada
│   ├── main.js                 # bootstrap Vue + Router
│   ├── App.vue                 # layout raiz + navbar
│   ├── router/
│   │   └── index.js            # definição de rotas
│   └── views/
│       ├── ProdutosView.vue
│       ├── ComprasView.vue
│       └── VendasView.vue
├── .env
├── vite.config.js
├── package.json
└── Dockerfile
```

---

## Configuração Base

### `frontend/.env`

```env
VITE_API_URL=http://localhost:8000
```

### `frontend/src/api.js`

```js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api',
  headers: { 'Content-Type': 'application/json' }
})

export default api
```

### `frontend/src/router/index.js`

```js
import { createRouter, createWebHistory } from 'vue-router'
import ProdutosView from '../views/ProdutosView.vue'
import ComprasView  from '../views/ComprasView.vue'
import VendasView   from '../views/VendasView.vue'

const routes = [
  { path: '/',        name: 'produtos', component: ProdutosView },
  { path: '/compras', name: 'compras',  component: ComprasView  },
  { path: '/vendas',  name: 'vendas',   component: VendasView   },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
```

### `frontend/src/main.js`

```js
import { createApp } from 'vue'
import App    from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
```

### `frontend/vite.config.js`

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  }
})
```

---

## `App.vue` — Layout Raiz

**Responsabilidade:** barra de navegação + `<RouterView />`

**Template:**

```html
<template>
  <header>
    <nav>
      <RouterLink to="/">Produtos</RouterLink>
      <RouterLink to="/compras">Compras</RouterLink>
      <RouterLink to="/vendas">Vendas</RouterLink>
    </nav>
  </header>
  <main>
    <RouterView />
  </main>
</template>
```

**Estilo da nav:**
- Links horizontais com separador `|`
- Link ativo destacado (classe `router-link-active`)
- Fundo escuro/escuro-azulado, texto claro

---

## `ProdutosView.vue`

### Dados reativos

```js
const produtos = ref([])          // lista carregada da API
const form = reactive({
  nome: '',
  preco_venda: '',
})
const mensagem = ref(null)        // { tipo: 'sucesso'|'erro', texto: '' }
const carregando = ref(false)
```

### Ciclo de vida

```js
onMounted(() => carregarProdutos())
```

### Métodos

**`carregarProdutos()`**
- `GET /api/produtos`
- Atualiza `produtos.value`
- Em caso de erro: exibe mensagem de erro

**`cadastrarProduto()`**
- Valida campos no cliente: nome (min 3 chars), preco_venda (> 0)
- `POST /api/produtos` com `{ nome, preco_venda }`
- Sucesso (201): limpa form, exibe "Produto cadastrado com sucesso!", recarrega lista
- Erro (422): exibe mensagem da API (`error.response.data.message`)

### Template

```
┌─────────────────────────────────────┐
│  PRODUTOS                           │
│                                     │
│  [Mensagem de sucesso/erro]         │
│                                     │
│  ┌──────────────────────────────┐   │
│  │  Nome: [__________________]  │   │
│  │  Preço Venda: [___________]  │   │
│  │         [Cadastrar]          │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌────┬───────────┬────────┬──────┬────────┐
│  │ ID │ Nome      │ Custo  │Preço │Estoque │
│  ├────┼───────────┼────────┼──────┼────────┤
│  │  1 │ Produto A │ R$5,00 │R$10  │  100   │
│  └────┴───────────┴────────┴──────┴────────┘
```

### Colunas da tabela

| Coluna       | Formato                                 |
|--------------|-----------------------------------------|
| ID           | número inteiro                          |
| Nome         | texto                                   |
| Custo Médio  | `formatarMoeda(custo_medio)`            |
| Preço Venda  | `formatarMoeda(preco_venda)`            |
| Estoque      | número inteiro (sem decimais)           |

---

## `ComprasView.vue`

### Dados reativos

```js
const produtos = ref([])           // para popular dropdowns
const compras  = ref([])           // histórico
const form = reactive({
  fornecedor: '',
  itens: [                          // lista dinâmica de itens
    { produto_id: '', quantidade: 1, preco_unitario: '' }
  ]
})
const mensagem = ref(null)
const carregando = ref(false)
```

### Ciclo de vida

```js
onMounted(() => {
  carregarProdutos()
  carregarCompras()
})
```

### Métodos

**`adicionarItem()`**
- Adiciona `{ produto_id: '', quantidade: 1, preco_unitario: '' }` ao array `form.itens`

**`removerItem(index)`**
- Remove o item pelo índice (mínimo 1 item deve permanecer)

**`registrarCompra()`**
- Valida: fornecedor preenchido, todos os itens com produto selecionado, quantidade >= 1, preco >= 0
- Monta payload:
  ```js
  {
    fornecedor: form.fornecedor,
    produtos: form.itens.map(i => ({
      id: i.produto_id,
      quantidade: i.quantidade,
      preco_unitario: i.preco_unitario
    }))
  }
  ```
- `POST /api/compras`
- Sucesso (201): limpa form, exibe mensagem de sucesso, recarrega listas
- Erro (422): exibe mensagem da API

**`carregarCompras()`**
- `GET /api/compras`
- Atualiza `compras.value`

### Template

```
┌─────────────────────────────────────────────┐
│  REGISTRAR COMPRA                           │
│                                             │
│  Fornecedor: [_______________________]      │
│                                             │
│  Itens:                                     │
│  ┌──────────────────┬─────┬──────┬───────┐  │
│  │ Produto          │ Qtd │ R$/un│       │  │
│  ├──────────────────┼─────┼──────┼───────┤  │
│  │ [dropdown v]     │ [1] │[0.00]│ [✕]   │  │
│  └──────────────────┴─────┴──────┴───────┘  │
│  [+ Adicionar item]                         │
│                      [Registrar Compra]     │
│                                             │
├─────────────────────────────────────────────┤
│  HISTÓRICO DE COMPRAS                       │
│                                             │
│  ┌────┬────────────┬──────────┬──────────┐  │
│  │ ID │ Fornecedor │ Total    │ Data     │  │
│  ├────┼────────────┼──────────┼──────────┤  │
│  │  1 │ Forn. X    │ R$190,00 │ 01/01/26 │  │
│  └────┴────────────┴──────────┴──────────┘  │
└─────────────────────────────────────────────┘
```

---

## `VendasView.vue`

### Dados reativos

```js
const produtos = ref([])           // para dropdowns e cálculo de lucro
const vendas   = ref([])           // histórico
const form = reactive({
  cliente: '',
  itens: [
    { produto_id: '', quantidade: 1, preco_unitario: '' }
  ]
})
const mensagem = ref(null)
const carregando = ref(false)
```

### Computed — cálculo em tempo real

```js
const totalEstimado = computed(() => {
  return form.itens.reduce((acc, item) => {
    return acc + (parseFloat(item.preco_unitario) || 0) * (parseInt(item.quantidade) || 0)
  }, 0)
})

const lucroEstimado = computed(() => {
  return form.itens.reduce((acc, item) => {
    const produto = produtos.value.find(p => p.id == item.produto_id)
    if (!produto) return acc
    const custo = parseFloat(produto.custo_medio) || 0
    const preco = parseFloat(item.preco_unitario) || 0
    const qtd   = parseInt(item.quantidade) || 0
    return acc + (preco - custo) * qtd
  }, 0)
})
```

### Métodos

**`adicionarItem()`** — igual a ComprasView

**`removerItem(index)`** — igual a ComprasView

**`registrarVenda()`**
- Valida campos no cliente
- Monta payload igual ao de compras (mas com `cliente`)
- `POST /api/vendas`
- Sucesso (200): exibe `total` e `lucro` retornados pela API, recarrega histórico
- Erro (422): exibe mensagem da API (ex: "Estoque insuficiente para o produto X")

**`carregarVendas()`**
- `GET /api/vendas`
- Atualiza `vendas.value`

### Template

```
┌─────────────────────────────────────────────┐
│  REGISTRAR VENDA                            │
│                                             │
│  Cliente: [_________________________]       │
│                                             │
│  Itens:                                     │
│  ┌──────────────────┬─────┬──────┬───────┐  │
│  │ Produto          │ Qtd │ R$/un│       │  │
│  ├──────────────────┼─────┼──────┼───────┤  │
│  │ [dropdown v]     │ [1] │[0.00]│ [✕]   │  │
│  └──────────────────┴─────┴──────┴───────┘  │
│  [+ Adicionar item]                         │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ Total estimado:  R$ 200,00           │   │
│  │ Lucro estimado:  R$  50,00           │   │
│  └──────────────────────────────────────┘   │
│                        [Registrar Venda]    │
│                                             │
├─────────────────────────────────────────────┤
│  HISTÓRICO DE VENDAS                        │
│                                             │
│  ┌────┬──────────┬──────────┬────────┬────┐ │
│  │ ID │ Cliente  │ Total    │ Lucro  │Sta │ │
│  ├────┼──────────┼──────────┼────────┼────┤ │
│  │  1 │ Cliente Y│ R$200,00 │ R$50,00│ ✓  │ │
│  └────┴──────────┴──────────┴────────┴────┘ │
└─────────────────────────────────────────────┘
```

**Coluna "Sta" (status):** `✓ Ativa` ou `✗ Cancelada` baseado em `venda.cancelada`

---

## Utilitário — Formatação de Moeda

Definir como função reutilizável (pode ser em `src/utils/format.js` ou diretamente nas views):

```js
export function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor ?? 0)
}
```

Uso: `formatarMoeda(produto.preco_venda)` → `"R$ 10,00"`

---

## Tratamento de Erros no Frontend

Padrão para todas as views:

```js
async function chamarAPI() {
  carregando.value = true
  mensagem.value = null
  try {
    const { data } = await api.post('/rota', payload)
    mensagem.value = { tipo: 'sucesso', texto: 'Operação realizada!' }
    // atualizar estado local
  } catch (error) {
    const texto = error.response?.data?.message ?? 'Erro inesperado. Tente novamente.'
    mensagem.value = { tipo: 'erro', texto }
  } finally {
    carregando.value = false
  }
}
```

**Estados de mensagem:**
- `tipo: 'sucesso'` → caixa verde
- `tipo: 'erro'` → caixa vermelha

**Estado de carregando:**
- Botão de submit fica `disabled` e mostra "Aguarde..." enquanto `carregando = true`

---

## Validação no Frontend

Validar antes de chamar a API para evitar requisições desnecessárias:

| Campo           | Regra                            |
|-----------------|----------------------------------|
| nome (produto)  | obrigatório, min 3 chars         |
| preco_venda     | obrigatório, número, >= 0        |
| fornecedor      | obrigatório, min 2 chars         |
| cliente         | obrigatório, min 2 chars         |
| produto_id      | selecionado (não vazio)          |
| quantidade      | inteiro, >= 1                    |
| preco_unitario  | número, >= 0                     |

Exibir erros inline abaixo de cada campo inválido.
