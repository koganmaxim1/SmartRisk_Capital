from fastapi import FastAPI
from fastapi.responses import JSONResponse
import pandas as pd
import uvicorn
from calculate_spread_stocks import CalculateSpreadStocks, StockRequest
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the path to the CSV file
excel_file_path = "stocks_data_MVP.csv"

@app.get("/stocks/GetAllStocksData")
def get_stocks_data():
    import requests
    import tempfile
    import pandas as pd
    from fastapi.responses import JSONResponse

    try:
        xls_url = "https://lhacesogkispjqlndfch.supabase.co/storage/v1/object/public/excel-files/00557070.xlsx"
        response = requests.get(xls_url)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp_file:
            tmp_file.write(response.content)
            tmp_path = tmp_file.name

        xls = pd.ExcelFile(tmp_path)
        sheet_name = xls.sheet_names[0]
        df = pd.read_excel(xls, sheet_name=sheet_name)
        df = df.replace({float("inf"): 0, float("-inf"): 0}).fillna(0)

        return JSONResponse(content=df.to_dict(orient="records"))
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)



