// Import Chi_san data from CSV into Supabase raw_expenses
// Usage: npx tsx scripts/import-chi-san.ts

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Parse VND formatted number: "15.933.334" -> 15933334
function parseVND(raw: string): number {
    if (!raw || raw.trim() === '') return 0
    return parseInt(raw.replace(/\./g, ''), 10) || 0
}

interface RawRow {
    month: string    // "01"
    year: string     // "2025"
    amount: string   // "15.933.334"
    description: string
    category: string // "3. Chi phí quản lý doanh nghiệp"
    classify: string // "Văn phòng phẩm"
    expenseType: string // "Biến phí" / "Định phí"
}

function parseCsvLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"'
                i++
            } else {
                inQuotes = !inQuotes
            }
        } else if (ch === ',' && !inQuotes) {
            result.push(current)
            current = ''
        } else {
            current += ch
        }
    }
    result.push(current)
    return result
}

async function main() {
    const csvPath = path.resolve(__dirname, 'chi_san.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvContent.trim().split('\n')

    // Skip header
    const dataLines = lines.slice(1)
    const rows: RawRow[] = dataLines.map(line => {
        const cols = parseCsvLine(line)
        return {
            month: cols[0]?.replace(/"/g, ''),
            year: cols[1]?.replace(/"/g, ''),
            amount: cols[2]?.replace(/"/g, ''),
            description: cols[3]?.replace(/"/g, ''),
            category: cols[4]?.replace(/"/g, ''),
            classify: cols[5]?.replace(/"/g, ''),
            expenseType: cols[6]?.replace(/"/g, ''),
        }
    })

    // Filter only 2025 and non-empty description
    const rows2025 = rows.filter(r => r.year === '2025' && r.description)

    console.log(`📋 Total rows from CSV: ${rows.length}`)
    console.log(`📋 2025 rows to import: ${rows2025.length}`)

    // Step 1: Delete existing San 2025 data
    console.log('\n🗑️  Deleting existing San 2025 expense data...')
    const { error: deleteError, count: deleteCount } = await supabase
        .from('raw_expenses')
        .delete({ count: 'exact' })
        .eq('clinic', 'San')
        .like('month', '2025.%')

    if (deleteError) {
        console.error('❌ Delete failed:', deleteError.message)
        process.exit(1)
    }
    console.log(`✅ Deleted ${deleteCount} existing rows`)

    // Step 2: Insert new data
    const insertData = rows2025
        .filter(r => parseVND(r.amount) > 0) // Skip zero-amount rows
        .map(r => ({
            clinic: 'San',
            month: `${r.year}.${r.month.padStart(2, '0')}`,
            description: r.description,
            classify: r.classify || '',
            amount: parseVND(r.amount),
            cash_flow: r.expenseType || '',
            finance: r.category || '',
        }))

    console.log(`\n📥 Inserting ${insertData.length} rows (non-zero amounts)...`)

    // Insert in batches of 50
    const batchSize = 50
    let inserted = 0
    for (let i = 0; i < insertData.length; i += batchSize) {
        const batch = insertData.slice(i, i + batchSize)
        const { error: insertError } = await supabase
            .from('raw_expenses')
            .insert(batch)

        if (insertError) {
            console.error(`❌ Insert batch ${i / batchSize + 1} failed:`, insertError.message)
            process.exit(1)
        }
        inserted += batch.length
        console.log(`  ✅ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} rows`)
    }

    console.log(`\n🎉 Done! Inserted ${inserted} San expense rows for 2025`)
}

main().catch(console.error)
