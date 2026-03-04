# TGIL Expense Alert System - Hướng Dẫn Triển Khai

## Tổng Quan

Hệ thống cảnh báo tự động qua Telegram khi chi phí vượt ngân sách. Kiểm tra mỗi 4 giờ, gửi cảnh báo tiếng Việt ở 3 cấp độ (chi tiết, danh mục, tổng tháng) tại ngưỡng 90% và 100%.

## Yêu Cầu

- ✅ Tài khoản Google (có Google Sheets)
- ✅ Tài khoản Telegram
- ✅ 2 file CSV: KPI (ngân sách) và Report_TGIL (chi phí thực tế)
- ⏱️ Thời gian: ~30 phút để setup

---

## BƯỚC 1: Tạo Telegram Bot

### 1.1. Mở Telegram, tìm @BotFather

- Mở app Telegram
- Tìm kiếm: `@BotFather`
- Bắt đầu chat

### 1.2. Tạo bot mới

Gửi lệnh:
```
/newbot
```

BotFather sẽ hỏi:
1. **Bot name**: `TGIL Expense Monitor` (hoặc tên bất kỳ)
2. **Username**: `tgil_expense_bot` (phải kết thúc bằng `bot`)

### 1.3. Lưu Bot Token

BotFather sẽ trả về token dạng:
```
123456789:ABCdefGHIjklMNOpqrsTUVwxyz123456789
```

**⚠️ QUAN TRỌNG**: Lưu token này, sẽ dùng ở bước sau!

### 1.4. Lấy Chat ID

**Cách 1: Chat trực tiếp với bot (Đơn giản nhất)**

1. Tìm bot của bạn trong Telegram: `@tgil_expense_bot`
2. Nhấn **Start** hoặc gửi tin nhắn `/start`
3. Mở trình duyệt, dán URL (thay `<TOKEN>` bằng bot token của bạn):
   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
4. Tìm dòng:
   ```json
   "chat":{"id":123456789,"first_name":"Your Name",...}
   ```
5. Số `123456789` là **Chat ID** của bạn

**Cách 2: Nhóm Telegram**

1. Tạo nhóm mới trong Telegram
2. Thêm bot vào nhóm (Add member → tìm bot)
3. Gửi bất kỳ tin nhắn nào trong nhóm
4. Mở URL getUpdates như trên
5. Tìm Chat ID (sẽ là số âm, VD: `-987654321`)

**⚠️ LƯU Ý**: Chat ID là **SỐ**, không phải username!

---

## BƯỚC 2: Chuẩn Bị Google Sheets

### 2.1. Tạo Spreadsheet mới

1. Mở Google Sheets: https://sheets.google.com
2. Tạo spreadsheet mới
3. Đặt tên: `TGIL Budget Monitoring 2026`

### 2.2. Import CSV files

**Sheet 1: KPI (Ngân sách)**

1. Tạo sheet mới, đặt tên chính xác: `KPI`
2. File → Import → Upload
3. Chọn file: `Teennie - Dữ liệu 2026 - KPI.csv`
4. Import location: Replace current sheet
5. Separator type: Auto-detect
6. Convert text to numbers: Checked

**Sheet 2: Report_TGIL (Chi phí thực tế)**

1. Tạo sheet mới, đặt tên chính xác: `Report_TGIL`
2. File → Import → Upload
3. Chọn file: `TGIL - Dữ liệu 2026 - Report_TGIL.csv`
4. Import location: Replace current sheet
5. Separator type: Auto-detect
6. Convert text to numbers: Checked

**✅ Kiểm tra:**
- Spreadsheet có 2 sheets: `KPI` và `Report_TGIL`
- Cả 2 sheets có cấu trúc giống nhau (cột A-P, ~60 dòng)
- Dòng 2 có headers: T1, T2, T3, ..., T12
- Dòng 10 có "DÒNG TIỀN RA"

---

## BƯỚC 3: Cài Đặt Google Apps Script

### 3.1. Mở Script Editor

1. Trong Google Sheets vừa tạo
2. Extensions → Apps Script
3. Sẽ mở tab mới với editor

### 3.2. Tạo các file script

Xóa nội dung file `Code.gs` mặc định.

**Tạo 7 files sau:**

1. **Code.gs**
   - Copy toàn bộ code từ file `/apps-script/Code.gs`
   - Paste vào

2. **Config.gs**
   - Nhấn dấu `+` bên cạnh Files
   - New script file: `Config.gs`
   - Copy code từ `/apps-script/Config.gs`

3. **Utils.gs**
   - New script file: `Utils.gs`
   - Copy code từ `/apps-script/Utils.gs`

4. **SheetsService.gs**
   - New script file: `SheetsService.gs`
   - Copy code từ `/apps-script/SheetsService.gs`

5. **ComparisonService.gs**
   - New script file: `ComparisonService.gs`
   - Copy code từ `/apps-script/ComparisonService.gs`

6. **AlertService.gs**
   - New script file: `AlertService.gs`
   - Copy code từ `/apps-script/AlertService.gs`

7. **TelegramClient.gs**
   - New script file: `TelegramClient.gs`
   - Copy code từ `/apps-script/TelegramClient.gs`

8. **Tests.gs**
   - New script file: `Tests.gs`
   - Copy code từ `/apps-script/Tests.gs`

**💾 Lưu project**: Ctrl+S hoặc File → Save

---

## BƯỚC 4: Cấu Hình Script Properties

### 4.1. Mở Script Properties

1. Trong Apps Script Editor
2. Nhấn biểu tượng ⚙️ **Project Settings** (bên trái)
3. Scroll xuống phần **Script Properties**
4. Nhấn **Add script property**

### 4.2. Thêm các properties

Thêm **5 properties** sau:

| Property | Value | Ghi chú |
|----------|-------|---------|
| `TELEGRAM_BOT_TOKEN` | `123456789:ABC...` | Token từ BotFather |
| `TELEGRAM_CHAT_ID` | `123456789` | Chat ID của bạn |
| `WARNING_THRESHOLD` | `90` | Cảnh báo ở 90% |
| `CRITICAL_THRESHOLD` | `100` | Vượt ngân sách ở 100% |
| `ENABLE_ALERTS` | `true` | Bật cảnh báo |

**⚠️ LƯU Ý**:
- Property names phải **VIẾT ĐÚNG** (phân biệt chữ hoa/thường)
- TELEGRAM_BOT_TOKEN và TELEGRAM_CHAT_ID là **BẮT BUỘC**
- Các giá trị khác có thể để mặc định

### 4.3. Lưu lại

Nhấn **Save script properties**

---

## BƯỚC 5: Kiểm Tra & Test

### 5.1. Khởi tạo hệ thống

1. Trong Apps Script Editor
2. Chọn function: `initializeSystem` (dropdown ở toolbar)
3. Nhấn **Run** (▶️)
4. **Lần đầu chạy** sẽ yêu cầu authorization:
   - Nhấn **Review permissions**
   - Chọn tài khoản Google của bạn
   - Nhấn **Advanced**
   - **Go to TGIL Expense Monitor (unsafe)**
   - **Allow**
5. Xem kết quả trong **Execution log** (View → Logs)

### 5.2. Chạy các test

**Test 1: Kiểm tra cấu hình**
```javascript
Function: testConfiguration
Run → Check logs
```
Kết quả mong đợi: `✅ Configuration is valid`

**Test 2: Kiểm tra bot token**
```javascript
Function: testBotToken
Run → Check logs
```
Kết quả: `✅ Bot token is valid` + thông tin bot

**Test 3: Kiểm tra đọc dữ liệu**
```javascript
Function: testReadKPI
Function: testReadReport
```
Kết quả: Hiển thị dữ liệu từ sheets

**Test 4: Gửi tin nhắn test**
```javascript
Function: testSendAlert
Run
```
**✅ Kiểm tra Telegram** - bạn sẽ nhận được tin nhắn test!

**Test 5: Chạy full workflow (không gửi tin)**
```javascript
Function: testFullWorkflow
Run
```
Xem logs để thấy hệ thống phát hiện bao nhiêu cảnh báo

### 5.3. Troubleshooting

**Lỗi: "Sheet KPI not found"**
- Kiểm tra tên sheet phải chính xác: `KPI` (không có space, đúng chữ hoa)

**Lỗi: "TELEGRAM_BOT_TOKEN not configured"**
- Kiểm tra lại Script Properties
- Đảm bảo viết đúng tên property

**Lỗi: "Telegram API error: Unauthorized"**
- Bot token sai hoặc hết hạn
- Tạo bot mới hoặc xin token mới từ BotFather

**Lỗi: "Telegram API error: Chat not found"**
- Chat ID sai
- Đảm bảo đã gửi `/start` cho bot trước
- Thử lấy Chat ID lại bằng getUpdates

---

## BƯỚC 6: Kích Hoạt Tự Động

### 6.1. Install triggers

1. Chọn function: `installTriggers`
2. **Run**
3. Xem logs: `✅ Trigger installed: checkExpensesScheduled runs every 4 hours`
4. **Kiểm tra Telegram** - sẽ nhận thông báo xác nhận!

### 6.2. Xem triggers đã cài

1. Nhấn biểu tượng ⏰ **Triggers** (bên trái)
2. Sẽ thấy:
   - Function: `checkExpensesScheduled`
   - Event source: Time-driven
   - Type: Hour timer
   - Every 4 hours

### 6.3. Quản lý triggers

**Tắt cảnh báo tạm thời:**
```javascript
Function: uninstallTriggers
Run
```

**Bật lại:**
```javascript
Function: installTriggers
Run
```

**Xem danh sách triggers:**
```javascript
Function: listTriggers
Run → Check logs
```

---

## BƯỚC 7: Sử Dụng Hệ Thống

### 7.1. Hoạt động tự động

- Hệ thống kiểm tra **mỗi 4 giờ**
- So sánh Report_TGIL với KPI
- Gửi cảnh báo khi:
  - ≥90%: Cảnh báo sắp đạt ngân sách
  - ≥100%: Vượt ngân sách

### 7.2. Cập nhật dữ liệu

**Khi có chi phí mới:**
1. Mở Google Sheets
2. Vào sheet `Report_TGIL`
3. Cập nhật số liệu mới (VD: cột T3, T4, ...)
4. Lưu (Ctrl+S)
5. Chờ tối đa 4 giờ → nhận cảnh báo tự động

**Hoặc chạy ngay:**
```javascript
Function: runManualCheck
Run
```

### 7.3. Format cảnh báo

**Cảnh báo mức Item (chi phí đơn lẻ):**
```
⚠️ CẢNH BÁO: Chi phí quảng cáo

📅 Tháng: T1/2026
📊 Chi phí thực tế: ₫450.000.000
💰 Ngân sách: ₫400.000.000
📈 Tỷ lệ: 112.5%

🔴 Vượt ngân sách: ₫50.000.000

⚠️ Chi phí quảng cáo đã vượt quá 112.5% ngân sách!
```

**Cảnh báo mức Category (danh mục):**
```
🚨 VƯỢT NGƯỠNG: Biến phí

📅 Tháng: T1/2026
📊 Tổng chi phí: ₫2.200.000.000
💰 Ngân sách: ₫2.159.000.000
📈 Tỷ lệ: 101.9%

🔴 Vượt ngân sách: ₫41.000.000

🚨 Danh mục Biến phí đã vượt ngưỡng!
```

**Cảnh báo mức Monthly Total (tổng tháng):**
```
🔥 CẢNH BÁO NGHIÊM TRỌNG: Tổng chi phí tháng

📅 Tháng: T1/2026
💸 Tổng chi thực tế: ₫3.600.000.000
💰 Tổng ngân sách: ₫3.459.000.000
📈 Tỷ lệ: 104.1%

🔴 Vượt ngân sách: ₫141.000.000

🔥 CẢNH BÁO NGHIÊM TRỌNG!
Tổng chi phí tháng T1 đã vượt ngân sách 4.1%!
⚠️ Cần rà soát và điều chỉnh chi tiêu NGAY!
```

### 7.4. Thứ tự cảnh báo

Hệ thống gửi theo độ ưu tiên:
1. **Tổng tháng** (nếu vượt) - Quan trọng nhất
2. **Danh mục** (Định phí, Biến phí)
3. **Chi tiết** (từng khoản chi)

Delay 1.5 giây giữa các tin để tránh spam.

---

## BƯỚC 8: Tùy Chỉnh

### 8.1. Thay đổi ngưỡng cảnh báo

1. Project Settings → Script Properties
2. Sửa:
   - `WARNING_THRESHOLD`: 80 (cảnh báo ở 80%)
   - `CRITICAL_THRESHOLD`: 110 (vượt ở 110%)
3. Save

### 8.2. Thay đổi tần suất kiểm tra

```javascript
// Trong Code.gs, hàm installTriggers()
// Thay đổi từ:
.everyHours(4)

// Thành:
.everyHours(1)  // Mỗi giờ
// hoặc
.everyDays(1).atHour(9)  // Mỗi ngày lúc 9h sáng
// hoặc
.everyWeeks(1).onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(9)  // Thứ 2 hàng tuần
```

Sau đó chạy lại `installTriggers`.

### 8.3. Gửi cho nhiều người

**Option 1: Tạo Telegram Group**
1. Tạo nhóm, thêm bot và tất cả mọi người
2. Lấy Chat ID của nhóm (số âm)
3. Cập nhật `TELEGRAM_CHAT_ID` với Group ID

**Option 2: Sửa code để gửi nhiều chat**

Trong `Code.gs`, hàm `processMonthAlerts`, thay:
```javascript
const chatId = config.TELEGRAM_CHAT_ID;
const results = sendMultipleAlerts(chatId, alertMessages);
```

Bằng:
```javascript
const chatIds = ['123456789', '-987654321', '111222333']; // Danh sách Chat IDs
chatIds.forEach(chatId => {
  sendMultipleAlerts(chatId, alertMessages);
});
```

---

## Monitoring & Bảo Trì

### Kiểm tra execution logs

1. Apps Script Editor → Executions (biểu tượng đồng hồ)
2. Xem lịch sử chạy:
   - Status: Success / Failed
   - Duration
   - Error messages (nếu có)

### Nhận thông báo lỗi

Nếu hệ thống gặp lỗi, bạn sẽ nhận tin nhắn:
```
🔥 LỖI HỆ THỐNG - TGIL Expense Monitor

*Ngữ cảnh:* Configuration validation failed
*Lỗi:* Invalid TELEGRAM_BOT_TOKEN
*Thời gian:* 02/01/2026 14:30

⚠️ Vui lòng kiểm tra logs để biết thêm chi tiết.
```

### Backup & Restore

**Backup:**
1. Apps Script Editor → File → Make a copy
2. Lưu tên: `TGIL Expense Monitor - Backup [date]`

**Restore:**
1. Mở backup copy
2. Copy toàn bộ code
3. Paste vào project chính

---

## FAQ

**Q: Tôi không nhận được cảnh báo?**

A: Kiểm tra:
1. Triggers đã được cài? (`listTriggers()`)
2. Config đúng? (`debugPrintConfig()`)
3. Sheet có dữ liệu? (`testReadReport()`)
4. Bot token còn hoạt động? (`testBotToken()`)
5. Execution logs có lỗi? (Executions tab)

**Q: Nhận quá nhiều cảnh báo trùng lặp?**

A: Tăng cooldown:
```javascript
Script Properties → ALERT_COOLDOWN_HOURS: 8
```

**Q: Muốn test mà không gửi Telegram?**

A:
```javascript
Function: testFullWorkflow  // Dry run, chỉ xem logs
```

**Q: Làm sao biết bot đang chạy?**

A: Kiểm tra:
1. Executions tab → thấy runs mỗi 4 giờ
2. Logs có "Expense Check Started/Completed"
3. Telegram có tin nhắn test sau khi install triggers

**Q: Sheet structure thay đổi (thêm dòng/cột)?**

A: Hệ thống tự động match theo tên category. Miễn là:
- Tên sheet đúng: `KPI`, `Report_TGIL`
- Headers tháng (T1-T12) ở dòng 2
- Category names giữ nguyên

**Q: Muốn tắt hẳn hệ thống?**

A:
```javascript
Function: uninstallTriggers
```
Hoặc:
```javascript
Script Properties → ENABLE_ALERTS: false
```

---

## Hỗ Trợ

**Lỗi thường gặp:**

1. **Authorization required**
   - Chạy bất kỳ function nào
   - Làm theo hướng dẫn authorize

2. **ReferenceError: function not defined**
   - Kiểm tra đã copy đủ 8 files
   - File names đúng chính tả

3. **Bot not responding**
   - Token hết hạn → tạo bot mới
   - Bot bị block → unblock trong Telegram

**Debug tips:**

```javascript
// Xem full logs
Function: runAllTests

// Xem cấu hình
Function: debugPrintConfig

// Xem dữ liệu
Function: debugPrintMonthData

// Test từng bước
testConfiguration()
testBotToken()
testReadKPI()
testCompareMonth()
testSendAlert()
```

---

## Bản Quyền & Credits

Được phát triển bởi **Claude Code** cho TGIL Company

Version: 1.0.0
Date: January 2026

---

## Checklist Deployment

- [ ] Tạo Telegram bot, lưu token
- [ ] Lấy Chat ID
- [ ] Tạo Google Sheets với 2 sheets: KPI, Report_TGIL
- [ ] Import CSV data
- [ ] Tạo Apps Script project với 8 files
- [ ] Cấu hình Script Properties (5 properties)
- [ ] Chạy `initializeSystem()`
- [ ] Grant permissions khi yêu cầu
- [ ] Chạy test: `testConfiguration()`, `testBotToken()`, `testSendAlert()`
- [ ] Cài triggers: `installTriggers()`
- [ ] Nhận tin xác nhận từ Telegram
- [ ] Kiểm tra Executions tab sau 4 giờ
- [ ] ✅ Hoàn tất!

---

**🎉 Chúc mừng! Hệ thống đã sẵn sàng hoạt động!**
