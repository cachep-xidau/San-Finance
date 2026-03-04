"""Database utilities"""
import sqlite3
from pathlib import Path
from typing import Optional
from contextlib import contextmanager
from etl.config.settings import DATABASE_PATH
from etl.utils.logger import setup_logger

logger = setup_logger(__name__)

def init_database(schema_file: Optional[Path] = None) -> None:
    """Initialize database with schema"""
    if schema_file is None:
        schema_file = Path(DATABASE_PATH).parent / 'schema.sql'

    if not schema_file.exists():
        logger.error(f'Schema file not found: {schema_file}')
        raise FileNotFoundError(f'Schema file not found: {schema_file}')

    conn = get_connection()
    try:
        with open(schema_file, 'r') as f:
            schema = f.read()
        conn.executescript(schema)
        conn.commit()
        logger.info('Database initialized successfully')
    except Exception as e:
        logger.error(f'Failed to initialize database: {e}')
        raise
    finally:
        conn.close()

def get_connection() -> sqlite3.Connection:
    """Get SQLite connection with WAL mode"""
    db_path = Path(DATABASE_PATH)
    db_path.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.Connection(str(db_path))
    conn.execute('PRAGMA journal_mode=WAL')  # Enable Write-Ahead Logging
    conn.execute('PRAGMA synchronous=NORMAL')
    conn.row_factory = sqlite3.Row  # Access columns by name

    return conn

@contextmanager
def get_db_context():
    """Context manager for database connection"""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f'Database transaction failed: {e}')
        raise
    finally:
        conn.close()
