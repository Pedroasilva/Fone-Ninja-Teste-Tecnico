<?php

namespace App\Repositories;

use App\Models\Produto;
use App\Repositories\Contracts\ProdutoRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ProdutoRepository implements ProdutoRepositoryInterface
{
    public function all(): Collection
    {
        return Produto::all(['id', 'nome', 'custo_medio', 'preco_venda', 'estoque', 'created_at']);
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
