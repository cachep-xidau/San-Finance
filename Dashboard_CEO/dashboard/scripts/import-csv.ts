/**
 * Import CSV raw data into Supabase
 * 
 * Usage: npx tsx scripts/import-csv.ts
 * 
 * Prerequisites: Run scripts/create-tables.sql in Supabase Dashboard first
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing env vars. Run with: source .env.local && npx tsx scripts/import-csv.ts')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const CSV_DIR = join(__dirname, '../../')

// ── Helpers ──────────────────────────────────────

function parseVietnameseNumber(str: string): number {
    if (!str || str.trim() === '') return 0
    const cleaned = str.replace(/\./g, '').replace(/,/g, '.').trim()
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : num
}

function parseCSV(content: string): Record<string, string>[] {
    const lines = content.split('\n').filter(l => l.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim())
    const rows: Record<string, string>[] = []

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const row: Record<string, string> = {}
        headers.forEach((h, idx) => {
            row[h] = values[idx] || ''
        })
        rows.push(row)
    }
    return rows
}

async function batchInsert(table: string, rows: Record<string, unknown>[], batchSize = 500) {
    let inserted = 0
    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize)
        const { error } = await supabase.from(table).insert(batch as never[])
        if (error) {
            console.error(`  ❌ Batch ${i}–${i + batch.length} error:`, error.message)
        } else {
            inserted += batch.length
        }
    }
    return inserted
}

// ── Import Functions ─────────────────────────────

async function importMasterData() {
    console.log('\n📋 Importing Master Data...')

    await supabase.from('master_data').delete().neq('id', 0)

    // 2025 format: ID, Phân loại chi, Tài chính, Dòng tiền
    const content2025 = readFileSync(join(CSV_DIR, 'Master_data_2025.csv'), 'utf-8')
    const rows2025 = parseCSV(content2025).map(r => ({
        code: r['ID'] || '',
        classify: r['Phân loại chi'] || '',
        category: r['Tài chính'] || '',
        expense_type: r['Dòng tiền'] || '',
    }))

    // 2026 format: Index, Category, Classify, Expense type
    const content2026 = readFileSync(join(CSV_DIR, 'Master_data_2026.csv'), 'utf-8')
    const rows2026 = parseCSV(content2026).map(r => ({
        code: r['Index'] || '',
        classify: r['Classify'] || '',
        category: r['Category'] || '',
        expense_type: r['Expense type'] || '',
    }))

    const allRows = [...rows2025, ...rows2026]
    const inserted = await batchInsert('master_data', allRows)
    console.log(`  ✅ Imported ${inserted}/${allRows.length} master data rows`)
}

async function importRevenue() {
    console.log('\n💰 Importing Revenue...')

    await supabase.from('raw_revenue').delete().neq('id', 0)

    const clinics = ['San', 'Implant', 'Teennie']
    let totalInserted = 0

    for (const clinic of clinics) {
        const filename = `Doanh thu_${clinic}.csv`
        console.log(`  📄 ${filename}...`)

        const content = readFileSync(join(CSV_DIR, filename), 'utf-8')
        const rawRows = parseCSV(content)

        const rows = rawRows
            .map(r => ({
                clinic,
                month: r['THÁNG'] || '',
                date: r['NGÀY'] || '',
                cash: parseVietnameseNumber(r['TIỀN MẶT']),
                card: parseVietnameseNumber(r['CÀ THẺ']),
                card_net: parseVietnameseNumber(r['THỰC NHẬN CÀ THẺ']),
                transfer: parseVietnameseNumber(r['CHUYỂN KHOẢN']),
                installment: parseVietnameseNumber(r['TRẢ GÓP']),
                deposit: parseVietnameseNumber(r['TRẢ CỌC']),
                total: parseVietnameseNumber(r['TỔNG']),
                total_net: parseVietnameseNumber(r['TỔNG TRỪ PHÍ CÀ THẺ']),
            }))
            .filter(r => r.total > 0)

        const inserted = await batchInsert('raw_revenue', rows)
        totalInserted += inserted
        console.log(`    ✅ ${inserted} rows (${rawRows.length - rows.length} empty filtered)`)
    }

    console.log(`  📊 Total revenue: ${totalInserted} rows`)
}

async function importExpenses() {
    console.log('\n📉 Importing Expenses...')

    await supabase.from('raw_expenses').delete().neq('id', 0)

    const clinics = ['San', 'Implant', 'Teennie']
    let totalInserted = 0

    for (const clinic of clinics) {
        const filename = `Chi_phi_${clinic}.csv`
        console.log(`  📄 ${filename}...`)

        const content = readFileSync(join(CSV_DIR, filename), 'utf-8')
        const rawRows = parseCSV(content)

        const rows = rawRows
            .map(r => ({
                clinic,
                month: r['THÁNG'] || '',
                description: r['NỘI DUNG CHI'] || '',
                classify: r['PHÂN LOẠI'] || '',
                amount: parseVietnameseNumber(r['SỐ TIỀN']),
                cash_flow: r['DÒNG TIỀN'] || '',
                finance: r['TÀI CHÍNH'] || '',
            }))
            .filter(r => r.amount > 0)

        const inserted = await batchInsert('raw_expenses', rows)
        totalInserted += inserted
        console.log(`    ✅ ${inserted} rows (${rawRows.length - rows.length} empty filtered)`)
    }

    console.log(`  📊 Total expenses: ${totalInserted} rows`)
}

// ── Main ─────────────────────────────────────────

async function main() {
    console.log('🚀 S Group CSV Import\n')
    console.log(`  Supabase: ${SUPABASE_URL}`)
    console.log(`  CSV dir:  ${CSV_DIR}\n`)

    await importMasterData()
    await importRevenue()
    await importExpenses()

    console.log('\n✅ Import complete!')
}

main().catch(console.error)
