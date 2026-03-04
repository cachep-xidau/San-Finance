// Re-map existing expense records to match new master data
// Updates: finance (category), classify, cash_flow (expense_type) based on master lookup
// Usage: npx tsx scripts/remap-expenses.ts

import { createClient } from '@supabase/supabase-js'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Map old classify values → new master data classify
// Key = old value in raw_expenses, Value = matching classify in master_data
const CLASSIFY_ALIAS: Record<string, string> = {
    // ── Exact matches (just documenting reclassification) ──
    'Thưởng gián tiếp': 'Thưởng gián tiếp',
    'Đi trường': 'Đi trường',
    'Hành chính MKT': 'Hành chính MKT',
    'Phí cà thẻ': 'Phí cà thẻ',
    'Tiếp khách phòng khám': 'Tiếp khách phòng khám',
    'Tiếp khách ngoài': 'Tiếp khách ngoài',

    // ── Name changes (old → new master) ──
    'Mua đồ hành chính': 'Hành chính',                      // QLDN.10
    'Lương': 'Lương cố định bộ phận văn phòng',             // QLDN.NS.01
    'KPI': 'Thưởng KPI',                                    // QLDN.NS.03
    'Marketing chạy Quảng cáo': 'Marketing chạy quảng cáo', // CPBH.04 (case diff)
    'Quỹ thưởng tổng cuối năm': 'Thưởng tổng cuối năm',    // KHAC.01
    'Chi phí Mặt bằng': 'Thuê mặt bằng',                   // QLDN.01
    'Thuê bằng': 'Thuê bằng bác sĩ',                       // QLDN.03
    'Điện + Nước': 'Điện, nước, wifi',                      // QLDN.09
    'Tiền vật liệu': 'Vật tư nha khoa (điều trị - nội nha - nha chu)', // GIAVON.01
    'Tiền Lab': 'Lab răng sứ',                              // GIAVON.03
    'Tiếp khách': 'Tiếp khách phòng khám',                  // KHAC.05
    'Sửa chữa': 'Bảo trì - sửa chữa - khử khuẩn',        // QLDN.04
    'Quỹ thưởng': 'Thưởng tổng cuối năm',                  // KHAC.01
    'Thuế': 'Phường, quận',                                  // THUE.03
    // Garbage data
    '6': 'Hành chính',
    '3': 'Hành chính',
    '50b test cv': 'Hành chính',
}

async function main() {
    // 1. Get master data lookup
    const { data: masterData } = await supabase.from('master_data').select('*')
    if (!masterData) { console.error('❌ No master data'); process.exit(1) }

    // Build lookup: classify → master row
    const masterLookup = new Map<string, { code: string; category: string; classify: string; expense_type: string }>()
    for (const row of masterData) {
        masterLookup.set(row.classify, row)
    }
    console.log(`📋 Master data: ${masterData.length} items`)

    // 2. Get all unique classify values from expenses
    const { data: expenses } = await supabase
        .from('raw_expenses')
        .select('id, classify, finance, cash_flow')
        .gt('amount', 0)

    if (!expenses) { console.error('❌ No expenses'); process.exit(1) }
    console.log(`📊 Total expense records: ${expenses.length}`)

    // 3. Find unique classify values and check matches
    const classifyValues = [...new Set(expenses.map(e => e.classify).filter(Boolean))]
    console.log(`\n📌 Unique classify values in expenses: ${classifyValues.length}`)

    const matched: string[] = []
    const unmatched: string[] = []

    for (const cv of classifyValues) {
        const alias = CLASSIFY_ALIAS[cv] || cv
        if (masterLookup.has(alias)) {
            matched.push(cv)
        } else {
            unmatched.push(cv)
        }
    }

    console.log(`  ✅ Matched: ${matched.length}`)
    console.log(`  ⚠️  Unmatched: ${unmatched.length}`)
    if (unmatched.length > 0) {
        console.log('\n  Unmatched values:')
        for (const u of unmatched) {
            const count = expenses.filter(e => e.classify === u).length
            console.log(`    - "${u}" (${count} records)`)
        }
    }

    // 4. Update records
    console.log('\n🔧 Updating expense records...')
    let updated = 0
    let skipped = 0

    // Group by classify for batch updates
    for (const cv of matched) {
        const alias = CLASSIFY_ALIAS[cv] || cv
        const master = masterLookup.get(alias)!

        // Find records that need updating (wrong finance or cash_flow)
        const needUpdate = expenses.filter(e =>
            e.classify === cv &&
            (e.finance !== master.category || e.cash_flow !== master.expense_type)
        )

        if (needUpdate.length === 0) {
            skipped += expenses.filter(e => e.classify === cv).length
            continue
        }

        // Batch update by classify — also rename classify if alias differs
        const updatePayload: Record<string, string> = {
            finance: master.category,
            cash_flow: master.expense_type,
        }
        const newClassify = CLASSIFY_ALIAS[cv] || cv
        if (newClassify !== cv) {
            updatePayload.classify = newClassify
        }

        const { error, count } = await supabase
            .from('raw_expenses')
            .update(updatePayload, { count: 'exact' })
            .eq('classify', cv)
            .gt('amount', 0)

        if (error) {
            console.error(`  ❌ Error updating "${cv}":`, error.message)
            continue
        }
        updated += count || 0
        console.log(`  ✅ "${cv}" → finance: "${master.category}", cash_flow: "${master.expense_type}" (${count} rows)`)
    }

    console.log(`\n🎉 Done! Updated ${updated} records, ${skipped} already correct`)
}

main().catch(console.error)
