#!/bin/bash

# Bulk Domain Import Script
# Usage: ./bulk-import-domains.sh <csv-file> [api-url]
# Example: ./bulk-import-domains.sh global-csv-export.csv https://ceker.prolifel.com/api/domains

set -e

# Configuration
CSV_FILE="${1:-global-csv-export.csv}"
API_URL="${2:-https://ceker.prolifel.com/api/domains}"
BATCH_SIZE=500

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "  Bulk Domain Import Script"
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

# Extract domains from CSV (assuming fqdn is in column 4)
# Filter for valid domain names only
echo "Extracting domains from CSV..."
tr -d '\r' < "$CSV_FILE" | tail -n +2 | cut -d',' -f4 | \
    grep -v '^$' | grep -v '^STATIC$' | \
    grep -E '^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$' | \
    sort -u > /tmp/domains.txt

TOTAL=$(wc -l < /tmp/domains.txt)
BATCHES=$(( ($TOTAL + $BATCH_SIZE - 1) / $BATCH_SIZE ))

echo "Found $TOTAL unique valid domains"
echo "Will process in $BATCHES batches"
echo ""

# Initialize counters
total_success=0
total_failed=0
batch_num=0

# Split into batch files
split -l "$BATCH_SIZE" /tmp/domains.txt /tmp/batch_

# Process each batch
for batch_file in /tmp/batch_*; do
    batch_num=$((batch_num + 1))
    batch_count=$(wc -l < "$batch_file")

    # Read domains and format as JSON array
    domains=$(cat "$batch_file" | sed 's/.*/"&"/' | paste -sd ',')

    echo -n "Batch $batch_num/$BATCHES ($batch_count domains)... "

    # Send request
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{\"domains\": [$domains]}")

    # Extract failed count from response
    failed=$(echo "$response" | grep -o '"failed":\[[^]]*\]' | grep -o '"[^"]*"' | wc -l || echo "0")
    batch_success=$((batch_count - failed))
    total_success=$((total_success + batch_success))
    total_failed=$((total_failed + failed))

    if [ "$failed" -eq 0 ]; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${YELLOW}Partial ($batch_success created, $failed duplicates)${NC}"
    fi
done

# Cleanup
rm -f /tmp/batch_* /tmp/domains.txt

# Print summary
echo ""
echo "======================================"
echo "  Import Summary"
echo "======================================"
echo -e "Total processed: $((total_success + total_failed))"
echo -e "${GREEN}Success: $total_success${NC}"
echo -e "${YELLOW}Failed (duplicates): $total_failed${NC}"
echo "======================================"
