import clickhouse_connect
from fastapi import HTTPException

def connect_clickhouse(host: str, port: str, database: str, user: str, jwt: str):
    try:
        client = clickhouse_connect.get_client(
            host=host,
            port=int(port),
            database=database,
            username=user,
            password=jwt,
            secure=port in ["8443", "9440"],
            verify=True
        )
        client.command("SELECT 1")
        return client
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"ClickHouse connection failed: {str(e)}")

def get_tables(client):
    try:
        result = client.query("SELECT name FROM system.tables WHERE database = currentDatabase()")
        return [row[0] for row in result.result_rows]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch tables: {str(e)}")

def get_columns(client, table: str):
    try:
        result = client.query(f"DESCRIBE TABLE {table}")
        return [{"name": row[0], "type": row[1]} for row in result.result_rows]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch columns: {str(e)}")

def fetch_data(client, table: str, columns: list, limit: int = None):
    try:
        query = f"SELECT {', '.join(columns)} FROM {table}"
        if limit:
            query += f" LIMIT {limit}"
        result = client.query(query)
        return [dict(zip(columns, row)) for row in result.result_rows], len(result.result_rows)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Data fetch failed: {str(e)}")

def insert_data(client, table: str, columns: list, data: list):
    try:
        client.insert(table, data, column_names=columns)
        return len(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Data insertion failed: {str(e)}") 
