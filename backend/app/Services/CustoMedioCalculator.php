<?php

namespace App\Services;

class CustoMedioCalculator
{
    public function calcular(
        int   $estoqueAtual,
        float $custoAtual,
        int   $quantidade,
        float $precoUnitario
    ): float {
        return ($estoqueAtual * $custoAtual + $quantidade * $precoUnitario)
               / ($estoqueAtual + $quantidade);
    }
}
