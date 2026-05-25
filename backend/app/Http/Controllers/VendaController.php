<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreVendaRequest;
use App\Services\Contracts\VendaServiceInterface;

class VendaController extends Controller
{
    public function __construct(
        private readonly VendaServiceInterface $service
    ) {}

    public function index()
    {
        return response()->json($this->service->listar());
    }

    public function store(StoreVendaRequest $request)
    {
        return response()->json($this->service->registrar($request->validated()), 200);
    }

    public function destroy(int $id)
    {
        $venda = $this->service->cancelar($id);
        return response()->json(['message' => 'Venda cancelada com sucesso.', 'venda' => $venda]);
    }
}
