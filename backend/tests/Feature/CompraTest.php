<?php

namespace Tests\Feature;

use App\Models\Produto;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompraTest extends TestCase
{
    use RefreshDatabase;

    private function criarProduto(array $attrs = []): Produto
    {
        return Produto::create(array_merge([
            'nome'        => 'Produto Teste',
            'preco_venda' => 20.0,
            'custo_medio' => 0,
            'estoque'     => 0,
        ], $attrs));
    }

    public function test_registrar_compra_atualiza_estoque_e_custo_medio(): void
    {
        $produto = $this->criarProduto();

        $this->postJson('/api/compras', [
            'fornecedor' => 'Fornecedor X',
            'produtos'   => [['id' => $produto->id, 'quantidade' => 10, 'preco_unitario' => 15.0]],
        ])->assertStatus(201);

        $produto->refresh();
        $this->assertEquals(10, $produto->estoque);
        $this->assertEqualsWithDelta(15.0, $produto->custo_medio, 0.01);
    }

    public function test_segunda_compra_recalcula_custo_medio(): void
    {
        $produto = $this->criarProduto(['estoque' => 10, 'custo_medio' => 5.0]);

        $this->postJson('/api/compras', [
            'fornecedor' => 'Fornecedor X',
            'produtos'   => [['id' => $produto->id, 'quantidade' => 5, 'preco_unitario' => 8.0]],
        ])->assertStatus(201);

        $produto->refresh();
        $this->assertEquals(15, $produto->estoque);
        $this->assertEqualsWithDelta(6.0, $produto->custo_medio, 0.01);
    }

    public function test_compra_sem_fornecedor_retorna_422(): void
    {
        $produto = $this->criarProduto();

        $this->postJson('/api/compras', [
            'produtos' => [['id' => $produto->id, 'quantidade' => 5, 'preco_unitario' => 10.0]],
        ])->assertStatus(422)->assertJsonValidationErrors(['fornecedor']);
    }

    public function test_compra_com_produto_inexistente_retorna_422(): void
    {
        $this->postJson('/api/compras', [
            'fornecedor' => 'Fornecedor X',
            'produtos'   => [['id' => 9999, 'quantidade' => 1, 'preco_unitario' => 10.0]],
        ])->assertStatus(422)->assertJsonValidationErrors(['produtos.0.id']);
    }

    public function test_listar_compras_retorna_historico(): void
    {
        $produto = $this->criarProduto();
        $this->postJson('/api/compras', [
            'fornecedor' => 'Fornecedor X',
            'produtos'   => [['id' => $produto->id, 'quantidade' => 1, 'preco_unitario' => 10.0]],
        ]);

        $this->getJson('/api/compras')
             ->assertStatus(200)
             ->assertJsonCount(1);
    }
}
