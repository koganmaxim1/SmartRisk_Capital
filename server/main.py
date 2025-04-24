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
excel_file_path = r"C:\Projects\SmartRisk_Capital\server\stocks_data_MVP.csv"

@app.post("/stocks/CalculateSpreadStocks")
def get_calculate_spread_stocks(request: StockRequest):
    # Load fresh data for each request
    stocks_data_df = pd.read_csv(excel_file_path)
    calc = CalculateSpreadStocks(request, stocks_data_df)
    result = calc.main()
    return JSONResponse(content=result)

@app.get("/stocks/GetAllStocksData")
def get_stocks_data():
    # Load fresh data for each request
    stocks_data_df = pd.read_csv(excel_file_path)
    cleaned_df = stocks_data_df.replace([float('inf'), float('-inf')], 0).fillna(0)
    stocks_data = cleaned_df.to_dict(orient='records')
    return JSONResponse(content=stocks_data)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
