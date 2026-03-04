// Import Chi_TGIL data from CSV into Supabase raw_expenses
// Usage: npx tsx scripts/import-chi-tgil.ts

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

function parseVND(raw: string): number {
    if (!raw || raw.trim() === '') return 0
    return parseInt(raw.trim().replace(/\./g, ''), 10) || 0
}

function parseCsvLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"'; i++
            } else { inQuotes = !inQuotes }
        } else if (ch === ',' && !inQuotes) {
            result.push(current); current = ''
        } else { current += ch }
    }
    result.push(current)
    return result
}

async function main() {
    const csvPath = path.resolve(__dirname, 'chi_tgil.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvContent.trim().split('\n')
    const dataLines = lines.slice(1)

    const rows = dataLines.map(line => {
        const cols = parseCsvLine(line)
        return {
            month: cols[0]?.replace(/"/g, '').trim(),
            year: cols[1]?.replace(/"/g, '').trim(),
            amount: cols[2]?.replace(/"/g, '').trim(),
            description: cols[3]?.replace(/"/g, '').trim(),
            category: cols[4]?.replace(/"/g, '').trim(),
            classify: cols[5]?.replace(/"/g, '').trim(),
            expenseType: cols[6]?.replace(/"/g, '').trim(),
        }
    })

    const rows2025 = rows.filter(r => r.year === '2025' && r.description)
    console.log(`📋 Total rows: ${rows.length}, 2025 rows: ${rows2025.length}`)

    console.log('\n🗑️  Deleting existing Implant 2025 expense data...')
    const { error: delErr, count } = await supabase
        .from('raw_expenses')
        .delete({ count: 'exact' })
        .eq('clinic', 'Implant')
        .like('month', '2025.%')

    if (delErr) { console.error('❌', delErr.message); process.exit(1) }
    console.log(`✅ Deleted ${count} rows`)

    const insertData = rows2025
        .filter(r => parseVND(r.amount) > 0)
        .map(r => ({
            clinic: 'Implant',
            month: `${r.year}.${r.month.padStart(2, '0')}`,
            description: r.description,
            classify: r.classify || '',
            amount: parseVND(r.amount),
            cash_flow: r.expenseType || '',
            finance: r.category || '',
        }))

    console.log(`\n📥 Inserting ${insertData.length} rows...`)
    const batchSize = 50
    let inserted = 0
    for (let i = 0; i < insertData.length; i += batchSize) {
        const batch = insertData.slice(i, i + batchSize)
        const { error } = await supabase.from('raw_expenses').insert(batch)
        if (error) { console.error('❌', error.message); process.exit(1) }
        inserted += batch.length
        console.log(`  ✅ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} rows`)
    }
    console.log(`\n🎉 Done! Inserted ${inserted} Implant expense rows for 2025`)
}

main().catch(console.error)
