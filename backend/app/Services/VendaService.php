<?php

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
