// Migrate master_data table: truncate + re-insert 51 rows from new config
// Usage: npx tsx scripts/migrate-master-data.ts

import { createClient } from '@supabase/supabase-js'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// New master data config from Google Sheet (Master_cashflow)
const NEW_MASTER_DATA = [
    { code: 'GIAVON.01', category: '1. Giá vốn hàng bán', classify: 'Vật tư nha khoa (điều trị - nội nha - nha chu)', expense_type: 'Biến phí' },
    { code: 'GIAVON.02', category: '1. Giá vốn hàng bán', classify: 'Vật liệu implant', expense_type: 'Biến phí' },
    { code: 'GIAVON.03', category: '1. Giá vốn hàng bán', classify: 'Lab răng sứ', expense_type: 'Biến phí' },
    { code: 'GIAVON.04', category: '1. Giá vốn hàng bán', classify: 'Mắc cài', expense_type: 'Biến phí' },
    { code: 'GIAVON.05', category: '1. Giá vốn hàng bán', classify: 'Thuốc - hoá chất', expense_type: 'Biến phí' },
    { code: 'GIAVON.06', category: '1. Giá vốn hàng bán', classify: 'Vật tư tiêu hao', expense_type: 'Biến phí' },
    { code: 'GIAVON.07', category: '1. Giá vốn hàng bán', classify: 'Khác', expense_type: 'Biến phí' },
    { code: 'CPBH.01', category: '2. Chi phí bán hàng', classify: 'Chi phí quảng cáo Meta/Google/Tiktok', expense_type: 'Biến phí' },
    { code: 'CPBH.02', category: '2. Chi phí bán hàng', classify: 'Agency hoặc freelancer', expense_type: 'Biến phí' },
    { code: 'CPBH.03', category: '2. Chi phí bán hàng', classify: 'Chi phí sản xuất nội dung', expense_type: 'Biến phí' },
    { code: 'CPBH.04', category: '2. Chi phí bán hàng', classify: 'Marketing chạy quảng cáo', expense_type: 'Biến phí' },
    { code: 'CPBH.05', category: '2. Chi phí bán hàng', classify: 'Chi phí video, hình ảnh', expense_type: 'Biến phí' },
    { code: 'CPBH.06', category: '2. Chi phí bán hàng', classify: 'KOL/KOC', expense_type: 'Biến phí' },
    { code: 'CPBH.07', category: '2. Chi phí bán hàng', classify: 'Chi phí referral/Hoa hồng giới thiệu', expense_type: 'Biến phí' },
    { code: 'CPBH.08', category: '2. Chi phí bán hàng', classify: 'Event marketing', expense_type: 'Biến phí' },
    { code: 'CPBH.09', category: '2. Chi phí bán hàng', classify: 'Quà tặng - voucher', expense_type: 'Biến phí' },
    { code: 'CPBH.10', category: '2. Chi phí bán hàng', classify: 'In ấn POSM', expense_type: 'Biến phí' },
    { code: 'CPBH.11', category: '2. Chi phí bán hàng', classify: 'Tặng phẩm khách', expense_type: 'Biến phí' },
    { code: 'CPBH.12', category: '2. Chi phí bán hàng', classify: 'Thưởng gián tiếp', expense_type: 'Biến phí' },
    { code: 'CPBH.13', category: '2. Chi phí bán hàng', classify: 'Đi trường', expense_type: 'Biến phí' },
    { code: 'CPBH.14', category: '2. Chi phí bán hàng', classify: 'Hành chính MKT', expense_type: 'Biến phí' },
    { code: 'QLDN.01', category: '3. Chi phí quản lý doanh nghiệp', classify: 'Thuê mặt bằng', expense_type: 'Định phí' },
    { code: 'QLDN.02', category: '3. Chi phí quản lý doanh nghiệp', classify: 'Dọn vệ sinh', expense_type: 'Định phí' },
    { code: 'QLDN.03', category: '3. Chi phí quản lý doanh nghiệp', classify: 'Thuê bằng bác sĩ', expense_type: 'Định phí' },
    { code: 'QLDN.04', category: '3. Chi phí quản lý doanh nghiệp', classify: 'Bảo trì - sửa chữa - khử khuẩn', expense_type: 'Biến phí' },
    { code: 'QLDN.05', category: '3. Chi phí quản lý doanh nghiệp', classify: 'Văn phòng phẩm', expense_type: 'Biến phí' },
    { code: 'QLDN.06', category: '3. Chi phí quản lý doanh nghiệp', classify: 'Chi phí phần mềm (CRM, kế toán, cloud)', expense_type: 'Định phí' },
    { code: 'QLDN.07', category: '3. Chi phí quản lý doanh nghiệp', classify: 'Chi phí ngân hàng - POS', expense_type: 'Định phí' },
    { code: 'QLDN.08', category: '3. Chi phí quản lý doanh nghiệp', classify: 'Thuê xe, bãi xe', expense_type: 'Định phí' },
    { code: 'QLDN.09', category: '3. Chi phí quản lý doanh nghiệp', classify: 'Điện, nước, wifi', expense_type: 'Biến phí' },
    { code: 'QLDN.10', category: '3. Chi phí quản lý doanh nghiệp', classify: 'Hành chính', expense_type: 'Biến phí' },
    { code: 'QLDN.NS.01', category: '4. Chi phí nhân sự', classify: 'Lương cố định bộ phận văn phòng', expense_type: 'Định phí' },
    { code: 'QLDN.NS.02', category: '4. Chi phí nhân sự', classify: 'Lương cố định bộ phận kinh doanh', expense_type: 'Định phí' },
    { code: 'QLDN.NS.03', category: '4. Chi phí nhân sự', classify: 'Thưởng KPI', expense_type: 'Biến phí' },
    { code: 'QLDN.NS.04', category: '4. Chi phí nhân sự', classify: 'Thưởng nóng, liên hoan', expense_type: 'Biến phí' },
    { code: 'QLDN.NS.05', category: '4. Chi phí nhân sự', classify: 'Phụ cấp chuyên môn', expense_type: 'Định phí' },
    { code: 'QLDN.NS.06', category: '4. Chi phí nhân sự', classify: 'Bảo hiểm', expense_type: 'Định phí' },
    { code: 'QLDN.NS.07', category: '4. Chi phí nhân sự', classify: 'Thuế TNCN', expense_type: 'Định phí' },
    { code: 'QLDN.NS.08', category: '4. Chi phí nhân sự', classify: 'Đào tạo nhân sự', expense_type: 'Biến phí' },
    { code: 'THUE.01', category: '5. Chi phí thuế và lãi vay', classify: 'Thuế GTGT/ TNCN/ TNDN/ môn bài/ lệ phí..nộp NSNN', expense_type: 'Biến phí' },
    { code: 'THUE.02', category: '5. Chi phí thuế và lãi vay', classify: 'Chi phí lãi vay', expense_type: 'Biến phí' },
    { code: 'THUE.03', category: '5. Chi phí thuế và lãi vay', classify: 'Phường, quận', expense_type: 'Biến phí' },
    { code: 'KHAC.01', category: '6. Chi phí khác', classify: 'Thưởng tổng cuối năm', expense_type: 'Định phí' },
    { code: 'KHAC.02', category: '6. Chi phí khác', classify: 'Quỹ dự phòng', expense_type: 'Biến phí' },
    { code: 'KHAC.03', category: '6. Chi phí khác', classify: 'Chi phí phát sinh bất thường', expense_type: 'Biến phí' },
    { code: 'KHAC.04', category: '6. Chi phí khác', classify: 'Chi phí phúc lợi nội bộ', expense_type: 'Định phí' },
    { code: 'KHAC.05', category: '6. Chi phí khác', classify: 'Tiếp khách phòng khám', expense_type: 'Biến phí' },
    { code: 'KHAC.06', category: '6. Chi phí khác', classify: 'Tiếp khách ngoài', expense_type: 'Biến phí' },
    { code: 'KHAC.07', category: '6. Chi phí khác', classify: 'Mua sắm tài sản', expense_type: 'Biến phí' },
    { code: 'KHAC.08', category: '6. Chi phí khác', classify: 'Phí cà thẻ', expense_type: 'Biến phí' },
    { code: 'KHAC.09', category: '6. Chi phí khác', classify: 'Giới thiệu nhân sự', expense_type: 'Biến phí' },
]

async function main() {
    console.log(`📋 New master data: ${NEW_MASTER_DATA.length} items`)

    // Delete all existing
    console.log('\n🗑️  Deleting existing master data...')
    const { error: delErr, count } = await supabase
        .from('master_data')
        .delete({ count: 'exact' })
        .neq('id', 0) // delete all

    if (delErr) { console.error('❌', delErr.message); process.exit(1) }
    console.log(`✅ Deleted ${count} rows`)

    // Insert new
    console.log(`\n📥 Inserting ${NEW_MASTER_DATA.length} rows...`)
    const { error } = await supabase.from('master_data').insert(NEW_MASTER_DATA)
    if (error) { console.error('❌', error.message); process.exit(1) }

    // Verify
    const { count: newCount } = await supabase
        .from('master_data')
        .select('*', { count: 'exact', head: true })
    console.log(`\n🎉 Done! Master data now has ${newCount} items`)
}

main().catch(console.error)
