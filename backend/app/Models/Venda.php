<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Venda extends Model
{
    protected $fillable = ['cliente', 'total', 'lucro', 'cancelada', 'cancelada_em'];

    protected $casts = [
        'total'        => 'decimal:2',
        'lucro'        => 'decimal:2',
        'cancelada'    => 'boolean',
        'cancelada_em' => 'datetime',
    ];

    public function produtos(): BelongsToMany
    {
        return $this->belongsToMany(Produto::class, 'venda_produto')
                    ->withPivot('quantidade', 'preco_unitario', 'custo_medio_snapshot');
    }
}
