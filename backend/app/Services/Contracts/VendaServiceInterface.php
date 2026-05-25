<?php

namespace App\Services\Contracts;

use App\Models\Venda;
use Illuminate\Database\Eloquent\Collection;

interface VendaServiceInterface
{
    public function listar(): Collection;
    public function registrar(array $dados): array;
    public function cancelar(int $id): Venda;
}
