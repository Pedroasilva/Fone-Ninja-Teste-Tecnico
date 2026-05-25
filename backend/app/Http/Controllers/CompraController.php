<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCompraRequest;
use App\Services\Contracts\CompraServiceInterface;

class CompraController extends Controller
{
    public function __construct(
        private readonly CompraServiceInterface $service
    ) {}

    public function index()
    {
        return response()->json($this->service->listar());
    }

    public function store(StoreCompraRequest $request)
    {
        return response()->json($this->service->registrar($request->validated()), 201);
    }
}
