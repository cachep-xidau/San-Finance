/**
 * Client-safe formatting and calculation utilities for KPI display.
 * Extracted from kpis.ts to avoid importing server-only modules in client components.
 */

export function formatCurrency(amount: number): string {
    if (amount >= 1e9) {
        return `₫${(amount / 1e9).toFixed(2)} tỷ`
    }
    if (amount >= 1e6) {
        return `₫${(amount / 1e6).toFixed(0)} triệu`
    }
    return `₫${amount.toLocaleString('vi-VN')}`
}

export function formatPercent(value: number): string {
    return `${value.toFixed(1)}%`
}

export function calculateChange(current: number, previous: number): {
    value: number
    percent: string
    type: 'up' | 'down'
} {
    if (previous === 0) {
        return { value: 0, percent: 'N/A', type: 'up' }
    }
    const change = ((current - previous) / previous) * 100
    return {
        value: change,
        percent: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
        type: change >= 0 ? 'up' : 'down',
    }
}
