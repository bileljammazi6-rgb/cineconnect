#!/bin/bash
set -e

echo "🚀 Starting Netlify build process..."

# Check Node version
echo "📦 Node version: $(node --version)"
echo "📦 NPM version: $(npm --version)"

# Install dependencies with fallback
echo "📥 Installing dependencies..."
if npm ci --production=false; then
    echo "✅ npm ci succeeded"
elif npm install --production=false; then
    echo "✅ npm install succeeded (fallback)"
else
    echo "❌ Both npm ci and npm install failed"
    exit 1
fi

# Verify Vite is available
echo "🔍 Checking Vite installation..."
if npx vite --version; then
    echo "✅ Vite is available"
else
    echo "❌ Vite not found, installing..."
    npm install vite --save-dev
fi

# Build the project
echo "🏗️ Building project..."
npm run build

echo "✅ Build completed successfully!"