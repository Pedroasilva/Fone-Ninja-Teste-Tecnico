<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Produto extends Model
{
    protected $fillable = ['nome', 'preco_venda', 'custo_medio', 'estoque'];

    protected $casts = [
        'preco_venda' => 'decimal:2',
        'custo_medio' => 'decimal:2',
        'estoque'     => 'integer',
    ];

    public function compras(): BelongsToMany
    {
        return $this->belongsToMany(Compra::class, 'compra_produto')
                    ->withPivot('quantidade', 'preco_unitario');
    }

    public function vendas(): BelongsToMany
    {
        return $this->belongsToMany(Venda::class, 'venda_produto')
                    ->withPivot('quantidade', 'preco_unitario', 'custo_medio_snapshot');
    }
}
