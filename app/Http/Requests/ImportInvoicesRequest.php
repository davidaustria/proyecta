<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ImportInvoicesRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:10240'], // Max 10MB
            'source_system' => ['nullable', 'string', 'max:100'],
            'has_headers' => ['boolean'],
            'skip_duplicates' => ['boolean'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'El archivo es requerido.',
            'file.file' => 'Debe proporcionar un archivo válido.',
            'file.mimes' => 'El archivo debe ser de tipo Excel (.xlsx o .xls).',
            'file.max' => 'El archivo no puede ser mayor a 10MB.',
        ];
    }
}
