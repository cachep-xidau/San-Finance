import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBudgets, upsertBudget } from '@/lib/queries/budgets'

// GET /api/budget - List budgets
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, clinic_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const typedProfile = profile as unknown as { role: string; clinic_id: string | null }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id') || undefined
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined

    // Role-based filtering
    let filterClinicId = clinicId
    if (typedProfile.role === 'clinic_manager') {
      filterClinicId = typedProfile.clinic_id || undefined
    }

    const budgets = await getBudgets(filterClinicId, year, month)
    return NextResponse.json({ data: budgets })
  } catch (error) {
    console.error('GET /api/budget error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
      { status: 500 }
    )
  }
}

// POST /api/budget - Create or update budget
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is CEO
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const typedProfile = profile as unknown as { role: string }
    if (!profile || typedProfile.role !== 'ceo') {
      return NextResponse.json(
        { error: 'Only CEO can manage budgets' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { clinic_id, category_id, year, month, amount } = body

    // Validate
    if (!clinic_id || !category_id || !year || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (amount < 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      )
    }

    // Upsert budget (create or update)
    const budget = await upsertBudget({
      clinic_id,
      category_id,
      year,
      month: month || null,
      amount,
    })

    return NextResponse.json({ data: budget })
  } catch (error) {
    console.error('POST /api/budget error:', error)
    return NextResponse.json(
      { error: 'Failed to create/update budget' },
      { status: 500 }
    )
  }
}
