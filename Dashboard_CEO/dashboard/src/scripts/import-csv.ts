/**
 * CSV Import Script for S Group Dashboard
 *
 * Usage: npx dotenv-cli -e .env.local -- npx tsx src/scripts/import-csv.ts
 *
 * This script imports:
 * - Expenses from Chi_phi_*.csv files
 * - Revenue from Doanh_thu_*.csv files
 * - Categories from Master_data_2026.csv
 */

import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'
import * as fs from 'fs'
import * as path from 'path'

// Supabase client with service role for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// CSV directory path (relative to project root)
const CSV_DIR = path.resolve(__dirname, '../../..')

// Clinic mapping
const CLINIC_SLUGS: Record<string, string> = {
  'Chi_phi_Implant.csv': 'implant',
  'Chi_phi_San.csv': 'san',
  'Chi_phi_Teennie.csv': 'teennie',
  'Doanh_thu_Implant.csv': 'implant',
  'Doanh_thu_San.csv': 'san',
  'Doanh_thu_Teennie.csv': 'teennie',
}

// Category mapping from Vietnamese to code
const CATEGORY_MAPPING: Record<string, string> = {
  'Tiền vật liệu': 'GIAVON.06',
  'Tiền Lab': 'GIAVON.03',
  'Marketing chạy Quảng cáo': 'CPBH.04',
  'Hoa hồng giới thiệu': 'CPBH.07',
  'KPI': 'QLDN.NS.03',
  'Tặng phẩm khách': 'CPBH.11',
  'Đi trường': 'CPBH.13',
  'Hành chính MKT': 'CPBH.14',
  'SEO': 'CPBH.04',
  'Tiktok': 'CPBH.01',
  'Cộng tác viên': 'CPBH.02',
  'Quỹ thưởng gián tiếp': 'CPBH.12',
  'Chi phí Mặt bằng': 'QLDN.01',
  'Thuê bằng': 'QLDN.03',
  'Sửa chữa': 'QLDN.04',
  'Điện + Nước': 'QLDN.09',
  'Tiền thuê xe': 'QLDN.08',
  'Mua đồ hành chính': 'QLDN.10',
  'Lương': 'QLDN.NS.01',
  'Bảo hiểm': 'QLDN.NS.06',
  'Đào tạo': 'QLDN.NS.08',
  'Mua sắm tài sản': 'KHAC.07',
  'Tiếp khách': 'KHAC.05',
  'tiếp khách': 'KHAC.05',
  'Tiền dự trù phát sinh': 'KHAC.02',
  'Tiền thưởng nóng + liên hoan': 'QLDN.NS.04',
  'Quỹ thưởng tổng cuối năm': 'KHAC.01',
  'Phí cà thẻ': 'KHAC.08',
}

interface ClinicCache {
  [slug: string]: string
}

interface CategoryCache {
  [code: string]: string
}

async function getClinicIds(): Promise<ClinicCache> {
  const { data, error } = await supabase
    .from('clinics')
    .select('id, slug')

  if (error) throw error

  const cache: ClinicCache = {}
  data?.forEach((c: { id: string; slug: string }) => {
    cache[c.slug] = c.id
  })
  return cache
}

async function getCategoryIds(): Promise<CategoryCache> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, code')

  if (error) throw error

  const cache: CategoryCache = {}
  data?.forEach((c: { id: string; code: string }) => {
    cache[c.code] = c.id
  })
  return cache
}

function parseAmount(value: string): number {
  if (!value) return 0
  // Remove dots and convert to number
  const cleaned = value.replace(/\./g, '').replace(/,/g, '.')
  return parseFloat(cleaned) || 0
}

function parseMonth(monthStr: string): { year: number; month: number } {
  // Format: "2024.01" or "202401"
  const parts = monthStr.split('.')
  if (parts.length === 2) {
    return { year: parseInt(parts[0]), month: parseInt(parts[1]) }
  }
  // Try format YYYYMM
  if (monthStr.length === 6) {
    return {
      year: parseInt(monthStr.slice(0, 4)),
      month: parseInt(monthStr.slice(4, 6))
    }
  }
  throw new Error(`Invalid month format: ${monthStr}`)
}

function getMonthDate(monthStr: string): string {
  const { year, month } = parseMonth(monthStr)
  // Return first day of month as ISO date
  return `${year}-${String(month).padStart(2, '0')}-01`
}

async function importExpenses(clinicIds: ClinicCache, categoryIds: CategoryCache) {
  console.log('\n📊 Importing expenses...')

  const expenseFiles = ['Chi_phi_Implant.csv', 'Chi_phi_San.csv', 'Chi_phi_Teennie.csv']
  let totalImported = 0

  for (const file of expenseFiles) {
    const filePath = path.join(CSV_DIR, file)
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  File not found: ${file}`)
      continue
    }

    const clinicSlug = CLINIC_SLUGS[file]
    const clinicId = clinicIds[clinicSlug]
    if (!clinicId) {
      console.log(`  ⚠️  Clinic not found: ${clinicSlug}`)
      continue
    }

    console.log(`  📁 Processing ${file}...`)

    const content = fs.readFileSync(filePath, 'utf-8')
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    }) as Record<string, string>[]

    const expenses: Array<{
      clinic_id: string
      category_id: string
      date: string
      description: string | null
      amount: number
      source_type: string
    }> = []

    for (const record of records) {
      const monthStr = record['THÁNG']
      const description = record['NỘI DUNG CHI']
      const category = record['PHÂN LOẠI']
      const amount = parseAmount(record['SỐ TIỀN'])

      if (!monthStr || amount === 0) continue

      const categoryCode = CATEGORY_MAPPING[category] || 'KHAC.03'
      const categoryId = categoryIds[categoryCode]
      if (!categoryId) continue

      expenses.push({
        clinic_id: clinicId,
        category_id: categoryId,
        date: getMonthDate(monthStr),
        description: description || null,
        amount,
        source_type: 'csv_import',
      })
    }

    // Insert in batches of 1000
    const batchSize = 1000
    for (let i = 0; i < expenses.length; i += batchSize) {
      const batch = expenses.slice(i, i + batchSize)
      const { error } = await supabase
        .from('expenses')
        .insert(batch)

      if (error) {
        console.log(`  ❌ Error inserting batch: ${error.message}`)
      } else {
        totalImported += batch.length
      }
    }

    console.log(`  ✅ Imported ${expenses.length} records from ${file}`)
  }

  console.log(`\n✨ Total expenses imported: ${totalImported}`)
}

async function importRevenue(clinicIds: ClinicCache) {
  console.log('\n💰 Importing revenue...')

  const revenueFiles = ['Doanh_thu_Implant.csv', 'Doanh_thu_San.csv', 'Doanh_thu_Teennie.csv']
  let totalImported = 0

  for (const file of revenueFiles) {
    const filePath = path.join(CSV_DIR, file)
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  File not found: ${file}`)
      continue
    }

    const clinicSlug = CLINIC_SLUGS[file]
    const clinicId = clinicIds[clinicSlug]
    if (!clinicId) {
      console.log(`  ⚠️  Clinic not found: ${clinicSlug}`)
      continue
    }

    console.log(`  📁 Processing ${file}...`)

    const content = fs.readFileSync(filePath, 'utf-8')
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
    }) as Record<string, string>[] as Record<string, string>[]

    const revenueData: Array<{
      clinic_id: string
      date: string
      cash: number
      card: number
      card_net: number
      transfer: number
      installment: number
      deposit: number
      total: number
    }> = []

    for (const record of records) {
      const monthStr = record['THÁNG']
      const dateStr = record['NGÀY']

      if (!monthStr) continue

      let date: string
      if (dateStr) {
        // Parse DD/MM/YYYY format
        const parts = dateStr.split('/')
        if (parts.length === 3) {
          date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
        } else {
          date = getMonthDate(monthStr)
        }
      } else {
        date = getMonthDate(monthStr)
      }

      const cash = parseAmount(record['TIỀN MẶT'])
      const card = parseAmount(record['CÀ THẺ'])
      const cardNet = parseAmount(record['THỰC NHẬN CÀ THẺ'])
      const transfer = parseAmount(record['CHUYỂN KHOẢN'])
      const installment = parseAmount(record['TRẢ GÓP'])
      const deposit = parseAmount(record['TRẢ CỌC'])
      const total = parseAmount(record['TỔNG']) || cash + card + transfer + installment + deposit

      if (total === 0) continue

      revenueData.push({
        clinic_id: clinicId,
        date,
        cash,
        card,
        card_net: cardNet,
        transfer,
        installment,
        deposit,
        total,
      })
    }

    // Insert in batches of 1000
    const batchSize = 1000
    for (let i = 0; i < revenueData.length; i += batchSize) {
      const batch = revenueData.slice(i, i + batchSize)
      const { error } = await supabase
        .from('revenue')
        .insert(batch)

      if (error) {
        console.log(`  ❌ Error inserting batch: ${error.message}`)
      } else {
        totalImported += batch.length
      }
    }

    console.log(`  ✅ Imported ${revenueData.length} records from ${file}`)
  }

  console.log(`\n✨ Total revenue imported: ${totalImported}`)
}

async function main() {
  console.log('🚀 Starting CSV import...')
  console.log(`📁 CSV directory: ${CSV_DIR}`)

  // Get clinic and category IDs
  console.log('\n📋 Fetching clinic and category IDs...')
  const clinicIds = await getClinicIds()
  const categoryIds = await getCategoryIds()

  console.log(`  Found ${Object.keys(clinicIds).length} clinics`)
  console.log(`  Found ${Object.keys(categoryIds).length} categories`)

  // Import expenses
  await importExpenses(clinicIds, categoryIds)

  // Import revenue
  await importRevenue(clinicIds)

  console.log('\n✅ Import complete!')
}

main().catch(console.error)
