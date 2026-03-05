// Shared types for cost analysis (client-safe)
export interface CostByClassify {
    classify: string
    finance: string
    months: Record<string, number>
    total: number
}
