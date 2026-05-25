<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProdutoTest extends TestCase
{
    use RefreshDatabase;

    public function test_listar_produtos_retorna_lista_vazia(): void
    {
        $this->getJson('/api/produtos')
             ->assertStatus(200)
             ->assertJson([]);
    }

    public function test_criar_produto_com_dados_validos(): void
    {
        $this->postJson('/api/produtos', ['nome' => 'Produto A', 'preco_venda' => 10.0])
             ->assertStatus(201)
             ->assertJsonFragment([
                 'nome'        => 'Produto A',
                 'preco_venda' => '10.00',
                 'custo_medio' => '0.00',
                 'estoque'     => 0,
             ]);
    }

    public function test_criar_produto_sem_nome_retorna_422(): void
    {
        $this->postJson('/api/produtos', ['preco_venda' => 10.0])
             ->assertStatus(422)
             ->assertJsonValidationErrors(['nome']);
    }

    public function test_criar_produto_com_nome_curto_retorna_422(): void
    {
        $this->postJson('/api/produtos', ['nome' => 'AB', 'preco_venda' => 10.0])
             ->assertStatus(422)
             ->assertJsonValidationErrors(['nome']);
    }

    public function test_criar_produto_com_preco_negativo_retorna_422(): void
    {
        $this->postJson('/api/produtos', ['nome' => 'Produto', 'preco_venda' => -1])
             ->assertStatus(422)
             ->assertJsonValidationErrors(['preco_venda']);
    }
}
