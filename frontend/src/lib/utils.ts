import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string, currency = 'IDR', locale = 'id'): string {
    const symbol = currency === 'USD' ? '$' : 'Rp';
    // Map 'id' locale to 'id-ID' for correct formatting if needed, though 'id' usually works.
    const validLocale = locale === 'id' ? 'id-ID' : 'en-US';
    return `${symbol} ${Number(value).toLocaleString(validLocale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
