<?php

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
        private readonly CustoMedioCalculator       $custoCalculator
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
