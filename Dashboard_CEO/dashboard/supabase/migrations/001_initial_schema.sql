-- S Group Dashboard Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CLINICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default clinics
INSERT INTO clinics (name, slug) VALUES
  ('Nha khoa Implant', 'implant'),
  ('Nha khoa San', 'san'),
  ('Nha khoa Teennie', 'teennie')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  parent_category TEXT,
  expense_type TEXT CHECK (expense_type IN ('fixed', 'variable')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert categories from Master_data_2026.csv
INSERT INTO categories (code, name, parent_category, expense_type) VALUES
  -- Giá vốn hàng bán
  ('GIAVON.01', 'Vật tư nha khoa (điều trị - nội nha - nha chu)', '1. Giá vốn hàng bán', 'variable'),
  ('GIAVON.02', 'Vật liệu implant', '1. Giá vốn hàng bán', 'variable'),
  ('GIAVON.03', 'Lab răng sứ', '1. Giá vốn hàng bán', 'variable'),
  ('GIAVON.04', 'Mắc cài', '1. Giá vốn hàng bán', 'variable'),
  ('GIAVON.05', 'Thuốc - hoá chất', '1. Giá vốn hàng bán', 'variable'),
  ('GIAVON.06', 'Vật tư tiêu hao', '1. Giá vốn hàng bán', 'variable'),
  ('GIAVON.07', 'Khác', '1. Giá vốn hàng bán', 'variable'),
  -- Chi phí bán hàng
  ('CPBH.01', 'Chi phí quảng cáo Meta/Google/Tiktok', '2. Chi phí bán hàng', 'variable'),
  ('CPBH.02', 'Agency hoặc freelancer', '2. Chi phí bán hàng', 'variable'),
  ('CPBH.03', 'Chi phí sản xuất nội dung', '2. Chi phí bán hàng', 'variable'),
  ('CPBH.04', 'Marketing chạy quảng cáo', '2. Chi phí bán hàng', 'variable'),
  ('CPBH.05', 'Chi phí video, hình ảnh', '2. Chi phí bán hàng', 'variable'),
  ('CPBH.06', 'KOL/KOC', '2. Chi phí bán hàng', 'variable'),
  ('CPBH.07', 'Chi phí referral/Hoa hồng giới thiệu', '2. Chi phí bán hàng', 'variable'),
  ('CPBH.08', 'Event marketing', '2. Chi phí bán hàng', 'variable'),
  ('CPBH.09', 'Quà tặng - voucher', '2. Chi phí bán hàng', 'variable'),
  ('CPBH.10', 'In ấn POSM', '2. Chi phí bán hàng', 'variable'),
  ('CPBH.11', 'Tặng phẩm khách', '2. Chi phí bán hàng', 'variable'),
  ('CPBH.12', 'Thưởng gián tiếp', '2. Chi phí bán hàng', 'variable'),
  ('CPBH.13', 'Đi trường', '2. Chi phí bán hàng', 'variable'),
  ('CPBH.14', 'Hành chính MKT', '2. Chi phí bán hàng', 'variable'),
  -- Chi phí quản lý doanh nghiệp
  ('QLDN.01', 'Thuê mặt bằng', '3. Chi phí quản lý doanh nghiệp', 'fixed'),
  ('QLDN.02', 'Dọn vệ sinh', '3. Chi phí quản lý doanh nghiệp', 'fixed'),
  ('QLDN.03', 'Thuê bằng bác sĩ', '3. Chi phí quản lý doanh nghiệp', 'fixed'),
  ('QLDN.04', 'Bảo trì - sửa chữa - khử khuẩn', '3. Chi phí quản lý doanh nghiệp', 'variable'),
  ('QLDN.05', 'Văn phòng phẩm', '3. Chi phí quản lý doanh nghiệp', 'variable'),
  ('QLDN.06', 'Chi phí phần mềm (CRM, kế toán, cloud)', '3. Chi phí quản lý doanh nghiệp', 'fixed'),
  ('QLDN.07', 'Chi phí ngân hàng - POS', '3. Chi phí quản lý doanh nghiệp', 'fixed'),
  ('QLDN.08', 'Thuê xe, bãi xe', '3. Chi phí quản lý doanh nghiệp', 'fixed'),
  ('QLDN.09', 'Điện, nước, wifi', '3. Chi phí quản lý doanh nghiệp', 'variable'),
  ('QLDN.10', 'Hành chính', '3. Chi phí quản lý doanh nghiệp', 'variable'),
  -- Chi phí nhân sự
  ('QLDN.NS.01', 'Lương cố định bộ phận văn phòng', '4. Chi phí nhân sự', 'fixed'),
  ('QLDN.NS.02', 'Lương cố định bộ phận kinh doanh', '4. Chi phí nhân sự', 'fixed'),
  ('QLDN.NS.03', 'Thưởng KPI', '4. Chi phí nhân sự', 'variable'),
  ('QLDN.NS.04', 'Thưởng nóng, liên hoan', '4. Chi phí nhân sự', 'variable'),
  ('QLDN.NS.05', 'Phụ cấp chuyên môn', '4. Chi phí nhân sự', 'fixed'),
  ('QLDN.NS.06', 'Bảo hiểm', '4. Chi phí nhân sự', 'fixed'),
  ('QLDN.NS.07', 'Thuế TNCN', '4. Chi phí nhân sự', 'fixed'),
  ('QLDN.NS.08', 'Đào tạo nhân sự', '4. Chi phí nhân sự', 'variable'),
  -- Chi phí thuế và lãi vay
  ('THUE.01', 'Thuế GTGT/ TNCN/ TNDN/ môn bài/ lệ phí', '5. Chi phí thuế và lãi vay', 'variable'),
  ('THUE.02', 'Chi phí lãi vay', '5. Chi phí thuế và lãi vay', 'variable'),
  ('THUE.03', 'Phường, quận', '5. Chi phí thuế và lãi vay', 'variable'),
  -- Chi phí khác
  ('KHAC.01', 'Thưởng tổng cuối năm', '6. Chi phí khác', 'fixed'),
  ('KHAC.02', 'Quỹ dự phòng', '6. Chi phí khác', 'variable'),
  ('KHAC.03', 'Chi phí phát sinh bất thường', '6. Chi phí khác', 'variable'),
  ('KHAC.04', 'Chi phí phúc lợi nội bộ', '6. Chi phí khác', 'fixed'),
  ('KHAC.05', 'Tiếp khách phòng khám', '6. Chi phí khác', 'variable'),
  ('KHAC.06', 'Tiếp khách ngoài', '6. Chi phí khác', 'variable'),
  ('KHAC.07', 'Mua sắm tài sản', '6. Chi phí khác', 'variable'),
  ('KHAC.08', 'Phí cà thẻ', '6. Chi phí khác', 'variable'),
  ('KHAC.09', 'Giới thiệu nhân sự', '6. Chi phí khác', 'variable')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('ceo', 'c_suite', 'clinic_manager')),
  clinic_id UUID REFERENCES clinics(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BUDGETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,
  year INT NOT NULL,
  month INT CHECK (month BETWEEN 1 AND 12),
  amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, category_id, year, month)
);

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  amount DECIMAL(15,2) NOT NULL,
  source_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_expenses_clinic_date ON expenses(clinic_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);

-- ============================================
-- REVENUE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) NOT NULL,
  date DATE NOT NULL,
  cash DECIMAL(15,2) DEFAULT 0,
  card DECIMAL(15,2) DEFAULT 0,
  card_net DECIMAL(15,2) DEFAULT 0,
  transfer DECIMAL(15,2) DEFAULT 0,
  installment DECIMAL(15,2) DEFAULT 0,
  deposit DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_revenue_clinic_date ON revenue(clinic_id, date);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue ENABLE ROW LEVEL SECURITY;

-- Clinics: All authenticated users can read
CREATE POLICY "All users can read clinics" ON clinics FOR SELECT
  TO authenticated
  USING (true);

-- Categories: All authenticated users can read
CREATE POLICY "All users can read categories" ON categories FOR SELECT
  TO authenticated
  USING (true);

-- User Profiles: Users can read own profile
CREATE POLICY "Users can read own profile" ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Budgets: CEO and C-Suite can read all, Clinic Manager can read own clinic
CREATE POLICY "CEO can manage budgets" ON budgets FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'ceo')
  );

CREATE POLICY "C-Suite can read budgets" ON budgets FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('ceo', 'c_suite'))
    OR
    (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'clinic_manager')
     AND clinic_id = (SELECT clinic_id FROM user_profiles WHERE id = auth.uid()))
  );

-- Expenses: All roles can read based on their access level
CREATE POLICY "CEO can read all expenses" ON expenses FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('ceo', 'c_suite'))
    OR
    (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'clinic_manager')
     AND clinic_id = (SELECT clinic_id FROM user_profiles WHERE id = auth.uid()))
  );

-- Revenue: Same as expenses
CREATE POLICY "CEO can read all revenue" ON revenue FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('ceo', 'c_suite'))
    OR
    (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'clinic_manager')
     AND clinic_id = (SELECT clinic_id FROM user_profiles WHERE id = auth.uid()))
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role, clinic_id)
  VALUES (NEW.id, 'clinic_manager', NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
