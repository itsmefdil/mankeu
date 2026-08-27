import { type Budget } from '@/services/financial';

/**
 * Checks if a budget rule is active for a given target month and year.
 */
export function isBudgetActive(budget: Budget, targetMonth: number, targetYear: number): boolean {
    const targetIdx = targetYear * 12 + targetMonth;
    const startM = budget.start_month ?? budget.month;
    const startY = budget.start_year ?? budget.year;
    const startIdx = startY * 12 + startM;
    const periodType = budget.period_type || 'monthly';

    if (periodType === 'forever') {
        return targetIdx >= startIdx;
    }

    if (periodType === 'yearly') {
        const budgetYear = budget.start_year ?? budget.year;
        return targetYear === budgetYear;
    }

    if (periodType === 'custom_range') {
        const endM = budget.end_month ?? startM;
        const endY = budget.end_year ?? startY;
        const endIdx = endY * 12 + endM;
        return targetIdx >= startIdx && targetIdx <= endIdx;
    }

    // Default / legacy 'monthly'
    const endM = budget.end_month ?? startM;
    const endY = budget.end_year ?? startY;
    const endIdx = endY * 12 + endM;
    return targetIdx >= startIdx && targetIdx <= endIdx;
}

/**
 * Returns progress information for range budgets (e.g. Month 3 of 10)
 */
export function getBudgetMonthProgress(budget: Budget, targetMonth: number, targetYear: number): { current: number; total: number } | null {
    const targetIdx = targetYear * 12 + targetMonth;
    const startM = budget.start_month ?? budget.month;
    const startY = budget.start_year ?? budget.year;
    const startIdx = startY * 12 + startM;

    if (budget.period_type === 'custom_range' && budget.end_month && budget.end_year) {
        const endIdx = budget.end_year * 12 + budget.end_month;
        const total = endIdx - startIdx + 1;
        const current = targetIdx - startIdx + 1;
        if (current >= 1 && current <= total) {
            return { current, total };
        }
    }
    return null;
}
