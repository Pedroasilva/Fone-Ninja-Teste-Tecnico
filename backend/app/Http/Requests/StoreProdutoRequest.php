<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProdutoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome'        => ['required', 'string', 'min:3', 'max:255'],
            'preco_venda' => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'nome.required'        => 'O nome do produto é obrigatório.',
            'nome.min'             => 'O nome deve ter pelo menos 3 caracteres.',
            'preco_venda.required' => 'O preço de venda é obrigatório.',
            'preco_venda.numeric'  => 'O preço de venda deve ser um número.',
            'preco_venda.min'      => 'O preço de venda não pode ser negativo.',
        ];
    }
}
