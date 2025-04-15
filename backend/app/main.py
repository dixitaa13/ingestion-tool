import logging
import json
import pandas as pd
from typing import Optional
from fastapi import FastAPI, Form, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import clickhouse_connect
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

client = None

def initialize_clickhouse_client():
    global client
    try:
        client = clickhouse_connect.get_client(
            host="localhost",
            port=8123,
            database="default",
            user="default",
            password="my_jwt_token"
        )
        client.command("SELECT 1")
        logger.info("Initialized ClickHouse client")
    except Exception as e:
        logger.error(f"Failed to initialize ClickHouse client: {str(e)}")
        raise HTTPException(status_code=500, detail=f"ClickHouse connection failed: {str(e)}")

def validate_join_condition(join_condition: str, tables: list) -> bool:
    pattern = rf"^{re.escape(tables[0])}\.\w+\s*=\s*{re.escape(tables[1])}\.\w+$"
    return bool(re.match(pattern, join_condition))

def sanitize_column_name(col: str) -> str:
    # Replace dots and invalid chars with underscores for ClickHouse
    return re.sub(r'[^a-zA-Z0-9_]', '_', col.strip())

@app.post("/connect/clickhouse")
async def connect_clickhouse(
    host: str = Form(...),
    port: str = Form(...),
    database: str = Form(...),
    user: str = Form(...),
    jwt: str = Form(...)
):
    global client
    try:
        client = clickhouse_connect.get_client(
            host=host,
            port=int(port),
            database=database,
            user=user,
            password=jwt
        )
        client.command("SELECT 1")
        logger.info(f"Connected to ClickHouse: {host}:{port}/{database}")
        return {"message": "Connected to ClickHouse"}
    except Exception as e:
        logger.error(f"ClickHouse connection failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/connect/flatfile")
async def connect_flatfile(file: UploadFile = File(...), delimiter: str = Form(...)):
    try:
        df = pd.read_csv(file.file, delimiter=delimiter)
        columns = list(df.columns)  # Keep raw column names
        logger.info(f"Flat file raw columns: {columns}")
        return {"message": "Connected to flat file", "columns": columns}
    except Exception as e:
        logger.error(f"Flat file connection failed: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to read CSV: {str(e)}")

@app.get("/tables")
async def get_tables():
    if client is None:
        initialize_clickhouse_client()
    try:
        result = client.query("SHOW TABLES")
        tables = [row[0] for row in result.result_rows]
        logger.info(f"Tables fetched: {tables}")
        return {"tables": tables}
    except Exception as e:
        logger.error(f"Table fetch failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/columns/{table}")
async def get_columns(table: str):
    if client is None:
        initialize_clickhouse_client()
    try:
        result = client.query(f"DESCRIBE TABLE {table}")
        columns = [row[0] for row in result.result_rows]
        logger.info(f"Columns for {table}: {columns}")
        return {"columns": columns}
    except Exception as e:
        logger.error(f"Column fetch failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/preview")
async def preview(
    table: str = Form(...),
    columns: str = Form(...),
    tables: Optional[str] = Form(None),
    join_condition: Optional[str] = Form(None)
):
    if client is None:
        initialize_clickhouse_client()
    columns_list = json.loads(columns)
    if not columns_list:
        raise HTTPException(status_code=400, detail="No columns selected")
    try:
        if tables and len(json.loads(tables)) > 1:
            tables_list = json.loads(tables)
            if len(tables_list) != 2:
                raise HTTPException(status_code=400, detail="Exactly two tables required for join")
            if not join_condition:
                raise HTTPException(status_code=400, detail="Join condition required")
            if not validate_join_condition(join_condition, tables_list):
                raise HTTPException(status_code=400, detail="Invalid join condition format")
            sanitized_columns = [col for col in columns_list]  # Keep join column format
            query = f"SELECT {', '.join(sanitized_columns)} FROM {tables_list[0]} INNER JOIN {tables_list[1]} ON {join_condition} LIMIT 100"
        else:
            query = f"SELECT {', '.join(columns_list)} FROM {table} LIMIT 100"
        logger.info(f"Executing preview query: {query}")
        result = client.query(query)
        data = result.result_rows
        return {"count": len(data), "data": [dict(zip(columns_list, row)) for row in data]}
    except Exception as e:
        logger.error(f"Preview failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/preview/flatfile")
async def preview_flatfile(
    file: UploadFile = File(...),
    columns: str = Form(...),
    delimiter: str = Form(...)
):
    try:
        columns_list = json.loads(columns)
        logger.info(f"Flat file preview requested columns: {columns_list}")
        if not columns_list:
            raise HTTPException(status_code=400, detail="No columns selected")
        file.file.seek(0)
        df = pd.read_csv(file.file, delimiter=delimiter)
        logger.info(f"Flat file CSV columns: {list(df.columns)}")
        missing_cols = [col for col in columns_list if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Columns not found in CSV: {missing_cols}. Available columns: {list(df.columns)}")
        df = df[columns_list].head(100)
        data = df.to_dict(orient='records')
        logger.info(f"Flat file preview: {len(data)} records")
        return {"count": len(data), "data": data}
    except Exception as e:
        logger.error(f"Flat file preview failed: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to preview CSV: {str(e)}")

@app.post("/ingest/clickhouse-to-flatfile")
async def ingest_clickhouse(
    table: str = Form(...),
    columns: str = Form(...),
    file_path: str = Form(...),
    delimiter: str = Form(",")
):
    if client is None:
        initialize_clickhouse_client()
    try:
        columns_list = json.loads(columns)
        if not columns_list:
            raise HTTPException(status_code=400, detail="No columns selected")
        query = f"SELECT {', '.join(columns_list)} FROM {table}"
        result = client.query(query)
        df = pd.DataFrame(result.result_rows, columns=columns_list)
        df.to_csv(file_path, index=False, sep=delimiter)
        logger.info(f"ClickHouse to flat file: {len(df)} records to {file_path}")
        return {"record_count": len(df)}
    except Exception as e:
        logger.error(f"ClickHouse ingestion failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/ingest/clickhouse-join-to-flatfile")
async def ingest_clickhouse_join(
    tables: str = Form(...),
    columns: str = Form(...),
    join_condition: str = Form(...),
    file_path: str = Form(...),
    delimiter: str = Form(",")
):
    if client is None:
        initialize_clickhouse_client()
    try:
        tables_list = json.loads(tables)
        columns_list = json.loads(columns)
        if len(tables_list) != 2:
            raise HTTPException(status_code=400, detail="Exactly two tables required for join")
        if not columns_list:
            raise HTTPException(status_code=400, detail="No columns selected")
        if not validate_join_condition(join_condition, tables_list):
            raise HTTPException(status_code=400, detail="Invalid join condition format")
        sanitized_columns = [col for col in columns_list]  # Keep join column format
        query = f"SELECT {', '.join(sanitized_columns)} FROM {tables_list[0]} INNER JOIN {tables_list[1]} ON {join_condition}"
        result = client.query(query)
        df = pd.DataFrame(result.result_rows, columns=columns_list)
        df.to_csv(file_path, index=False, sep=delimiter)
        logger.info(f"ClickHouse join to flat file: {len(df)} records to {file_path}")
        return {"record_count": len(df)}
    except Exception as e:
        logger.error(f"ClickHouse join ingestion failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/ingest/flatfile-to-clickhouse")
async def ingest_flatfile(
    file: UploadFile = File(...),
    delimiter: str = Form(...),
    table: str = Form(...),
    columns: str = Form(...)
):
    if client is None:
        initialize_clickhouse_client()
    try:
        columns_list = json.loads(columns)
        logger.info(f"Flat file ingest requested columns: {columns_list}")
        if not columns_list:
            raise HTTPException(status_code=400, detail="No columns selected")
        file.file.seek(0)
        try:
            df = pd.read_csv(file.file, delimiter=delimiter)
        except Exception as e:
            logger.error(f"Failed to parse CSV: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(e)}")
        logger.info(f"Flat file CSV columns: {list(df.columns)}")
        missing_cols = [col for col in columns_list if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Columns not found in CSV: {missing_cols}. Available columns: {list(df.columns)}")
        try:
            df_selected = df[columns_list]
        except KeyError as e:
            logger.error(f"Column selection failed: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Invalid columns selected: {str(e)}. Available columns: {list(df.columns)}")
        # Map CSV columns to sanitized ClickHouse columns
        sanitized_columns = [sanitize_column_name(col) for col in columns_list]
        column_mapping = dict(zip(columns_list, sanitized_columns))
        logger.info(f"Column mapping: {column_mapping}")
        column_types = []
        for csv_col, sanitized_col in zip(columns_list, sanitized_columns):
            try:
                dtype = df[csv_col].dtype
                if pd.api.types.is_integer_dtype(dtype):
                    column_types.append(f"{sanitized_col} UInt32")
                elif pd.api.types.is_float_dtype(dtype):
                    column_types.append(f"{sanitized_col} Float64")
                elif pd.api.types.is_datetime64_any_dtype(dtype):
                    column_types.append(f"{sanitized_col} Date")
                else:
                    column_types.append(f"{sanitized_col} String")
            except KeyError as e:
                logger.error(f"Data type detection failed for {csv_col}: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Cannot determine data type for {csv_col}")
        create_query = f"""
            CREATE TABLE IF NOT EXISTS {table} (
                {', '.join(column_types)}
            ) ENGINE = MergeTree()
            ORDER BY tuple()
        """
        logger.info(f"Creating table with query: {create_query}")
        try:
            client.command(create_query)
        except Exception as e:
            logger.error(f"Table creation failed: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Failed to create table: {str(e)}")
        # Rename DataFrame columns to sanitized names for ClickHouse
        try:
            df_for_insert = df_selected.rename(columns=column_mapping)
        except Exception as e:
            logger.error(f"Column renaming failed: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Failed to map columns: {str(e)}")
        logger.info(f"Inserting columns: {list(df_for_insert.columns)}")
        try:
            client.insert_df(table=table, df=df_for_insert)
        except Exception as e:
            logger.error(f"Data insertion failed: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Failed to insert data: {str(e)}")
        logger.info(f"Flat file to ClickHouse: {len(df_for_insert)} records to {table}")
        return {"record_count": len(df_for_insert)}
    except Exception as e:
        logger.error(f"Flat file ingestion failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))