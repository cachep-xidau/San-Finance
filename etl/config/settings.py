"""ETL Configuration Settings"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Project root
PROJECT_ROOT = Path(__file__).parent.parent.parent

# Upload directory
UPLOAD_DIR = PROJECT_ROOT / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)

# Database
DATABASE_PATH = os.getenv('DATABASE_PATH', str(PROJECT_ROOT / 'database' / 's_group.db'))

# Logging
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_DIR = PROJECT_ROOT / 'etl' / 'logs'
LOG_DIR.mkdir(exist_ok=True)

# Batch processing
BATCH_SIZE = int(os.getenv('BATCH_SIZE', '1000'))
MAX_RETRIES = int(os.getenv('MAX_RETRIES', '5'))

# Data validation
ENABLE_VALIDATION = os.getenv('ENABLE_VALIDATION', 'true').lower() == 'true'
