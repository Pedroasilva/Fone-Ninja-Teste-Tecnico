<?php

namespace App\Repositories\Contracts;

use App\Models\Venda;
use Illuminate\Database\Eloquent\Collection;

interface VendaRepositoryInterface
{
    public function allWithProdutos(): Collection;
    public function create(array $data): Venda;
    public function attachProdutos(Venda $venda, array $pivotData): void;
    public function findWithProdutos(int $id): Venda;
    public function save(Venda $venda): void;
}
