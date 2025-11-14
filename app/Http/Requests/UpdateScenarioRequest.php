<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateScenarioRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'base_year' => ['sometimes', 'required', 'integer', 'min:2000', 'max:2100'],
            'historical_months' => ['sometimes', 'required', 'integer', 'min:3', 'max:60'],
            'projection_years' => ['sometimes', 'required', 'integer', 'min:1', 'max:10'],
            'status' => ['sometimes', 'required', 'string', 'in:draft,active,archived'],
            'is_baseline' => ['boolean'],
            'calculation_method' => ['sometimes', 'required', 'string', 'in:simple_average,weighted_average,trend'],
            'include_inflation' => ['boolean'],
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
            'name.required' => 'El nombre del escenario es requerido.',
            'base_year.required' => 'El año base es requerido.',
            'base_year.min' => 'El año base debe ser mayor o igual a 2000.',
            'base_year.max' => 'El año base debe ser menor o igual a 2100.',
            'historical_months.required' => 'El número de meses históricos es requerido.',
            'historical_months.min' => 'Se requieren al menos 3 meses históricos.',
            'historical_months.max' => 'No se pueden usar más de 60 meses históricos.',
            'projection_years.required' => 'El número de años de proyección es requerido.',
            'projection_years.min' => 'Se requiere al menos 1 año de proyección.',
            'projection_years.max' => 'No se pueden proyectar más de 10 años.',
            'status.in' => 'El estado debe ser: draft, active o archived.',
            'calculation_method.in' => 'El método de cálculo debe ser: simple_average, weighted_average o trend.',
        ];
    }
}
