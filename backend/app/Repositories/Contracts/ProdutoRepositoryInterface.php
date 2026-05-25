<?php

namespace App\Repositories\Contracts;

use App\Models\Produto;
use Illuminate\Database\Eloquent\Collection;

interface ProdutoRepositoryInterface
{
    public function all(): Collection;
    public function create(array $data): Produto;
    public function findForUpdate(int $id): Produto;
    public function save(Produto $produto): void;
}
