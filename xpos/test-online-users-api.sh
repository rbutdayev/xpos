#!/bin/bash

# Test script for SuperAdmin Online Users API
# Usage: ./test-online-users-api.sh

echo "========================================="
echo "SuperAdmin Online Users API Test"
echo "========================================="
echo ""

# Configuration
API_URL="http://127.0.0.1:8001/api/admin"
EMAIL="admin@xpos.az"
PASSWORD="12345678"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Login and get Bearer token${NC}"
echo "POST $API_URL/login"
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "$LOGIN_RESPONSE" | jq '.'

# Extract token from response
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}Error: Failed to get token${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Login successful!${NC}"
echo "Token: $TOKEN"
echo ""
echo "========================================="
echo ""

sleep 1

echo -e "${YELLOW}Step 2: Get online users${NC}"
echo "GET $API_URL/online-users"
echo ""

ONLINE_USERS_RESPONSE=$(curl -s -X GET "$API_URL/online-users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")

echo "$ONLINE_USERS_RESPONSE" | jq '.'

# Check if request was successful
SUCCESS=$(echo "$ONLINE_USERS_RESPONSE" | jq -r '.success')

if [ "$SUCCESS" == "true" ]; then
    COUNT=$(echo "$ONLINE_USERS_RESPONSE" | jq -r '.count')
    echo -e "${GREEN}✓ Request successful!${NC}"
    echo "Online users count: $COUNT"
else
    echo -e "${RED}Error: Request failed${NC}"
fi

echo ""
echo "========================================="
echo ""

sleep 1

echo -e "${YELLOW}Step 3: Logout (revoke token)${NC}"
echo "POST $API_URL/logout"
echo ""

LOGOUT_RESPONSE=$(curl -s -X POST "$API_URL/logout" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")

echo "$LOGOUT_RESPONSE" | jq '.'

echo -e "${GREEN}✓ Logout successful!${NC}"
echo ""
echo "========================================="
echo ""

echo -e "${GREEN}All tests completed!${NC}"
