"""Data cleaning and transformation"""
import pandas as pd
from typing import List, Dict, Any
from etl.utils.logger import setup_logger

logger = setup_logger(__name__)

class DataCleaner:
    """Clean and transform data"""

    @staticmethod
    def clean_records(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Clean data records"""
        df = pd.DataFrame(records)

        # Remove duplicates
        initial_count = len(df)
        df = df.drop_duplicates()
        duplicates_removed = initial_count - len(df)
        if duplicates_removed > 0:
            logger.info(f'Removed {duplicates_removed} duplicate rows')

        # Handle missing values
        df = df.dropna(how='all')  # Remove completely empty rows
        df = df.fillna('')  # Fill remaining NaN with empty string

        # Strip whitespace from string columns
        string_columns = df.select_dtypes(include=['object']).columns
        for col in string_columns:
            df[col] = df[col].astype(str).str.strip()

        # Convert back to list of dicts
        cleaned_records = df.to_dict('records')
        logger.info(f'Cleaned {len(cleaned_records)} records')

        return cleaned_records

    @staticmethod
    def aggregate_data(records: List[Dict[str, Any]], group_by: str, agg_fields: Dict[str, str]) -> List[Dict[str, Any]]:
        """Aggregate data by field"""
        df = pd.DataFrame(records)

        if group_by not in df.columns:
            logger.error(f'Group by column {group_by} not found')
            return records

        # Aggregate
        aggregated = df.groupby(group_by).agg(agg_fields).reset_index()
        result = aggregated.to_dict('records')

        logger.info(f'Aggregated {len(records)} rows to {len(result)} groups')
        return result
