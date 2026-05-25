<?php

namespace Tests\Unit;

use App\Services\CustoMedioCalculator;
use PHPUnit\Framework\TestCase;

class CustoMedioCalculatorTest extends TestCase
{
    private CustoMedioCalculator $calculator;

    protected function setUp(): void
    {
        $this->calculator = new CustoMedioCalculator();
    }

    public function test_calcula_custo_medio_com_estoque_existente(): void
    {
        $resultado = $this->calculator->calcular(
            estoqueAtual: 10, custoAtual: 5.0,
            quantidade: 5,    precoUnitario: 8.0
        );

        $this->assertEqualsWithDelta(6.0, $resultado, 0.001);
    }

    public function test_custo_medio_quando_estoque_e_zero(): void
    {
        $resultado = $this->calculator->calcular(
            estoqueAtual: 0, custoAtual: 0.0,
            quantidade: 10,  precoUnitario: 15.0
        );

        $this->assertEqualsWithDelta(15.0, $resultado, 0.001);
    }

    public function test_custo_medio_com_multiplas_entradas(): void
    {
        $apos_primeira = $this->calculator->calcular(0, 0.0, 10, 10.0);
        $apos_segunda  = $this->calculator->calcular(10, $apos_primeira, 10, 20.0);

        $this->assertEqualsWithDelta(15.0, $apos_segunda, 0.001);
    }
}
