/**
 * Format a number as currency
 *
 * @param amount - The amount to format
 * @param currency - The currency code (default: 'MXN')
 * @param locale - The locale to use for formatting (default: 'es-MX')
 * @returns Formatted currency string
 *
 * @example
 * ```ts
 * formatCurrency(1234.56) // "$1,234.56"
 * formatCurrency(1234.56, 'USD') // "$1,234.56"
 * formatCurrency(1234.56, 'EUR', 'de-DE') // "1.234,56 €"
 * ```
 */
export function formatCurrency(
    amount: number,
    currency: string = 'MXN',
    locale: string = 'es-MX',
): string {
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch (error) {
        console.error('Error formatting currency:', error);
        return `${currency} ${amount.toFixed(2)}`;
    }
}

/**
 * Format a number as a compact currency (with K, M, B suffixes)
 *
 * @param amount - The amount to format
 * @param currency - The currency code (default: 'MXN')
 * @param locale - The locale to use for formatting (default: 'es-MX')
 * @returns Formatted compact currency string
 *
 * @example
 * ```ts
 * formatCompactCurrency(1234) // "$1.2K"
 * formatCompactCurrency(1234567) // "$1.2M"
 * formatCompactCurrency(1234567890) // "$1.2B"
 * ```
 */
export function formatCompactCurrency(
    amount: number,
    currency: string = 'MXN',
    locale: string = 'es-MX',
): string {
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            notation: 'compact',
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
        }).format(amount);
    } catch (error) {
        console.error('Error formatting compact currency:', error);
        return formatCurrency(amount, currency, locale);
    }
}

/**
 * Format a number as percentage
 *
 * @param value - The value to format (as decimal, e.g., 0.15 for 15%)
 * @param decimals - Number of decimal places (default: 2)
 * @param locale - The locale to use for formatting (default: 'es-MX')
 * @returns Formatted percentage string
 *
 * @example
 * ```ts
 * formatPercentage(0.1234) // "12.34%"
 * formatPercentage(0.1234, 0) // "12%"
 * formatPercentage(0.1234, 4) // "12.3400%"
 * ```
 */
export function formatPercentage(
    value: number,
    decimals: number = 2,
    locale: string = 'es-MX',
): string {
    try {
        return new Intl.NumberFormat(locale, {
            style: 'percent',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(value);
    } catch (error) {
        console.error('Error formatting percentage:', error);
        return `${(value * 100).toFixed(decimals)}%`;
    }
}

/**
 * Format a date string or Date object
 *
 * @param date - The date to format (string, Date, or null)
 * @param format - Format type: 'short', 'medium', 'long', or custom format string (default: 'medium')
 * @param locale - The locale to use for formatting (default: 'es-MX')
 * @returns Formatted date string
 *
 * @example
 * ```ts
 * formatDate('2025-01-15') // "15/01/2025"
 * formatDate('2025-01-15', 'long') // "15 de enero de 2025"
 * formatDate('2025-01-15', 'short') // "15/01/25"
 * formatDate(new Date(), 'DD/MM/YYYY') // "15/01/2025"
 * ```
 */
export function formatDate(
    date: string | Date | null | undefined,
    format: 'short' | 'medium' | 'long' | string = 'medium',
    locale: string = 'es-MX',
): string {
    if (!date) {
        return '';
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
        console.error('Invalid date:', date);
        return '';
    }

    try {
        // Handle custom format strings
        if (!['short', 'medium', 'long'].includes(format)) {
            return formatCustomDate(dateObj, format);
        }

        // Handle Intl.DateTimeFormat presets
        const options: Intl.DateTimeFormatOptions = {
            short: { day: '2-digit', month: '2-digit', year: '2-digit' },
            medium: { day: '2-digit', month: '2-digit', year: 'numeric' },
            long: { day: 'numeric', month: 'long', year: 'numeric' },
        }[format];

        return new Intl.DateTimeFormat(locale, options).format(dateObj);
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateObj.toLocaleDateString(locale);
    }
}

/**
 * Format a date with a custom format string
 *
 * @param date - The date to format
 * @param format - Custom format string (e.g., 'DD/MM/YYYY', 'YYYY-MM-DD')
 * @returns Formatted date string
 */
function formatCustomDate(date: Date, format: string): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    const shortYear = year.slice(-2);

    return format
        .replace('YYYY', year)
        .replace('YY', shortYear)
        .replace('MM', month)
        .replace('DD', day);
}

/**
 * Format a datetime string or Date object with time
 *
 * @param date - The date to format
 * @param format - Format type: 'short', 'medium', 'long' (default: 'medium')
 * @param locale - The locale to use for formatting (default: 'es-MX')
 * @returns Formatted datetime string
 *
 * @example
 * ```ts
 * formatDateTime('2025-01-15T14:30:00') // "15/01/2025, 14:30"
 * formatDateTime('2025-01-15T14:30:00', 'long') // "15 de enero de 2025, 14:30:00"
 * ```
 */
export function formatDateTime(
    date: string | Date | null | undefined,
    format: 'short' | 'medium' | 'long' = 'medium',
    locale: string = 'es-MX',
): string {
    if (!date) {
        return '';
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
        console.error('Invalid date:', date);
        return '';
    }

    try {
        const options: Intl.DateTimeFormatOptions = {
            short: {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            },
            medium: {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            },
            long: {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            },
        }[format];

        return new Intl.DateTimeFormat(locale, options).format(dateObj);
    } catch (error) {
        console.error('Error formatting datetime:', error);
        return dateObj.toLocaleString(locale);
    }
}

/**
 * Format a number with thousand separators
 *
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 0)
 * @param locale - The locale to use for formatting (default: 'es-MX')
 * @returns Formatted number string
 *
 * @example
 * ```ts
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(1234.567, 2) // "1,234.57"
 * ```
 */
export function formatNumber(
    value: number,
    decimals: number = 0,
    locale: string = 'es-MX',
): string {
    try {
        return new Intl.NumberFormat(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(value);
    } catch (error) {
        console.error('Error formatting number:', error);
        return value.toFixed(decimals);
    }
}

/**
 * Format a relative time (e.g., "2 hours ago", "in 3 days")
 *
 * @param date - The date to format
 * @param locale - The locale to use for formatting (default: 'es-MX')
 * @returns Formatted relative time string
 *
 * @example
 * ```ts
 * formatRelativeTime(new Date(Date.now() - 3600000)) // "hace 1 hora"
 * formatRelativeTime(new Date(Date.now() + 86400000)) // "en 1 día"
 * ```
 */
export function formatRelativeTime(
    date: string | Date,
    locale: string = 'es-MX',
): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor(
        (dateObj.getTime() - now.getTime()) / 1000,
    );

    try {
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60,
            second: 1,
        };

        for (const [unit, seconds] of Object.entries(intervals)) {
            const interval = Math.floor(diffInSeconds / seconds);
            if (Math.abs(interval) >= 1) {
                return rtf.format(
                    interval,
                    unit as Intl.RelativeTimeFormatUnit,
                );
            }
        }

        return rtf.format(0, 'second');
    } catch (error) {
        console.error('Error formatting relative time:', error);
        return formatDate(dateObj);
    }
}
