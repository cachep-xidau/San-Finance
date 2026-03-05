/**
 * Import 2025 revenue data from Google Sheets CSV exports
 * 
 * Usage: source .env.local && npx tsx scripts/import-revenue-2025.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing env vars. Run: source .env.local && npx tsx scripts/import-revenue-2025.ts')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Google Sheets CSV uses quoted fields with dots as thousand separators
function parseGSheetsNumber(str: string): number {
    if (!str) return 0
    const cleaned = str.replace(/"/g, '').replace(/\./g, '').replace(/,/g, '.').trim()
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : num
}

// Parse Google Sheets CSV (handles quoted fields with commas inside)
function parseGSheetsCSV(content: string): Record<string, string>[] {
    const lines = content.split('\n').filter(l => l.trim())
    if (lines.length < 2) return []

    // Parse quoted CSV line
    const parseLine = (line: string): string[] => {
        const result: string[] = []
        let current = ''
        let inQuotes = false
        for (const ch of line) {
            if (ch === '"') { inQuotes = !inQuotes; continue }
            if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue }
            current += ch
        }
        result.push(current.trim())
        return result
    }

    const headers = parseLine(lines[0])
    const rows: Record<string, string>[] = []

    for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i])
        const row: Record<string, string> = {}
        headers.forEach((h, idx) => { row[h] = values[idx] || '' })
        rows.push(row)
    }
    return rows
}

const CSV_DIR = join(__dirname, '../../../')

const FILES = [
    { clinic: 'San', file: 'Doanh thu_San_2025.csv' },
    { clinic: 'Implant', file: 'Doanh thu_TGIL_2025.csv' },
    { clinic: 'Teennie', file: 'Doanh thu_Teennie_2025.csv' },
]

async function main() {
    console.log('🚀 Import 2025 Revenue Data\n')

    // First, delete any existing 2025 revenue data
    console.log('🗑️  Deleting existing 2025 revenue data...')
    const { error: delErr } = await supabase.from('raw_revenue').delete().like('month', '2025.%')
    if (delErr) {
        console.error('  ❌ Delete error:', delErr.message)
    } else {
        console.log('  ✅ Cleared 2025 data')
    }

    let grandTotal = 0

    for (const { clinic, file } of FILES) {
        console.log(`\n📄 ${file} → clinic: ${clinic}`)

        const content = readFileSync(join(CSV_DIR, file), 'utf-8')
        const rawRows = parseGSheetsCSV(content)

        const rows = rawRows.map(r => {
            const thang = r['THÁNG']?.padStart(2, '0') || '01'
            const month = `2025.${thang}`
            return {
                clinic,
                month,
                date: r['NGÀY'] || '',
                cash: parseGSheetsNumber(r['TIỀN MẶT']),
                card: parseGSheetsNumber(r['CÀ THẺ']),
                card_net: parseGSheetsNumber(r['THỰC NHẬN CÀ THẺ']),
                transfer: parseGSheetsNumber(r['CHUYỂN KHOẢN']),
                installment: parseGSheetsNumber(r['TRẢ GÓP']),  // Teennie won't have this → 0
                deposit: parseGSheetsNumber(r['TRẢ CỌC']),
                total: parseGSheetsNumber(r['TỔNG']),
                total_net: parseGSheetsNumber(r['TỔNG TRỪ PHÍ CÀ THẺ']),
            }
        }).filter(r => r.total > 0)

        // Batch insert
        let inserted = 0
        for (let i = 0; i < rows.length; i += 500) {
            const batch = rows.slice(i, i + 500)
            const { error } = await supabase.from('raw_revenue').insert(batch as never[])
            if (error) {
                console.error(`  ❌ Batch error:`, error.message)
            } else {
                inserted += batch.length
            }
        }

        const totalRevenue = rows.reduce((s, r) => s + r.total, 0)
        grandTotal += totalRevenue
        console.log(`  ✅ ${inserted} rows imported (${rawRows.length - rows.length} empty filtered)`)
        console.log(`  💰 Revenue: ${(totalRevenue / 1e9).toFixed(2)} tỷ`)
    }

    console.log(`\n📊 Grand Total 2025 Revenue: ${(grandTotal / 1e9).toFixed(2)} tỷ`)
    console.log('✅ Import complete!')
}

main().catch(console.error)
