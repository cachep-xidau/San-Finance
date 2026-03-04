---
stepsCompleted: [auto-generated]
inputDocuments: ['projects/S Group/marketing/prd.md', 'projects/S Group/marketing/architecture.md']
workflowType: 'epics-and-stories'
project_name: 'Marketing Hub'
date: '2026-02-24'
totalEpics: 7
totalStories: 28
---

# Epics & User Stories — Marketing Hub

**Tác giả:** Lucas
**Ngày:** 2026-02-24
**Source:** PRD v1.0 + Architecture v1.0

---

## Epic Overview

| Epic | Tên | Stories | Phase | Priority |
|------|-----|---------|-------|----------|
| E1 | Auth & User Management | 4 | 1 | P0 |
| E2 | Data Ingestion & Sync | 5 | 1 | P0 |
| E3 | Campaign Management | 4 | 1 | P0 |
| E4 | Dashboard & Reporting | 5 | 1-2 | P0 |
| E5 | Alert & Notification Engine | 4 | 1-2 | P0 |
| E6 | Telegram Bot | 3 | 1-2 | P1 |
| E7 | Unified Metrics & Funnel | 3 | 2 | P0 |

---

## E1: Auth & User Management

> Xử lý đăng nhập, phân quyền, và cấu hình người dùng cho 4 roles

### S1.1 — Đăng ký & Đăng nhập

**As a** admin, **I want to** tạo tài khoản cho team members với email/password, **so that** họ có thể đăng nhập vào hệ thống.

**Acceptance Criteria:**
- [ ] Tạo user với email, name, password, role (CMO/HEAD/MANAGER/STAFF)
- [ ] Login bằng email + password → session token
- [ ] Redirect theo role: CMO → `/cmo`, Manager → `/manager`, Staff → `/staff`
- [ ] Logout invalidates session

**Technical Notes:**
- Better Auth cho auth + session management
- Prisma `User` model với `Role` enum
- Redis session store (TTL 24h)

**Effort:** S (1-2 ngày)

---

### S1.2 — Role-based Access Control

**As a** system, **I want to** enforce quyền truy cập theo role, **so that** mỗi người chỉ thấy data phù hợp.

**Acceptance Criteria:**
- [ ] Auth Guard middleware kiểm tra session ở mọi /api routes
- [ ] Role Guard kiểm tra role ở protected routes
- [ ] CMO/HEAD: xem CMO + Manager dashboard
- [ ] MANAGER: xem Manager + Staff dashboard, CRUD campaigns
- [ ] STAFF: chỉ xem Staff dashboard, input data
- [ ] Unauthorized → 403 response

**Technical Notes:**
- NestJS `@Roles()` decorator + `RolesGuard`
- Frontend middleware check role → redirect đúng layout

**Effort:** S (1-2 ngày)

---

### S1.3 — Notification Preferences

**As a** user, **I want to** chọn kênh nhận alert (Telegram/Email) cho từng loại alert, **so that** tôi chỉ nhận thông báo quan trọng.

**Acceptance Criteria:**
- [ ] Settings page: toggle on/off cho mỗi alert type × channel
- [ ] Alert types: Budget Burn, Performance Drop, Goal Gap, Daily Digest, Weekly Report
- [ ] Channels: Telegram, Email
- [ ] Lưu vào `NotificationPreference` table
- [ ] Default: tất cả on cho role CMO/HEAD/MANAGER

**Technical Notes:**
- Prisma `NotificationPreference` model
- `PATCH /api/users/notifications`

**Effort:** M (3-5 ngày)

---

### S1.4 — Telegram Account Linking

**As a** user, **I want to** liên kết Telegram account với tài khoản Marketing Hub, **so that** tôi nhận alert và query data qua Telegram.

**Acceptance Criteria:**
- [ ] Settings page: nút "Link Telegram"
- [ ] Generate unique token → user gửi token cho bot → bot verify → lưu chat_id
- [ ] Hiển thị trạng thái: Linked ✅ / Not linked
- [ ] Unlink Telegram option
- [ ] `telegramChatId` lưu trong User model

**Technical Notes:**
- `POST /api/users/telegram/link` → generate token
- Bot `/start <token>` → verify + save chat_id
- grammY conversation handler

**Effort:** M (3-5 ngày)

---

## E2: Data Ingestion & Sync

> Tự động đồng bộ dữ liệu từ Facebook, TikTok, CRM và CSV upload cho Zalo

### S2.1 — Facebook Marketing API Connector

**As a** system, **I want to** tự động đồng bộ campaigns, ad sets, ads, và daily metrics từ Facebook Marketing API, **so that** team không cần nhập tay từ FB Ads Manager.

**Acceptance Criteria:**
- [ ] Kết nối FB Marketing API v21 với App Token
- [ ] Sync campaigns → ad sets → ads → insights (spend, impressions, clicks, leads, conversions)
- [ ] Schedule: mỗi 4 giờ qua BullMQ cron job
- [ ] Upsert logic: update existing, create new
- [ ] Handle rate limits: exponential backoff, max 3 retries
- [ ] Log sync status vào `SyncLog` table
- [ ] Invalidate Redis cache sau sync

**Technical Notes:**
- `facebook.connector.ts` trong DataSync module
- BullMQ job `fb-sync` → queue `data-sync`
- Prisma upsert cho Campaign, AdSet, Ad, DailyMetrics

**Effort:** L (1-2 tuần)

---

### S2.2 — TikTok Marketing API Connector

**As a** system, **I want to** tự động đồng bộ campaigns và metrics từ TikTok Marketing API, **so that** data TikTok luôn cập nhật.

**Acceptance Criteria:**
- [ ] Kết nối TikTok Marketing API v1.3
- [ ] Sync campaigns → ad groups → ads → reports (spend, impressions, clicks, conversions)
- [ ] Schedule: mỗi 4 giờ (offset 1h so với FB)
- [ ] Upsert + retry logic giống FB
- [ ] Map TikTok fields → unified DailyMetrics schema
- [ ] SyncLog tracking

**Technical Notes:**
- `tiktok.connector.ts` trong DataSync module
- TikTok dùng access_token + app_id

**Effort:** L (1-2 tuần)

---

### S2.3 — Pancake CRM Webhook Integration

**As a** system, **I want to** nhận webhook từ Pancake CRM khi có lead mới, **so that** lead data cập nhật real-time.

**Acceptance Criteria:**
- [ ] Webhook endpoint: `POST /api/webhooks/pancake`
- [ ] Validate webhook signature
- [ ] Parse lead data: name, phone, email, source
- [ ] Map lead → đúng campaign (qua UTM/source)
- [ ] Set funnel stage = LEAD (default)
- [ ] Enqueue lead processing job (BullMQ)
- [ ] Return 200 OK ngay (async processing)

**Technical Notes:**
- `pancake.connector.ts` trong DataSync module
- BullMQ job cho heavy processing
- Lead → Campaign mapping qua metadata/UTM

**Effort:** M (3-5 ngày)

---

### S2.4 — CSV Upload cho Zalo & Manual Data

**As a** staff member, **I want to** upload CSV file cho kênh chưa có API (Zalo), **so that** data Zalo cũng có trên dashboard.

**Acceptance Criteria:**
- [ ] Upload form: drag & drop CSV file
- [ ] Auto-detect columns mapping (hoặc manual mapping UI)
- [ ] Preview data trước khi import (top 10 rows)
- [ ] Validation: required fields, data types, duplicate detection
- [ ] Import vào DailyMetrics + Campaign
- [ ] Success/error report sau import
- [ ] Support cả Zalo OA và Zalo Ads format

**Technical Notes:**
- `csv-import.service.ts` trong DataSync module
- Multer file upload + Papa Parse CSV parsing
- Staff View → Data Entry section

**Effort:** M (3-5 ngày)

---

### S2.5 — Sync Status Dashboard

**As a** manager, **I want to** xem trạng thái sync cho từng data source, **so that** tôi biết data có cập nhật hay không.

**Acceptance Criteria:**
- [ ] Settings page: table hiển thị mỗi source (FB, TikTok, Pancake, Zalo)
- [ ] Mỗi source: last sync time, status (success/failed/in-progress), records processed
- [ ] Manual trigger sync button (Manager only)
- [ ] Error details nếu sync failed
- [ ] Auto-refresh mỗi 30s

**Technical Notes:**
- `GET /api/sync/status` → query SyncLog
- `POST /api/sync/trigger/:channel` → enqueue manual sync

**Effort:** S (1-2 ngày)

---

## E3: Campaign Management

> CRUD campaigns, budget tracking, goal setting, và staff task management

### S3.1 — Campaign CRUD

**As a** manager, **I want to** tạo, sửa, xem campaigns trên hệ thống, **so that** tất cả campaigns được quản lý tập trung.

**Acceptance Criteria:**
- [ ] Create campaign: name, channel, start/end date, ad account
- [ ] List campaigns: filter by channel, status, date range
- [ ] Campaign detail: metrics overview, ad sets, ads
- [ ] Edit campaign: update name, dates, status
- [ ] Status transitions: Draft → Active → Paused → Completed → Archived
- [ ] Auto-create campaigns từ API sync nếu chưa tồn tại

**Technical Notes:**
- `campaigns.controller.ts` + `campaigns.service.ts`
- Prisma CRUD operations
- Manager View → Campaigns section

**Effort:** M (3-5 ngày)

---

### S3.2 — Budget Management

**As a** manager, **I want to** set planned budget và track actual spend cho mỗi campaign, **so that** tôi kiểm soát được chi tiêu.

**Acceptance Criteria:**
- [ ] Set planned budget (VND) + daily limit cho campaign
- [ ] Auto-calculate actual spend từ DailyMetrics
- [ ] Pace status: On-track / Behind / Ahead / Overspent
- [ ] Budget pacing indicator: "65% budget used, 12 days remaining, pace: on-track"
- [ ] Forecast: dự báo ngày hết budget nếu giữ pace hiện tại
- [ ] Recalculate mỗi 1h qua BullMQ job

**Technical Notes:**
- `budget.service.ts` trong Campaign module
- Prisma `Budget` model
- BullMQ cron: `budget-recalc` mỗi 1h

**Effort:** M (3-5 ngày)

---

### S3.3 — Goal Setting & Tracking

**As a** manager, **I want to** set KPI mục tiêu cho campaign và theo dõi progress, **so that** tôi biết campaign đang on-track hay lệch.

**Acceptance Criteria:**
- [ ] Set goals: target leads, target conversions, target CPL, target ROAS
- [ ] Progress tracking: actual / target (%)
- [ ] Pace indicator: projected vs actual (on-track / behind / ahead)
- [ ] Visual progress bar trên campaign card
- [ ] Goal gap alert khi actual < 70% projected pace

**Technical Notes:**
- `goals.service.ts` trong Campaign module
- Prisma `Goal` model
- Alert integration: trigger GOAL_GAP rule

**Effort:** M (3-5 ngày)

---

### S3.4 — Campaign Notes & Tags

**As a** staff/manager, **I want to** thêm notes và tags vào campaign, **so that** context được lưu trữ (không mất khi chuyển từ Sheets).

**Acceptance Criteria:**
- [ ] Add note to campaign (text, author, timestamp)
- [ ] View note timeline (newest first)
- [ ] Note visible cho tất cả roles
- [ ] Staff có thể add note, không edit/delete note người khác

**Technical Notes:**
- Prisma `CampaignNote` model
- Simple CRUD, no complexity

**Effort:** S (1-2 ngày)

---

## E4: Dashboard & Reporting

> Role-based dashboards, analytics views, và weekly/monthly reports

### S4.1 — CMO Executive Dashboard

**As a** CMO, **I want to** mở dashboard 1 lần là thấy tổng quan KPI, **so that** tôi ra quyết định trong 30 giây.

**Acceptance Criteria:**
- [ ] Total spend (today, 7d, 30d) với trend indicator (↑↓)
- [ ] Total leads (today, 7d, 30d) với trend
- [ ] Overall ROI / ROAS
- [ ] Budget utilization across all campaigns (gauge chart)
- [ ] Cross-channel comparison table: spend, leads, CPL, ROI per channel
- [ ] Top 5 campaigns by ROI
- [ ] Date range filter: today, 7d, 30d, custom
- [ ] Auto-refresh mỗi 5 phút

**Technical Notes:**
- `/cmo/page.tsx` — Server Component + client charts
- `GET /api/dashboard/cmo` → aggregated data
- Redis cache `dash:cmo` (TTL 5 min)
- Charts: recharts hoặc tremor

**Effort:** L (1-2 tuần)

---

### S4.2 — Manager Campaign Health Dashboard

**As a** manager, **I want to** thấy sức khỏe tất cả campaigns, **so that** tôi xử lý nhanh campaigns có vấn đề.

**Acceptance Criteria:**
- [ ] Campaign cards grid: name, channel, spend, leads, CPL, status
- [ ] Visual health: green border (healthy), yellow (warning), red (critical)
- [ ] Health rules: overspend=red, CPL>target=yellow, on-track=green
- [ ] Budget burn rate bar cho mỗi campaign
- [ ] Goal progress bar
- [ ] Quick actions: pause, edit goals, view detail
- [ ] Filter by status, channel
- [ ] Staff task completion overview

**Technical Notes:**
- `/manager/page.tsx`
- `GET /api/dashboard/manager`
- Campaign health calculated server-side

**Effort:** L (1-2 tuần)

---

### S4.3 — Staff Task & Data Entry Dashboard

**As a** staff member, **I want to** mở app thấy ngay task cần làm, **so that** tôi không búi data từ nhiều nguồn.

**Acceptance Criteria:**
- [ ] Task queue: campaigns cần verify data (sorted by priority)
- [ ] Data entry forms: smart forms với pre-filled fields
- [ ] Data quality score: % data verified cho mỗi campaign
- [ ] CSV upload shortcut (Zalo data)
- [ ] Recently updated campaigns list
- [ ] Sync status badges per source

**Technical Notes:**
- `/staff/page.tsx`
- `GET /api/dashboard/staff`
- Task queue = campaigns with unverified data since last sync

**Effort:** M (3-5 ngày)

---

### S4.4 — Cross-Channel Comparison View

**As a** CMO/Manager, **I want to** so sánh hiệu quả giữa các kênh, **so that** tôi phân bổ budget thông minh.

**Acceptance Criteria:**
- [ ] Table: Channel × Metrics (spend, leads, CPL, conversions, ROAS)
- [ ] Bar chart comparison cho selected metric
- [ ] Sparkline trends cho mỗi kênh (7d)
- [ ] Highlight: kênh nào CPL thấp nhất, leads cao nhất
- [ ] Date range filter

**Technical Notes:**
- `GET /api/dashboard/comparison`
- Pre-built view, accessible từ cả CMO và Manager layouts

**Effort:** M (3-5 ngày)

---

### S4.5 — Weekly PDF Report

**As a** CMO/Head, **I want to** nhận email PDF report mỗi thứ 2 lúc 9:00 AM, **so that** tôi có tổng kết tuần không cần mở app.

**Acceptance Criteria:**
- [ ] Auto-generate mỗi Monday 9:00 AM
- [ ] Nội dung: total spend, total leads, ROI by channel, top campaigns, budget status
- [ ] PDF format, Vietnamese, VND currency
- [ ] Email gửi qua Resend tới CMO + HEAD
- [ ] PDF lưu + download được trong app (Report History)

**Technical Notes:**
- BullMQ cron job `weekly-report` Monday 8:30 AM
- `pdf-generator.service.ts` → React PDF / Puppeteer
- `weekly-report.service.ts` aggregate data
- Resend gửi email attach PDF

**Effort:** L (1-2 tuần)

---

## E5: Alert & Notification Engine

> Budget alerts, performance drops, daily digest, và multi-channel dispatch

### S5.1 — Alert Rule Engine

**As a** manager, **I want to** cấu hình alert rules cho campaigns, **so that** hệ thống tự cảnh báo khi có vấn đề.

**Acceptance Criteria:**
- [ ] CRUD alert rules: type, threshold, channel, recipient role
- [ ] Alert types: Budget Burn, Performance Drop, Goal Gap
- [ ] Threshold config: ví dụ "spend > 80% budget khi timeline < 50%"
- [ ] Toggle on/off mỗi rule
- [ ] Default rules tạo sẵn cho mỗi campaign mới
- [ ] Rule evaluation sau mỗi data sync + budget recalc

**Technical Notes:**
- Prisma `AlertRule` model + `AlertLog`
- `alert-rules.service.ts` CRUD
- `alert-evaluator.service.ts` chạy sau mỗi sync job

**Effort:** L (1-2 tuần)

---

### S5.2 — Budget & Performance Alerts

**As a** CMO, **I want to** nhận alert ngay khi campaign overspend hoặc performance giảm, **so that** tôi phản ứng nhanh.

**Acceptance Criteria:**
- [ ] Budget Burn: trigger khi actual_spend > threshold% × planned_budget
- [ ] Performance Drop: trigger khi CPL tăng > 30% vs 7-day average
- [ ] Message format: "⚠️ Chiến dịch X: đã dùng 80% budget chỉ sau 3 ngày"
- [ ] Dispatch theo user notification preferences (Telegram/Email)
- [ ] Log mỗi alert vào AlertLog
- [ ] De-duplicate: không gửi cùng alert trong 24h

**Technical Notes:**
- `alert-dispatcher.service.ts`
- Telegram: `telegram.notifier.ts` gửi rich message
- Email: `email.notifier.ts` qua Resend

**Effort:** M (3-5 ngày)

---

### S5.3 — Morning Briefing Bot

**As a** CMO/Manager, **I want to** nhận morning briefing qua Telegram mỗi sáng 8:00 AM, **so that** tôi biết tình hình mà không cần mở app.

**Acceptance Criteria:**
- [ ] Schedule: 8:00 AM mỗi ngày (GMT+7)
- [ ] Format: "🌅 Morning Briefing - DD/MM/YYYY"
- [ ] 3 Highlights: top performing campaigns
- [ ] 2 Warnings: campaigns cần attention
- [ ] 1 Suggestion: budget reallocation / optimization tip
- [ ] Gửi tới tất cả users có Telegram linked + DAILY_DIGEST enabled

**Technical Notes:**
- BullMQ cron job `morning-briefing` 8:00 AM
- `daily-digest.service.ts` aggregate previous day data
- grammY send formatted message

**Effort:** M (3-5 ngày)

---

### S5.4 — Multi-Channel Dispatch

**As a** system, **I want to** dispatch alerts qua đúng kênh (Telegram/Email) theo user preferences, **so that** ai nhận đúng alert ở đúng nơi.

**Acceptance Criteria:**
- [ ] Read user NotificationPreference trước khi dispatch
- [ ] Telegram: rich formatted message + action buttons (nếu cần decision)
- [ ] Email: template email, clean format
- [ ] Fallback: nếu Telegram fail → retry → fallback email
- [ ] Retry logic: max 3 attempts, exponential backoff

**Technical Notes:**
- `notifications.module.ts` orchestrate
- `telegram.notifier.ts` + `email.notifier.ts`
- BullMQ `notifications` queue

**Effort:** M (3-5 ngày)

---

## E6: Telegram Bot

> Slash commands, inline queries, và interactive decision buttons

### S6.1 — Bot Core & Account Linking

**As a** user, **I want to** interact với Telegram Bot để link account và nhận help, **so that** tôi kết nối Telegram với Marketing Hub.

**Acceptance Criteria:**
- [ ] `/start <token>` → link Telegram account
- [ ] `/help` → danh sách commands
- [ ] `/start` (no token) → welcome message + instructions
- [ ] Bot responds chỉ cho users đã linked

**Technical Notes:**
- grammY framework
- `telegram.module.ts` bootstrap bot
- `bot.service.ts` core handlers

**Effort:** S (1-2 ngày)

---

### S6.2 — Slash Commands: Report, Compare, Budget

**As a** CMO/Manager, **I want to** query data qua Telegram commands, **so that** tôi có thông tin nhanh mà không cần mở app.

**Acceptance Criteria:**
- [ ] `/report today` → spend, leads, top campaign hôm nay
- [ ] `/report week` → tổng kết 7 ngày
- [ ] `/compare fb tiktok` → table so sánh 2 kênh (spend, leads, CPL)
- [ ] `/budget <campaign-name>` → budget status, pace, forecast
- [ ] Formatted response: emoji + table layout trong Telegram
- [ ] Error handling: campaign not found, invalid command

**Technical Notes:**
- `commands/report.command.ts`
- `commands/compare.command.ts`
- `commands/budget.command.ts`
- grammY command handlers → call internal services

**Effort:** L (1-2 tuần)

---

### S6.3 — Decision Action Buttons

**As a** CMO, **I want to** nhận alert với action buttons trong Telegram, **so that** tôi ra quyết định ngay trong chat.

**Acceptance Criteria:**
- [ ] Alert message có inline keyboard buttons: [Pause] [Continue] [View Details]
- [ ] Tap button → record decision vào AlertLog
- [ ] Nếu pause → ghi note "CMO paused via Telegram"
- [ ] Confirmation message sau action

**Technical Notes:**
- grammY inline keyboard + callback queries
- `callback.handler.ts`
- Update AlertLog.decisionAction

**Effort:** M (3-5 ngày)

---

## E7: Unified Metrics & Funnel

> Chuẩn hóa conversion funnel, normalized CPL, và cross-channel attribution

### S7.1 — Channel-Funnel Mapping Configuration

**As a** manager, **I want to** map events từ mỗi kênh vào funnel stages chung, **so that** conversion được tính nhất quán.

**Acceptance Criteria:**
- [ ] Settings page: table Channel × Event → Funnel Stage
- [ ] Default mappings: FB lead_form → LEAD, TikTok page_view → AWARENESS, etc.
- [ ] Manager có thể customize mappings
- [ ] Mapping apply cho tất cả historical + future data
- [ ] 6 funnel stages: AWARENESS → INTEREST → LEAD → QUALIFIED → CONVERSION → RETENTION

**Technical Notes:**
- Prisma `ChannelFunnelMapping` model
- `funnel.service.ts` trong Metrics module
- Admin UI trong Settings

**Effort:** M (3-5 ngày)

---

### S7.2 — Normalized CPL Calculation

**As a** CMO, **I want to** xem Cost per Lead thống nhất cross-channel, **so that** tôi so sánh hiệu quả kênh chính xác.

**Acceptance Criteria:**
- [ ] Unified CPL = Total Spend / Total Leads (per channel, per campaign, overall)
- [ ] Tính theo funnel stage: Cost per Awareness, Cost per Lead, Cost per Conversion
- [ ] Display trên dashboard với channel breakdown
- [ ] Historical trend: CPL overtime (7d, 30d chart)

**Technical Notes:**
- `normalization.service.ts` trong Metrics module
- Aggregate from DailyMetrics + Lead tables
- Cache result in Redis (TTL 15 min)

**Effort:** M (3-5 ngày)

---

### S7.3 — Funnel Visualization

**As a** CMO/Manager, **I want to** xem funnel visualization cross-channel, **so that** tôi thấy drop-off ở đâu.

**Acceptance Criteria:**
- [ ] Funnel chart: 6 stages, count + conversion rate at each stage
- [ ] Filter by channel: show FB funnel vs TikTok funnel vs All
- [ ] Color-coded: green (healthy conversion), red (high drop-off)
- [ ] Tooltip with details: count, %, avg time between stages

**Technical Notes:**
- `GET /api/metrics/funnel`
- recharts FunnelChart component
- Server-side aggregation from Lead table

**Effort:** M (3-5 ngày)

---

## Sprint Mapping

### Sprint 1 (Tuần 1-2)

| Story | Epic | Effort | Focus |
|-------|------|--------|-------|
| S1.1 Auth & Login | E1 | S | Foundation |
| S1.2 RBAC | E1 | S | Foundation |
| S2.1 FB Connector | E2 | L | Core Value |
| S3.1 Campaign CRUD | E3 | M | Core Value |
| S2.4 CSV Upload | E2 | M | Quick Win |

### Sprint 2 (Tuần 3-4)

| Story | Epic | Effort | Focus |
|-------|------|--------|-------|
| S2.2 TikTok Connector | E2 | L | Core Value |
| S2.3 Pancake Webhook | E2 | M | Core Value |
| S3.2 Budget Management | E3 | M | Core Value |
| S4.1 CMO Dashboard | E4 | L | Visible Value |
| S5.3 Morning Briefing | E5 | M | Quick Win |

### Sprint 3 (Tuần 5-6)

| Story | Epic | Effort | Focus |
|-------|------|--------|-------|
| S4.2 Manager Dashboard | E4 | L | Visible Value |
| S4.3 Staff Dashboard | E4 | M | UX |
| S3.3 Goal Tracking | E3 | M | Intelligence |
| S5.1 Alert Rule Engine | E5 | L | Intelligence |
| S1.3 Notification Prefs | E1 | M | Settings |

### Sprint 4 (Tuần 7-8)

| Story | Epic | Effort | Focus |
|-------|------|--------|-------|
| S7.1 Funnel Mapping | E7 | M | Metrics |
| S7.2 Normalized CPL | E7 | M | Metrics |
| S6.2 Bot Slash Commands | E6 | L | Bot |
| S5.2 Budget Alerts | E5 | M | Alerts |
| S4.4 Channel Comparison | E4 | M | Analytics |

### Sprint 5 (Tuần 9-10)

| Story | Epic | Effort | Focus |
|-------|------|--------|-------|
| S7.3 Funnel Viz | E7 | M | Metrics |
| S4.5 Weekly PDF Report | E4 | L | Reporting |
| S6.3 Decision Buttons | E6 | M | Bot |
| S5.4 Multi-channel Alert | E5 | M | Alerts |
| S1.4 Telegram Linking | E1 | M | Settings |

### Backlog (Sprint 6+)

| Story | Epic | Focus |
|-------|------|-------|
| S3.4 Campaign Notes | E3 | UX |
| S6.1 Bot Core | E6 | Bot |
| S2.5 Sync Dashboard | E2 | Monitoring |
