// Import 2026 data for Teennie and TGIL (expenses + revenue)
// Usage: npx tsx scripts/import-2026-data.ts

import { createClient } from '@supabase/supabase-js'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

function parseVND(raw: string): number {
    if (!raw) return 0
    const cleaned = raw.trim().replace(/\s/g, '')
    if (cleaned === '-' || cleaned === '' || cleaned === '0') return 0
    return parseInt(cleaned.replace(/\./g, ''), 10) || 0
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
    return result.map(v => v.replace(/^"|"$/g, '').trim())
}

// ── Expense data ──────────────────────────────────────────────

const CHI_TEENNIE = `"01","2026","356.000.000","chạy qc","2. Chi phí bán hàng","Marketing chạy quảng cáo","Biến phí"
"01","2026","31.500.000","Vít chỉnh nha","1. Giá vốn hàng bán","Vật tư tiêu hao","Biến phí"
"01","2026","109.388.667","Thuốc tê xanh, Nhận Thun Liên Hàm Teennie, thun và dây cung morelli, thun seadent","1. Giá vốn hàng bán","Vật tư tiêu hao","Biến phí"
"01","2026","4.025.000","Gửi xe NV tháng 12","3. Chi phí quản lý doanh nghiệp","Thuê xe, bãi xe","Định phí"
"01","2026","28.086.000","tiếp khách ngoài","6. Chi phí khác","Tiếp khách ngoài","Biến phí"
"01","2026","22.500.000","crm","3. Chi phí quản lý doanh nghiệp","Chi phí phần mềm (CRM, kế toán, cloud)","Định phí"
"01","2026","18.000.000","phí giới thiệu","2. Chi phí bán hàng","Chi phí referral/Hoa hồng giới thiệu","Biến phí"
"01","2026","32.813.500","chi phí hành chính","3. Chi phí quản lý doanh nghiệp","Hành chính","Biến phí"
"01","2026","6.989.515","phí cà thẻ","6. Chi phí khác","Phí cà thẻ","Biến phí"
"01","2026","22.000.000","bằng bs Huân","3. Chi phí quản lý doanh nghiệp","Thuê bằng bác sĩ","Định phí"
"01","2026","15.275.000","hành chính MKT","2. Chi phí bán hàng","Hành chính MKT","Biến phí"
"01","2026","128763375","tiền mb","3. Chi phí quản lý doanh nghiệp","Thuê mặt bằng","Định phí"
"01","2026","6.784.000","tiếp khách pk","6. Chi phí khác","Tiếp khách phòng khám","Biến phí"
"01","2026","19.742.000","Bảo trì - sửa chữa - khử khuẩn","3. Chi phí quản lý doanh nghiệp","Bảo trì - sửa chữa - khử khuẩn","Biến phí"
"01","2026","73.186.000","Kin, thuốc, túi chườm, mua cao su lấy dấu,vật liệu, mũi khoan, kim và gạc y tế, tiền thuốc PT,túi zip bạc phụ tá, kéo cắt hàm duy trì","1. Giá vốn hàng bán","Vật tư tiêu hao","Biến phí"
"01","2026","28.933.628","tiền điện, nước, wifi","3. Chi phí quản lý doanh nghiệp","Điện, nước, wifi","Biến phí"
"01","2026","30.250.000","phường quận","5. Chi phí thuế và lãi vay","Phường, quận","Biến phí"
"01","2026","56432000","mua khâu","1. Giá vốn hàng bán","Vật tư tiêu hao","Biến phí"
"01","2026","6.000.000","đào tạo","4. Chi phí nhân sự","Đào tạo nhân sự","Biến phí"
"01","2026","1.500.000","gth NV","6. Chi phí khác","Giới thiệu nhân sự","Biến phí"
"01","2026","9.433.000","thưởng nóng liên hoan","4. Chi phí nhân sự","Thưởng nóng, liên hoan","Biến phí"
"01","2026","13.200.000","Túi giấy teennie","2. Chi phí bán hàng","Hành chính MKT","Biến phí"
"01","2026","2.132.000","Bao thư lớn Teennie","2. Chi phí bán hàng","Hành chính MKT","Biến phí"
"01","2026","20.000.000","tặng phẩm khách","2. Chi phí bán hàng","Tặng phẩm khách","Biến phí"
"01","2026","18.270.000","cọc túi vải teennie","2. Chi phí bán hàng","Hành chính MKT","Biến phí"
"01","2026","75.000.000","trích thưởng","6. Chi phí khác","Thưởng tổng cuối năm","Định phí"
"01","2026","5.498.750","Ly giấy","3. Chi phí quản lý doanh nghiệp","Hành chính","Biến phí"
"01","2026","24.240.000","Nhựa hàm duy trì, kềm Teennie","1. Giá vốn hàng bán","Vật tư tiêu hao","Biến phí"
"01","2026","45.226.667","BHXH T1/26","4. Chi phí nhân sự","Bảo hiểm","Định phí"
"01","2026","980.000","bàn đạp máy cạo vôi","6. Chi phí khác","Mua sắm tài sản","Biến phí"
"01","2026","427.000","usb wifi","6. Chi phí khác","Mua sắm tài sản","Biến phí"
"01","2026","196.918.958","thuế quý 4/25","5. Chi phí thuế và lãi vay","Thuế GTGT/ TNCN/ TNDN/ môn bài/ lệ phí..nộp NSNN","Biến phí"
"01","2026","10.000.000","thưởng gián tiếp","2. Chi phí bán hàng","Thưởng gián tiếp","Biến phí"
"01","2026","481.292.314","lương nv","4. Chi phí nhân sự","Lương cố định bộ phận văn phòng","Định phí"
"01","2026","1.077.754.724","kpi","4. Chi phí nhân sự","Thưởng KPI","Biến phí"
"02","2026","135.000.000","Qc teennie","2. Chi phí bán hàng","Chi phí quảng cáo Meta/Google/Tiktok","Biến phí"
"02","2026","4.100.000","gửi xe máy NV tháng 1","3. Chi phí quản lý doanh nghiệp","Thuê xe, bãi xe","Định phí"
"02","2026","42105000","thun chuỗi","1. Giá vốn hàng bán","Vật tư tiêu hao","Biến phí"
"02","2026","85.265.000","mua kềm cắt dây cung, Minivis, mua mc, sáp nha khoa","1. Giá vốn hàng bán","Vật tư tiêu hao","Biến phí"
"02","2026","2.686.103","phí cà thẻ","6. Chi phí khác","Phí cà thẻ","Biến phí"
"02","2026","30.834.000","tiếp khách ngoài","6. Chi phí khác","Tiếp khách ngoài","Biến phí"
"02","2026","13.597.000","grab, tiếp khách pk","6. Chi phí khác","Tiếp khách phòng khám","Biến phí"
"02","2026","22.000.000","bằng bs Huân","3. Chi phí quản lý doanh nghiệp","Thuê bằng bác sĩ","Định phí"
"02","2026","127.286.250","tiền mb","3. Chi phí quản lý doanh nghiệp","Thuê mặt bằng","Định phí"
"02","2026","18.017.000","hành chính MKT","2. Chi phí bán hàng","Hành chính MKT","Biến phí"
"02","2026","25.795.000","sữa chữa, bảo trì","3. Chi phí quản lý doanh nghiệp","Bảo trì - sửa chữa - khử khuẩn","Biến phí"
"02","2026","25.100.000","quận, phường","5. Chi phí thuế và lãi vay","Phường, quận","Biến phí"
"02","2026","17.500.000","thưởng nóng liên hoan","4. Chi phí nhân sự","Thưởng nóng, liên hoan","Biến phí"
"02","2026","1.790.000","gương chụp hình trong miệng","1. Giá vốn hàng bán","Vật tư tiêu hao","Biến phí"
"02","2026","41.419.000","cp hành chính","3. Chi phí quản lý doanh nghiệp","Hành chính","Biến phí"
"02","2026","8.817.984","Phí mail 1 năm","3. Chi phí quản lý doanh nghiệp","Chi phí phần mềm (CRM, kế toán, cloud)","Định phí"
"02","2026","17.000.000","phí gth","2. Chi phí bán hàng","Chi phí referral/Hoa hồng giới thiệu","Biến phí"
"02","2026","35.043.755","tiền điện, nước, wifi","3. Chi phí quản lý doanh nghiệp","Điện, nước, wifi","Biến phí"
"02","2026","29.947.000","Vật tư tiêu hao t1/26","1. Giá vốn hàng bán","Vật tư tiêu hao","Biến phí"
"02","2026","3.300.000","đào tạo","4. Chi phí nhân sự","Đào tạo nhân sự","Biến phí"
"02","2026","61.560.000","tặng phẩm khách","2. Chi phí bán hàng","Tặng phẩm khách","Biến phí"`

const CHI_TGIL = `"01","2026","4.025.000","Gửi xe NV tháng 12","3. Chi phí quản lý doanh nghiệp","Thuê xe, bãi xe","Định phí"
"01","2026","26.836.000","tiếp khách ngoài","6. Chi phí khác","Tiếp khách ngoài","Biến phí"
"01","2026","22.500.000","crm","3. Chi phí quản lý doanh nghiệp","Chi phí phần mềm (CRM, kế toán, cloud)","Định phí"
"01","2026","77.016.334","Thuốc tê xanh, màn xương, mực in máng, mũi khoan, kim và gạc y tế","1. Giá vốn hàng bán","Vật tư tiêu hao","Biến phí"
"01","2026","79.938.750","phi giới thiệu","2. Chi phí bán hàng","Chi phí referral/Hoa hồng giới thiệu","Biến phí"
"01","2026","448.000.000","Nạp chạy qc","2. Chi phí bán hàng","Marketing chạy quảng cáo","Biến phí"
"01","2026","33.413.500","chi phí hành chính","3. Chi phí quản lý doanh nghiệp","Hành chính","Biến phí"
"01","2026","32.400.000","hoàn tất thủ tục sáp nhập","3. Chi phí quản lý doanh nghiệp","Hành chính","Biến phí"
"01","2026","97.596.833","dụng cụ trám R, kin, chổi đánh bóng nha khoa + đèn dẫn quang, thuốc, túi chườm, composite medent, mua nước muối + dây truyền dịch, mua cây nạo nha chu, đổi bình oxi phòng diều trị,thuốc,túi zip bạc phụ tá","1. Giá vốn hàng bán","Vật tư tiêu hao","Biến phí"
"01","2026","1.625.000","chi tiền đóng phạt xe a Đức","3. Chi phí quản lý doanh nghiệp","Thuê xe, bãi xe","Định phí"
"01","2026","27.666.000","grab, tiếp khách pk","6. Chi phí khác","Tiếp khách phòng khám","Biến phí"
"01","2026","24.347.904","phí cà thẻ","6. Chi phí khác","Phí cà thẻ","Biến phí"
"01","2026","40.000.000","thuê bằng bs","3. Chi phí quản lý doanh nghiệp","Thuê bằng bác sĩ","Định phí"
"01","2026","32.449.000","hành chính MKT","2. Chi phí bán hàng","Hành chính MKT","Biến phí"
"01","2026","257.526.750","tiền mb","3. Chi phí quản lý doanh nghiệp","Thuê mặt bằng","Định phí"
"01","2026","44.616.000","thuê xe cty","3. Chi phí quản lý doanh nghiệp","Thuê xe, bãi xe","Định phí"
"01","2026","82.024.000","Hd biotem+Multy, cylinder","1. Giá vốn hàng bán","Vật liệu implant","Biến phí"
"01","2026","17.100.000","Bảo trì - sửa chữa - khử khuẩn","3. Chi phí quản lý doanh nghiệp","Bảo trì - sửa chữa - khử khuẩn","Biến phí"
"01","2026","720.420.000","lab","1. Giá vốn hàng bán","Lab răng sứ","Biến phí"
"01","2026","28.933.628","tiền điện, nước, wifi","3. Chi phí quản lý doanh nghiệp","Điện, nước, wifi","Biến phí"
"01","2026","25920000","2 trụ nobel","1. Giá vốn hàng bán","Vật liệu implant","Biến phí"
"01","2026","30.250.000","phường quận","5. Chi phí thuế và lãi vay","Phường, quận","Biến phí"
"01","2026","11.533.000","thưởng nóng liên hoan","4. Chi phí nhân sự","Thưởng nóng, liên hoan","Biến phí"
"01","2026","400000","chụp phim+xnm","1. Giá vốn hàng bán","Vật tư tiêu hao","Biến phí"
"01","2026","59.040.000","hd trụ JD","1. Giá vốn hàng bán","Vật liệu implant","Biến phí"
"01","2026","37.867.425","pin+template+scanbody+chênh lệch muti+cylinder của JD","1. Giá vốn hàng bán","Vật liệu implant","Biến phí"
"01","2026","15.000.000","Trâm máy nội nha","1. Giá vốn hàng bán","Vật tư tiêu hao","Biến phí"
"01","2026","6.000.000","đào tạo","4. Chi phí nhân sự","Đào tạo nhân sự","Biến phí"
"01","2026","4.860.000","bãi xe cty","3. Chi phí quản lý doanh nghiệp","Thuê xe, bãi xe","Định phí"
"01","2026","6419200","Xnm, chụp phim khách","1. Giá vốn hàng bán","Vật tư tiêu hao","Biến phí"
"01","2026","1500000","gth NV","6. Chi phí khác","Giới thiệu nhân sự","Biến phí"
"01","2026","127.176.000","vật liệu T12/25","1. Giá vốn hàng bán","Vật tư tiêu hao","Biến phí"
"01","2026","11.000.000","tặng phẩm khách","2. Chi phí bán hàng","Tặng phẩm khách","Biến phí"
"01","2026","50.000.000","trích thưởng","6. Chi phí khác","Thưởng tổng cuối năm","Định phí"
"01","2026","25.596.000","tiktok","2. Chi phí bán hàng","Chi phí quảng cáo Meta/Google/Tiktok","Biến phí"
"01","2026","73.375.000","tt đợt 3/9 strauman","1. Giá vốn hàng bán","Vật liệu implant","Biến phí"
"01","2026","8.350.000","xương osteobiol","1. Giá vốn hàng bán","Vật liệu implant","Biến phí"
"01","2026","5.498.750","Ly giấy","3. Chi phí quản lý doanh nghiệp","Hành chính","Biến phí"
"01","2026","46.621.500","Xương zimmer+hd xương đợt cuối Việt Đăng","1. Giá vốn hàng bán","Vật tư tiêu hao","Biến phí"
"01","2026","90.453.333","BHXH T1/26","4. Chi phí nhân sự","Bảo hiểm","Định phí"
"01","2026","8000000","mua tay khoan","6. Chi phí khác","Mua sắm tài sản","Biến phí"
"01","2026","1.000.000","xăng xe chú Đức(xe điện bảo trì lấy xe xăng chạy)","3. Chi phí quản lý doanh nghiệp","Thuê xe, bãi xe","Định phí"
"01","2026","65.311.185","thuế quý 4/25","5. Chi phí thuế và lãi vay","Thuế GTGT/ TNCN/ TNDN/ môn bài/ lệ phí..nộp NSNN","Biến phí"
"01","2026","10.000.000","thưởng gián tiếp","2. Chi phí bán hàng","Thưởng gián tiếp","Biến phí"
"01","2026","956.044.429","lương nv","4. Chi phí nhân sự","Lương cố định bộ phận văn phòng","Định phí"
"01","2026","775.182.369","kpi","4. Chi phí nhân sự","Thưởng KPI","Biến phí"
"02","2026","211000000","Qc tgip","2. Chi phí bán hàng","Marketing chạy quảng cáo","Biến phí"
"02","2026","4100000","gửi xe máy NV tháng 1","3. Chi phí quản lý doanh nghiệp","Thuê xe, bãi xe","Định phí"
"02","2026","21460000","xi măng gắn răng","1. Giá vốn hàng bán","Vật tư tiêu hao","Biến phí"
"02","2026","77.520.000","hd chân bướm+gò má","1. Giá vốn hàng bán","Vật liệu implant","Biến phí"
"02","2026","9900000","multy imp gò má","1. Giá vốn hàng bán","Vật liệu implant","Biến phí"
"02","2026","26.469.303","phí cà thẻ","6. Chi phí khác","Phí cà thẻ","Biến phí"
"02","2026","27221000","tiếp khách ngoài","6. Chi phí khác","Tiếp khách ngoài","Biến phí"
"02","2026","19.522.000","grab, tiếp khách pk","6. Chi phí khác","Tiếp khách phòng khám","Biến phí"
"02","2026","74.134.600","XNM, đồ trám răng, thuốc, tiền mê, vật liệu đtt, chụp phim khách, đánh bóng răng, chất gắn tạm 3M","1. Giá vốn hàng bán","Vật tư tiêu hao","Biến phí"
"02","2026","40.000.000","thuê bằng bs","3. Chi phí quản lý doanh nghiệp","Thuê bằng bác sĩ","Định phí"
"02","2026","254.572.500","tiền mb","3. Chi phí quản lý doanh nghiệp","Thuê mặt bằng","Định phí"
"02","2026","17.154.000","hành chính MKT","2. Chi phí bán hàng","Hành chính MKT","Biến phí"
"02","2026","28995000","sữa chửa bảo trì","3. Chi phí quản lý doanh nghiệp","Bảo trì - sửa chữa - khử khuẩn","Biến phí"
"02","2026","20000000","quận, phường","5. Chi phí thuế và lãi vay","Phường, quận","Biến phí"
"02","2026","17500000","thưởng nóng liên hoan","4. Chi phí nhân sự","Thưởng nóng, liên hoan","Biến phí"
"02","2026","40.505.000","cp Hành chính","3. Chi phí quản lý doanh nghiệp","Hành chính","Biến phí"
"02","2026","45.600.000","kí hd SIC","1. Giá vốn hàng bán","Vật liệu implant","Biến phí"
"02","2026","29.094.000","Xe cty","3. Chi phí quản lý doanh nghiệp","Thuê xe, bãi xe","Định phí"
"02","2026","8.817.984","Phí mail 1 năm","3. Chi phí quản lý doanh nghiệp","Chi phí phần mềm (CRM, kế toán, cloud)","Định phí"
"02","2026","26.649.875","phí gth","2. Chi phí bán hàng","Chi phí referral/Hoa hồng giới thiệu","Biến phí"
"02","2026","5030000","lab","1. Giá vốn hàng bán","Lab răng sứ","Biến phí"
"02","2026","3500000","Hs xử lý nc thải","3. Chi phí quản lý doanh nghiệp","Hành chính","Biến phí"
"02","2026","4860000","Rửa xe+gui xe","3. Chi phí quản lý doanh nghiệp","Thuê xe, bãi xe","Định phí"
"02","2026","35043755","tiền điện, nước, wifi","3. Chi phí quản lý doanh nghiệp","Điện, nước, wifi","Biến phí"
"02","2026","145.183.000","Vật tư tiêu hao t1/26","1. Giá vốn hàng bán","Vật tư tiêu hao","Biến phí"
"02","2026","25.596.000","tiktok","2. Chi phí bán hàng","Chi phí quảng cáo Meta/Google/Tiktok","Biến phí"
"02","2026","3.300.000","đào tạo","4. Chi phí nhân sự","Đào tạo nhân sự","Biến phí"`

// ── Revenue data (inline as parsed objects) ──────────────────

function parseRevenueLine(line: string, clinic: string, hasInstallment: boolean) {
    const cols = parseCsvLine(line)
    const month = cols[0]
    const year = cols[1]
    const date = cols[2]
    const cash = parseVND(cols[3])
    const card = parseVND(cols[4])
    const card_net = parseVND(cols[5])
    const transfer = parseVND(cols[6])
    let installment = 0, deposit = 0, total = 0, total_net = 0

    if (hasInstallment) {
        // Thu_TGIL: THÁNG,NĂM,NGÀY,TIỀN MẶT,CÀ THẺ,THỰC NHẬN CÀ THẺ,CHUYỂN KHOẢN,TRẢ GÓP,TRẢ CỌC,TỔNG,TỔNG TRỪ PHÍ CÀ THẺ
        installment = parseVND(cols[7])
        deposit = parseVND(cols[8])
        total = parseVND(cols[9])
        total_net = parseVND(cols[10])
    } else {
        // Thu_Teennie: THÁNG,NĂM,NGÀY,TIỀN MẶT,CÀ THẺ,THỰC NHẬN CÀ THẺ,CHUYỂN KHOẢN,TRẢ CỌC,TỔNG,TỔNG TRỪ PHÍ CÀ THẺ
        deposit = parseVND(cols[7])
        total = parseVND(cols[8])
        total_net = parseVND(cols[9])
    }

    if (total === 0) return null

    return {
        clinic,
        month: `${year}.${month.padStart(2, '0')}`,
        date,
        cash,
        card,
        card_net,
        transfer,
        installment,
        deposit,
        total,
        total_net,
    }
}

function parseExpenseLine(line: string, clinic: string) {
    const cols = parseCsvLine(line)
    const month = cols[0]
    const year = cols[1]
    const amount = parseVND(cols[2])
    if (amount === 0) return null
    return {
        clinic,
        month: `${year}.${month.padStart(2, '0')}`,
        description: cols[3],
        classify: cols[5],
        amount,
        cash_flow: cols[6],
        finance: cols[4],
    }
}

// Thu_Teennie raw CSV
const THU_TEENNIE = `"01","2026","02/01/2026","2.245.000","5.286.000","5.182.852","72.528.000","","80.059.000","79.955.852"
"01","2026","03/01/2026","17.251.000","19.450.000","18.945.450","116.748.000","","153.449.000","152.944.450"
"01","2026","04/01/2026","45.231.000","6.417.000","6.256.575","91.191.000","","142.839.000","142.678.575"
"01","2026","05/01/2026","2.228.000","7.650.000","7.457.095","70.379.000","","80.257.000","80.064.095"
"01","2026","06/01/2026","15.441.000","","","47.541.000","470.000","62.512.000","62.512.000"
"01","2026","07/01/2026","19.082.000","3.330.000","3.265.065","110.373.000","","132.785.000","132.720.065"
"01","2026","08/01/2026","20.509.000","10.861.000","10.588.475","52.881.500","400.000","83.851.500","83.578.975"
"01","2026","09/01/2026","17.670.000","6.075.000","5.923.125","67.267.000","","91.012.000","90.860.125"
"01","2026","10/01/2026","6.780.000","2.405.000","2.344.875","97.728.000","500.000","106.413.000","106.352.875"
"01","2026","11/01/2026","50.598.000","14.258.000","13.901.550","115.014.695","","179.870.695","179.514.245"
"01","2026","12/01/2026","17.476.000","12.280.000","11.973.000","55.972.000","1.000.000","84.728.000","84.421.000"
"01","2026","13/01/2026","18.583.000","7.375.000","7.217.825","29.460.000","500.000","54.918.000","54.760.825"
"01","2026","14/01/2026","10.555.000","3.400.000","3.346.450","110.476.000","","124.431.000","124.377.450"
"01","2026","15/01/2026","5.375.000","500.000","496.000","99.112.000","","104.987.000","104.983.000"
"01","2026","16/01/2026","24.982.000","9.080.000","8.853.000","91.718.000","","125.780.000","125.553.000"
"01","2026","17/01/2026","41.493.000","6.844.000","6.672.900","62.680.000","","111.017.000","110.845.900"
"01","2026","18/01/2026","30.738.000","7.468.500","7.276.183","119.150.000","","157.356.500","157.164.183"
"01","2026","19/01/2026","2.275.000","4.790.000","4.670.250","15.080.000","","22.145.000","22.025.250"
"01","2026","20/01/2026","7.432.000","8.065.000","7.898.395","78.960.000","","94.457.000","94.290.395"
"01","2026","21/01/2026","9.468.000","3.758.000","3.664.050","57.664.333","","70.890.333","70.796.383"
"01","2026","22/01/2026","23.916.000","3.533.000","3.444.675","58.824.666","","86.273.666","86.185.341"
"01","2026","23/01/2026","8.456.000","6.595.000","6.430.125","44.651.909","","59.702.909","59.538.034"
"01","2026","24/01/2026","91.662.000","53.543.000","52.204.425","85.313.909","","230.518.909","229.180.334"
"01","2026","25/01/2026","18.358.000","13.552.666","13.213.849","79.481.000","","111.391.666","111.052.849"
"01","2026","26/01/2026","10.739.000","40.692.000","39.706.375","31.735.818","","83.166.818","82.181.193"
"01","2026","27/01/2026","16.271.000","1.916.000","1.868.100","73.970.000","","92.157.000","92.109.100"
"01","2026","28/01/2026","18.135.000","4.660.000","4.543.500","77.576.000","","100.371.000","100.254.500"
"01","2026","29/01/2026","20.579.000","2.630.000","2.564.250","38.692.000","","61.901.000","61.835.250"
"01","2026","30/01/2026","9.345.714","5.233.000","5.088.625","31.844.000","","46.422.714","46.278.339"
"01","2026","31/01/2026","17.962.000","13.575.500","13.236.112","85.057.000","","116.594.500","116.255.112"
"02","2026","01/02/2026","22.134.000","14.002.000","13.651.950","106.115.000","","142.251.000","141.900.950"
"02","2026","02/02/2026","9.910.000","15.143.000","14.791.825","96.761.000","","121.814.000","121.462.825"
"02","2026","03/02/2026","11.157.000","490.000","479.097","93.272.000","","104.919.000","104.908.097"
"02","2026","04/02/2026","17.420.000","18.181.000","17.826.470","117.130.000","","152.731.000","152.376.470"
"02","2026","05/02/2026","15.160.000","2.055.000","2.014.927","67.971.000","","85.186.000","85.145.927"
"02","2026","06/02/2026","6.090.000","6.736.000","6.604.648","63.133.000","","75.959.000","75.827.648"
"02","2026","07/02/2026","34.353.000","10.455.000","10.257.127","80.141.000","","124.949.000","124.751.127"
"02","2026","08/02/2026","29.045.000","21.585.000","21.155.622","66.749.695","","117.379.695","116.950.317"
"02","2026","09/02/2026","8.113.000","3.262.000","3.198.391","42.948.833","","54.323.833","54.260.224"
"02","2026","10/02/2026","10.543.000","4.670.000","4.578.934","93.072.000","1.500.000","106.785.000","106.693.934"
"02","2026","11/02/2026","2.885.000","3.750.000","3.676.875","42.485.000","","49.120.000","49.046.875"
"02","2026","12/02/2026","385.000","3.205.000","3.142.502","41.045.000","","44.635.000","44.572.502"
"02","2026","26/02/2026","19.001.000","44.540.000","44.225.160","71.492.000","","135.033.000","134.718.160"
"02","2026","27/02/2026","6.456.666","4.250.000","4.167.125","27.451.000","1.000.000","37.157.666","37.074.791"
"02","2026","28/02/2026","23.707.000","6.808.000","6.675.244","134.909.000","","165.424.000","165.291.244"`

const THU_TGIL = `"01","2026","02/01/2026","39.145.000","4.870.000","4.748.250","15.990.000","","","60.005.000","59.883.250"
"01","2026","03/01/2026","8.150.000","1.350.000","1.316.250","50.208.500","","","59.708.500","59.674.750"
"01","2026","04/01/2026","8.280.000","350.000","341.250","41.665.000","","5.335.000","44.960.000","44.951.250"
"01","2026","05/01/2026","2.200.000","16.080.000","15.829.860","62.545.000","","","80.825.000","80.574.860"
"01","2026","06/01/2026","16.390.000","950.000","923.400","45.712.000","","","63.052.000","63.025.400"
"01","2026","07/01/2026","21.204.000","6.940.000","6.766.500","9.420.000","","","37.564.000","37.390.500"
"01","2026","08/01/2026","135.150.000","6.640.000","6.525.000","25.189.800","42.080.000","17.000.000","192.059.800","191.944.800"
"01","2026","09/01/2026","10.392.500","201.600.000","195.955.200","164.841.000","","","376.833.500","371.188.700"
"01","2026","10/01/2026","8.130.000","61.000.000","59.920.000","120.536.000","","","189.666.000","188.586.000"
"01","2026","11/01/2026","18.050.000","46.890.000","45.586.530","54.717.500","","","119.657.500","118.354.030"
"01","2026","12/01/2026","13.357.500","7.938.000","7.739.550","466.762.500","","1.617.000","486.441.000","486.242.550"
"01","2026","13/01/2026","228.007.000","3.240.000","3.159.000","103.586.500","","","334.833.500","334.752.500"
"01","2026","14/01/2026","208.183.000","","","15.530.000","","","223.713.000","223.713.000"
"01","2026","15/01/2026","191.850.000","48.811.000","47.747.344","98.778.000","","","339.439.000","338.375.344"
"01","2026","16/01/2026","17.625.000","25.244.500","24.606.247","25.788.000","","","68.657.500","68.019.247"
"01","2026","17/01/2026","11.395.000","12.430.000","12.119.250","80.423.500","","","104.248.500","103.937.750"
"01","2026","18/01/2026","79.805.000","20.781.000","20.201.475","137.727.500","","","238.313.500","237.733.975"
"01","2026","19/01/2026","11.495.000","5.150.000","5.021.250","58.440.000","","","75.085.000","74.956.250"
"01","2026","20/01/2026","152.089.000","20.752.000","20.216.700","25.339.000","","","198.180.000","197.644.700"
"01","2026","21/01/2026","151.160.000","49.840.000","48.594.000","138.238.500","","","339.238.500","337.992.500"
"01","2026","22/01/2026","22.420.000","7.400.000","7.215.000","95.349.000","122.225.000","","247.394.000","247.209.000"
"01","2026","23/01/2026","71.195.000","6.111.000","5.958.225","28.998.500","","","106.304.500","106.151.725"
"01","2026","24/01/2026","16.845.000","4.300.000","4.182.600","45.997.500","","","67.142.500","67.025.100"
"01","2026","25/01/2026","14.063.750","385.000","375.375","32.896.500","","","47.345.250","47.335.625"
"01","2026","26/01/2026","26.183.000","121.036.000","118.010.100","87.651.000","","","234.870.000","231.844.100"
"01","2026","27/01/2026","12.055.000","","","33.760.000","","","45.815.000","45.815.000"
"01","2026","28/01/2026","76.600.000","79.966.000","78.111.162","30.005.000","","","186.571.000","184.716.162"
"01","2026","29/01/2026","6.300.000","75.620.000","73.729.500","52.150.000","","","134.070.000","132.179.500"
"01","2026","30/01/2026","293.740.000","71.881.500","70.337.618","55.865.000","","","421.486.500","419.942.618"
"01","2026","31/01/2026","188.329.000","76.380.000","74.351.460","27.410.000","","","292.119.000","290.090.460"
"02","2026","01/02/2026","151.680.000","9.435.000","9.199.125","149.612.000","","","310.727.000","310.491.125"
"02","2026","02/02/2026","60.612.500","14.370.000","14.010.750","243.440.000","","","318.422.500","318.063.250"
"02","2026","03/02/2026","15.475.000","96.735.000","94.316.625","62.878.000","9.580.000","","184.668.000","182.249.625"
"02","2026","04/02/2026","8.740.000","6.341.000","6.181.275","70.964.000","","5.500.000","80.545.000","80.385.275"
"02","2026","05/02/2026","155.355.000","1.045.000","1.015.740","76.753.500","","","233.153.500","233.124.240"
"02","2026","06/02/2026","24.730.000","7.930.000","7.728.450","123.501.500","","","156.161.500","155.959.950"
"02","2026","07/02/2026","76.130.500","550.000","536.250","24.605.000","","5.600.000","95.685.500","95.671.750"
"02","2026","08/02/2026","89.971.000","3.410.500","3.325.237","41.340.000","","","134.721.500","134.636.237"
"02","2026","09/02/2026","19.433.000","3.979.000","3.879.525","16.838.000","","550.000","39.700.000","39.600.525"
"02","2026","10/02/2026","2.610.000","12.035.000","11.699.970","8.769.000","","1.100.000","22.314.000","21.978.970"
"02","2026","11/02/2026","3.715.000","6.390.000","6.230.250","67.885.000","","","77.990.000","77.830.250"
"02","2026","12/02/2026","1.775.000","","","6.327.500","","","8.102.500","8.102.500"
"02","2026","26/02/2026","44.052.500","1.480.000","","14.453.000","","","59.985.500","58.505.500"
"02","2026","27/02/2026","26.199.500","892.000","","48.291.500","35.550.000","","110.933.000","110.041.000"
"02","2026","28/02/2026","44.163.000","20.000.000","","4.155.000","","","68.318.000","48.318.000"`

async function main() {
    // ── 1. Delete existing 2026 data ──
    console.log('🗑️  Deleting existing 2026 data...\n')

    for (const clinic of ['Teennie', 'Implant']) {
        const { count: expCount } = await supabase.from('raw_expenses').delete({ count: 'exact' }).eq('clinic', clinic).like('month', '2026.%')
        const { count: revCount } = await supabase.from('raw_revenue').delete({ count: 'exact' }).eq('clinic', clinic).like('month', '2026.%')
        console.log(`  ${clinic}: deleted ${expCount || 0} expenses, ${revCount || 0} revenue`)
    }

    // ── 2. Import expenses ──
    console.log('\n📥 Importing expenses...')

    const teennieExpenses = CHI_TEENNIE.split('\n').map(l => parseExpenseLine(l, 'Teennie')).filter(Boolean) as any[]
    const tgilExpenses = CHI_TGIL.split('\n').map(l => parseExpenseLine(l, 'Implant')).filter(Boolean) as any[]

    console.log(`  Teennie: ${teennieExpenses.length} rows`)
    console.log(`  Implant: ${tgilExpenses.length} rows`)

    const allExpenses = [...teennieExpenses, ...tgilExpenses]
    const batchSize = 50
    for (let i = 0; i < allExpenses.length; i += batchSize) {
        const batch = allExpenses.slice(i, i + batchSize)
        const { error } = await supabase.from('raw_expenses').insert(batch)
        if (error) { console.error('❌ Expense insert:', error.message); process.exit(1) }
    }
    console.log(`  ✅ Inserted ${allExpenses.length} expenses`)

    // ── 3. Import revenue ──
    console.log('\n📥 Importing revenue...')

    const teennieRevenue = THU_TEENNIE.split('\n').map(l => parseRevenueLine(l, 'Teennie', false)).filter(Boolean) as any[]
    const tgilRevenue = THU_TGIL.split('\n').map(l => parseRevenueLine(l, 'Implant', true)).filter(Boolean) as any[]

    console.log(`  Teennie: ${teennieRevenue.length} rows`)
    console.log(`  Implant: ${tgilRevenue.length} rows`)

    const allRevenue = [...teennieRevenue, ...tgilRevenue]
    for (let i = 0; i < allRevenue.length; i += batchSize) {
        const batch = allRevenue.slice(i, i + batchSize)
        const { error } = await supabase.from('raw_revenue').insert(batch)
        if (error) { console.error('❌ Revenue insert:', error.message); process.exit(1) }
    }
    console.log(`  ✅ Inserted ${allRevenue.length} revenue rows`)

    console.log('\n🎉 Done!')
}

main().catch(console.error)
