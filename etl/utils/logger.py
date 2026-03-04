"""ETL Logging Configuration"""
import logging
import sys
from pathlib import Path
from colorlog import ColoredFormatter
from etl.config.settings import LOG_LEVEL, LOG_DIR

def setup_logger(name: str) -> logging.Logger:
    """Setup colored logger with file and console handlers"""
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, LOG_LEVEL))

    # Console handler with colors
    console_handler = logging.StreamHandler(sys.stdout)
    console_formatter = ColoredFormatter(
        '%(log_color)s%(levelname)-8s%(reset)s %(blue)s[%(name)s]%(reset)s %(message)s',
        log_colors={
            'DEBUG': 'cyan',
            'INFO': 'green',
            'WARNING': 'yellow',
            'ERROR': 'red',
            'CRITICAL': 'red,bg_white',
        }
    )
    console_handler.setFormatter(console_formatter)

    # File handler
    log_file = LOG_DIR / f'{name}.log'
    file_handler = logging.FileHandler(log_file)
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    file_handler.setFormatter(file_formatter)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger
