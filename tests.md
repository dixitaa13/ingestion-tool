# Test Cases

This document outlines the test cases conducted to verify the functionality of the Bidirectional ClickHouse & Flat File Data Ingestion Tool. Tests cover CSV ingestion, ClickHouse exports, error handling, and UI interactions.

## 1. CSV to ClickHouse Ingestion

### Test 1.1: Valid CSV Ingestion
- **Description**: Upload a valid CSV with sanitized column names.
- **Input**: CSV file with 3 records, including column `test_table2.name`.
- **Action**: Upload via UI, select all columns, ingest to ClickHouse table `uk_imported`.
- **Expected**:
  - 3 records inserted.
  - Column `test_table2.name` sanitized to `test_table2_name`.
  - No errors reported.
- **Actual**: 3 records inserted, column sanitized correctly.
- **Result**: Pass

### Test 1.2: Invalid Column Selection
- **Description**: Attempt to ingest with a non-existent column.
- **Input**: CSV file, select column `test_table2_name` (not in CSV).
- **Action**: Upload via UI, select invalid column, attempt ingestion.
- **Expected**:
  - Error message: “Columns not found in CSV”.
  - No data ingested.
- **Actual**: Error displayed, ingestion blocked.
- **Result**: Pass

### Test 1.3: Malformed CSV
- **Description**: Upload an invalid CSV file.
- **Input**: File with incorrect CSV format (e.g., missing commas, unbalanced quotes).
- **Action**: Upload via UI, attempt ingestion.
- **Expected**:
  - Error message: “Invalid CSV format”.
  - No data ingested.
- **Actual**: Error displayed, ingestion blocked.
- **Result**: Pass

## 2. ClickHouse to CSV Export

### Test 2.1: Table Export
- **Description**: Export a ClickHouse table to CSV.
- **Input**: ClickHouse table `uk_price_paid` with 3 records.
- **Action**: Connect to ClickHouse via UI, select table, click “Export”.
- **Expected**:
  - CSV file `output.csv` downloaded.
  - File contains 3 records matching table data.
- **Actual**: CSV downloaded with 3 records.
- **Result**: Pass

## 3. User Interface

### Test 3.1: Data Preview
- **Description**: Verify CSV data preview in UI.
- **Input**: CSV with 3 records.
- **Action**: Upload CSV, view preview.
- **Expected**:
  - Preview shows 3 records with correct columns.
- **Actual**: Preview displayed all records accurately.
- **Result**: Pass

### Test 3.2: Column Multi-Select
- **Description**: Test column selection functionality.
- **Input**: CSV with columns `id`, `test_table2.name`.
- **Action**: Upload CSV, use multi-select dropdown to choose columns.
- **Expected**:
  - Selected columns highlighted.
  - Only selected columns used for ingestion.
- **Actual**: Columns selected and ingested correctly.
- **Result**: Pass

### Test 3.3: UI Reset
- **Description**: Test UI reset functionality.
- **Input**: CSV uploaded, columns selected, preview active.
- **Action**: Click “Reset” button.
- **Expected**:
  - UI clears CSV, selections, and preview.
  - Ready for new upload.
- **Actual**: UI reset to initial state.
- **Result**: Pass

## Summary
All test cases passed, confirming the tool’s ability to:
- Ingest CSVs with proper sanitization.
- Export ClickHouse data reliably.
- Handle errors gracefully.
- Provide a functional UI.

Tested by: Dixitaa, April 15, 2025