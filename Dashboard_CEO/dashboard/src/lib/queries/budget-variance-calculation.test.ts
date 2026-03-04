import { describe, expect, it } from 'vitest'
import { buildBudgetVariance } from './budget-variance-calculation'

describe('buildBudgetVariance', () => {
  it('aggregates budgets and expenses by category in all-clinics mode', () => {
    const budgets = [
      {
        category_id: 'cat-rent',
        amount: 100,
        categories: { name: 'Rent', parent_category: null },
      },
      {
        category_id: 'cat-rent',
        amount: 50,
        categories: { name: 'Rent', parent_category: null },
      },
      {
        category_id: 'cat-marketing',
        amount: 300,
        categories: { name: 'Marketing', parent_category: null },
      },
    ]

    const expenses = [
      { category_id: 'cat-rent', amount: 120 },
      { category_id: 'cat-rent', amount: 30 },
      { category_id: 'cat-marketing', amount: 330 },
    ]

    const result = buildBudgetVariance(budgets, expenses)

    expect(result).toHaveLength(2)

    const rent = result.find((item) => item.category === 'Rent')
    expect(rent).toEqual({
      category: 'Rent',
      budget: 150,
      actual: 150,
      variance: 0,
      variance_pct: 0,
      status: 'ok',
    })

    const marketing = result.find((item) => item.category === 'Marketing')
    expect(marketing).toEqual({
      category: 'Marketing',
      budget: 300,
      actual: 330,
      variance: 30,
      variance_pct: 10,
      status: 'ok',
    })
  })

  it('returns warning and critical statuses by variance threshold', () => {
    const budgets = [
      {
        category_id: 'cat-warning',
        amount: 100,
        categories: { name: 'Warning', parent_category: null },
      },
      {
        category_id: 'cat-critical',
        amount: 100,
        categories: { name: 'Critical', parent_category: null },
      },
    ]

    const expenses = [
      { category_id: 'cat-warning', amount: 115 },
      { category_id: 'cat-critical', amount: 121 },
    ]

    const result = buildBudgetVariance(budgets, expenses)

    const warning = result.find((item) => item.category === 'Warning')
    expect(warning?.status).toBe('warning')

    const critical = result.find((item) => item.category === 'Critical')
    expect(critical?.status).toBe('critical')
  })

  it('uses parent category suffix as short label when present', () => {
    const budgets = [
      {
        category_id: 'cat-a',
        amount: 200,
        categories: { name: 'Some Name', parent_category: '1. Marketing' },
      },
    ]

    const expenses = [{ category_id: 'cat-a', amount: 100 }]

    const result = buildBudgetVariance(budgets, expenses)

    expect(result[0]?.category).toBe('Marketing')
  })
})
