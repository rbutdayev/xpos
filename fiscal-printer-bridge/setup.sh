#!/bin/bash

# XPOS Printer Bridge Desktop App - Setup Script
# This script helps you set up the desktop application

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║       XPOS Printer Bridge Desktop App Setup             ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
echo "1️⃣  Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found!"
    echo "   Please install Node.js v16 or later from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js found: $NODE_VERSION"
echo ""

# Check npm
echo "2️⃣  Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found!"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✅ npm found: $NPM_VERSION"
echo ""

# Install dependencies
echo "3️⃣  Installing dependencies..."
echo "   This may take a few minutes..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Create icons
echo "4️⃣  Creating placeholder icons..."
cd electron/assets

# Make script executable
chmod +x create-icons.sh

# Run icon creation
./create-icons.sh

cd ../..

echo ""
echo "✅ Icons created"
echo ""

# Summary
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║                 ✅ Setup Complete!                       ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo ""
echo "1. Test the app in development mode:"
echo "   npm run electron:dev"
echo ""
echo "2. Build installers for distribution:"
echo "   npm run electron:build:win    # Windows"
echo "   npm run electron:build:mac    # macOS"
echo ""
echo "3. Find installers in:"
echo "   dist-electron/"
echo ""
echo "📚 Documentation:"
echo "   - QUICKSTART.md    - Quick start guide"
echo "   - README-DESKTOP.md - User documentation"
echo "   - BUILDING.md       - Build instructions"
echo ""
echo "🎉 Happy building!"
echo ""
