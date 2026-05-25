# /build-backend

Scaffolda o projeto Laravel completo dentro da pasta `backend/`, com models, migrations, controllers e rotas para o ERP de estoque.

## Pré-requisitos

- Pasta `backend/` ainda não existe (ou está vazia)
- Composer disponível **ou** criação via template manual

## Passos

### 1. Criar projeto Laravel

```bash
composer create-project laravel/laravel:^13.0 backend --prefer-dist
```

Se composer não estiver disponível, criar a estrutura manualmente copiando os arquivos essenciais.

---

### 2. Migrations

#### `database/migrations/xxxx_create_produtos_table.php`

Campos:

- `id` (bigIncrements)
- `nome` (string, min:3)
- `preco_venda` (decimal 10,2)
- `custo_medio` (decimal 10,2, default 0)
- `estoque` (integer, default 0)
- `timestamps`

#### `database/migrations/xxxx_create_compras_table.php`

Campos:

- `id`
- `fornecedor` (string)
- `total` (decimal 10,2)
- `timestamps`

#### `database/migrations/xxxx_create_compra_produto_table.php` (pivot)

Campos:

- `compra_id` (foreignId → compras)
- `produto_id` (foreignId → produtos)
- `quantidade` (integer)
- `preco_unitario` (decimal 10,2)

#### `database/migrations/xxxx_create_vendas_table.php`

Campos:

- `id`
- `cliente` (string)
- `total` (decimal 10,2)
- `lucro` (decimal 10,2)
- `cancelada` (boolean, default false)
- `timestamps`

#### `database/migrations/xxxx_create_venda_produto_table.php` (pivot)

Campos:

- `venda_id` (foreignId → vendas)
- `produto_id` (foreignId → produtos)
- `quantidade` (integer)
- `preco_unitario` (decimal 10,2)
- `custo_medio_snapshot` (decimal 10,2) — custo médio no momento da venda

---

### 3. Models

#### `app/Models/Produto.php`

```php
protected $fillable = ['nome', 'preco_venda', 'custo_medio', 'estoque'];

public function compras(): BelongsToMany  // via compra_produto
public function vendas(): BelongsToMany   // via venda_produto
```

#### `app/Models/Compra.php`

```php
protected $fillable = ['fornecedor', 'total'];
public function produtos(): BelongsToMany  // com pivot: quantidade, preco_unitario
```

#### `app/Models/Venda.php`

```php
protected $fillable = ['cliente', 'total', 'lucro', 'cancelada'];
public function produtos(): BelongsToMany  // com pivot: quantidade, preco_unitario, custo_medio_snapshot
```

---

### 4. Controllers

#### `app/Http/Controllers/ProdutoController.php`

**`store` — POST /api/produtos**

- Validar: `nome` (required, min:3), `preco_venda` (required, numeric, min:0)
- Criar produto com `estoque = 0`, `custo_medio = 0`
- Retornar 201 com o produto criado

**`index` — GET /api/produtos**

- Retornar todos os produtos: id, nome, custo_medio, preco_venda, estoque

---

#### `app/Http/Controllers/CompraController.php`

**`store` — POST /api/compras**

- Validar: `fornecedor` (required), `produtos` (array, required), cada item tem `id`, `quantidade` (min:1), `preco_unitario` (min:0)
- Para cada produto:
  - Calcular novo custo médio: `(estoque_atual * custo_medio + quantidade * preco_unitario) / (estoque_atual + quantidade)`
  - Incrementar estoque
  - Salvar custo médio atualizado
- Criar registro de Compra com total calculado
- Associar produtos via pivot
- Retornar 201 com a compra e produtos

**`index` — GET /api/compras** *(diferencial)*

- Listar todas as compras com seus produtos

---

#### `app/Http/Controllers/VendaController.php`

**`store` — POST /api/vendas**

- Validar: `cliente` (required), `produtos` (array, required), cada item tem `id`, `quantidade` (min:1), `preco_unitario` (min:0)
- Para cada produto:
  - Verificar estoque suficiente → 422 com mensagem "Estoque insuficiente para o produto {nome}" se falhar
  - Calcular lucro do item: `(preco_unitario - custo_medio) * quantidade`
  - Decrementar estoque
  - Salvar `custo_medio_snapshot` no pivot
- Criar Venda com total e lucro totais
- Retornar 200 com `{ venda, total, lucro }`

**`destroy` — DELETE /api/vendas/{id}** *(cancelamento — opcional)*

- Setar `cancelada = true`
- Reverter estoque de cada item (somar de volta)
- Retornar 200

**`index` — GET /api/vendas** *(diferencial)*

- Listar todas as vendas com seus produtos

---

### 5. Rotas — `routes/api.php`

```php
Route::apiResource('produtos', ProdutoController::class)->only(['index', 'store']);
Route::apiResource('compras',  CompraController::class)->only(['index', 'store']);
Route::apiResource('vendas',   VendaController::class)->only(['index', 'store', 'destroy']);
```

---

### 6. CORS — `config/cors.php`

Garantir que `allowed_origins` aceite `http://localhost:5173` (ou `['*']` para desenvolvimento).

---

### 7. `.env` de exemplo (`backend/.env.example`)

```env
APP_NAME=ERPEstoque
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=erp_estoque
DB_USERNAME=erp
DB_PASSWORD=secret
```

---

## Verificação

Após scaffoldar, rode (dentro do container ou localmente):

```bash
php artisan migrate
php artisan route:list
```

Todos os endpoints devem aparecer em `/api/*`.
