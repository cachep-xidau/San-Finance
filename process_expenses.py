#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Process expense data and apply new 2026 master data classification
"""

import csv
import re
from datetime import datetime

# Mapping from old classification to new 2026 classification
# Format: {old_classification: (new_index, category, classify, expense_type)}
CLASSIFICATION_MAPPING = {
    # Giá vốn hàng bán (Cost of Goods Sold)
    'Tiền vật liệu': ('GIAVON.06', '1. Giá vốn hàng bán', 'Vật tư tiêu hao', 'Biến phí'),
    'Tiền Lab': ('GIAVON.03', '1. Giá vốn hàng bán', 'Lab răng sứ', 'Biến phí'),

    # Chi phí bán hàng (Sales expenses)
    'Marketing chạy Quảng cáo': ('CPBH.04', '2. Chi phí bán hàng', 'Marketing chạy quảng cáo', 'Biến phí'),
    'Hoa hồng giới thiệu': ('CPBH.07', '2. Chi phí bán hàng', 'Chi phí referral/Hoa hồng giới thiệu', 'Biến phí'),
    'KPI': ('QLDN.NS.03', '4. Chi phí nhân sự', 'Thưởng KPI', 'Biến phí'),
    'Tặng phẩm khách': ('CPBH.11', '2. Chi phí bán hàng', 'Tặng phẩm khách', 'Biến phí'),
    'Đi trường': ('CPBH.13', '2. Chi phí bán hàng', 'Đi trường', 'Biến phí'),
    'Hành chính MKT': ('CPBH.14', '2. Chi phí bán hàng', 'Hành chính MKT', 'Biến phí'),
    'SEO': ('CPBH.04', '2. Chi phí bán hàng', 'Marketing chạy quảng cáo', 'Biến phí'),
    'Tiktok': ('CPBH.01', '2. Chi phí bán hàng', 'Chi phí quảng cáo Meta/Google/Tiktok', 'Biến phí'),
    'Cộng tác viên': ('CPBH.02', '2. Chi phí bán hàng', 'Agency hoặc freelancer', 'Biến phí'),
    'Quỹ thưởng gián tiếp': ('CPBH.12', '2. Chi phí bán hàng', 'Thưởng gián tiếp', 'Biến phí'),

    # Chi phí quản lý doanh nghiệp (Enterprise management)
    'Chi phí Mặt bằng': ('QLDN.01', '3. Chi phí quản lý doanh nghiệp', 'Thuê mặt bằng', 'Định phí'),
    'Thuê bằng': ('QLDN.03', '3. Chi phí quản lý doanh nghiệp', 'Thuê bằng bác sĩ', 'Định phí'),
    'Sửa chữa': ('QLDN.04', '3. Chi phí quản lý doanh nghiệp', 'Bảo trì - sửa chữa - khử khuẩn', 'Biến phí'),
    'Điện + Nước': ('QLDN.09', '3. Chi phí quản lý doanh nghiệp', 'Điện, nước, wifi', 'Biến phí'),
    'Tiền thuê xe': ('QLDN.08', '3. Chi phí quản lý doanh nghiệp', 'Thuê xe, bãi xe', 'Định phí'),
    'Mua đồ hành chính': ('QLDN.10', '3. Chi phí quản lý doanh nghiệp', 'Hành chính', 'Biến phí'),

    # Chi phí nhân sự (Personnel expenses)
    'Lương': ('QLDN.NS.01', '4. Chi phí nhân sự', 'Lương cố định bộ phận văn phòng', 'Định phí'),
    'Bảo hiểm': ('QLDN.NS.06', '4. Chi phí nhân sự', 'Bảo hiểm', 'Định phí'),
    'Đào tạo': ('QLDN.NS.08', '4. Chi phí nhân sự', 'Đào tạo nhân sự', 'Biến phí'),

    # Chi phí khác (Other expenses)
    'Mua sắm tài sản': ('KHAC.07', '6. Chi phí khác', 'Mua sắm tài sản', 'Biến phí'),
    'Tiếp khách': ('KHAC.05', '6. Chi phí khác', 'Tiếp khách phòng khám', 'Biến phí'),
    'tiếp khách': ('KHAC.05', '6. Chi phí khác', 'Tiếp khách phòng khám', 'Biến phí'),
    'Tiền dự trù phát sinh': ('KHAC.02', '6. Chi phí khác', 'Quỹ dự phòng', 'Biến phí'),
    'Tiền thưởng nóng + liên hoan': ('QLDN.NS.04', '4. Chi phí nhân sự', 'Thưởng nóng, liên hoan', 'Biến phí'),
    'Quỹ thưởng tổng cuối năm': ('KHAC.01', '6. Chi phí khác', 'Thưởng tổng cuối năm', 'Định phí'),
    'Phí cà thẻ': ('KHAC.08', '6. Chi phí khác', 'Phí cà thẻ', 'Biến phí'),
}

# Keyword-based suggestions for empty classifications
KEYWORD_SUGGESTIONS = [
    # Marketing related
    (r'marketing|quảng cáo|ads|facebook|google|meta|tiktok|seo',
     ('CPBH.04', '2. Chi phí bán hàng', 'Marketing chạy quảng cáo', 'Biến phí')),

    # Salary related
    (r'lương|lươngnv|lương nv|lương bs|salary',
     ('QLDN.NS.01', '4. Chi phí nhân sự', 'Lương cố định bộ phận văn phòng', 'Định phí')),

    # KPI/Bonus
    (r'%|kpi|thưởng|bonus',
     ('QLDN.NS.03', '4. Chi phí nhân sự', 'Thưởng KPI', 'Biến phí')),

    # Materials/Supplies
    (r'vật liệu|vật tư|thun|button|khí cụ|morelli|thanh ngọc',
     ('GIAVON.06', '1. Giá vốn hàng bán', 'Vật tư tiêu hao', 'Biến phí')),

    # Lab
    (r'lab|labo|răng sứ',
     ('GIAVON.03', '1. Giá vốn hàng bán', 'Lab răng sứ', 'Biến phí')),

    # Rent/Premises
    (r'61a|mặt bằng|thuê mb|rent',
     ('QLDN.01', '3. Chi phí quản lý doanh nghiệp', 'Thuê mặt bằng', 'Định phí')),

    # Utilities
    (r'điện|nước|water|electric',
     ('QLDN.09', '3. Chi phí quản lý doanh nghiệp', 'Điện, nước, wifi', 'Biến phí')),

    # Insurance
    (r'bảo hiểm|bhxh|insurance',
     ('QLDN.NS.06', '4. Chi phí nhân sự', 'Bảo hiểm', 'Định phí')),

    # Administrative
    (r'hành chính|văn phòng|office|admin|hotline|phần mềm|software',
     ('QLDN.10', '3. Chi phí quản lý doanh nghiệp', 'Hành chính', 'Biến phí')),

    # Gifts/Referrals
    (r'gth|giới thiệu|referral|hoa hồng',
     ('CPBH.07', '2. Chi phí bán hàng', 'Chi phí referral/Hoa hồng giới thiệu', 'Biến phí')),

    # Card fees
    (r'phí cà thẻ|phí thẻ|card fee|pos',
     ('KHAC.08', '6. Chi phí khác', 'Phí cà thẻ', 'Biến phí')),

    # Assets
    (r'máy|thiết bị|tài sản|equipment',
     ('KHAC.07', '6. Chi phí khác', 'Mua sắm tài sản', 'Biến phí')),

    # Entertainment/hospitality
    (r'tiếp khách|liên hoan|party|celebration|trái cây|hoa|đồ cúng',
     ('KHAC.05', '6. Chi phí khác', 'Tiếp khách phòng khám', 'Biến phí')),
]

def parse_month(month_str):
    """Parse month string (format: YYYY.MM) and return year and month"""
    try:
        parts = month_str.split('.')
        if len(parts) == 2:
            year = parts[0]
            month = parts[1]
            return year, month
    except:
        pass
    return None, None

def clean_amount(amount_str):
    """Clean and parse amount string"""
    try:
        # Remove any non-numeric characters except dots and commas
        cleaned = re.sub(r'[^\d.,]', '', str(amount_str))
        # Remove dots used as thousands separators
        cleaned = cleaned.replace('.', '')
        # Replace comma with dot for decimal
        cleaned = cleaned.replace(',', '.')
        return float(cleaned) if cleaned else 0.0
    except:
        return 0.0

def get_classification(old_classification, description=''):
    """Get new classification based on old classification or description keywords"""
    # First try exact match on old classification
    if old_classification and old_classification in CLASSIFICATION_MAPPING:
        return CLASSIFICATION_MAPPING[old_classification], 'exact_match'

    # If empty or no match, try keyword matching on description
    if description:
        desc_lower = description.lower()
        for pattern, classification in KEYWORD_SUGGESTIONS:
            if re.search(pattern, desc_lower, re.IGNORECASE):
                return classification, 'keyword_match'

    # Return None to indicate mismatch
    return None, 'no_match'

def process_expenses():
    """Process expense data and apply new classification"""

    input_file = '/Users/lucasbraci/Desktop/claudekit/projects/S Group/Chi_phi_Teennie.csv'
    output_file = '/Users/lucasbraci/Desktop/claudekit/projects/S Group/chi_Teennie_2026.csv'
    suggestions_file = '/Users/lucasbraci/Desktop/claudekit/projects/S Group/classification_suggestions.csv'

    processed_data = []
    mismatches = {}
    match_stats = {'exact_match': 0, 'keyword_match': 0, 'no_match': 0}

    print("Processing expense data...")

    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            month_year = row.get('THÁNG', '').strip()
            description = row.get('NỘI DUNG CHI', '').strip()
            old_classification = row.get('PHÂN LOẠI', '').strip()
            amount = row.get('SỐ TIỀN', '0').strip()

            # Skip completely empty rows
            if not month_year and not description and not amount:
                continue

            # Parse month and year
            year, month = parse_month(month_year)

            # Clean amount
            amount_value = clean_amount(amount)

            # Get new classification
            new_class, match_type = get_classification(old_classification, description)
            match_stats[match_type] += 1

            if new_class:
                index, category, classify, expense_type = new_class
                processed_data.append({
                    'Month': month or '',
                    'Year': year or '',
                    'Amount': amount_value,
                    'Description': description,
                    'Category': category,
                    'Classify': classify,
                    'Expense type': expense_type,
                    'Old Classification': old_classification,
                    'Match Type': match_type
                })
            else:
                # Track mismatches
                key = old_classification if old_classification else '<EMPTY>'
                if key not in mismatches:
                    mismatches[key] = []
                mismatches[key].append({
                    'description': description,
                    'amount': amount_value,
                    'month': month_year
                })

                # Still add to processed data but with placeholder
                processed_data.append({
                    'Month': month or '',
                    'Year': year or '',
                    'Amount': amount_value,
                    'Description': description,
                    'Category': 'NEEDS_CLASSIFICATION',
                    'Classify': old_classification if old_classification else 'EMPTY',
                    'Expense type': 'UNKNOWN',
                    'Old Classification': old_classification,
                    'Match Type': 'no_match'
                })

    # Write processed data
    print(f"Writing processed data to {output_file}...")
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        fieldnames = ['Month', 'Year', 'Amount', 'Description', 'Category', 'Classify', 'Expense type', 'Old Classification', 'Match Type']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(processed_data)

    # Write mismatch suggestions
    if mismatches:
        print(f"\nWriting classification suggestions to {suggestions_file}...")
        with open(suggestions_file, 'w', encoding='utf-8', newline='') as f:
            fieldnames = ['Old Classification', 'Sample Description', 'Total Occurrences', 'Sample Amount', 'Sample Month', 'Suggested New Category', 'Suggested New Classify']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for old_class, examples in mismatches.items():
                total = len(examples)
                sample = examples[0]
                writer.writerow({
                    'Old Classification': old_class,
                    'Sample Description': sample['description'],
                    'Total Occurrences': total,
                    'Sample Amount': sample['amount'],
                    'Sample Month': sample['month'],
                    'Suggested New Category': 'PLEASE_REVIEW',
                    'Suggested New Classify': 'PLEASE_ASSIGN'
                })

    # Print summary
    print("\n" + "="*60)
    print("PROCESSING SUMMARY")
    print("="*60)
    print(f"Total records processed: {len(processed_data)}")
    print(f"\nClassification Results:")
    print(f"  - Exact matches: {match_stats['exact_match']} ({match_stats['exact_match']/len(processed_data)*100:.1f}%)")
    print(f"  - Keyword matches: {match_stats['keyword_match']} ({match_stats['keyword_match']/len(processed_data)*100:.1f}%)")
    print(f"  - No match (needs review): {match_stats['no_match']} ({match_stats['no_match']/len(processed_data)*100:.1f}%)")
    print(f"\nSuccessfully classified: {match_stats['exact_match'] + match_stats['keyword_match']}")
    print(f"Needs manual classification: {match_stats['no_match']}")
    print(f"\nOutput file: {output_file}")
    if mismatches:
        print(f"Suggestions file: {suggestions_file}")
        print(f"\nUnclassified categories ({len(mismatches)}):")
        for old_class, examples in sorted(mismatches.items(), key=lambda x: len(x[1]), reverse=True)[:10]:
            print(f"  - {old_class}: {len(examples)} occurrences")
        if len(mismatches) > 10:
            print(f"  ... and {len(mismatches) - 10} more categories")
    print("="*60)

if __name__ == '__main__':
    process_expenses()
