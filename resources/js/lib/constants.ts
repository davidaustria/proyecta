/**
 * Application constants and enums
 */

/**
 * Scenario status values
 */
export const SCENARIO_STATUS = {
    DRAFT: 'draft',
    ACTIVE: 'active',
    ARCHIVED: 'archived',
} as const;

export type ScenarioStatus =
    (typeof SCENARIO_STATUS)[keyof typeof SCENARIO_STATUS];

/**
 * Scenario status labels for display
 */
export const SCENARIO_STATUS_LABELS: Record<ScenarioStatus, string> = {
    [SCENARIO_STATUS.DRAFT]: 'Borrador',
    [SCENARIO_STATUS.ACTIVE]: 'Activo',
    [SCENARIO_STATUS.ARCHIVED]: 'Archivado',
};

/**
 * Scenario status colors for badges
 */
export const SCENARIO_STATUS_COLORS: Record<
    ScenarioStatus,
    'default' | 'secondary' | 'destructive' | 'outline'
> = {
    [SCENARIO_STATUS.DRAFT]: 'secondary',
    [SCENARIO_STATUS.ACTIVE]: 'default',
    [SCENARIO_STATUS.ARCHIVED]: 'outline',
};

/**
 * Calculation method values
 */
export const CALCULATION_METHOD = {
    SIMPLE_AVERAGE: 'simple_average',
    WEIGHTED_AVERAGE: 'weighted_average',
    TREND: 'trend',
} as const;

export type CalculationMethod =
    (typeof CALCULATION_METHOD)[keyof typeof CALCULATION_METHOD];

/**
 * Calculation method labels for display
 */
export const CALCULATION_METHOD_LABELS: Record<CalculationMethod, string> = {
    [CALCULATION_METHOD.SIMPLE_AVERAGE]: 'Promedio Simple',
    [CALCULATION_METHOD.WEIGHTED_AVERAGE]: 'Promedio Ponderado',
    [CALCULATION_METHOD.TREND]: 'Tendencia',
};

/**
 * Calculation method descriptions
 */
export const CALCULATION_METHOD_DESCRIPTIONS: Record<
    CalculationMethod,
    string
> = {
    [CALCULATION_METHOD.SIMPLE_AVERAGE]:
        'Promedio aritmético de los datos históricos',
    [CALCULATION_METHOD.WEIGHTED_AVERAGE]:
        'Promedio ponderado dando mayor peso a datos recientes',
    [CALCULATION_METHOD.TREND]: 'Proyección basada en tendencia histórica',
};

/**
 * Adjustment type values for scenario assumptions
 */
export const ADJUSTMENT_TYPE = {
    PERCENTAGE: 'percentage',
    FIXED_AMOUNT: 'fixed_amount',
} as const;

export type AdjustmentType =
    (typeof ADJUSTMENT_TYPE)[keyof typeof ADJUSTMENT_TYPE];

/**
 * Adjustment type labels for display
 */
export const ADJUSTMENT_TYPE_LABELS: Record<AdjustmentType, string> = {
    [ADJUSTMENT_TYPE.PERCENTAGE]: 'Porcentaje',
    [ADJUSTMENT_TYPE.FIXED_AMOUNT]: 'Monto Fijo',
};

/**
 * Invoice status values
 */
export const INVOICE_STATUS = {
    DRAFT: 'draft',
    ISSUED: 'issued',
    PAID: 'paid',
    CANCELLED: 'cancelled',
} as const;

export type InvoiceStatus =
    (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];

/**
 * Invoice status labels for display
 */
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
    [INVOICE_STATUS.DRAFT]: 'Borrador',
    [INVOICE_STATUS.ISSUED]: 'Emitida',
    [INVOICE_STATUS.PAID]: 'Pagada',
    [INVOICE_STATUS.CANCELLED]: 'Cancelada',
};

/**
 * Invoice status colors for badges
 */
export const INVOICE_STATUS_COLORS: Record<
    InvoiceStatus,
    'default' | 'secondary' | 'destructive' | 'outline'
> = {
    [INVOICE_STATUS.DRAFT]: 'secondary',
    [INVOICE_STATUS.ISSUED]: 'default',
    [INVOICE_STATUS.PAID]: 'default',
    [INVOICE_STATUS.CANCELLED]: 'destructive',
};

/**
 * Currency codes supported by the application
 */
export const CURRENCIES = {
    MXN: 'MXN',
    USD: 'USD',
    EUR: 'EUR',
} as const;

export type Currency = (typeof CURRENCIES)[keyof typeof CURRENCIES];

/**
 * Currency labels for display
 */
export const CURRENCY_LABELS: Record<Currency, string> = {
    [CURRENCIES.MXN]: 'Peso Mexicano (MXN)',
    [CURRENCIES.USD]: 'Dólar Estadounidense (USD)',
    [CURRENCIES.EUR]: 'Euro (EUR)',
};

/**
 * Currency symbols
 */
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
    [CURRENCIES.MXN]: '$',
    [CURRENCIES.USD]: '$',
    [CURRENCIES.EUR]: '€',
};

/**
 * Month names in Spanish
 */
export const MONTH_NAMES = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
] as const;

/**
 * Short month names in Spanish
 */
export const MONTH_NAMES_SHORT = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
] as const;

/**
 * Default number of historical months to use for projections
 */
export const DEFAULT_HISTORICAL_MONTHS = 12;

/**
 * Default number of years to project
 */
export const DEFAULT_PROJECTION_YEARS = 3;

/**
 * Maximum number of years to project
 */
export const MAX_PROJECTION_YEARS = 10;

/**
 * Minimum number of historical months required
 */
export const MIN_HISTORICAL_MONTHS = 3;

/**
 * Default seasonality factors (uniform distribution)
 */
export const DEFAULT_SEASONALITY_FACTORS = Array(12).fill(1.0);

/**
 * Pagination default page size
 */
export const DEFAULT_PAGE_SIZE = 15;

/**
 * Pagination page size options
 */
export const PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100] as const;

/**
 * Chart colors for projections (Tailwind colors)
 */
export const CHART_COLORS = {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    accent: 'hsl(var(--accent))',
    muted: 'hsl(var(--muted))',
    destructive: 'hsl(var(--destructive))',
} as const;

/**
 * Chart colors palette for multiple series
 */
export const CHART_COLOR_PALETTE = [
    '#3b82f6', // blue-500
    '#10b981', // green-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#f97316', // orange-500
] as const;

/**
 * Toast duration in milliseconds
 */
export const TOAST_DURATION = {
    SHORT: 3000,
    MEDIUM: 5000,
    LONG: 7000,
} as const;

/**
 * File upload limits
 */
export const FILE_UPLOAD = {
    MAX_SIZE_MB: 10,
    MAX_SIZE_BYTES: 10 * 1024 * 1024,
    ALLOWED_EXTENSIONS: ['.xlsx', '.xls'],
    ALLOWED_MIME_TYPES: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
    ],
} as const;

/**
 * Date format patterns
 */
export const DATE_FORMATS = {
    SHORT: 'short' as const,
    MEDIUM: 'medium' as const,
    LONG: 'long' as const,
    ISO: 'YYYY-MM-DD' as const,
    DISPLAY: 'DD/MM/YYYY' as const,
} as const;

/**
 * Application routes
 */
export const APP_ROUTES = {
    DASHBOARD: '/dashboard',
    SCENARIOS: '/scenarios',
    CUSTOMERS: '/customers',
    CUSTOMER_TYPES: '/customer-types',
    BUSINESS_GROUPS: '/business-groups',
    PRODUCTS: '/products',
    IMPORT: '/import',
    SETTINGS: '/settings',
    INFLATION_RATES: '/settings/inflation-rates',
} as const;
