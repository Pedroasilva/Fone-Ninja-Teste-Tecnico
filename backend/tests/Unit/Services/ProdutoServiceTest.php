<?php

namespace Tests\Unit\Services;

use App\Services\ProdutoService;
use App\Repositories\Contracts\ProdutoRepositoryInterface;
use App\Models\Produto;
use Illuminate\Database\Eloquent\Collection;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class ProdutoServiceTest extends TestCase
{
    private MockObject&ProdutoRepositoryInterface $repositorioMock;
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
        $colecao = new Collection([new Produto()]);

        $this->repositorioMock
            ->expects($this->once())
            ->method('all')
            ->willReturn($colecao);

        $resultado = $this->service->listar();

        $this->assertSame($colecao, $resultado);
    }
}
