<?php

namespace Tests\Feature;

use App\Models\Produto;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VendaTest extends TestCase
{
    use RefreshDatabase;

    private function criarProdutoComEstoque(int $estoque, float $custo): Produto
    {
        return Produto::create([
            'nome'        => 'Produto Teste',
            'preco_venda' => 50.0,
            'custo_medio' => $custo,
            'estoque'     => $estoque,
        ]);
    }

    public function test_registrar_venda_decrementa_estoque_e_retorna_lucro(): void
    {
        $produto = $this->criarProdutoComEstoque(estoque: 20, custo: 10.0);

        $resposta = $this->postJson('/api/vendas', [
            'cliente'  => 'Cliente Y',
            'produtos' => [['id' => $produto->id, 'quantidade' => 5, 'preco_unitario' => 20.0]],
        ])->assertStatus(200);

        $resposta->assertJsonFragment(['total' => 100.0, 'lucro' => 50.0]);

        $produto->refresh();
        $this->assertEquals(15, $produto->estoque);
    }

    public function test_venda_com_estoque_insuficiente_retorna_422(): void
    {
        $produto = $this->criarProdutoComEstoque(estoque: 3, custo: 10.0);

        $this->postJson('/api/vendas', [
            'cliente'  => 'Cliente Y',
            'produtos' => [['id' => $produto->id, 'quantidade' => 10, 'preco_unitario' => 20.0]],
        ])->assertStatus(422)
          ->assertJsonFragment(['message' => "Estoque insuficiente para o produto {$produto->nome}"]);
    }

    public function test_cancelar_venda_reverte_estoque(): void
    {
        $produto = $this->criarProdutoComEstoque(estoque: 20, custo: 10.0);

        $vendaResposta = $this->postJson('/api/vendas', [
            'cliente'  => 'Y',
            'produtos' => [['id' => $produto->id, 'quantidade' => 5, 'preco_unitario' => 20.0]],
        ])->assertStatus(200);

        $vendaId = $vendaResposta->json('venda.id');

        $this->deleteJson("/api/vendas/{$vendaId}")
             ->assertStatus(200)
             ->assertJsonFragment(['cancelada' => true]);

        $produto->refresh();
        $this->assertEquals(20, $produto->estoque);
    }

    public function test_cancelar_venda_ja_cancelada_retorna_422(): void
    {
        $produto = $this->criarProdutoComEstoque(estoque: 20, custo: 10.0);

        $vendaResposta = $this->postJson('/api/vendas', [
            'cliente'  => 'Y',
            'produtos' => [['id' => $produto->id, 'quantidade' => 5, 'preco_unitario' => 20.0]],
        ]);

        $vendaId = $vendaResposta->json('venda.id');

        $this->deleteJson("/api/vendas/{$vendaId}");
        $this->deleteJson("/api/vendas/{$vendaId}")
             ->assertStatus(422);
    }

    public function test_lucro_negativo_quando_venda_abaixo_do_custo(): void
    {
        $produto = $this->criarProdutoComEstoque(estoque: 10, custo: 20.0);

        $resposta = $this->postJson('/api/vendas', [
            'cliente'  => 'Y',
            'produtos' => [['id' => $produto->id, 'quantidade' => 2, 'preco_unitario' => 10.0]],
        ])->assertStatus(200);

        $this->assertEqualsWithDelta(-20.0, $resposta->json('lucro'), 0.01);
    }
}
