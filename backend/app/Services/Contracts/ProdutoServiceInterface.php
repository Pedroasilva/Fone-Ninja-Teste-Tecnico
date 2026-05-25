<?php

namespace App\Services\Contracts;

use App\Models\Produto;
use Illuminate\Database\Eloquent\Collection;

interface ProdutoServiceInterface
{
    public function listar(): Collection;
    public function criar(array $dados): Produto;
}
