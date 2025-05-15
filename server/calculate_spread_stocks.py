import itertools
import pandas as pd
import numpy as np
from pydantic import BaseModel
from typing import  List, Dict
import cvxpy as cp
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SelectedStock(BaseModel):
    name: str
    minimum_weight: int

class StockRequest(BaseModel):
    risk_percentage: float
    amount_of_stocks: int
    money_to_invest: float
    selected_stocks: List[SelectedStock]
    portfolio_target: str


class CalculateSpreadStocks:
    def __init__(self, request: StockRequest, data: pd.DataFrame):
        self.risk = request.risk_percentage
        self.n = request.amount_of_stocks
        self.money_to_invest = request.money_to_invest
        self.selected_stocks = [stock.name for stock in request.selected_stocks]
        self.target = request.portfolio_target
        self.stocks_portfolio_df = None
        # Convert data to DataFrame if it's not already
        self.selected_stocks_data = pd.DataFrame(data.loc[data["symbol"].isin(self.selected_stocks)])
        weights_map = {stock.name: stock.minimum_weight for stock in request.selected_stocks}
        self.selected_stocks_data["min_weight"] = self.selected_stocks_data["symbol"].map(weights_map)
        self.optimal_portfolio_df = None
        self.portfolio_std = None

    def main(self):
        self.add_daily_change_to_each_stock()
        self.calculate_cov_between_each_2_stocks()
        self.calculate_corr_between_each_2_stocks()

        # Build N-stock optimal portfolio
        portfolio_df, std, risk, risk_adjusted = self.build_optimal_portfolio()

        return {
            "portfolio": portfolio_df.to_dict(orient="records"),
            "portfolio_std": std,
            "risk_percentage": risk,
            "risk_adjusted": risk_adjusted
        }


import requests
import tempfile

# Download the file from Supabase
xls_url = "https://lhacesogkispjqlndfch.supabase.co/storage/v1/object/public/excel-files/00557070.xlsx"
response = requests.get(xls_url)

with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp_file:
    tmp_file.write(response.content)
    tmp_path = tmp_file.name

# Load Excel from the temp file
xls = pd.ExcelFile(tmp_path)
print("Loaded sheets:", xls.sheet_names)


        # Add empty column
        self.selected_stocks_data['Change_data'] = None

        # Fill Change_data for each stock that has a matching sheet
        for idx in self.selected_stocks_data.index:
            symbol = self.selected_stocks_data.loc[idx, 'symbol']
            if symbol in xls.sheet_names:
                df = xls.parse(symbol)
                if 'Change' in df.columns and 'Date' in df.columns:
                    # Create list of dictionaries with date and change
                    change_data = [{'date': date, 'change': change} 
                                 for date, change in zip(df['Date'], df['Change']) 
                                 if pd.notna(change)]
                    self.selected_stocks_data.at[idx, 'Change_data'] = change_data

    def calculate_cov_between_each_2_stocks(self):
        change_dict = dict(zip(self.selected_stocks_data['symbol'], self.selected_stocks_data['Change_data']))

        for other_symbol, other_change in change_dict.items():
            def cov_with_other(row):
                this_symbol = row['symbol']
                this_change = row['Change_data']
                if this_symbol == other_symbol:
                    return np.nan  # same stock -> skip
                if this_change is None or other_change is None:
                    return np.nan

                # Create dictionaries for faster date lookup
                this_changes = {item['date']: item['change'] for item in this_change}
                other_changes = {item['date']: item['change'] for item in other_change}

                # Find common dates
                common_dates = set(this_changes.keys()) & set(other_changes.keys())
                if not common_dates:
                    logger.info(f"No common dates found between {this_symbol} and {other_symbol}")
                    return np.nan

                # Get aligned changes for common dates
                this_aligned = [this_changes[date] for date in common_dates]
                other_aligned = [other_changes[date] for date in common_dates]

                cov_value = np.cov(this_aligned, other_aligned)[0, 1]
                logger.info(f"Covariance between {this_symbol} and {other_symbol}: {cov_value:.6f} (using {len(common_dates)} common dates)")
                return cov_value

            self.selected_stocks_data[f'{other_symbol}_COV'] = self.selected_stocks_data.apply(cov_with_other, axis=1)

    def calculate_corr_between_each_2_stocks(self):
        # Create a dictionary: symbol -> standard deviation of the stock's change data
        std_dict = dict(
            zip(
                self.selected_stocks_data['symbol'],
                self.selected_stocks_data['Change_data'].apply(
                    lambda x: np.std([item['change'] for item in x]) if x is not None else np.nan
                )
            )
        )

        # Loop over each stock and calculate correlation with all other stocks using the existing COV columns
        for other_symbol in std_dict.keys():
            def corr_with_other(row):
                if row['symbol'] == other_symbol:
                    return np.nan  # Same stock, set NaN
                cov = row.get(f'{other_symbol}_COV', None)
                std_a = std_dict.get(row['symbol'], np.nan)
                std_b = std_dict.get(other_symbol, np.nan)
                # Avoid division by zero or missing data
                if pd.isna(cov) or pd.isna(std_a) or pd.isna(std_b) or std_a == 0 or std_b == 0:
                    return np.nan
                return cov / (std_a * std_b)

            # Add a new column with the correlation value
            self.selected_stocks_data[f'{other_symbol}_CORR'] = self.selected_stocks_data.apply(corr_with_other, axis=1)

    # def build_two_stock_portfolios(self):
    #     import itertools
    #     import numpy as np
    #     import pandas as pd
    #
    #     symbols = self.selected_stocks_data['symbol'].tolist()
    #     std_dict = dict(zip(
    #         self.selected_stocks_data['symbol'],
    #         self.selected_stocks_data['standard_deviation']
    #     ))
    #
    #     combinations = list(itertools.combinations(symbols, 2))
    #     portfolio_rows = []
    #
    #     for stock_a, stock_b in combinations:
    #         std_a = std_dict[stock_a]
    #         std_b = std_dict[stock_b]
    #         var_a = std_a ** 2
    #         var_b = std_b ** 2
    #
    #         # Try to get covariance in both directions
    #         row_a = self.selected_stocks_data[self.selected_stocks_data['symbol'] == stock_a].iloc[0]
    #         cov_ab = row_a.get(f"{stock_b}_COV", np.nan)
    #
    #         if pd.isna(cov_ab):
    #             row_b = self.selected_stocks_data[self.selected_stocks_data['symbol'] == stock_b].iloc[0]
    #             cov_ab = row_b.get(f"{stock_a}_COV", np.nan)
    #
    #         if pd.isna(cov_ab):
    #             print(f"⚠️ Missing COV between {stock_a} and {stock_b}")
    #             continue
    #
    #         denominator = var_a + var_b - 2 * cov_ab
    #         if denominator == 0:
    #             print(f"⚠️ Zero denominator for {stock_a}, {stock_b}")
    #             continue
    #
    #         # Classical Markowitz min-variance formula
    #         weight_a = (var_b - cov_ab) / denominator
    #         weight_b = 1 - weight_a
    #
    #         # Skip if weights are way out of bounds (optional)
    #         if not (0 <= weight_a <= 1 and 0 <= weight_b <= 1):
    #             print(f"⚠️ Invalid weights: {weight_a:.2f}, {weight_b:.2f} for {stock_a}, {stock_b}")
    #             continue
    #
    #         # Portfolio variance & std
    #         portfolio_variance = (
    #                 weight_a ** 2 * var_a +
    #                 weight_b ** 2 * var_b +
    #                 2 * weight_a * weight_b * cov_ab
    #         )
    #         portfolio_std = np.sqrt(portfolio_variance)
    #
    #         portfolio_rows.append({
    #             'stock_a': stock_a,
    #             'weight_a': weight_a,
    #             'investment_a': weight_a * self.money_to_invest,
    #             'stock_b': stock_b,
    #             'weight_b': weight_b,
    #             'investment_b': weight_b * self.money_to_invest,
    #             'portfolio_std': portfolio_std
    #         })
    #
    #     self.stocks_portfolio_df = pd.DataFrame(portfolio_rows)
    #     print(f"✅ Created {len(self.stocks_portfolio_df)} 2-stock portfolios.")

    def build_optimal_portfolio(self):
        df = self.selected_stocks_data
        symbols = df['symbol'].tolist()
        n = len(symbols)

        # Get expected returns from the data
        expected_returns = df['expected_return'].values if 'expected_return' in df.columns else np.zeros(n)
        
        # Convert risk percentage to target standard deviation
        # Linear mapping: 1% -> 0.003, 100% -> 0.060
        target_std = 0.003 + (self.risk - 1) * (0.060 - 0.003) / 99

        # Build covariance matrix using standard deviations
        std_dict = dict(zip(df['symbol'], df['standard_deviation']))
        cov_matrix = np.zeros((n, n))
        
        # Use correlation of 0.5 between different stocks (a reasonable assumption)
        correlation = 0.5
        for i in range(n):
            for j in range(n):
                if i == j:
                    cov_matrix[i][j] = std_dict[symbols[i]] ** 2
                else:
                    cov_matrix[i][j] = correlation * std_dict[symbols[i]] * std_dict[symbols[j]]

        # Define optimization variable
        w = cp.Variable(n)

        # Constraints: weights sum to 1, no short-selling, and minimum weight (converted from percentage)
        min_weights = df['min_weight'].values / 100  # Convert from % to fraction
        constraints = [
            cp.sum(w) == 1,
            w >= min_weights
        ]

        # First calculate minimum risk portfolio to get minimum achievable std
        min_risk_objective = cp.Minimize(cp.quad_form(w, cov_matrix))
        min_risk_problem = cp.Problem(min_risk_objective, constraints)
        min_risk_problem.solve()
        
        if w.value is None:
            raise ValueError("❌ Minimum risk optimization failed — check inputs")
        
        min_risk_weights = w.value
        min_achievable_std = np.sqrt(min_risk_weights.T @ cov_matrix @ min_risk_weights)
        
        # Check if target std is achievable, if not use minimum achievable std
        risk_adjusted = False
        if target_std < min_achievable_std:
            target_std = min_achievable_std
            risk_adjusted = True
            # Convert back to risk percentage
            self.risk = 1 + (target_std - 0.003) * 99 / (0.060 - 0.003)
        
        # Then calculate maximum return portfolio with risk constraint
        if self.target == "max":
            max_return_objective = cp.Maximize(w @ expected_returns)
            risk_constraint = cp.quad_form(w, cov_matrix) <= target_std**2
            max_return_problem = cp.Problem(max_return_objective, constraints + [risk_constraint])
            max_return_problem.solve()
            
            if w.value is None:
                raise ValueError("❌ Maximum return optimization failed — check inputs")
            
            optimal_weights = w.value
            portfolio_std = np.sqrt(optimal_weights.T @ cov_matrix @ optimal_weights)
            portfolio_return = optimal_weights @ expected_returns
            
        else:  # min risk
            objective = cp.Minimize(cp.quad_form(w, cov_matrix))
            problem = cp.Problem(objective, constraints)
            problem.solve()
            
            if w.value is None:
                raise ValueError("❌ Optimization failed — check inputs")
            
            optimal_weights = w.value
            portfolio_std = np.sqrt(optimal_weights.T @ cov_matrix @ optimal_weights)
            portfolio_return = optimal_weights @ expected_returns

        # Create portfolio DataFrame
        portfolio_df = pd.DataFrame({
            'symbol': symbols,
            'weight': optimal_weights,
            'investment': optimal_weights * self.money_to_invest,
            'expected_return': expected_returns
        })

        return portfolio_df, portfolio_std, self.risk, risk_adjusted


if __name__ == "__main__":
    # Load Excel file once
    excel_file_path = "C:\Projects\SmartRisk_Capital\server\stocks_data_MVP.csv"
    data_df = pd.read_csv(excel_file_path)
    mock_request = StockRequest(
        risk_percentage=25.0,
        amount_of_stocks=3,
        money_to_invest=5000.0,
        selected_stocks=['AMZN', 'NVO'],
        portfolio_target="max"
    )
    stocks_division = CalculateSpreadStocks(mock_request ,data_df )
    stocks_division.main()