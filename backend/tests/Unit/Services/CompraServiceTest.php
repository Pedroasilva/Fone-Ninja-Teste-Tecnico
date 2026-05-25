<?php

namespace Tests\Unit\Services;

use App\Services\CompraService;
use App\Services\CustoMedioCalculator;
use App\Repositories\Contracts\ProdutoRepositoryInterface;
use App\Repositories\Contracts\CompraRepositoryInterface;
use App\Models\Produto;
use App\Models\Compra;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\MockObject\MockObject;
use Tests\TestCase;

class CompraServiceTest extends TestCase
{
    public function test_registrar_atualiza_custo_medio_e_estoque(): void
    {
        $produto              = new Produto();
        $produto->id          = 1;
        $produto->estoque     = 10;
        $produto->custo_medio = 5.0;

        /** @var ProdutoRepositoryInterface&MockObject $produtoRepo */
        $produtoRepo = $this->createMock(ProdutoRepositoryInterface::class);
        /** @var CompraRepositoryInterface&MockObject $compraRepo */
        $compraRepo = $this->createMock(CompraRepositoryInterface::class);

        $produtoRepo->method('findForUpdate')->willReturn($produto);
        $produtoRepo->expects($this->once())->method('save')
            ->with($this->callback(function (Produto $p) {
                return $p->estoque == 15 && abs($p->custo_medio - 6.0) < 0.01;
            }));

        /** @var Compra&MockObject $compraFake */
        $compraFake = $this->createPartialMock(Compra::class, ['load']);
        $compraFake->id = 1;
        $compraFake->method('load')->willReturn($compraFake);

        $compraRepo->method('create')->willReturn($compraFake);
        $compraRepo->method('attachProdutos');

        DB::shouldReceive('transaction')->andReturnUsing(fn ($cb) => $cb());

        $service = new CompraService($produtoRepo, $compraRepo, new CustoMedioCalculator());

        $service->registrar([
            'fornecedor' => 'X',
            'produtos'   => [['id' => 1, 'quantidade' => 5, 'preco_unitario' => 8.0]],
        ]);
    }
}
