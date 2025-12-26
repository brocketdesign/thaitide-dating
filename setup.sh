#!/bin/bash

# ThaiTide Quick Start Script
# This script helps set up the development environment

echo "🌊 ThaiTide Dating Platform - Quick Start Setup"
echo "================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if MongoDB is running (optional)
if command -v mongod &> /dev/null; then
    if pgrep -x "mongod" > /dev/null; then
        echo "✅ MongoDB is running"
    else
        echo "⚠️  MongoDB is installed but not running"
        echo "   Start it with: mongod"
    fi
else
    echo "⚠️  MongoDB not found locally. You can use MongoDB Atlas instead."
fi
echo ""

# Setup Backend
echo "📦 Setting up Backend..."
cd backend || exit

if [ ! -f ".env" ]; then
    echo "Creating backend .env file..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your API keys"
else
    echo "✅ Backend .env already exists"
fi

echo "Installing backend dependencies..."
npm install --silent

echo "✅ Backend setup complete"
echo ""

# Setup Frontend
echo "📦 Setting up Frontend..."
cd ../frontend || exit

if [ ! -f ".env.local" ]; then
    echo "Creating frontend .env.local file..."
    cp .env.local.example .env.local
    echo "⚠️  Please edit frontend/.env.local with your API keys"
else
    echo "✅ Frontend .env.local already exists"
fi

echo "Installing frontend dependencies..."
npm install --silent

echo "✅ Frontend setup complete"
echo ""

# Summary
cd ..
echo "================================================"
echo "✨ Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Edit backend/.env with your API keys"
echo "2. Edit frontend/.env.local with your API keys"
echo "3. Start MongoDB (if using local)"
echo "4. Start backend: cd backend && npm run dev"
echo "5. Start frontend: cd frontend && npm run dev"
echo ""
echo "📚 See SETUP.md for detailed configuration guide"
echo "================================================"
