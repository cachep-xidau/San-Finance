# Teennie Expense Alert System

Hệ thống cảnh báo chi phí tự động qua Telegram cho công ty Teennie.

## Tính Năng

✅ **Tự động kiểm tra** mỗi 4 giờ
✅ **3 cấp độ cảnh báo**: Chi tiết, Danh mục, Tổng tháng
✅ **2 ngưỡng**: 90% (cảnh báo), 100% (vượt ngân sách)
✅ **Tin nhắn tiếng Việt** với format đẹp
✅ **Retry logic** xử lý lỗi mạng
✅ **Comprehensive testing** với 10+ test functions

## Kiến Trúc

```
Apps-script-Teennie/
├── Code.gs              # Entry point, triggers, orchestration
├── Config.gs            # Configuration management (Script Properties)
├── Utils.gs             # Formatting helpers (VND, dates, parsing)
├── SheetsService.gs     # Data extraction from Google Sheets
├── ComparisonService.gs # Budget vs actual comparison logic
├── AlertService.gs      # Telegram message generation
├── TelegramClient.gs    # Telegram Bot API integration
├── Tests.gs             # Testing functions
└── README.md            # File này
```

## Quick Start

### 1. Dùng chung Bot với TGIL

Bot token và Chat ID **dùng chung** với hệ thống TGIL. Bạn sẽ nhận cảnh báo của **cả 2 công ty** trên cùng 1 Telegram chat/group.

### 2. Tạo Google Sheets

```
1. Tạo spreadsheet: "Teennie Budget Monitoring 2026"
2. Import 2 sheets:
   - KPI (ngân sách)
   - Report_Teennie (chi phí thực tế)
```

### 3. Setup Apps Script

```
1. Extensions → Apps Script
2. Copy 8 files .gs vào project
3. Cấu hình Script Properties (DÙNG CHUNG với TGIL):
   - TELEGRAM_BOT_TOKEN: <same as TGIL>
   - TELEGRAM_CHAT_ID: <same as TGIL>
   - WARNING_THRESHOLD: 90
   - CRITICAL_THRESHOLD: 100
4. Run: initializeSystem()
5. Run: installTriggers()
```

### 4. Test

```javascript
// Chạy các test
testConfiguration()
testBotToken()
testSendAlert()  // Nhận tin test trên Telegram!
```

## Cấu Trúc Dữ Liệu

### Google Sheets Format

**KPI Sheet** (Ngân sách):
```
Row 1: Headers (DIỄN GIẢI, KẾ HOẠCH, ...)
Row 2: T1, T2, T3, ..., T12
Row 10: DÒNG TIỀN RA (tổng tháng)
Row 12: Định phí (danh mục)
Row 13-15: Chi phí cụ thể (items)
Row 16: Biến phí (danh mục)
...
```

**Report_Teennie Sheet** (Chi phí thực tế):
- Cấu trúc giống hệt KPI
- Cập nhật dữ liệu thực tế theo tháng

## Khác biệt với TGIL

| Aspect | TGIL | Teennie |
|--------|------|---------|
| Sheet name | `Report_TGIL` | `Report_Teennie` |
| Alert prefix | "TGIL Expense Monitor" | "Teennie Expense Monitor" |
| Telegram bot/chat | **DÙNG CHUNG** | **DÙNG CHUNG** |
| Trigger schedule | Every 4 hours | Every 4 hours |

## Configuration

### Script Properties (DÙNG CHUNG)

| Property | Value | Note |
|----------|-------|------|
| `TELEGRAM_BOT_TOKEN` | `<token>` | **Dùng chung với TGIL** |
| `TELEGRAM_CHAT_ID` | `<chat_id>` | **Dùng chung với TGIL** |
| `WARNING_THRESHOLD` | 90 | Có thể khác TGIL |
| `CRITICAL_THRESHOLD` | 100 | Có thể khác TGIL |

## Functions Reference

### Main Functions

- `checkExpensesScheduled()` - Main trigger function (auto runs every 4h)
- `processMonthAlerts(month)` - Process alerts for specific month
- `installTriggers()` - Install time-based triggers
- `uninstallTriggers()` - Remove all triggers
- `runManualCheck()` - Run check immediately (ignore cooldown)
- `initializeSystem()` - Initialize system on first deployment

### Test Functions

- `testConfiguration()` - Validate config
- `testBotToken()` - Test Telegram bot token
- `testReadKPI()` - Test reading KPI data
- `testReadReport()` - Test reading Report data
- `testCompareMonth()` - Test comparison logic
- `testSendAlert()` - Send test alert to Telegram
- `testFullWorkflow()` - End-to-end test (dry run)
- `runAllTests()` - Run complete test suite

## Alert Format

### Warning Alert (90%+)
```
⚠️ CẢNH BÁO: Chi phí quảng cáo

📅 Tháng: T1/2026
📊 Chi phí thực tế: ₫360.000.000
💰 Ngân sách: ₫400.000.000
📈 Tỷ lệ: 90.0%

💵 Còn lại: ₫40.000.000

⚠️ Chi phí quảng cáo đã đạt 90.0% ngân sách!
```

### Critical Alert (100%+)
```
🚨 VƯỢT NGƯỠNG: Chi phí quảng cáo

📅 Tháng: T1/2026
📊 Chi phí thực tế: ₫450.000.000
💰 Ngân sách: ₫400.000.000
📈 Tỷ lệ: 112.5%

🔴 Vượt ngân sách: ₫50.000.000

⚠️ Chi phí quảng cáo đã vượt quá 112.5% ngân sách!
```

## Deployment Checklist

### 1. Bot Setup (Dùng chung TGIL)

✅ Bot đã được tạo cho TGIL
✅ Chat ID đã có sẵn
✅ **Không cần tạo bot mới**

### 2. Apps Script Installation

**Open Script Editor**:
```
1. Google Sheets → Extensions → Apps Script
2. Delete default Code.gs content
```

**Create Files**:
- Copy 8 files .gs từ folder này

**Set Script Properties** (DÙNG CHUNG):
```
1. ⚙️ Project Settings → Script Properties
2. Sử dụng CHÍNH XÁC giá trị như TGIL:
   - TELEGRAM_BOT_TOKEN: <from TGIL>
   - TELEGRAM_CHAT_ID: <from TGIL>
   - WARNING_THRESHOLD: 90
   - CRITICAL_THRESHOLD: 100
   - ENABLE_ALERTS: true
```

**Test Functions**:
```
1. Run testReadKPI() → check logs
2. Run testReadReport() → verify data
3. Run testSendAlert() → receive Telegram message
4. Run testFullWorkflow() → end-to-end test
```

**Install Triggers**:
```
1. Run installTriggers()
2. Verify in Triggers tab
3. Should see: checkExpensesScheduled every 4 hours
```

## Alert Messages

Cả TGIL và Teennie sẽ gửi alert đến **CÙNG 1 Telegram chat**. Messages sẽ có prefix để phân biệt:

- TGIL: "TGIL Expense Monitor"
- Teennie: "Teennie Expense Monitor"

## Troubleshooting

### Debug Commands
```javascript
// Full test suite
runAllTests()

// View configuration
debugPrintConfig()

// View raw data
debugPrintMonthData()

// Test bot connection
testBotToken()
```

### Reset System
```javascript
// Remove triggers
uninstallTriggers()

// Clear last check timestamp
setLastCheckTimestamp(new Date(0))

// Reinstall
installTriggers()
```

## Version

- **Version**: 1.0.0
- **Released**: January 2026
- **Author**: Claude Code
- **License**: Proprietary (S Group)

---

**📞 Contact**: Liên hệ team kế toán S Group để được hỗ trợ

**🎉 Happy Monitoring!**
