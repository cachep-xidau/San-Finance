import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/sync — manual sync trigger
export async function POST() {
    try {
        const supabase = await createClient()
        const startTime = Date.now()

        // Create sync log entry (type cast since sync_logs is not in generated types)
        const { data: logEntry } = await (supabase as any)
            .from('sync_logs')
            .insert({ status: 'running' })
            .select('id')
            .single()

        // TODO: Replace with Google Sheets API fetch when credentials are configured
        // For now, this is a placeholder that marks sync as complete
        const details = {
            revenue: { inserted: 0, skipped: 0 },
            expenses: { inserted: 0, skipped: 0 },
            message: 'Google Sheets API chưa được cấu hình. Vui lòng thêm GOOGLE_SHEETS_CREDENTIALS vào .env.local',
        }

        const durationMs = Date.now() - startTime

        // Update sync log
        if (logEntry?.id) {
            await (supabase as any)
                .from('sync_logs')
                .update({
                    status: 'success',
                    completed_at: new Date().toISOString(),
                    duration_ms: durationMs,
                    details,
                })
                .eq('id', logEntry.id)
        }

        return NextResponse.json({ success: true, duration_ms: durationMs, details })
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
        )
    }
}

// GET /api/sync — Vercel Cron trigger
export async function GET(request: Request) {
    // Verify cron secret in production
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delegate to POST handler logic
    return POST()
}
