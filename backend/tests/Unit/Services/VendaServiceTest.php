<?php

namespace Tests\Unit\Services;

use App\Services\VendaService;
use App\Repositories\Contracts\ProdutoRepositoryInterface;
use App\Repositories\Contracts\VendaRepositoryInterface;
use App\Models\Produto;
use App\Models\Venda;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\MockObject\MockObject;
use Tests\TestCase;

class VendaServiceTest extends TestCase
{
    public function test_registrar_decrementa_estoque_e_calcula_lucro(): void
    {
        $produto              = new Produto();
        $produto->id          = 1;
        $produto->nome        = 'Produto A';
        $produto->estoque     = 20;
        $produto->custo_medio = 10.0;

        /** @var ProdutoRepositoryInterface&MockObject $produtoRepo */
        $produtoRepo = $this->createMock(ProdutoRepositoryInterface::class);
        /** @var VendaRepositoryInterface&MockObject $vendaRepo */
        $vendaRepo = $this->createMock(VendaRepositoryInterface::class);

        $produtoRepo->method('findForUpdate')->willReturn($produto);
        $produtoRepo->expects($this->once())->method('save')
            ->with($this->callback(fn ($p) => $p->estoque == 15));

        /** @var Venda&MockObject $vendaFake */
        $vendaFake = $this->createPartialMock(Venda::class, ['load']);
        $vendaFake->lucro = 25.0;
        $vendaFake->method('load')->willReturn($vendaFake);

        $vendaRepo->method('create')->willReturn($vendaFake);
        $vendaRepo->method('attachProdutos');

        DB::shouldReceive('transaction')->andReturnUsing(fn ($cb) => $cb());

        $service   = new VendaService($produtoRepo, $vendaRepo);
        $resultado = $service->registrar([
            'cliente'  => 'Y',
            'produtos' => [['id' => 1, 'quantidade' => 5, 'preco_unitario' => 15.0]],
        ]);

        $this->assertEqualsWithDelta(25.0, $resultado['lucro'], 0.01);
    }

    public function test_registrar_lanca_excecao_se_estoque_insuficiente(): void
    {
        $produto          = new Produto();
        $produto->id      = 1;
        $produto->nome    = 'Produto A';
        $produto->estoque = 3;

        /** @var ProdutoRepositoryInterface&MockObject $produtoRepo */
        $produtoRepo = $this->createMock(ProdutoRepositoryInterface::class);
        /** @var VendaRepositoryInterface&MockObject $vendaRepo */
        $vendaRepo = $this->createMock(VendaRepositoryInterface::class);
        $produtoRepo->method('findForUpdate')->willReturn($produto);

        DB::shouldReceive('transaction')->andReturnUsing(fn ($cb) => $cb());

        $service = new VendaService($produtoRepo, $vendaRepo);

        $this->expectException(ValidationException::class);

        $service->registrar([
            'cliente'  => 'Y',
            'produtos' => [['id' => 1, 'quantidade' => 10, 'preco_unitario' => 15.0]],
        ]);
    }

    public function test_cancelar_lanca_excecao_se_ja_cancelada(): void
    {
        $venda            = new Venda();
        $venda->cancelada = true;
        $venda->setRelation('produtos', collect([]));

        /** @var ProdutoRepositoryInterface&MockObject $produtoRepo */
        $produtoRepo = $this->createMock(ProdutoRepositoryInterface::class);
        /** @var VendaRepositoryInterface&MockObject $vendaRepo */
        $vendaRepo = $this->createMock(VendaRepositoryInterface::class);
        $vendaRepo->method('findWithProdutos')->willReturn($venda);

        DB::shouldReceive('transaction')->andReturnUsing(fn ($cb) => $cb());

        $service = new VendaService($produtoRepo, $vendaRepo);

        $this->expectException(ValidationException::class);
        $service->cancelar(1);
    }
}
