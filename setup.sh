#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Mankeu setup...${NC}"

# Setup Backend Environment
echo -e "${YELLOW}Setting up backend environment...${NC}"
if [ ! -f backend/.env ]; then
    echo "Creating backend/.env from example..."
    cp backend/.env.example backend/.env
    # Generate a secure random key for production/staging if needed, 
    # but for this quick setup we'll keep the default or user can change it.
    # Optionally, we could use openssl to generate one:
    # SECRET=$(openssl rand -hex 32)
    # sed -i "s/CHANGE_THIS_TO_A_SECURE_SECRET_KEY/$SECRET/g" backend/.env
else
    echo "backend/.env already exists."
fi

# Setup Frontend Environment
echo -e "${YELLOW}Setting up frontend environment...${NC}"
if [ ! -f frontend/.env ]; then
    echo "Creating frontend/.env from example..."
    cp frontend/.env.example frontend/.env
else
    echo "frontend/.env already exists."
fi

# Build and Start Docker Containers
echo -e "${GREEN}Building and starting services with Docker Compose...${NC}"
docker compose down -v --remove-orphans # Clean start to avoid conflicts
docker compose up -d --build

echo -e "${GREEN}Setup complete!${NC}"
echo -e "Frontend is running at: http://localhost:3000"
echo -e "Backend is running at: http://localhost:8000"
echo -e "API Docs are at: http://localhost:8000/docs"
