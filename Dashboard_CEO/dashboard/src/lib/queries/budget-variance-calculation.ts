export interface BudgetVariance {
  category: string
  budget: number
  actual: number
  variance: number
  variance_pct: number
  status: 'ok' | 'warning' | 'critical'
}

export interface BudgetVarianceBudgetRow {
  category_id: string
  amount: number
  categories: { name: string; parent_category: string | null } | null
}

export interface BudgetVarianceExpenseRow {
  category_id: string
  amount: number | null
}

export function buildBudgetVariance(
  budgets: BudgetVarianceBudgetRow[],
  expenses: BudgetVarianceExpenseRow[]
): BudgetVariance[] {
  const actualsByCategory: Record<string, number> = {}

  for (const expense of expenses) {
    actualsByCategory[expense.category_id] =
      (actualsByCategory[expense.category_id] || 0) + (expense.amount || 0)
  }

  const grouped = new Map<string, { category: string; budget: number; actual: number }>()

  for (const budget of budgets) {
    const fullName = budget.categories?.name || 'Unknown'
    const shortName = budget.categories?.parent_category?.split('. ')[1] || fullName

    const existing = grouped.get(budget.category_id)
    const budgetAmount = budget.amount || 0

    if (existing) {
      existing.budget += budgetAmount
      continue
    }

    grouped.set(budget.category_id, {
      category: shortName,
      budget: budgetAmount,
      actual: actualsByCategory[budget.category_id] || 0,
    })
  }

  return Array.from(grouped.values()).map((item) => {
    const variance = item.actual - item.budget
    const variancePct = item.budget > 0 ? (variance / item.budget) * 100 : 0

    let status: 'ok' | 'warning' | 'critical' = 'ok'
    if (Math.abs(variancePct) > 20) {
      status = 'critical'
    } else if (Math.abs(variancePct) > 10) {
      status = 'warning'
    }

    return {
      category: item.category,
      budget: item.budget,
      actual: item.actual,
      variance,
      variance_pct: variancePct,
      status,
    }
  })
}
