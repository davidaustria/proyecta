<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCustomerRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('customers')->where('organization_id', auth()->user()->organization_id),
            ],
            'tax_id' => ['nullable', 'string', 'max:50'],
            'customer_type_id' => ['required', 'integer', 'exists:customer_types,id'],
            'business_group_id' => ['nullable', 'integer', 'exists:business_groups,id'],
            'is_active' => ['boolean'],
            'metadata' => ['nullable', 'array'],
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
            'name.required' => 'El nombre del cliente es requerido.',
            'code.required' => 'El código del cliente es requerido.',
            'code.unique' => 'Ya existe un cliente con este código.',
            'customer_type_id.required' => 'El tipo de cliente es requerido.',
            'customer_type_id.exists' => 'El tipo de cliente seleccionado no existe.',
            'business_group_id.exists' => 'El grupo empresarial seleccionado no existe.',
        ];
    }
}
