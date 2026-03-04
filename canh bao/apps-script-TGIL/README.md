# TGIL Expense Alert System

Hệ thống cảnh báo chi phí tự động qua Telegram cho công ty TGIL.

## Tính Năng

✅ **Tự động kiểm tra** mỗi 4 giờ
✅ **3 cấp độ cảnh báo**: Chi tiết, Danh mục, Tổng tháng
✅ **2 ngưỡng**: 90% (cảnh báo), 100% (vượt ngân sách)
✅ **Tin nhắn tiếng Việt** với format đẹp
✅ **Retry logic** xử lý lỗi mạng
✅ **Comprehensive testing** với 10+ test functions

## Kiến Trúc

```
apps-script/
├── Code.gs              # Entry point, triggers, orchestration
├── Config.gs            # Configuration management (Script Properties)
├── Utils.gs             # Formatting helpers (VND, dates, parsing)
├── SheetsService.gs     # Data extraction from Google Sheets
├── ComparisonService.gs # Budget vs actual comparison logic
├── AlertService.gs      # Telegram message generation
├── TelegramClient.gs    # Telegram Bot API integration
├── Tests.gs             # Testing functions
├── DEPLOYMENT.md        # Hướng dẫn triển khai chi tiết
└── README.md            # File này
```

## Quick Start

### 1. Tạo Telegram Bot
```
1. Mở Telegram → tìm @BotFather
2. Gửi: /newbot
3. Lưu Bot Token: 123456789:ABC...
4. Gửi /start cho bot → lấy Chat ID
```

### 2. Tạo Google Sheets
```
1. Tạo spreadsheet: "TGIL Budget Monitoring 2026"
2. Import 2 sheets:
   - KPI (ngân sách)
   - Report_TGIL (chi phí thực tế)
```

### 3. Setup Apps Script
```
1. Extensions → Apps Script
2. Copy 8 files .gs vào project
3. Cấu hình Script Properties:
   - TELEGRAM_BOT_TOKEN
   - TELEGRAM_CHAT_ID
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

## Hướng Dẫn Đầy Đủ

📖 Xem file **[DEPLOYMENT.md](./DEPLOYMENT.md)** để có hướng dẫn chi tiết từng bước.

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

**Report_TGIL Sheet** (Chi phí thực tế):
- Cấu trúc giống hệt KPI
- Cập nhật dữ liệu thực tế theo tháng

## Configuration

### Script Properties

| Property | Required | Default | Description |
|----------|----------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | ✅ Yes | - | Bot token từ @BotFather |
| `TELEGRAM_CHAT_ID` | ✅ Yes | - | Chat ID nhận cảnh báo |
| `WARNING_THRESHOLD` | No | 90 | Ngưỡng cảnh báo (%) |
| `CRITICAL_THRESHOLD` | No | 100 | Ngưỡng vượt ngân sách (%) |
| `ENABLE_ALERTS` | No | true | Bật/tắt cảnh báo |
| `ALERT_COOLDOWN_HOURS` | No | 4 | Thời gian chờ giữa các lần check |

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

### Utility Functions

- `getConfig()` - Get configuration
- `getKPIData(month)` - Extract KPI data for month
- `getReportData(month)` - Extract Report data for month
- `compareMonthExpenses(month)` - Compare expenses vs budget
- `generateAlerts(results)` - Generate alert messages
- `sendMultipleAlerts(chatId, messages)` - Send alerts with retry

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

### Monthly Total Alert
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

## Workflow

```
Every 4 hours:
├─ Check cooldown period
├─ Detect changed months (compare with last check)
├─ For each changed month:
│  ├─ Read KPI data (budget)
│  ├─ Read Report data (actual)
│  ├─ Compare by category
│  ├─ Check thresholds (90%, 100%)
│  ├─ Generate alert messages
│  └─ Send to Telegram (with retry)
└─ Update last check timestamp
```

## Error Handling

### Automatic Retry
- 3 attempts with exponential backoff (2s, 4s, 6s)
- Rate limiting: 1.5s delay between messages
- Error notifications sent to admin

### Common Errors

**"Sheet not found"**
→ Kiểm tra tên sheet: `KPI`, `Report_TGIL` (chính xác)

**"TELEGRAM_BOT_TOKEN not configured"**
→ Thêm vào Script Properties

**"Telegram API error: Unauthorized"**
→ Bot token sai hoặc hết hạn

**"Chat not found"**
→ Gửi `/start` cho bot trước

## Monitoring

### Execution Logs
```
Apps Script Editor → Executions (⏰ icon)
- View run history
- Check errors
- Monitor duration
```

### Manual Triggers
```javascript
// Check immediately
runManualCheck()

// View current config
debugPrintConfig()

// List installed triggers
listTriggers()
```

## Customization

### Change Thresholds
```javascript
Script Properties:
- WARNING_THRESHOLD: 85  // Cảnh báo ở 85%
- CRITICAL_THRESHOLD: 110 // Vượt ở 110%
```

### Change Frequency
```javascript
// In Code.gs → installTriggers()
.everyHours(1)  // Mỗi giờ
// or
.everyDays(1).atHour(9)  // Hàng ngày lúc 9h
```

### Multiple Recipients
```javascript
// Option 1: Telegram Group (recommended)
// - Thêm bot vào group
// - Lấy Group Chat ID (số âm)
// - Cập nhật TELEGRAM_CHAT_ID

// Option 2: Multiple individual chats
// - Modify processMonthAlerts() to loop through chat IDs
```

## Troubleshooting

### Debug Commands
```javascript
// Full test suite
runAllTests()

// View configuration
debugPrintConfig()

// View raw data
debugPrintMonthData()

// Find Chat IDs
getChatIdsFromUpdates()

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

## Performance

- **Execution time**: ~5-10 seconds per month
- **API calls**: 1 getUpdates + N sendMessage (N = alerts)
- **Quotas**: Well within Google Apps Script limits
- **Rate limiting**: 1.5s between messages (Telegram: 30 msg/sec limit)

## Security

- ✅ Bot token stored in Script Properties (not in code)
- ✅ Chat ID validation
- ✅ No sensitive data in logs
- ✅ Authorization required on first run
- ✅ Scoped permissions (Sheets + External services only)

## Limitations

- Max 6 minutes execution time (Apps Script free tier)
- Telegram: 4096 characters per message (auto-handled)
- Sheets: Read-only access (doesn't modify data)
- Time-based trigger: Minimum 1 hour interval

## Roadmap

### Potential Enhancements
- [ ] Web dashboard for alert history
- [ ] Weekly/monthly summary reports
- [ ] Predictive alerts (trend analysis)
- [ ] Multi-company support
- [ ] Email notifications (fallback)
- [ ] Slack integration
- [ ] Custom alert rules per category
- [ ] Budget vs actual charts

## Support

### Documentation
- 📖 [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- 📝 [Plan file](/.claude/plans/hazy-coalescing-ladybug.md) - Implementation plan

### Getting Help
1. Check DEPLOYMENT.md FAQ section
2. Run `runAllTests()` for diagnostics
3. Check Execution logs for errors
4. Verify Script Properties configuration

## Version

- **Version**: 1.0.0
- **Released**: January 2026
- **Author**: Claude Code
- **License**: Proprietary (TGIL Company)

## Changelog

### v1.0.0 (2026-01-02)
- ✨ Initial release
- ✅ Automated expense monitoring
- ✅ Telegram integration
- ✅ 3-level alert system
- ✅ Comprehensive testing suite
- ✅ Full deployment documentation

---

**📞 Contact**: Liên hệ team kế toán TGIL để được hỗ trợ

**🎉 Happy Monitoring!**
