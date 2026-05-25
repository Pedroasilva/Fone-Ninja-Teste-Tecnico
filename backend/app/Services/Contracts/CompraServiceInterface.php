<?php

namespace App\Services\Contracts;

use App\Models\Compra;
use Illuminate\Database\Eloquent\Collection;

interface CompraServiceInterface
{
    public function listar(): Collection;
    public function registrar(array $dados): Compra;
}
