"""Data validation using Pydantic"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, ValidationError, field_validator
from datetime import datetime
from etl.utils.logger import setup_logger

logger = setup_logger(__name__)

class DataRecord(BaseModel):
    """Base data record validation model"""
    # Example fields - customize based on your data
    id: Optional[int] = None
    date: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[str] = None

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v is not None and v < 0:
            raise ValueError('Amount must be non-negative')
        return v

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        if v is not None:
            allowed_statuses = ['pending', 'completed', 'cancelled']
            if v.lower() not in allowed_statuses:
                raise ValueError(f'Status must be one of {allowed_statuses}')
        return v.lower() if v else None

class DataValidator:
    """Validate data records"""

    @staticmethod
    def validate_records(records: List[Dict[str, Any]], model: type[BaseModel] = DataRecord) -> tuple[List[Dict], List[Dict]]:
        """
        Validate records against Pydantic model
        Returns: (valid_records, invalid_records)
        """
        valid_records = []
        invalid_records = []

        for idx, record in enumerate(records):
            try:
                validated = model(**record)
                valid_records.append(validated.model_dump())
            except ValidationError as e:
                invalid_record = {
                    'row_index': idx,
                    'record': record,
                    'errors': e.errors()
                }
                invalid_records.append(invalid_record)
                logger.warning(f'Validation failed for row {idx}: {e.errors()}')

        logger.info(f'Validation complete: {len(valid_records)} valid, {len(invalid_records)} invalid')
        return valid_records, invalid_records
