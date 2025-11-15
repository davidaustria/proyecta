import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

// Business Models
export interface CustomerType {
    id: number;
    name: string;
    code: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface BusinessGroup {
    id: number;
    name: string;
    code: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface Customer {
    id: number;
    name: string;
    code: string;
    tax_id?: string;
    customer_type_id?: number;
    business_group_id?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    customer_type?: CustomerType;
    business_group?: BusinessGroup;
    invoices_count?: number;
}

export interface Product {
    id: number;
    name: string;
    code: string;
    description?: string;
    unit_price?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface InflationRate {
    id: number;
    year: number;
    rate: number;
    is_estimated: boolean;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface Scenario {
    id: number;
    name: string;
    description?: string;
    base_year: number;
    historical_months: number;
    projection_years: number;
    status: 'draft' | 'active' | 'archived';
    is_baseline: boolean;
    calculation_method: 'simple_average' | 'weighted_average' | 'trend';
    include_inflation: boolean;
    created_at: string;
    updated_at: string;
    user: {
        id: number;
        name?: string;
    };
    assumptions_count?: number;
    projections_count?: number;
}

export interface ScenarioAssumption {
    id: number;
    scenario_id: number;
    year: number;
    growth_rate?: number;
    inflation_rate?: number;
    adjustment_type: 'percentage' | 'fixed_amount';
    fixed_amount?: number;
    seasonality_factors?: number[];
    notes?: string;
    created_at: string;
    updated_at: string;
    business_group_id?: number;
    customer_type_id?: number;
    customer_id?: number;
    product_id?: number;
    business_group?: BusinessGroup;
    customer_type?: CustomerType;
    customer?: Customer;
    product?: Product;
    hierarchy_level: 'global' | 'customer_type' | 'business_group' | 'customer' | 'product';
}

// Invoice and Import
export interface InvoiceItem {
    id: number;
    invoice_id: number;
    product_id?: number;
    description: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    tax: number;
    total: number;
    created_at: string;
    updated_at: string;
    product?: Product;
}

export interface Invoice {
    id: number;
    invoice_number: string;
    customer_id: number;
    invoice_date: string;
    due_date?: string;
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
    status: 'draft' | 'issued' | 'paid' | 'cancelled';
    import_batch_id?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
    customer?: Customer;
    items?: InvoiceItem[];
    items_count?: number;
}

export interface ImportBatch {
    id: number;
    filename: string;
    source_system?: string;
    total_records: number;
    successful_records: number;
    failed_records: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error_log?: string;
    imported_by: number;
    imported_at: string;
    created_at: string;
    updated_at: string;
    user?: User;
    invoices?: Invoice[];
}

// Import types for wizard
export interface ImportPreviewRow {
    row_number: number;
    data: Record<string, string | number>;
    errors?: string[];
    is_valid: boolean;
}

export interface ImportPreviewData {
    headers: string[];
    rows: ImportPreviewRow[];
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
}

export interface ColumnMapping {
    excel_column: string;
    system_field: string;
}

// Pagination
export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number | null;
    to: number | null;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}
