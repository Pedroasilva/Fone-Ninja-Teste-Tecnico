<?php

namespace App\Repositories;

use App\Models\Compra;
use App\Repositories\Contracts\CompraRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class CompraRepository implements CompraRepositoryInterface
{
    public function allWithProdutos(): Collection
    {
        return Compra::with('produtos')->latest()->get();
    }

    public function create(array $data): Compra
    {
        return Compra::create($data);
    }

    public function attachProdutos(Compra $compra, array $pivotData): void
    {
        $compra->produtos()->attach($pivotData);
    }
}
