#!/bin/bash
# S Group Project Setup Script

set -e

echo "🚀 Setting up S Group ETL & BI Dashboard..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Check Python
echo -e "${BLUE}Checking Python...${NC}"
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi
echo -e "${GREEN}✓ Python 3 found${NC}"

# 2. Check Node.js
echo -e "${BLUE}Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found${NC}"

# 3. Create Python virtual environment
echo -e "${BLUE}Creating Python virtual environment...${NC}"
python3 -m venv .venv
source .venv/bin/activate
echo -e "${GREEN}✓ Virtual environment created${NC}"

# 4. Install Python dependencies
echo -e "${BLUE}Installing Python dependencies...${NC}"
pip install -r etl/requirements.txt
echo -e "${GREEN}✓ Python dependencies installed${NC}"

# 5. Initialize database
echo -e "${BLUE}Initializing database...${NC}"
PYTHONPATH=. python etl/main.py --init-db
echo -e "${GREEN}✓ Database initialized${NC}"

# 6. Install dashboard dependencies
echo -e "${BLUE}Installing dashboard dependencies...${NC}"
cd dashboard
npm install
cd ..
echo -e "${GREEN}✓ Dashboard dependencies installed${NC}"

# 7. Create .env if not exists
if [ ! -f .env ]; then
    echo -e "${BLUE}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo "⚠️  Please configure .env with your credentials"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Start dashboard: cd dashboard && npm run dev"
echo "2. Upload CSV file at http://localhost:3000"
echo "3. View processed data in dashboard"
