"""Load data into SQLite database"""
import json
from typing import List, Dict, Any
from datetime import datetime
from etl.utils.db import get_db_context
from etl.utils.logger import setup_logger
from etl.config.settings import BATCH_SIZE

logger = setup_logger(__name__)

class DatabaseLoader:
    """Load data into SQLite database"""

    def load_raw_data(self, source_type: str, source_id: str, data: List[Dict[str, Any]]) -> int:
        """Load raw data into database"""
        with get_db_context() as conn:
            cursor = conn.cursor()

            data_json = json.dumps(data)
            row_count = len(data)

            cursor.execute("""
                INSERT INTO raw_data (source_type, source_id, data_json, row_count)
                VALUES (?, ?, ?, ?)
            """, (source_type, source_id, data_json, row_count))

            raw_data_id = cursor.lastrowid
            logger.info(f'Loaded {row_count} raw records (ID: {raw_data_id})')
            return raw_data_id

    def load_processed_data(self, raw_data_id: int, entity_type: str, data: List[Dict[str, Any]]) -> int:
        """Load processed data into database"""
        with get_db_context() as conn:
            cursor = conn.cursor()

            for batch_start in range(0, len(data), BATCH_SIZE):
                batch = data[batch_start:batch_start + BATCH_SIZE]
                batch_json = json.dumps(batch)

                cursor.execute("""
                    INSERT INTO processed_data (raw_data_id, entity_type, data_json)
                    VALUES (?, ?, ?)
                """, (raw_data_id, entity_type, batch_json))

                logger.info(f'Loaded batch {batch_start // BATCH_SIZE + 1} ({len(batch)} records)')

            return len(data)

    def log_etl_job(self, job_id: str, job_type: str, status: str, **kwargs) -> None:
        """Log ETL job execution"""
        with get_db_context() as conn:
            cursor = conn.cursor()

            # Check if job exists
            cursor.execute('SELECT id FROM etl_logs WHERE job_id = ?', (job_id,))
            existing = cursor.fetchone()

            if existing:
                # Update existing log
                set_clause = ', '.join([f'{k} = ?' for k in kwargs.keys()])
                set_clause += ', status = ?'
                values = list(kwargs.values()) + [status, job_id]

                cursor.execute(f"""
                    UPDATE etl_logs SET {set_clause}
                    WHERE job_id = ?
                """, values)
                logger.info(f'Updated ETL log for job {job_id}: {status}')
            else:
                # Insert new log
                cursor.execute("""
                    INSERT INTO etl_logs (job_id, job_type, status, started_at)
                    VALUES (?, ?, ?, ?)
                """, (job_id, job_type, status, datetime.now()))
                logger.info(f'Created ETL log for job {job_id}: {status}')
