<?php

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
