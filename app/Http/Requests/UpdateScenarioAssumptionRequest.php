<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateScenarioAssumptionRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'growth_rate' => ['sometimes', 'nullable', 'numeric', 'min:-100', 'max:1000'],
            'inflation_rate' => ['sometimes', 'nullable', 'numeric', 'min:-100', 'max:1000'],
            'adjustment_type' => ['sometimes', 'required', 'string', 'in:percentage,fixed_amount'],
            'fixed_amount' => ['nullable', 'numeric', 'required_if:adjustment_type,fixed_amount'],
            'seasonality_factors' => ['nullable', 'array', 'size:12'],
            'seasonality_factors.*' => ['numeric', 'min:0', 'max:10'],
            'notes' => ['nullable', 'string', 'max:1000'],
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
            'growth_rate.min' => 'La tasa de crecimiento no puede ser menor a -100%.',
            'growth_rate.max' => 'La tasa de crecimiento no puede ser mayor a 1000%.',
            'inflation_rate.min' => 'La tasa de inflación no puede ser menor a -100%.',
            'inflation_rate.max' => 'La tasa de inflación no puede ser mayor a 1000%.',
            'adjustment_type.required' => 'El tipo de ajuste es requerido.',
            'adjustment_type.in' => 'El tipo de ajuste debe ser: percentage o fixed_amount.',
            'fixed_amount.required_if' => 'El monto fijo es requerido cuando el tipo de ajuste es "fixed_amount".',
            'seasonality_factors.size' => 'Los factores de estacionalidad deben ser exactamente 12 valores (uno por mes).',
            'seasonality_factors.*.min' => 'Cada factor de estacionalidad debe ser mayor o igual a 0.',
            'seasonality_factors.*.max' => 'Cada factor de estacionalidad debe ser menor o igual a 10.',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Validar que la suma de factores de estacionalidad sea aproximadamente 12
            if ($this->seasonality_factors && is_array($this->seasonality_factors)) {
                $sum = array_sum($this->seasonality_factors);
                if ($sum < 11.5 || $sum > 12.5) {
                    $validator->errors()->add(
                        'seasonality_factors',
                        'La suma de los factores de estacionalidad debe ser aproximadamente 12.0 (actualmente: '.number_format($sum, 2).').'
                    );
                }
            }
        });
    }
}
