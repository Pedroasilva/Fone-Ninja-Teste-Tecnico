<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Compra extends Model
{
    protected $fillable = ['fornecedor', 'total'];

    protected $casts = [
        'total' => 'decimal:2',
    ];

    public function produtos(): BelongsToMany
    {
        return $this->belongsToMany(Produto::class, 'compra_produto')
                    ->withPivot('quantidade', 'preco_unitario');
    }
}
