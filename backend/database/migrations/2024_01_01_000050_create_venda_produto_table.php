<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('venda_produto', function (Blueprint $table) {
            $table->foreignId('venda_id')->constrained('vendas')->cascadeOnDelete();
            $table->foreignId('produto_id')->constrained('produtos')->cascadeOnDelete();
            $table->integer('quantidade');
            $table->decimal('preco_unitario', 10, 2);
            $table->decimal('custo_medio_snapshot', 10, 2);
            $table->primary(['venda_id', 'produto_id']);
            $table->index('produto_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('venda_produto');
    }
};
