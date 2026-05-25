<?php

namespace App\Repositories;

use App\Models\Venda;
use App\Repositories\Contracts\VendaRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class VendaRepository implements VendaRepositoryInterface
{
    public function allWithProdutos(): Collection
    {
        return Venda::with('produtos')->latest()->get();
    }

    public function create(array $data): Venda
    {
        return Venda::create($data);
    }

    public function attachProdutos(Venda $venda, array $pivotData): void
    {
        $venda->produtos()->attach($pivotData);
    }

    public function findWithProdutos(int $id): Venda
    {
        return Venda::with('produtos')->findOrFail($id);
    }

    public function save(Venda $venda): void
    {
        $venda->save();
    }
}
