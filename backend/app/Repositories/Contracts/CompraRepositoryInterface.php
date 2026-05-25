<?php

namespace App\Repositories\Contracts;

use App\Models\Compra;
use Illuminate\Database\Eloquent\Collection;

interface CompraRepositoryInterface
{
    public function allWithProdutos(): Collection;
    public function create(array $data): Compra;
    public function attachProdutos(Compra $compra, array $pivotData): void;
}
