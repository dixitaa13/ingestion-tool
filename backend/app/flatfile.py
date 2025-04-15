import pandas as pd
from fastapi import HTTPException
import os

def read_flatfile(file_path: str, delimiter: str):
    try:
        df = pd.read_csv(file_path, delimiter=delimiter)
        columns = df.columns.tolist()
        data = df.to_dict(orient="records")
        return columns, data, len(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read flat file: {str(e)}")

def write_flatfile(data: list, columns: list, file_path: str, delimiter: str):
    try:
        df = pd.DataFrame(data, columns=columns)
        df.to_csv(file_path, sep=delimiter, index=False)
        return len(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to write flat file: {str(e)}") 
