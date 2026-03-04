// Fix Chi_san October Category/Classify misalignment
// Maps Description → correct (finance, classify) using Chi_TGIL T10 + Chi_san T09 as reference
// Usage: npx tsx scripts/fix-chi-san-oct.ts

import { createClient } from '@supabase/supabase-js'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Correct mapping based on Chi_TGIL T10 and Chi_san T09
// Key: description pattern → { finance, classify, cash_flow }
const CORRECT_MAP: Record<string, { finance: string; classify: string; cash_flow: string }> = {
    'Mua đồ hành chính': { finance: '3. Chi phí quản lý doanh nghiệp', classify: 'Văn phòng phẩm', cash_flow: 'Biến phí' },
    'Tiền thuê xe': { finance: '3. Chi phí quản lý doanh nghiệp', classify: 'Thuê xe, bãi xe', cash_flow: 'Định phí' },
    'bãi xe cty': { finance: '3. Chi phí quản lý doanh nghiệp', classify: 'Thuê xe, bãi xe', cash_flow: 'Biến phí' },
    'điện+nước': { finance: '3. Chi phí quản lý doanh nghiệp', classify: 'Điện, nước, wifi', cash_flow: 'Biến phí' },
    'Cp tiếp khách': { finance: '6. Chi phí khác', classify: 'Tiếp khách phòng khám', cash_flow: 'Biến phí' },
    'tặng phẩm khách': { finance: '2. Chi phí bán hàng', classify: 'Tặng phẩm khách', cash_flow: 'Biến phí' },
    'MKT chạy quảng cáo': { finance: '2. Chi phí bán hàng', classify: 'Marketing chạy quảng cáo', cash_flow: 'Biến phí' },
    'Cp sửa chữa': { finance: '3. Chi phí quản lý doanh nghiệp', classify: 'Bảo trì - sửa chữa - khử khuẩn', cash_flow: 'Biến phí' },
    'Cộng tác viên': { finance: '2. Chi phí bán hàng', classify: 'Chi phí referral/Hoa hồng giới thiệu', cash_flow: 'Biến phí' },
    'Thưởng gián tiếp': { finance: '2. Chi phí bán hàng', classify: 'Thưởng gián tiếp', cash_flow: 'Biến phí' },
    'Đi trường': { finance: '2. Chi phí bán hàng', classify: 'Đi trường', cash_flow: 'Biến phí' },
    'Hành chính MKT': { finance: '2. Chi phí bán hàng', classify: 'Hành chính MKT', cash_flow: 'Biến phí' },
    'Hoa hòng gth': { finance: '2. Chi phí bán hàng', classify: 'Chi phí referral/Hoa hồng giới thiệu', cash_flow: 'Biến phí' },
    'TikTok': { finance: '2. Chi phí bán hàng', classify: 'Chi phí quảng cáo Meta/Google/Tiktok', cash_flow: 'Biến phí' },
    'SEO': { finance: '2. Chi phí bán hàng', classify: 'Chi phí quảng cáo Meta/Google/Tiktok', cash_flow: 'Biến phí' },
    '% của NV': { finance: '4. Chi phí nhân sự', classify: 'Thưởng KPI', cash_flow: 'Biến phí' },
    'Phí cà thẻ': { finance: '6. Chi phí khác', classify: 'Phí cà thẻ', cash_flow: 'Biến phí' },
    'Tiếp khách pK': { finance: '6. Chi phí khác', classify: 'Tiếp khách phòng khám', cash_flow: 'Biến phí' },
    'Lương': { finance: '4. Chi phí nhân sự', classify: 'Lương cố định bộ phận văn phòng', cash_flow: 'Định phí' },
    'Chi phí MB': { finance: '3. Chi phí quản lý doanh nghiệp', classify: 'Thuê mặt bằng', cash_flow: 'Định phí' },
    'Bảo hiểm': { finance: '4. Chi phí nhân sự', classify: 'Bảo hiểm', cash_flow: 'Định phí' },
    'Thuê bằng bs': { finance: '3. Chi phí quản lý doanh nghiệp', classify: 'Thuê bằng bác sĩ', cash_flow: 'Định phí' },
    'chi phí cho quận': { finance: '3. Chi phí quản lý doanh nghiệp', classify: 'Hành chính', cash_flow: 'Biến phí' },
    'thuế': { finance: '3. Chi phí quản lý doanh nghiệp', classify: 'Hành chính', cash_flow: 'Biến phí' },
    'Quỹ thưởng': { finance: '4. Chi phí nhân sự', classify: 'Thưởng nóng, liên hoan', cash_flow: 'Biến phí' },
    'Dự trù phát sinh': { finance: '6. Chi phí khác', classify: 'Quỹ dự phòng', cash_flow: 'Biến phí' },
    'Mua sắm tài sản': { finance: '6. Chi phí khác', classify: 'Mua sắm tài sản', cash_flow: 'Biến phí' },
    'Thưởng nóng+liên hoan': { finance: '4. Chi phí nhân sự', classify: 'Thưởng nóng, liên hoan', cash_flow: 'Biến phí' },
    'Giới thiệu nhân sự': { finance: '2. Chi phí bán hàng', classify: 'Chi phí referral/Hoa hồng giới thiệu', cash_flow: 'Biến phí' },
    'đào tạo nhân sự': { finance: '4. Chi phí nhân sự', classify: 'Đào tạo nhân sự', cash_flow: 'Biến phí' },
    // Material items - keep as-is (these are correct in source)
    'Lab': { finance: '1. Giá vốn hàng bán', classify: 'Lab răng sứ', cash_flow: 'Biến phí' },
    'vật tư': { finance: '1. Giá vốn hàng bán', classify: 'Vật tư nha khoa (điều trị - nội nha - nha chu)', cash_flow: 'Biến phí' },
    'đồ đtt': { finance: '1. Giá vốn hàng bán', classify: 'Vật tư nha khoa (điều trị - nội nha - nha chu)', cash_flow: 'Biến phí' },
    'tiền chất gắn': { finance: '1. Giá vốn hàng bán', classify: 'Vật tư nha khoa (điều trị - nội nha - nha chu)', cash_flow: 'Biến phí' },
    'bóng đèn cực tím': { finance: '1. Giá vốn hàng bán', classify: 'Vật tư nha khoa (điều trị - nội nha - nha chu)', cash_flow: 'Biến phí' },
    'tấm choàng': { finance: '3. Chi phí quản lý doanh nghiệp', classify: 'Văn phòng phẩm', cash_flow: 'Biến phí' },
}

function findMapping(desc: string): typeof CORRECT_MAP[string] | null {
    const lower = desc.toLowerCase()
    for (const [key, val] of Object.entries(CORRECT_MAP)) {
        if (lower.includes(key.toLowerCase())) return val
    }
    return null
}

async function main() {
    // Fetch all San 2025.10 rows
    const { data: rows, error } = await supabase
        .from('raw_expenses')
        .select('*')
        .eq('clinic', 'San')
        .eq('month', '2025.10')

    if (error) { console.error('❌', error.message); process.exit(1) }
    console.log(`📋 Found ${rows?.length} San Oct rows`)

    let fixed = 0
    let skipped = 0

    for (const row of rows || []) {
        const mapping = findMapping(row.description)
        if (!mapping) {
            console.log(`  ⚠️  No mapping for: "${row.description}" (keeping as-is)`)
            skipped++
            continue
        }

        // Check if needs fix
        if (row.finance === mapping.finance && row.classify === mapping.classify && row.cash_flow === mapping.cash_flow) {
            continue // already correct
        }

        console.log(`  🔧 "${row.description}": finance "${row.finance}" → "${mapping.finance}", classify "${row.classify}" → "${mapping.classify}"`)

        const { error: updateErr } = await supabase
            .from('raw_expenses')
            .update({
                finance: mapping.finance,
                classify: mapping.classify,
                cash_flow: mapping.cash_flow,
            })
            .eq('id', row.id)

        if (updateErr) { console.error('❌', updateErr.message); process.exit(1) }
        fixed++
    }

    console.log(`\n🎉 Done! Fixed ${fixed} rows, skipped ${skipped}`)
}

main().catch(console.error)
