# Especificação — Backend Laravel

## Arquitetura: Controller → Service → Repository

```text
HTTP Request
    │
    ▼
Controller          ← HTTP: recebe, delega, responde
    │ (depende de ServiceInterface)
    ▼
Service             ← negócio: validações, transações, orquestração
    │ (depende de RepositoryInterface)
    ▼
Repository          ← dados: CRUD via Eloquent
    │
    ▼
Model / DB
```

---

## SOLID — Aplicação por Princípio

### S — Single Responsibility

Cada classe tem exatamente um motivo para mudar:

| Classe                 | Única responsabilidade                                     |
|------------------------|------------------------------------------------------------|
| `ProdutoController`    | Traduzir HTTP ↔ Service                                    |
| `StoreProdutoRequest`  | Validar dados de entrada                                   |
| `ProdutoService`       | Orquestrar regras de negócio de produtos                   |
| `CompraService`        | Orquestrar registro de compras e atualização de estoque    |
| `CustoMedioCalculator` | Calcular custo médio ponderado (isolado e testável)        |
| `ProdutoRepository`    | Persistir e recuperar produtos via Eloquent                |

A fórmula de custo médio é extraída para `CustoMedioCalculator` porque é uma regra independente que pode mudar (ex: FIFO no futuro) sem tocar no `CompraService`.

### O — Open/Closed

O sistema é aberto para extensão e fechado para modificação:

- Para adicionar uma nova estratégia de custo (ex: FIFO), cria-se `FifoCustoCalculator` implementando `CustoCalculatorInterface` — o `CompraService` não precisa mudar.
- Para trocar o banco de dados, cria-se `DynamodbProdutoRepository` implementando `ProdutoRepositoryInterface` — o `ProdutoService` não precisa mudar.

### L — Liskov Substitution

Qualquer implementação de `ProdutoRepositoryInterface` pode substituir outra sem quebrar os Services. Os contratos definem o que fazer, não como. Isso é validado nos testes unitários que usam mocks dos repositórios.

### I — Interface Segregation

Interfaces são coesas e não obrigam implementações a assinar métodos desnecessários:

- `ProdutoRepositoryInterface` — só métodos de produto
- `CompraRepositoryInterface` — só métodos de compra
- `VendaRepositoryInterface` — só métodos de venda
- `ProdutoServiceInterface` — contrato público do service para o controller

Nenhuma interface tem métodos que apenas alguns implementadores usariam.

### D — Dependency Inversion

Módulos de alto nível (Controllers, Services) não dependem de módulos de baixo nível (Repository concreto, Eloquent). Ambos dependem de abstrações:

```text
ProdutoController → ProdutoServiceInterface    ← ProdutoService
ProdutoService    → ProdutoRepositoryInterface ← ProdutoRepository
CompraService     → CustoCalculatorInterface   ← CustoMedioCalculator
```

Todas as dependências são injetadas via constructor e registradas no `AppServiceProvider`.

---

## Estrutura de Diretórios

```text
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── ProdutoController.php
│   │   │   ├── CompraController.php
│   │   │   └── VendaController.php
│   │   └── Requests/
│   │       ├── StoreProdutoRequest.php
│   │       ├── StoreCompraRequest.php
│   │       └── StoreVendaRequest.php
│   ├── Services/
│   │   ├── Contracts/
│   │   │   ├── ProdutoServiceInterface.php
│   │   │   ├── CompraServiceInterface.php
│   │   │   └── VendaServiceInterface.php
│   │   ├── ProdutoService.php
│   │   ├── CompraService.php
│   │   ├── VendaService.php
│   │   └── CustoMedioCalculator.php
│   ├── Repositories/
│   │   ├── Contracts/
│   │   │   ├── ProdutoRepositoryInterface.php
│   │   │   ├── CompraRepositoryInterface.php
│   │   │   └── VendaRepositoryInterface.php
│   │   ├── ProdutoRepository.php
│   │   ├── CompraRepository.php
│   │   └── VendaRepository.php
│   ├── Models/
│   │   ├── Produto.php
│   │   ├── Compra.php
│   │   └── Venda.php
│   └── Providers/
│       └── AppServiceProvider.php
├── tests/
│   ├── Unit/
│   │   ├── Services/
│   │   │   ├── ProdutoServiceTest.php
│   │   │   ├── CompraServiceTest.php
│   │   │   └── VendaServiceTest.php
│   │   └── CustoMedioCalculatorTest.php
│   └── Feature/
│       ├── ProdutoTest.php
│       ├── CompraTest.php
│       └── VendaTest.php
├── Dockerfile
├── entrypoint.sh
└── .env
```

---

## Variáveis de Ambiente (`.env`)

```env
APP_NAME=ERPEstoque
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000
APP_TIMEZONE=America/Sao_Paulo

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=erp_estoque
DB_USERNAME=erp
DB_PASSWORD=secret

LOG_CHANNEL=stack
LOG_LEVEL=debug
```

---

## Models

### `Produto.php`

```php
protected $fillable = ['nome', 'preco_venda', 'custo_medio', 'estoque'];

protected $casts = [
    'preco_venda' => 'decimal:2',
    'custo_medio' => 'decimal:2',
    'estoque'     => 'integer',
];

public function compras(): BelongsToMany
{
    return $this->belongsToMany(Compra::class, 'compra_produto')
                ->withPivot('quantidade', 'preco_unitario');
}

public function vendas(): BelongsToMany
{
    return $this->belongsToMany(Venda::class, 'venda_produto')
                ->withPivot('quantidade', 'preco_unitario', 'custo_medio_snapshot');
}
```

### `Compra.php`

```php
protected $fillable = ['fornecedor', 'total'];
protected $casts    = ['total' => 'decimal:2'];

public function produtos(): BelongsToMany
{
    return $this->belongsToMany(Produto::class, 'compra_produto')
                ->withPivot('quantidade', 'preco_unitario');
}
```

### `Venda.php`

```php
protected $fillable = ['cliente', 'total', 'lucro', 'cancelada'];

protected $casts = [
    'total'     => 'decimal:2',
    'lucro'     => 'decimal:2',
    'cancelada' => 'boolean',
];

public function produtos(): BelongsToMany
{
    return $this->belongsToMany(Produto::class, 'venda_produto')
                ->withPivot('quantidade', 'preco_unitario', 'custo_medio_snapshot');
}
```

---

## Interfaces de Service (I e D — SOLID)

### `ProdutoServiceInterface.php`

```php
namespace App\Services\Contracts;

use Illuminate\Database\Eloquent\Collection;
use App\Models\Produto;

interface ProdutoServiceInterface
{
    public function listar(): Collection;
    public function criar(array $dados): Produto;
}
```

### `CompraServiceInterface.php`

```php
namespace App\Services\Contracts;

use App\Models\Compra;

interface CompraServiceInterface
{
    public function listar(): \Illuminate\Database\Eloquent\Collection;
    public function registrar(array $dados): Compra;
}
```

### `VendaServiceInterface.php`

```php
namespace App\Services\Contracts;

use App\Models\Venda;

interface VendaServiceInterface
{
    public function listar(): \Illuminate\Database\Eloquent\Collection;
    public function registrar(array $dados): array;
    public function cancelar(int $id): Venda;
}
```

---

## Interfaces de Repository (D — SOLID)

### `ProdutoRepositoryInterface.php`

```php
namespace App\Repositories\Contracts;

use App\Models\Produto;
use Illuminate\Database\Eloquent\Collection;

interface ProdutoRepositoryInterface
{
    public function all(): Collection;
    public function create(array $data): Produto;
    public function findForUpdate(int $id): Produto;
    public function save(Produto $produto): void;
}
```

### `CompraRepositoryInterface.php`

```php
namespace App\Repositories\Contracts;

use App\Models\Compra;
use Illuminate\Database\Eloquent\Collection;

interface CompraRepositoryInterface
{
    public function allWithProdutos(): Collection;
    public function create(array $data): Compra;
    public function attachProdutos(Compra $compra, array $pivotData): void;
}
```

### `VendaRepositoryInterface.php`

```php
namespace App\Repositories\Contracts;

use App\Models\Venda;
use Illuminate\Database\Eloquent\Collection;

interface VendaRepositoryInterface
{
    public function allWithProdutos(): Collection;
    public function create(array $data): Venda;
    public function attachProdutos(Venda $venda, array $pivotData): void;
    public function findWithProdutos(int $id): Venda;
    public function save(Venda $venda): void;
}
```

---

## `CustoMedioCalculator.php` — SRP + O/C

```php
namespace App\Services;

// SRP: única responsabilidade — calcular custo médio ponderado
// O/C: para trocar a fórmula (FIFO, etc.), cria-se outra classe implementando
//       CustoCalculatorInterface sem modificar CompraService
class CustoMedioCalculator
{
    public function calcular(
        int   $estoqueAtual,
        float $custoAtual,
        int   $quantidade,
        float $precoUnitario
    ): float {
        // Quando estoque = 0, a divisão simplifica para precoUnitario
        return ($estoqueAtual * $custoAtual + $quantidade * $precoUnitario)
               / ($estoqueAtual + $quantidade);
    }
}
```

---

## Services

### `ProdutoService.php`

```php
namespace App\Services;

use App\Models\Produto;
use App\Services\Contracts\ProdutoServiceInterface;
use App\Repositories\Contracts\ProdutoRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ProdutoService implements ProdutoServiceInterface
{
    public function __construct(
        private readonly ProdutoRepositoryInterface $produtos
    ) {}

    public function listar(): Collection
    {
        return $this->produtos->all();
    }

    public function criar(array $dados): Produto
    {
        return $this->produtos->create([
            'nome'        => $dados['nome'],
            'preco_venda' => $dados['preco_venda'],
            'custo_medio' => 0,
            'estoque'     => 0,
        ]);
    }
}
```

### `CompraService.php`

```php
namespace App\Services;

use App\Models\Compra;
use App\Services\Contracts\CompraServiceInterface;
use App\Repositories\Contracts\ProdutoRepositoryInterface;
use App\Repositories\Contracts\CompraRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class CompraService implements CompraServiceInterface
{
    public function __construct(
        private readonly ProdutoRepositoryInterface $produtos,
        private readonly CompraRepositoryInterface  $compras,
        private readonly CustoMedioCalculator       $custoCalculator  // SRP + D
    ) {}

    public function listar(): Collection
    {
        return $this->compras->allWithProdutos();
    }

    public function registrar(array $dados): Compra
    {
        return DB::transaction(function () use ($dados) {
            $total     = 0;
            $pivotData = [];

            foreach ($dados['produtos'] as $item) {
                $produto = $this->produtos->findForUpdate($item['id']);

                $novoCusto = $this->custoCalculator->calcular(
                    estoqueAtual:  $produto->estoque,
                    custoAtual:    (float) $produto->custo_medio,
                    quantidade:    $item['quantidade'],
                    precoUnitario: $item['preco_unitario']
                );

                $produto->estoque    += $item['quantidade'];
                $produto->custo_medio = round($novoCusto, 2);
                $this->produtos->save($produto);

                $total += $item['quantidade'] * $item['preco_unitario'];

                $pivotData[$item['id']] = [
                    'quantidade'     => $item['quantidade'],
                    'preco_unitario' => $item['preco_unitario'],
                ];
            }

            $compra = $this->compras->create([
                'fornecedor' => $dados['fornecedor'],
                'total'      => round($total, 2),
            ]);

            $this->compras->attachProdutos($compra, $pivotData);

            return $compra->load('produtos');
        });
    }
}
```

### `VendaService.php`

```php
namespace App\Services;

use App\Models\Venda;
use App\Services\Contracts\VendaServiceInterface;
use App\Repositories\Contracts\ProdutoRepositoryInterface;
use App\Repositories\Contracts\VendaRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VendaService implements VendaServiceInterface
{
    public function __construct(
        private readonly ProdutoRepositoryInterface $produtos,
        private readonly VendaRepositoryInterface   $vendas
    ) {}

    public function listar(): Collection
    {
        return $this->vendas->allWithProdutos();
    }

    public function registrar(array $dados): array
    {
        return DB::transaction(function () use ($dados) {
            $total     = 0;
            $lucro     = 0;
            $pivotData = [];

            foreach ($dados['produtos'] as $item) {
                $produto = $this->produtos->findForUpdate($item['id']);

                if ($produto->estoque < $item['quantidade']) {
                    throw ValidationException::withMessages([
                        'produtos' => "Estoque insuficiente para o produto {$produto->nome}",
                    ]);
                }

                $snapshot  = (float) $produto->custo_medio;
                $lucroItem = ($item['preco_unitario'] - $snapshot) * $item['quantidade'];

                $produto->estoque -= $item['quantidade'];
                $this->produtos->save($produto);

                $total += $item['quantidade'] * $item['preco_unitario'];
                $lucro += $lucroItem;

                $pivotData[$item['id']] = [
                    'quantidade'           => $item['quantidade'],
                    'preco_unitario'       => $item['preco_unitario'],
                    'custo_medio_snapshot' => $snapshot,
                ];
            }

            $venda = $this->vendas->create([
                'cliente'   => $dados['cliente'],
                'total'     => round($total, 2),
                'lucro'     => round($lucro, 2),
                'cancelada' => false,
            ]);

            $this->vendas->attachProdutos($venda, $pivotData);

            return [
                'venda' => $venda->load('produtos'),
                'total' => round($total, 2),
                'lucro' => round($lucro, 2),
            ];
        });
    }

    public function cancelar(int $id): Venda
    {
        return DB::transaction(function () use ($id) {
            $venda = $this->vendas->findWithProdutos($id);

            if ($venda->cancelada) {
                throw ValidationException::withMessages([
                    'venda' => 'Esta venda já foi cancelada.',
                ]);
            }

            foreach ($venda->produtos as $produto) {
                $produtoAtual = $this->produtos->findForUpdate($produto->id);
                $produtoAtual->estoque += $produto->pivot->quantidade;
                $this->produtos->save($produtoAtual);
            }

            $venda->cancelada = true;
            $this->vendas->save($venda);

            return $venda;
        });
    }
}
```

---

## Controllers

Controllers são finos: recebem request, chamam service via interface, retornam response.

### `ProdutoController.php`

```php
namespace App\Http\Controllers;

use App\Http\Requests\StoreProdutoRequest;
use App\Services\Contracts\ProdutoServiceInterface;

class ProdutoController extends Controller
{
    public function __construct(
        private readonly ProdutoServiceInterface $service  // D: depende de abstração
    ) {}

    public function index()
    {
        return response()->json($this->service->listar());
    }

    public function store(StoreProdutoRequest $request)
    {
        return response()->json($this->service->criar($request->validated()), 201);
    }
}
```

### `CompraController.php`

```php
namespace App\Http\Controllers;

use App\Http\Requests\StoreCompraRequest;
use App\Services\Contracts\CompraServiceInterface;

class CompraController extends Controller
{
    public function __construct(
        private readonly CompraServiceInterface $service
    ) {}

    public function index()
    {
        return response()->json($this->service->listar());
    }

    public function store(StoreCompraRequest $request)
    {
        return response()->json($this->service->registrar($request->validated()), 201);
    }
}
```

### `VendaController.php`

```php
namespace App\Http\Controllers;

use App\Http\Requests\StoreVendaRequest;
use App\Services\Contracts\VendaServiceInterface;

class VendaController extends Controller
{
    public function __construct(
        private readonly VendaServiceInterface $service
    ) {}

    public function index()
    {
        return response()->json($this->service->listar());
    }

    public function store(StoreVendaRequest $request)
    {
        return response()->json($this->service->registrar($request->validated()), 200);
    }

    public function destroy(int $id)
    {
        $venda = $this->service->cancelar($id);
        return response()->json(['message' => 'Venda cancelada com sucesso.', 'venda' => $venda]);
    }
}
```

---

## Form Requests

### `StoreProdutoRequest.php`

```php
public function rules(): array
{
    return [
        'nome'        => ['required', 'string', 'min:3', 'max:255'],
        'preco_venda' => ['required', 'numeric', 'min:0'],
    ];
}

public function messages(): array
{
    return [
        'nome.required'        => 'O nome do produto é obrigatório.',
        'nome.min'             => 'O nome deve ter pelo menos 3 caracteres.',
        'preco_venda.required' => 'O preço de venda é obrigatório.',
        'preco_venda.numeric'  => 'O preço de venda deve ser um número.',
        'preco_venda.min'      => 'O preço de venda não pode ser negativo.',
    ];
}
```

### `StoreCompraRequest.php`

```php
public function rules(): array
{
    return [
        'fornecedor'                => ['required', 'string', 'min:2', 'max:255'],
        'produtos'                  => ['required', 'array', 'min:1'],
        'produtos.*.id'             => ['required', 'integer', 'exists:produtos,id'],
        'produtos.*.quantidade'     => ['required', 'integer', 'min:1'],
        'produtos.*.preco_unitario' => ['required', 'numeric', 'min:0'],
    ];
}
```

### `StoreVendaRequest.php`

```php
public function rules(): array
{
    return [
        'cliente'                   => ['required', 'string', 'min:2', 'max:255'],
        'produtos'                  => ['required', 'array', 'min:1'],
        'produtos.*.id'             => ['required', 'integer', 'exists:produtos,id'],
        'produtos.*.quantidade'     => ['required', 'integer', 'min:1'],
        'produtos.*.preco_unitario' => ['required', 'numeric', 'min:0'],
    ];
}
```

---

## Repositories — Implementações (Eloquent)

### `ProdutoRepository.php`

```php
namespace App\Repositories;

use App\Models\Produto;
use App\Repositories\Contracts\ProdutoRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ProdutoRepository implements ProdutoRepositoryInterface
{
    public function all(): Collection
    {
        return Produto::all(['id', 'nome', 'custo_medio', 'preco_venda', 'estoque']);
    }

    public function create(array $data): Produto
    {
        return Produto::create($data);
    }

    public function findForUpdate(int $id): Produto
    {
        return Produto::lockForUpdate()->findOrFail($id);
    }

    public function save(Produto $produto): void
    {
        $produto->save();
    }
}
```

### `CompraRepository.php`

```php
namespace App\Repositories;

use App\Models\Compra;
use App\Repositories\Contracts\CompraRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class CompraRepository implements CompraRepositoryInterface
{
    public function allWithProdutos(): Collection
    {
        return Compra::with('produtos')->latest()->get();
    }

    public function create(array $data): Compra
    {
        return Compra::create($data);
    }

    public function attachProdutos(Compra $compra, array $pivotData): void
    {
        $compra->produtos()->attach($pivotData);
    }
}
```

### `VendaRepository.php`

```php
namespace App\Repositories;

use App\Models\Venda;
use App\Repositories\Contracts\VendaRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class VendaRepository implements VendaRepositoryInterface
{
    public function allWithProdutos(): Collection
    {
        return Venda::with('produtos')->latest()->get();
    }

    public function create(array $data): Venda
    {
        return Venda::create($data);
    }

    public function attachProdutos(Venda $venda, array $pivotData): void
    {
        $venda->produtos()->attach($pivotData);
    }

    public function findWithProdutos(int $id): Venda
    {
        return Venda::with('produtos')->findOrFail($id);
    }

    public function save(Venda $venda): void
    {
        $venda->save();
    }
}
```

---

## `AppServiceProvider.php` — Registro de Bindings

```php
namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Repositories\Contracts\ProdutoRepositoryInterface;
use App\Repositories\Contracts\CompraRepositoryInterface;
use App\Repositories\Contracts\VendaRepositoryInterface;
use App\Repositories\ProdutoRepository;
use App\Repositories\CompraRepository;
use App\Repositories\VendaRepository;
use App\Services\Contracts\ProdutoServiceInterface;
use App\Services\Contracts\CompraServiceInterface;
use App\Services\Contracts\VendaServiceInterface;
use App\Services\ProdutoService;
use App\Services\CompraService;
use App\Services\VendaService;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Repositories
        $this->app->bind(ProdutoRepositoryInterface::class, ProdutoRepository::class);
        $this->app->bind(CompraRepositoryInterface::class,  CompraRepository::class);
        $this->app->bind(VendaRepositoryInterface::class,   VendaRepository::class);

        // Services
        $this->app->bind(ProdutoServiceInterface::class, ProdutoService::class);
        $this->app->bind(CompraServiceInterface::class,  CompraService::class);
        $this->app->bind(VendaServiceInterface::class,   VendaService::class);
    }
}
```

---

## Rotas — `routes/api.php`

```php
use App\Http\Controllers\ProdutoController;
use App\Http\Controllers\CompraController;
use App\Http\Controllers\VendaController;

Route::apiResource('produtos', ProdutoController::class)->only(['index', 'store']);
Route::apiResource('compras',  CompraController::class)->only(['index', 'store']);
Route::apiResource('vendas',   VendaController::class)->only(['index', 'store', 'destroy']);
```

**Endpoints gerados:**

| Método | Endpoint            | Controller@Método        |
|--------|---------------------|--------------------------|
| GET    | /api/produtos       | ProdutoController@index  |
| POST   | /api/produtos       | ProdutoController@store  |
| GET    | /api/compras        | CompraController@index   |
| POST   | /api/compras        | CompraController@store   |
| GET    | /api/vendas         | VendaController@index    |
| POST   | /api/vendas         | VendaController@store    |
| DELETE | /api/vendas/{venda} | VendaController@destroy  |

---

## CORS — `config/cors.php`

```php
'allowed_origins'      => ['http://localhost:5173'],
'allowed_methods'      => ['*'],
'allowed_headers'      => ['*'],
'supports_credentials' => false,
```

---

## Contratos de Request/Response por Endpoint

### `POST /api/produtos`

```json
// Entrada
{ "nome": "Produto A", "preco_venda": 10.00 }

// Saída 201
{ "id": 1, "nome": "Produto A", "preco_venda": "10.00", "custo_medio": "0.00", "estoque": 0 }

// Saída 422
{ "message": "O nome do produto é obrigatório.", "errors": { "nome": ["..."] } }
```

### `POST /api/compras`

```json
// Entrada
{
  "fornecedor": "Fornecedor X",
  "produtos": [{ "id": 1, "quantidade": 10, "preco_unitario": 15.00 }]
}

// Saída 201
{
  "id": 1, "fornecedor": "Fornecedor X", "total": "150.00",
  "produtos": [{ "id": 1, "nome": "...", "pivot": { "quantidade": 10, "preco_unitario": "15.00" } }]
}
```

### `POST /api/vendas`

```json
// Entrada
{
  "cliente": "Cliente Y",
  "produtos": [{ "id": 1, "quantidade": 5, "preco_unitario": 20.00 }]
}

// Saída 200
{
  "venda": { "id": 1, "cliente": "Cliente Y", "total": "100.00", "lucro": "25.00", "cancelada": false },
  "total": 100.00,
  "lucro": 25.00
}

// Saída 422
{ "message": "Estoque insuficiente para o produto Produto A", "errors": { "produtos": ["..."] } }
```

### `DELETE /api/vendas/{id}`

```json
// Saída 200
{ "message": "Venda cancelada com sucesso.", "venda": { "cancelada": true } }

// Saída 422
{ "message": "Esta venda já foi cancelada.", "errors": { "venda": ["..."] } }
```

---

## Tratamento de Erros

| Código | Origem                                                       |
|--------|--------------------------------------------------------------|
| 422    | FormRequest falhou ou ValidationException lançada no Service |
| 404    | `findOrFail()` no Repository (model binding)                 |
| 500    | Exceção não tratada — rollback automático da transação       |
