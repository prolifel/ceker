#!/bin/bash

# Bulk TLD Import Script
# Usage: ./bulk-import-tlds.sh [csv-file] [api-url]
# Example: ./bulk-import-tlds.sh tld-list-basic.csv https://ceker.prolifel.com/api/tlds

set -e

# Configuration
CSV_FILE="${1:-scripts/tld-list-basic.csv}"
API_URL="${2:-https://ceker.prolifel.com/api/tlds}"
BATCH_SIZE=500

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "  Bulk TLD Import Script"
echo "======================================"
echo "CSV File: $CSV_FILE"
echo "API URL: $API_URL"
echo "Batch Size: $BATCH_SIZE"
echo ""

# Check if file exists
if [ ! -f "$CSV_FILE" ]; then
    echo -e "${RED}Error: File '$CSV_FILE' not found${NC}"
    exit 1
fi

# Extract TLDs from CSV (one per line)
# Filter for valid TLD names only (alphabetical, 2-63 characters)
echo "Extracting TLDs from CSV..."
tr -d '\r' < "$CSV_FILE" | \
    grep -v '^$' | \
    grep -E '^[a-z]{2,63}$' | \
    sort -u > /tmp/tlds.txt

TOTAL=$(wc -l < /tmp/tlds.txt)
BATCHES=$(( ($TOTAL + $BATCH_SIZE - 1) / $BATCH_SIZE ))

echo "Found $TOTAL unique valid TLDs"
echo "Will process in $BATCHES batches"
echo ""

# Initialize counters
total_success=0
total_duplicates=0
batch_num=0

# Split into batch files
split -l "$BATCH_SIZE" /tmp/tlds.txt /tmp/batch_

# Process each batch
for batch_file in /tmp/batch_*; do
    batch_num=$((batch_num + 1))
    batch_count=$(wc -l < "$batch_file")

    # Read TLDs and format as JSON array, add dot prefix if needed
    tlds=$(cat "$batch_file" | sed 's/^\./\./; s/^[^\.]/.&/' | sed 's/.*/"&"/' | paste -sd ',')

    echo -n "Batch $batch_num/$BATCHES ($batch_count TLDs)... "

    # Send request
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{\"tlds\": [$tlds]}")

    # Extract inserted and duplicates from response
    inserted=$(echo "$response" | grep -o '"inserted":[0-9]*' | cut -d':' -f2 || echo "0")
    duplicates=$(echo "$response" | grep -o '"duplicates":[0-9]*' | cut -d':' -f2 || echo "0")

    total_success=$((total_success + inserted))
    total_duplicates=$((total_duplicates + duplicates))

    if [ "$duplicates" -eq 0 ]; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${YELLOW}Partial ($inserted inserted, $duplicates duplicates)${NC}"
    fi
done

# Cleanup
rm -f /tmp/batch_* /tmp/tlds.txt

# Print summary
echo ""
echo "======================================"
echo "  Import Summary"
echo "======================================"
echo -e "Total processed: $((total_success + total_duplicates))"
echo -e "${GREEN}Inserted: $total_success${NC}"
echo -e "${YELLOW}Duplicates: $total_duplicates${NC}"
echo "======================================"
