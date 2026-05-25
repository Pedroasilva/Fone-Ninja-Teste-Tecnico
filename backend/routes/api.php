<?php

use App\Http\Controllers\ProdutoController;
use App\Http\Controllers\CompraController;
use App\Http\Controllers\VendaController;
use Illuminate\Support\Facades\Route;

Route::apiResource('produtos', ProdutoController::class)->only(['index', 'store']);
Route::apiResource('compras',  CompraController::class)->only(['index', 'store']);
Route::apiResource('vendas',   VendaController::class)->only(['index', 'store', 'destroy']);
