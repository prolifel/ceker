#!/bin/bash

# Bulk Blacklist Import Script
# Usage: ./bulk-import-blacklist.sh [blacklist-file] [api-url]

set -e

BLACKLIST_FILE="${1:-scripts/blacklist.txt}"
API_URL="${2:-http://localhost:3000/api/blacklists}"
BATCH_SIZE=500

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "  Bulk Blacklist Import Script"
echo "======================================"
echo "Blacklist File: $BLACKLIST_FILE"
echo "API URL: $API_URL"
echo "Batch Size: $BATCH_SIZE"
echo ""

# Check if file exists
if [ ! -f "$BLACKLIST_FILE" ]; then
    echo -e "${RED}Error: File '$BLACKLIST_FILE' not found${NC}"
    exit 1
fi

# Extract hostnames from file (handle various URL formats)
# Remove protocols, www prefix, paths - extract hostname only
echo "Extracting domains from blacklist file..."
grep -v '^$' "$BLACKLIST_FILE" | \
    sed -E 's|https?://||; s|^www\.||; s|^/||; s|/.*$||' | \
    tr -d '\r' | \
    grep -v '^$' | \
    grep -E '^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$' | \
    sort -u > /tmp/blacklist.txt

TOTAL=$(wc -l < /tmp/blacklist.txt)
BATCHES=$(( ($TOTAL + $BATCH_SIZE - 1) / $BATCH_SIZE ))

echo "Found $TOTAL unique valid domains"
echo "Will process in $BATCHES batches"
echo ""

if [ "$TOTAL" -eq 0 ]; then
    echo -e "${YELLOW}No valid domains found to import${NC}"
    exit 0
fi

# Initialize counters
total_success=0
batch_num=0

# Split into batch files
split -l "$BATCH_SIZE" /tmp/blacklist.txt /tmp/batch_

# Process each batch
for batch_file in /tmp/batch_*; do
    batch_num=$((batch_num + 1))
    batch_count=$(wc -l < "$batch_file")

    # Read domains and format as JSON array
    domains=$(cat "$batch_file" | sed 's/.*/\"&\"/' | paste -sd ',')

    echo -n "Batch $batch_num/$BATCHES ($batch_count domains)... "

    # Send request
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{\"domains\": [$domains]}")

    # Extract inserted count from response
    inserted=$(echo "$response" | grep -o '"inserted":[0-9]*' | grep -o '[0-9]*' || echo "0")
    total_success=$((total_success + inserted))

    if [ "$inserted" -gt 0 ]; then
        echo -e "${GREEN}OK - Inserted $inserted domains${NC}"
    else
        echo -e "${YELLOW}No new domains (duplicates)${NC}"
    fi
done

# Cleanup
rm -f /tmp/batch_* /tmp/blacklist.txt

# Print summary
echo ""
echo "======================================"
echo "  Import Summary"
echo "======================================"
echo -e "Total processed: $TOTAL"
echo -e "${GREEN}Total inserted: $total_success${NC}"
echo "======================================"
