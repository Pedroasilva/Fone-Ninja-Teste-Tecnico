<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProdutoRequest;
use App\Services\Contracts\ProdutoServiceInterface;

class ProdutoController extends Controller
{
    public function __construct(
        private readonly ProdutoServiceInterface $service
    ) {}

    public function index()
    {
        return response()->json($this->service->listar());
    }

    public function store(StoreProdutoRequest $request)
    {
        return response()->json($this->service->criar($request->validated()), 201);
    }
}
