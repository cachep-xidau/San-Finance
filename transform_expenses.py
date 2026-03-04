import pandas as pd
import re

# Mapping từ phân loại cũ sang Master data 2026
MAPPING_2026 = {
    # 1. Giá vốn hàng bán
    'Tiền vật liệu': ('1. Giá vốn hàng bán', 'Vật liệu implant', 'Biến phí'),
    'Tiền Lab': ('1. Giá vốn hàng bán', 'Lab răng sứ', 'Biến phí'),

    # 2. Chi phí bán hàng
    'Marketing chạy Quảng cáo': ('2. Chi phí bán hàng', 'Marketing chạy quảng cáo', 'Biến phí'),
    'Tiktok': ('2. Chi phí bán hàng', 'Chi phí quảng cáo Meta/Google/Tiktok', 'Biến phí'),
    'SEO': ('2. Chi phí bán hàng', 'Chi phí quảng cáo Meta/Google/Tiktok', 'Biến phí'),
    'Hoa hồng giới thiệu': ('2. Chi phí bán hàng', 'Chi phí referral/Hoa hồng giới thiệu', 'Biến phí'),
    'Tặng phẩm khách': ('2. Chi phí bán hàng', 'Tặng phẩm khách', 'Biến phí'),
    'Quỹ thưởng gián tiếp': ('2. Chi phí bán hàng', 'Thưởng gián tiếp', 'Biến phí'),
    'Đi trường': ('2. Chi phí bán hàng', 'Đi trường', 'Biến phí'),
    'Hành chính MKT': ('2. Chi phí bán hàng', 'Hành chính MKT', 'Biến phí'),
    'Cộng tác viên': ('2. Chi phí bán hàng', 'Agency hoặc freelancer', 'Biến phí'),

    # 3. Chi phí quản lý doanh nghiệp
    'Chi phí Mặt bằng': ('3. Chi phí quản lý doanh nghiệp', 'Thuê mặt bằng', 'Định phí'),
    'Thuê bằng': ('3. Chi phí quản lý doanh nghiệp', 'Thuê bằng bác sĩ', 'Định phí'),
    'Sửa chữa': ('3. Chi phí quản lý doanh nghiệp', 'Bảo trì - sửa chữa - khử khuẩn', 'Biến phí'),
    'Mua đồ hành chính': ('3. Chi phí quản lý doanh nghiệp', 'Hành chính', 'Biến phí'),
    'Tiền thuê xe': ('3. Chi phí quản lý doanh nghiệp', 'Thuê xe, bãi xe', 'Định phí'),
    'Điện + Nước': ('3. Chi phí quản lý doanh nghiệp', 'Điện, nước, wifi', 'Biến phí'),
    'Phí cà thẻ': ('6. Chi phí khác', 'Phí cà thẻ', 'Biến phí'),

    # 4. Chi phí nhân sự
    'Lương': ('4. Chi phí nhân sự', 'Lương cố định bộ phận văn phòng', 'Định phí'),
    'KPI': ('4. Chi phí nhân sự', 'Thưởng KPI', 'Biến phí'),
    'Bảo hiểm': ('4. Chi phí nhân sự', 'Bảo hiểm', 'Định phí'),
    'Đào tạo': ('4. Chi phí nhân sự', 'Đào tạo nhân sự', 'Biến phí'),
    'Tiền thưởng nóng + liên hoan': ('4. Chi phí nhân sự', 'Thưởng nóng, liên hoan', 'Biến phí'),

    # 6. Chi phí khác
    'Quỹ thưởng tổng cuối năm': ('6. Chi phí khác', 'Thưởng tổng cuối năm', 'Định phí'),
    'Tiền dự trù phát sinh': ('6. Chi phí khác', 'Quỹ dự phòng', 'Biến phí'),
    'Tiếp khách': ('6. Chi phí khác', 'Tiếp khách phòng khám', 'Biến phí'),
    'Mua sắm tài sản': ('6. Chi phí khác', 'Mua sắm tài sản', 'Biến phí'),
}

# Default mapping for unknown categories
DEFAULT_MAPPING = ('6. Chi phí khác', 'Chi phí phát sinh bất thường', 'Biến phí')

def parse_amount(amount_str):
    """Parse Vietnamese number format (123.456.789) to float"""
    if pd.isna(amount_str) or amount_str == '' or amount_str is None:
        return 0.0
    # Remove dots (thousand separator) and convert
    clean = str(amount_str).replace('.', '').replace(',', '.').strip()
    try:
        return float(clean) if clean else 0.0
    except:
        return 0.0

def main():
    # Read the expense file with proper encoding
    df = pd.read_csv(
        '/Users/lucasbraci/Desktop/claudekit/projects/S Group/Chi_phi_Implant.csv',
        encoding='utf-8',
        on_bad_lines='skip'
    )

    print(f"Total rows: {len(df)}")
    print(f"Columns: {df.columns.tolist()}")

    # Filter 2025 data only
    df_2025 = df[df['THÁNG'].astype(str).str.startswith('2025')].copy()
    print(f"2025 rows: {len(df_2025)}")

    # Create new dataframe with required columns
    result = []

    for _, row in df_2025.iterrows():
        month_val = row['THÁNG']

        # Parse month and year - THÁNG is float like 2025.01, 2025.1 (for month 10)
        year = int(month_val)  # 2025
        # Get decimal part and convert to month (0.01 -> 1, 0.1 -> 10, 0.02 -> 2)
        decimal_part = month_val - year  # e.g., 0.01, 0.1, 0.02
        # Multiply by 100 and round to get month number
        month = int(round(decimal_part * 100))  # 0.01*100=1, 0.1*100=10, 0.02*100=2

        # Get classification
        old_category = str(row['PHÂN LOẠI']).strip() if pd.notna(row['PHÂN LOẠI']) else ''

        # Map to 2026 structure
        if old_category in MAPPING_2026:
            category, classify, expense_type = MAPPING_2026[old_category]
        else:
            category, classify, expense_type = DEFAULT_MAPPING
            print(f"Unknown category: '{old_category}' -> using default")

        # Parse amount
        amount = parse_amount(row['SỐ TIỀN'])

        result.append({
            'Month': f"{month:02d}",  # Format as 01, 02, ... 10
            'Year': int(year),
            'Amount': amount,
            'Description': str(row['NỘI DUNG CHI']).strip() if pd.notna(row['NỘI DUNG CHI']) else '',
            'Category': category,
            'Classify': classify,
            'Expense Type': expense_type
        })

    # Create result dataframe
    result_df = pd.DataFrame(result)

    # Save to CSV
    output_path = '/Users/lucasbraci/Desktop/claudekit/projects/S Group/Chi_TGIL_2025.csv'
    result_df.to_csv(output_path, index=False, encoding='utf-8-sig')

    print(f"\nSaved to: {output_path}")
    print(f"Total records: {len(result_df)}")
    print(f"\nSample data:")
    print(result_df.head(10).to_string())

    # Summary by Category
    print(f"\n=== Summary by Category ===")
    summary = result_df.groupby('Category')['Amount'].sum().sort_values(ascending=False)
    for cat, total in summary.items():
        print(f"{cat}: {total:,.0f} VND")

if __name__ == '__main__':
    main()
