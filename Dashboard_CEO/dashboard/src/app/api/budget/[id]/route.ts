import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateBudget, deleteBudget } from '@/lib/queries/budgets'

// PUT /api/budget/[id] - Update budget
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()

    const budget = await updateBudget(id, body)
    return NextResponse.json({ data: budget })
  } catch (error) {
    console.error('PUT /api/budget error:', error)
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    )
  }
}

// DELETE /api/budget/[id] - Delete budget
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    await deleteBudget(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/budget error:', error)
    return NextResponse.json(
      { error: 'Failed to delete budget' },
      { status: 500 }
    )
  }
}
