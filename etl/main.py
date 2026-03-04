"""
S Group ETL Pipeline Main Entry Point

Run ETL job with CSV file:
    python etl/main.py --file path/to/data.csv
"""
import argparse
import uuid
from datetime import datetime
from pathlib import Path
from etl.extract.csv_reader import CSVExtractor
from etl.transform.validator import DataValidator
from etl.transform.cleaner import DataCleaner
from etl.load.database import DatabaseLoader
from etl.utils.db import init_database
from etl.utils.logger import setup_logger
from etl.config.settings import ENABLE_VALIDATION

logger = setup_logger(__name__)

def run_etl_job(csv_file_path: str):
    """Execute ETL pipeline for CSV file"""
    job_id = f'etl-{datetime.now().strftime("%Y%m%d-%H%M%S")}-{uuid.uuid4().hex[:8]}'
    start_time = datetime.now()

    loader = DatabaseLoader()
    file_path = Path(csv_file_path)

    if not file_path.exists():
        logger.error(f'CSV file not found: {csv_file_path}')
        raise FileNotFoundError(f'CSV file not found: {csv_file_path}')

    try:
        logger.info(f'Starting ETL job: {job_id}')
        logger.info(f'Processing file: {file_path.name}')
        loader.log_etl_job(job_id, 'full', 'started')

        # 1. EXTRACT
        logger.info('=== EXTRACT PHASE ===')
        csv_extractor = CSVExtractor()
        raw_data = csv_extractor.extract_csv(str(file_path))

        # 2. TRANSFORM
        logger.info('=== TRANSFORM PHASE ===')

        # Clean data
        cleaner = DataCleaner()
        cleaned_data = cleaner.clean_records(raw_data)

        # Validate data
        invalid_data = []
        if ENABLE_VALIDATION:
            validator = DataValidator()
            valid_data, invalid_data = validator.validate_records(cleaned_data)

            if invalid_data:
                logger.warning(f'Found {len(invalid_data)} invalid records')
                # Log invalid records to DLQ
                loader.load_raw_data('dlq', job_id, invalid_data)
        else:
            valid_data = cleaned_data

        # 3. LOAD
        logger.info('=== LOAD PHASE ===')

        # Load raw data
        raw_data_id = loader.load_raw_data('csv', file_path.name, raw_data)

        # Load processed data
        processed_count = loader.load_processed_data(raw_data_id, 'sales', valid_data)

        # Log job completion
        duration = (datetime.now() - start_time).total_seconds()
        loader.log_etl_job(
            job_id, 'full', 'success',
            source_type='csv',
            source_id=file_path.name,
            rows_processed=processed_count,
            rows_failed=len(invalid_data) if ENABLE_VALIDATION else 0,
            completed_at=datetime.now(),
            duration_seconds=duration
        )

        logger.info(f'ETL job {job_id} completed successfully in {duration:.2f}s')
        logger.info(f'Processed: {processed_count} rows')

        return {
            'success': True,
            'job_id': job_id,
            'rows_processed': processed_count,
            'rows_failed': len(invalid_data) if ENABLE_VALIDATION else 0,
            'duration_seconds': duration
        }

    except Exception as e:
        duration = (datetime.now() - start_time).total_seconds()
        loader.log_etl_job(
            job_id, 'full', 'failed',
            error_message=str(e),
            completed_at=datetime.now(),
            duration_seconds=duration
        )
        logger.error(f'ETL job {job_id} failed: {e}', exc_info=True)
        raise

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='S Group ETL Pipeline')
    parser.add_argument('--file', type=str, help='CSV file path to process')
    parser.add_argument('--init-db', action='store_true', help='Initialize database')
    args = parser.parse_args()

    if args.init_db:
        logger.info('Initializing database...')
        init_database()
        logger.info('Database initialized successfully')
        return

    if not args.file:
        parser.error('--file argument is required')

    run_etl_job(args.file)

if __name__ == '__main__':
    main()
