"""CSV file data extraction"""
import pandas as pd
from pathlib import Path
from typing import List, Dict, Any
from etl.config.settings import BATCH_SIZE
from etl.utils.logger import setup_logger

logger = setup_logger(__name__)

class CSVExtractor:
    """Extract data from CSV files"""

    def extract_csv(self, file_path: str, chunksize: int = None) -> List[Dict[str, Any]]:
        """Extract data from CSV file"""
        path = Path(file_path)
        if not path.exists():
            logger.error(f'CSV file not found: {file_path}')
            raise FileNotFoundError(f'CSV file not found: {file_path}')

        try:
            if chunksize:
                # Process large files in chunks
                chunks = []
                for chunk in pd.read_csv(file_path, chunksize=chunksize):
                    chunks.append(chunk)
                df = pd.concat(chunks, ignore_index=True)
            else:
                df = pd.read_csv(file_path)

            records = df.to_dict('records')
            logger.info(f'Extracted {len(records)} rows from {path.name}')
            return records

        except Exception as e:
            logger.error(f'Failed to read CSV file {file_path}: {e}')
            raise

    def extract_multiple_csv(self, file_paths: List[str]) -> Dict[str, List[Dict[str, Any]]]:
        """Extract data from multiple CSV files"""
        results = {}
        for file_path in file_paths:
            try:
                data = self.extract_csv(file_path)
                results[file_path] = data
            except Exception as e:
                logger.warning(f'Skipped {file_path}: {e}')
        return results
