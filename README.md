# Bidirectional ClickHouse & Flat File Data Ingestion Tool:

A robust tool for seamless data transfer between CSV files and ClickHouse databases, built with a React frontend and FastAPI backend. This project enables users to upload CSVs, ingest data into ClickHouse with sanitized column names, export ClickHouse tables to CSV, and handle errors through an intuitive UI.

## Table of Contents
   - [Overview]
   - [Features]
   - [Prerequisites]
   - [Installation]
   - [Usage]
   - [Testing]
   - [Directory Structure]
   - [Challenges]
   - [Submission]

## Overview
This tool simplifies bidirectional data workflows:
- **CSV to ClickHouse**: Upload CSV files, select columns, and ingest data into ClickHouse tables, automatically sanitizing column names (e.g., `test_table2.name` to `test_table2_name`).
- **ClickHouse to CSV**: Export ClickHouse tables to downloadable CSV files.
- **Error Handling**: Detects invalid columns and malformed CSVs, displaying clear error messages.
- **User Interface**: A React-based UI at `http://localhost:3000` offers data previews, column selection, and state reset.

Built with:
- **Frontend**: React for responsive UI.
- **Backend**: FastAPI for efficient API endpoints.
- **Database**: ClickHouse for high-performance data storage.
- **Libraries**: Pandas, clickhouse-connect for data processing.

   ## Features
   - **Data Ingestion**: Upload CSVs and ingest into ClickHouse with automatic column name sanitization.
   - **Data Export**: Export ClickHouse tables to CSV with one click.
   - **Error Handling**: Validates CSV formats and column selections, preventing ingestion errors.
   - **Interactive UI**: Preview uploaded data, select columns via multi-select dropdowns, and reset UI state.
   - **Performance**: Handles large datasets efficiently using FastAPI and ClickHouse.

   ## Prerequisites
   Before running the tool, ensure you have:
   - **Python**: 3.8 or higher
   - **Node.js**: 16 or higher
   - **ClickHouse**: Server running on `localhost:8123`
     - Default credentials: `user: default`, `password: my_jwt_token`
     - Adjust credentials in `backend/config.py` if different
   - **Git**: Installed for cloning the repository
   - A modern web browser (e.g., Chrome, Edge)

   ## Installation
   Follow these steps to set up the project locally:

   1. **Clone the Repository**:
      ```bash
      git clone https://github.com/dixitaa13/ingestion-tool.git
      cd ingestion-tool
      ```

   2. **Set Up Backend**:
      ```bash
      cd backend
      python -m venv venv
      .\venv\Scripts\activate
      pip install fastapi uvicorn pandas clickhouse-connect
      ```
      Start the backend server:
      ```bash
      uvicorn app.main:app --reload
      ```
      - Runs on `http://127.0.0.1:8000`

   3. **Set Up Frontend**:
      Open a new terminal in the `ingestion-tool` directory:
      ```bash
      cd frontend
      npm install
      npm start
      ```
      - Runs on `http://localhost:3000`

   4. **Verify ClickHouse**:
      - Ensure ClickHouse is running at `localhost:8123`.
      - Create a sample table (e.g., `uk_price_paid`) for testing if needed.

   ## Usage
   1. **Access the UI**:
      - Open `http://localhost:3000` in your browser.
   2. **Ingest CSV**:
      - Upload a CSV file (e.g., with columns like `test_table2.name`).
      - Preview data in the UI.
      - Select columns to ingest.
      - Click “Ingest” to send data to ClickHouse.
   3. **Export CSV**:
      - Connect to ClickHouse.
      - Select a table (e.g., `uk_imported`).
      - Click “Export” to download as CSV.
   4. **Handle Errors**:
      - Invalid columns trigger “Columns not found” alerts.
      - Malformed CSVs show “Invalid CSV format” errors.
   5. **Reset UI**:
      - Click “Reset” to clear selections and previews.

   ## Testing
   The tool was tested to ensure reliability:
   - **CSV Ingestion**:
     - Uploaded CSV with 3 records, including `test_table2.name`.
     - Verified sanitization to `test_table2_name` and insertion into `uk_imported`.
   - **Error Cases**:
     - Tested invalid column selection; confirmed “Columns not found” error.
     - Uploaded malformed CSV; confirmed “Invalid CSV format” error.
   - **Export**:
     - Exported 3 records from `uk_price_paid` to CSV.
   - **UI**:
     - Verified data previews and multi-select functionality.
     - Confirmed reset clears UI state.

   ## Directory Structure
   ```
   ingestion-tool/
   ├── backend/
   │   ├── app/
   │   │   ├── main.py         # FastAPI app
   │   │   ├── config.py       # ClickHouse credentials
   │   ├── venv/              # Virtual environment (ignored)
   ├── frontend/
   │   ├── src/
   │   │   ├── App.js         # React components
   │   ├── node_modules/      # Dependencies (ignored)
   ├── .gitignore             # Excludes venv, node_modules, CSVs
   ├── README.md              # Project documentation
   ```

   ## Challenges
   - ClickHouse Errors: Resolved `Code: 62` syntax errors by sanitizing column names.
   - UI State: Ensured reset functionality clears all selections without reloading.
   - Error Handling: Implemented robust checks for invalid CSVs and columns.
   - Authentication: Overcame Git push issues with correct credentials.

   ## Submission
   - Author: Dixitaa
   - Date: April 15, 2025


