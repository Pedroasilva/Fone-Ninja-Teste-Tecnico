# /build-frontend

Scaffolda o projeto Vue 3 completo dentro da pasta `frontend/`, com telas para produtos, compras e vendas do ERP de estoque.

## Pré-requisitos

- Pasta `frontend/` ainda não existe (ou está vazia)
- Node 22 LTS disponível

## Passos

### 1. Criar projeto Vue com Vite

```bash
npm create vite@latest frontend -- --template vue
cd frontend
npm install
npm install axios@^1.16.1 vue-router@^5.0.7
```

Versões exatas utilizadas:

- `vue`: 3.5.34
- `vite`: 8.0.14
- `@vitejs/plugin-vue`: 6.0.7
- `vue-router`: 5.0.7
- `axios`: 1.16.1

---

### 2. Configuração

#### `frontend/.env`

```env
VITE_API_URL=http://localhost:8000
```

#### `frontend/src/api.js`

Instância Axios com `baseURL` vinda de `import.meta.env.VITE_API_URL`.

```js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api',
  headers: { 'Content-Type': 'application/json' }
})

export default api
```

#### `frontend/src/router/index.js`

Rotas:

- `/`        → `ProdutosView`
- `/compras` → `ComprasView`
- `/vendas`  → `VendasView`

---

### 3. Telas (Views)

#### `frontend/src/views/ProdutosView.vue`

Funcionalidades:

- Formulário para cadastrar produto: campos `nome` (text, required) e `preco_venda` (number, required)
- Botão "Cadastrar" → `POST /api/produtos`
- Tabela listando todos os produtos: id, nome, custo_medio (R$), preco_venda (R$), estoque
- Ao montar a view, busca lista via `GET /api/produtos`
- Exibe mensagem de sucesso ao cadastrar ou mensagem de erro da API

#### `frontend/src/views/ComprasView.vue`

Funcionalidades:

- Campo `fornecedor` (text, required)
- Lista dinâmica de itens: selecionar produto (dropdown com produtos da API), quantidade (number), preco_unitario (number)
- Botão "Adicionar item" para incluir mais linhas
- Botão "Registrar Compra" → `POST /api/compras`
- Exibe mensagem de sucesso (estoque e custo médio atualizados) ou erro
- *(Diferencial)* Tabela com histórico de compras via `GET /api/compras`

#### `frontend/src/views/VendasView.vue`

Funcionalidades:

- Campo `cliente` (text, required)
- Lista dinâmica de itens: selecionar produto (dropdown), quantidade (number), preco_unitario (number)
- Botão "Adicionar item"
- Cálculo em tempo real: total da venda e lucro estimado exibidos antes de salvar
  - Lucro estimado: `(preco_unitario - produto.custo_medio) * quantidade` por item
- Botão "Registrar Venda" → `POST /api/vendas`
- Exibe retorno da API: total confirmado e lucro real calculado
- Exibe mensagem de erro clara (ex: "Estoque insuficiente para Produto X")
- *(Diferencial)* Tabela com histórico de vendas via `GET /api/vendas`

---

### 4. Layout e Navegação

#### `frontend/src/App.vue`

- Barra de navegação com links para: Produtos | Compras | Vendas
- `<RouterView />` para renderizar as telas
- Estilização simples (pode usar CSS puro ou Tailwind)

---

### 5. Formatação de valores

Usar `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` para exibir valores monetários.

---

### 6. `vite.config.js`

Garantir que o servidor dev suba na porta 5173 e aceite conexões externas (necessário para Docker):

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
```

---

## Verificação

Após scaffoldar:

```bash
cd frontend
npm run dev
```

Acesse `http://localhost:5173` e confira as três rotas. As chamadas de API devem chegar em `http://localhost:8000/api/*`.
