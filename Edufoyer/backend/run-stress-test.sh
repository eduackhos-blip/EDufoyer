#!/bin/bash

echo "========================================"
echo "API Stress Testing Tool"
echo "========================================"
echo ""
echo "Make sure the server is running before starting the stress test!"
echo ""
read -p "Press Enter to continue..."

echo "Starting stress test..."
echo ""

node stress-test.js

echo ""
echo "Stress test completed!"








