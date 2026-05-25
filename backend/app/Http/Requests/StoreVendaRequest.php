<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVendaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'cliente'                   => ['required', 'string', 'min:2', 'max:255'],
            'produtos'                  => ['required', 'array', 'min:1'],
            'produtos.*.id'             => ['required', 'integer', 'exists:produtos,id'],
            'produtos.*.quantidade'     => ['required', 'integer', 'min:1'],
            'produtos.*.preco_unitario' => ['required', 'numeric', 'min:0'],
        ];
    }
}
