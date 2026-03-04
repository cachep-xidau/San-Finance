#!/bin/bash
# Run ETL pipeline

set -e

source .venv/bin/activate
python etl/main.py "$@"
