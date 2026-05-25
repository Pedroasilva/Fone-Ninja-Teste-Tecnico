# Especificação — Testes

## Visão Geral

| Camada    | Framework               | Tipo                        | Comando Docker                                    |
|-----------|-------------------------|-----------------------------|---------------------------------------------------|
| Backend   | PHPUnit (via Artisan)   | Unit + Feature              | `docker compose exec backend php artisan test`    |
| Frontend  | Vitest + Vue Test Utils | Unit + Componente           | `docker compose exec frontend npm run test`       |

---

## Backend — Laravel / PHPUnit

### Configuração

#### `phpunit.xml` — banco em memória para testes

```xml
<php>
    <env name="APP_ENV"       value="testing"/>
    <env name="DB_CONNECTION" value="sqlite"/>
    <env name="DB_DATABASE"   value=":memory:"/>
    <env name="CACHE_DRIVER"  value="array"/>
    <env name="SESSION_DRIVER" value="array"/>
</php>
```

SQLite em memória elimina dependência do serviço `db` durante testes, tornando-os rápidos e isolados.

#### Estrutura de testes

```text
backend/tests/
├── Unit/
│   ├── CustoMedioCalculatorTest.php   ← testa a fórmula pura, sem DB
│   └── Services/
│       ├── ProdutoServiceTest.php     ← mock do repositório
│       ├── CompraServiceTest.php      ← mock dos repositórios + calculator
│       └── VendaServiceTest.php       ← mock dos repositórios
└── Feature/
    ├── ProdutoTest.php                ← HTTP real + banco em memória
    ├── CompraTest.php
    └── VendaTest.php
```

---

### Testes Unitários — `CustoMedioCalculatorTest.php`

Testa a fórmula matemática de forma isolada, sem nenhuma dependência externa.

```php
use App\Services\CustoMedioCalculator;
use PHPUnit\Framework\TestCase;

class CustoMedioCalculatorTest extends TestCase
{
    private CustoMedioCalculator $calculator;

    protected function setUp(): void
    {
        $this->calculator = new CustoMedioCalculator();
    }

    public function test_calcula_custo_medio_com_estoque_existente(): void
    {
        // Estoque: 10 un. a R$5,00 + Compra: 5 un. a R$8,00
        // Esperado: (10*5 + 5*8) / (10+5) = 90/15 = 6,00
        $resultado = $this->calculator->calcular(
            estoqueAtual: 10, custoAtual: 5.0,
            quantidade: 5,    precoUnitario: 8.0
        );

        $this->assertEqualsWithDelta(6.0, $resultado, 0.001);
    }

    public function test_custo_medio_quando_estoque_e_zero(): void
    {
        // Primeiro lote: estoque 0, qualquer fórmula deve resultar no preco unitario
        $resultado = $this->calculator->calcular(
            estoqueAtual: 0, custoAtual: 0.0,
            quantidade: 10,  precoUnitario: 15.0
        );

        $this->assertEqualsWithDelta(15.0, $resultado, 0.001);
    }

    public function test_custo_medio_com_multiplas_entradas(): void
    {
        // 1ª compra: 10 un. a R$10,00 → custo = 10,00
        $apos_primeira = $this->calculator->calcular(0, 0.0, 10, 10.0);

        // 2ª compra: 10 un. a R$20,00 → custo = (10*10 + 10*20) / 20 = 15,00
        $apos_segunda = $this->calculator->calcular(10, $apos_primeira, 10, 20.0);

        $this->assertEqualsWithDelta(15.0, $apos_segunda, 0.001);
    }
}
```

---

### Testes Unitários — `ProdutoServiceTest.php`

Mock do repositório via PHPUnit: testa o service sem tocar no banco.

```php
use App\Services\ProdutoService;
use App\Repositories\Contracts\ProdutoRepositoryInterface;
use App\Models\Produto;
use PHPUnit\Framework\TestCase;

class ProdutoServiceTest extends TestCase
{
    private ProdutoRepositoryInterface $repositorioMock;
    private ProdutoService $service;

    protected function setUp(): void
    {
        $this->repositorioMock = $this->createMock(ProdutoRepositoryInterface::class);
        $this->service = new ProdutoService($this->repositorioMock);
    }

    public function test_criar_chama_repositorio_com_dados_corretos(): void
    {
        $produtoFake = new Produto(['nome' => 'Teste', 'preco_venda' => 10.0,
                                    'custo_medio' => 0, 'estoque' => 0]);

        $this->repositorioMock
            ->expects($this->once())
            ->method('create')
            ->with($this->callback(function ($dados) {
                return $dados['nome']        === 'Teste'
                    && $dados['preco_venda'] == 10.0
                    && $dados['custo_medio'] === 0
                    && $dados['estoque']     === 0;
            }))
            ->willReturn($produtoFake);

        $resultado = $this->service->criar(['nome' => 'Teste', 'preco_venda' => 10.0]);

        $this->assertSame($produtoFake, $resultado);
    }

    public function test_listar_delega_ao_repositorio(): void
    {
        $colecao = collect([new Produto()]);

        $this->repositorioMock
            ->expects($this->once())
            ->method('all')
            ->willReturn($colecao);

        $resultado = $this->service->listar();

        $this->assertSame($colecao, $resultado);
    }
}
```

---

### Testes Unitários — `CompraServiceTest.php`

```php
use App\Services\CompraService;
use App\Services\CustoMedioCalculator;
use App\Repositories\Contracts\ProdutoRepositoryInterface;
use App\Repositories\Contracts\CompraRepositoryInterface;
use App\Models\Produto;
use App\Models\Compra;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CompraServiceTest extends TestCase
{
    public function test_registrar_atualiza_custo_medio_e_estoque(): void
    {
        // Produto com estoque 10, custo 5.00
        $produto = new Produto();
        $produto->id         = 1;
        $produto->estoque    = 10;
        $produto->custo_medio = 5.0;

        $produtoRepo = $this->createMock(ProdutoRepositoryInterface::class);
        $compraRepo  = $this->createMock(CompraRepositoryInterface::class);

        $produtoRepo->method('findForUpdate')->willReturn($produto);
        $produtoRepo->expects($this->once())->method('save')
            ->with($this->callback(function (Produto $p) {
                // 10 un. a 5 + 5 un. a 8 = custo 6,00; estoque = 15
                return $p->estoque == 15 && abs($p->custo_medio - 6.0) < 0.01;
            }));

        $compraFake = new Compra(['fornecedor' => 'X', 'total' => 40.0]);
        $compraFake->id = 1;
        $compraRepo->method('create')->willReturn($compraFake);
        $compraRepo->method('attachProdutos')->willReturn(null);

        DB::shouldReceive('transaction')->andReturnUsing(fn($cb) => $cb());

        $service = new CompraService($produtoRepo, $compraRepo, new CustoMedioCalculator());

        $service->registrar([
            'fornecedor' => 'X',
            'produtos'   => [['id' => 1, 'quantidade' => 5, 'preco_unitario' => 8.0]],
        ]);
    }
}
```

---

### Testes Unitários — `VendaServiceTest.php`

```php
use App\Services\VendaService;
use App\Repositories\Contracts\ProdutoRepositoryInterface;
use App\Repositories\Contracts\VendaRepositoryInterface;
use App\Models\Produto;
use App\Models\Venda;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class VendaServiceTest extends TestCase
{
    public function test_registrar_decrementa_estoque_e_calcula_lucro(): void
    {
        $produto = new Produto();
        $produto->id          = 1;
        $produto->nome        = 'Produto A';
        $produto->estoque     = 20;
        $produto->custo_medio = 10.0;

        $produtoRepo = $this->createMock(ProdutoRepositoryInterface::class);
        $vendaRepo   = $this->createMock(VendaRepositoryInterface::class);

        $produtoRepo->method('findForUpdate')->willReturn($produto);
        $produtoRepo->expects($this->once())->method('save')
            ->with($this->callback(fn($p) => $p->estoque == 15)); // 20 - 5

        $vendaFake = new Venda(['cliente' => 'Y', 'total' => 75.0, 'lucro' => 25.0]);
        $vendaRepo->method('create')->willReturn($vendaFake);
        $vendaRepo->method('attachProdutos')->willReturn(null);

        DB::shouldReceive('transaction')->andReturnUsing(fn($cb) => $cb());

        $service = new VendaService($produtoRepo, $vendaRepo);

        $resultado = $service->registrar([
            'cliente'  => 'Y',
            'produtos' => [['id' => 1, 'quantidade' => 5, 'preco_unitario' => 15.0]],
        ]);

        // lucro: (15 - 10) * 5 = 25
        $this->assertEqualsWithDelta(25.0, $resultado['lucro'], 0.01);
    }

    public function test_registrar_lanca_excecao_se_estoque_insuficiente(): void
    {
        $produto = new Produto();
        $produto->id      = 1;
        $produto->nome    = 'Produto A';
        $produto->estoque = 3;

        $produtoRepo = $this->createMock(ProdutoRepositoryInterface::class);
        $vendaRepo   = $this->createMock(VendaRepositoryInterface::class);
        $produtoRepo->method('findForUpdate')->willReturn($produto);

        DB::shouldReceive('transaction')->andReturnUsing(fn($cb) => $cb());

        $service = new VendaService($produtoRepo, $vendaRepo);

        $this->expectException(ValidationException::class);

        $service->registrar([
            'cliente'  => 'Y',
            'produtos' => [['id' => 1, 'quantidade' => 10, 'preco_unitario' => 15.0]],
        ]);
    }

    public function test_cancelar_lanca_excecao_se_ja_cancelada(): void
    {
        $venda             = new Venda();
        $venda->cancelada  = true;
        $venda->setRelation('produtos', collect([]));

        $produtoRepo = $this->createMock(ProdutoRepositoryInterface::class);
        $vendaRepo   = $this->createMock(VendaRepositoryInterface::class);
        $vendaRepo->method('findWithProdutos')->willReturn($venda);

        DB::shouldReceive('transaction')->andReturnUsing(fn($cb) => $cb());

        $service = new VendaService($produtoRepo, $vendaRepo);

        $this->expectException(ValidationException::class);
        $service->cancelar(1);
    }
}
```

---

### Testes de Feature — `ProdutoTest.php`

Feature tests usam `RefreshDatabase` (migrations no SQLite em memória) e fazem requisições HTTP reais.

```php
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProdutoTest extends TestCase
{
    use RefreshDatabase;

    public function test_listar_produtos_retorna_lista_vazia(): void
    {
        $this->getJson('/api/produtos')
             ->assertStatus(200)
             ->assertJson([]);
    }

    public function test_criar_produto_com_dados_validos(): void
    {
        $this->postJson('/api/produtos', ['nome' => 'Produto A', 'preco_venda' => 10.0])
             ->assertStatus(201)
             ->assertJsonFragment([
                 'nome'        => 'Produto A',
                 'preco_venda' => '10.00',
                 'custo_medio' => '0.00',
                 'estoque'     => 0,
             ]);
    }

    public function test_criar_produto_sem_nome_retorna_422(): void
    {
        $this->postJson('/api/produtos', ['preco_venda' => 10.0])
             ->assertStatus(422)
             ->assertJsonValidationErrors(['nome']);
    }

    public function test_criar_produto_com_nome_curto_retorna_422(): void
    {
        $this->postJson('/api/produtos', ['nome' => 'AB', 'preco_venda' => 10.0])
             ->assertStatus(422)
             ->assertJsonValidationErrors(['nome']);
    }

    public function test_criar_produto_com_preco_negativo_retorna_422(): void
    {
        $this->postJson('/api/produtos', ['nome' => 'Produto', 'preco_venda' => -1])
             ->assertStatus(422)
             ->assertJsonValidationErrors(['preco_venda']);
    }
}
```

---

### Testes de Feature — `CompraTest.php`

```php
use App\Models\Produto;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompraTest extends TestCase
{
    use RefreshDatabase;

    private function criarProduto(array $attrs = []): Produto
    {
        return Produto::create(array_merge([
            'nome'        => 'Produto Teste',
            'preco_venda' => 20.0,
            'custo_medio' => 0,
            'estoque'     => 0,
        ], $attrs));
    }

    public function test_registrar_compra_atualiza_estoque_e_custo_medio(): void
    {
        $produto = $this->criarProduto();

        $this->postJson('/api/compras', [
            'fornecedor' => 'Fornecedor X',
            'produtos'   => [['id' => $produto->id, 'quantidade' => 10, 'preco_unitario' => 15.0]],
        ])->assertStatus(201);

        $produto->refresh();
        $this->assertEquals(10, $produto->estoque);
        $this->assertEqualsWithDelta(15.0, $produto->custo_medio, 0.01);
    }

    public function test_segunda_compra_recalcula_custo_medio(): void
    {
        $produto = $this->criarProduto(['estoque' => 10, 'custo_medio' => 5.0]);

        $this->postJson('/api/compras', [
            'fornecedor' => 'Fornecedor X',
            'produtos'   => [['id' => $produto->id, 'quantidade' => 5, 'preco_unitario' => 8.0]],
        ])->assertStatus(201);

        $produto->refresh();
        $this->assertEquals(15, $produto->estoque);
        // (10*5 + 5*8) / 15 = 6,00
        $this->assertEqualsWithDelta(6.0, $produto->custo_medio, 0.01);
    }

    public function test_compra_sem_fornecedor_retorna_422(): void
    {
        $produto = $this->criarProduto();

        $this->postJson('/api/compras', [
            'produtos' => [['id' => $produto->id, 'quantidade' => 5, 'preco_unitario' => 10.0]],
        ])->assertStatus(422)->assertJsonValidationErrors(['fornecedor']);
    }

    public function test_compra_com_produto_inexistente_retorna_422(): void
    {
        $this->postJson('/api/compras', [
            'fornecedor' => 'X',
            'produtos'   => [['id' => 9999, 'quantidade' => 1, 'preco_unitario' => 10.0]],
        ])->assertStatus(422)->assertJsonValidationErrors(['produtos.0.id']);
    }

    public function test_listar_compras_retorna_historico(): void
    {
        $produto = $this->criarProduto();
        $this->postJson('/api/compras', [
            'fornecedor' => 'X',
            'produtos'   => [['id' => $produto->id, 'quantidade' => 1, 'preco_unitario' => 10.0]],
        ]);

        $this->getJson('/api/compras')
             ->assertStatus(200)
             ->assertJsonCount(1);
    }
}
```

---

### Testes de Feature — `VendaTest.php`

```php
use App\Models\Produto;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VendaTest extends TestCase
{
    use RefreshDatabase;

    private function criarProdutoComEstoque(int $estoque, float $custo): Produto
    {
        return Produto::create([
            'nome'        => 'Produto Teste',
            'preco_venda' => 50.0,
            'custo_medio' => $custo,
            'estoque'     => $estoque,
        ]);
    }

    public function test_registrar_venda_decrementa_estoque_e_retorna_lucro(): void
    {
        $produto = $this->criarProdutoComEstoque(estoque: 20, custo: 10.0);

        $resposta = $this->postJson('/api/vendas', [
            'cliente'  => 'Cliente Y',
            'produtos' => [['id' => $produto->id, 'quantidade' => 5, 'preco_unitario' => 20.0]],
        ])->assertStatus(200);

        $resposta->assertJsonFragment(['total' => 100.0, 'lucro' => 50.0]);

        $produto->refresh();
        $this->assertEquals(15, $produto->estoque);
    }

    public function test_venda_com_estoque_insuficiente_retorna_422(): void
    {
        $produto = $this->criarProdutoComEstoque(estoque: 3, custo: 10.0);

        $this->postJson('/api/vendas', [
            'cliente'  => 'Cliente Y',
            'produtos' => [['id' => $produto->id, 'quantidade' => 10, 'preco_unitario' => 20.0]],
        ])->assertStatus(422)
          ->assertJsonFragment(['message' => "Estoque insuficiente para o produto {$produto->nome}"]);
    }

    public function test_cancelar_venda_reverte_estoque(): void
    {
        $produto = $this->criarProdutoComEstoque(estoque: 20, custo: 10.0);

        $vendaResposta = $this->postJson('/api/vendas', [
            'cliente'  => 'Y',
            'produtos' => [['id' => $produto->id, 'quantidade' => 5, 'preco_unitario' => 20.0]],
        ])->assertStatus(200);

        $vendaId = $vendaResposta->json('venda.id');

        $this->deleteJson("/api/vendas/{$vendaId}")
             ->assertStatus(200)
             ->assertJsonFragment(['cancelada' => true]);

        $produto->refresh();
        $this->assertEquals(20, $produto->estoque); // estoque revertido
    }

    public function test_cancelar_venda_ja_cancelada_retorna_422(): void
    {
        $produto = $this->criarProdutoComEstoque(estoque: 20, custo: 10.0);

        $vendaResposta = $this->postJson('/api/vendas', [
            'cliente'  => 'Y',
            'produtos' => [['id' => $produto->id, 'quantidade' => 5, 'preco_unitario' => 20.0]],
        ]);

        $vendaId = $vendaResposta->json('venda.id');

        $this->deleteJson("/api/vendas/{$vendaId}"); // 1ª vez
        $this->deleteJson("/api/vendas/{$vendaId}") // 2ª vez
             ->assertStatus(422);
    }

    public function test_lucro_negativo_quando_venda_abaixo_do_custo(): void
    {
        $produto = $this->criarProdutoComEstoque(estoque: 10, custo: 20.0);

        $resposta = $this->postJson('/api/vendas', [
            'cliente'  => 'Y',
            'produtos' => [['id' => $produto->id, 'quantidade' => 2, 'preco_unitario' => 10.0]],
        ])->assertStatus(200);

        // lucro: (10 - 20) * 2 = -20
        $this->assertEqualsWithDelta(-20.0, $resposta->json('lucro'), 0.01);
    }
}
```

---

## Frontend — Vitest + Vue Test Utils

### Instalação de dependências de teste

```bash
npm install -D vitest @vue/test-utils @vitejs/plugin-vue jsdom @testing-library/vue
```

### `vite.config.js` — habilitar Vitest

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: { host: '0.0.0.0', port: 5173 },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/__tests__/setup.js',
  },
})
```

### `package.json` — script de teste

```json
{
  "scripts": {
    "dev":  "vite",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### Estrutura de testes

```text
frontend/src/__tests__/
├── setup.js                      ← configuração global (mocks de API)
├── utils/
│   └── format.test.js            ← testa formatarMoeda()
└── views/
    ├── ProdutosView.test.js
    ├── ComprasView.test.js
    └── VendasView.test.js
```

---

### `setup.js` — mock global do Axios

```js
import { vi } from 'vitest'

// Substitui o módulo api.js inteiro em todos os testes
vi.mock('../api', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    delete: vi.fn(),
  },
}))
```

---

### `utils/format.test.js`

```js
import { describe, it, expect } from 'vitest'
import { formatarMoeda } from '../utils/format'

describe('formatarMoeda', () => {
  it('formata valor positivo em reais', () => {
    expect(formatarMoeda(10)).toBe('R$ 10,00')
  })

  it('formata zero', () => {
    expect(formatarMoeda(0)).toBe('R$ 0,00')
  })

  it('formata null como zero', () => {
    expect(formatarMoeda(null)).toBe('R$ 0,00')
  })

  it('formata valor negativo', () => {
    const resultado = formatarMoeda(-50)
    expect(resultado).toContain('50,00')
  })
})
```

---

### `views/ProdutosView.test.js`

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ProdutosView from '../views/ProdutosView.vue'
import api from '../api'

describe('ProdutosView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: [] })
  })

  it('renderiza formulário de cadastro', () => {
    const wrapper = mount(ProdutosView)
    expect(wrapper.find('input[placeholder*="nome"], input[name="nome"]').exists()).toBe(true)
  })

  it('carrega e exibe lista de produtos ao montar', async () => {
    api.get.mockResolvedValue({
      data: [{ id: 1, nome: 'Produto A', preco_venda: '10.00',
               custo_medio: '5.00', estoque: 20 }],
    })

    const wrapper = mount(ProdutosView)
    await flushPromises()

    expect(wrapper.text()).toContain('Produto A')
  })

  it('exibe mensagem de sucesso após cadastro', async () => {
    api.post.mockResolvedValue({
      data: { id: 2, nome: 'Novo', preco_venda: '15.00',
              custo_medio: '0.00', estoque: 0 },
    })

    const wrapper = mount(ProdutosView)
    await flushPromises()

    // Preenche e envia o formulário
    await wrapper.find('[data-testid="input-nome"]').setValue('Produto Novo')
    await wrapper.find('[data-testid="input-preco"]').setValue('15')
    await wrapper.find('[data-testid="btn-cadastrar"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('sucesso')
  })

  it('exibe mensagem de erro se a API retornar 422', async () => {
    api.post.mockRejectedValue({
      response: { data: { message: 'O nome do produto é obrigatório.' } },
    })

    const wrapper = mount(ProdutosView)
    await flushPromises()

    await wrapper.find('[data-testid="btn-cadastrar"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('obrigatório')
  })
})
```

---

### `views/ComprasView.test.js`

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ComprasView from '../views/ComprasView.vue'
import api from '../api'

const produtosFake = [
  { id: 1, nome: 'Produto A', custo_medio: '5.00', preco_venda: '10.00', estoque: 50 },
]

describe('ComprasView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: [] })
  })

  it('inicia com um item na lista de itens', async () => {
    const wrapper = mount(ComprasView)
    await flushPromises()
    expect(wrapper.findAll('[data-testid="linha-item"]')).toHaveLength(1)
  })

  it('adiciona nova linha ao clicar em Adicionar item', async () => {
    const wrapper = mount(ComprasView)
    await flushPromises()

    await wrapper.find('[data-testid="btn-adicionar-item"]').trigger('click')
    expect(wrapper.findAll('[data-testid="linha-item"]')).toHaveLength(2)
  })

  it('remove linha ao clicar em remover', async () => {
    const wrapper = mount(ComprasView)
    await flushPromises()

    await wrapper.find('[data-testid="btn-adicionar-item"]').trigger('click')
    await wrapper.findAll('[data-testid="btn-remover-item"]')[1].trigger('click')
    expect(wrapper.findAll('[data-testid="linha-item"]')).toHaveLength(1)
  })

  it('não permite remover o último item', async () => {
    const wrapper = mount(ComprasView)
    await flushPromises()

    await wrapper.find('[data-testid="btn-remover-item"]').trigger('click')
    expect(wrapper.findAll('[data-testid="linha-item"]')).toHaveLength(1)
  })

  it('exibe sucesso após registrar compra', async () => {
    api.get.mockResolvedValueOnce({ data: produtosFake })
              .mockResolvedValue({ data: [] })
    api.post.mockResolvedValue({ data: { id: 1, fornecedor: 'X', total: '50.00' } })

    const wrapper = mount(ComprasView)
    await flushPromises()

    await wrapper.find('[data-testid="input-fornecedor"]').setValue('Fornecedor X')
    await wrapper.find('[data-testid="btn-registrar"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('sucesso')
  })
})
```

---

### `views/VendasView.test.js`

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import VendasView from '../views/VendasView.vue'
import api from '../api'

const produtosFake = [
  { id: 1, nome: 'Produto A', custo_medio: '10.00', preco_venda: '20.00', estoque: 50 },
]

describe('VendasView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: [] })
  })

  it('calcula total e lucro estimados em tempo real', async () => {
    api.get.mockResolvedValueOnce({ data: produtosFake })
              .mockResolvedValue({ data: [] })

    const wrapper = mount(VendasView)
    await flushPromises()

    // Seleciona produto e preenche campos
    const select = wrapper.find('[data-testid="select-produto"]')
    await select.setValue('1')

    await wrapper.find('[data-testid="input-quantidade"]').setValue('5')
    await wrapper.find('[data-testid="input-preco-venda"]').setValue('20')
    await flushPromises()

    // total: 5 * 20 = 100; lucro: (20 - 10) * 5 = 50
    expect(wrapper.text()).toContain('100')
    expect(wrapper.text()).toContain('50')
  })

  it('exibe erro quando API retorna estoque insuficiente', async () => {
    api.get.mockResolvedValue({ data: produtosFake })
    api.post.mockRejectedValue({
      response: { data: { message: 'Estoque insuficiente para o produto Produto A' } },
    })

    const wrapper = mount(VendasView)
    await flushPromises()

    await wrapper.find('[data-testid="btn-registrar"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Estoque insuficiente')
  })

  it('exibe total e lucro retornados pela API após sucesso', async () => {
    api.get.mockResolvedValue({ data: produtosFake })
    api.post.mockResolvedValue({
      data: {
        venda: { id: 1, cliente: 'Y', total: '100.00', lucro: '50.00', cancelada: false },
        total: 100.0,
        lucro: 50.0,
      },
    })

    const wrapper = mount(VendasView)
    await flushPromises()

    await wrapper.find('[data-testid="input-cliente"]').setValue('Cliente Y')
    await wrapper.find('[data-testid="btn-registrar"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('sucesso')
  })
})
```

---

## Data Attributes para Testes

Todos os elementos interativos das views devem ter `data-testid` para que os testes não dependam de estrutura HTML ou CSS:

| Elemento                      | `data-testid`          |
|-------------------------------|------------------------|
| Input nome do produto         | `input-nome`           |
| Input preço de venda          | `input-preco`          |
| Botão cadastrar produto       | `btn-cadastrar`        |
| Input fornecedor/cliente      | `input-fornecedor` / `input-cliente` |
| Linha de item dinâmico        | `linha-item`           |
| Botão adicionar item          | `btn-adicionar-item`   |
| Botão remover item            | `btn-remover-item`     |
| Select produto                | `select-produto`       |
| Input quantidade              | `input-quantidade`     |
| Input preço unitário          | `input-preco-venda`    |
| Botão registrar compra/venda  | `btn-registrar`        |

---

## Executando Testes via Docker

```bash
# Todos os testes do backend
docker compose exec backend php artisan test

# Apenas testes unitários
docker compose exec backend php artisan test --testsuite=Unit

# Apenas testes de feature
docker compose exec backend php artisan test --testsuite=Feature

# Com cobertura (requer Xdebug ou PCOV no Dockerfile)
docker compose exec backend php artisan test --coverage

# Testes do frontend
docker compose exec frontend npm run test

# Frontend em modo watch (desenvolvimento)
docker compose exec frontend npm run test:watch
```

### Adicionando Xdebug para cobertura no `backend/Dockerfile`

```dockerfile
RUN pecl install xdebug \
    && docker-php-ext-enable xdebug \
    && echo "xdebug.mode=coverage" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini
```

---

## Critérios de Cobertura Mínima

| Módulo                  | Cobertura alvo |
|-------------------------|----------------|
| `CustoMedioCalculator`  | 100%           |
| `ProdutoService`        | 90%            |
| `CompraService`         | 90%            |
| `VendaService`          | 90%            |
| Feature (endpoints)     | 100% dos casos listados acima |
| Views Vue               | casos de sucesso + erro por view |
