import itertools
import pandas as pd
import numpy as np
from pydantic import BaseModel
from typing import List
import cvxpy as cp


class StockRequest(BaseModel):
    risk_percentage: float
    amount_of_stocks: int
    money_to_invest: float
    selected_stocks: List[str]
    portfolio_target: str


class CalculateSpreadStocks:
    def __init__(self, request: StockRequest, data: pd.DataFrame):
        self.risk = request.risk_percentage
        self.n = request.amount_of_stocks
        self.money_to_invest = request.money_to_invest
        self.selected_stocks = request.selected_stocks
        self.target = request.portfolio_target
        self.stocks_portfolio_df = None
        self.selected_stocks_data = data.loc[data["symbol"].isin(self.selected_stocks)]
        self.optimal_portfolio_df =None
        self.portfolio_std = None

    def main(self):
        self.add_daily_change_to_each_stock()
        self.calculate_cov_between_each_2_stocks()
        self.calculate_corr_between_each_2_stocks()

        # Build N-stock optimal portfolio
        portfolio_df, std = self.build_optimal_portfolio()

        return {
            "portfolio": portfolio_df.to_dict(orient="records"),
            "portfolio_std": std
        }


    def add_daily_change_to_each_stock(self):
        # Load Excel file
        xls = pd.ExcelFile(r"C:\Users\Kogan\OneDrive\שולחן העבודה\סטארטאפ\SmartRisk Capital\נתוני חברות לסטארטאפ.xlsx")

        # Add empty column
        self.selected_stocks_data['Change_data'] = None

        # Fill Change_data for each stock that has a matching sheet
        for idx, row in self.selected_stocks_data.iterrows():
            symbol = row['symbol']
            for idx, row in self.selected_stocks_data.iterrows():
                symbol = row['symbol']
                if symbol in xls.sheet_names:
                    df = xls.parse(symbol)
                    if 'Change' in df.columns:
                        self.selected_stocks_data.at[idx, 'Change_data'] = df['Change'].dropna().tolist()

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
                min_len = min(len(this_change), len(other_change))
                return np.cov(this_change[:min_len], other_change[:min_len])[0, 1]

            self.selected_stocks_data[f'{other_symbol}_COV'] = self.selected_stocks_data.apply(cov_with_other, axis=1)

    def calculate_corr_between_each_2_stocks(self):
        # Create a dictionary: symbol -> standard deviation of the stock's change data
        std_dict = dict(
            zip(
                self.selected_stocks_data['symbol'],
                self.selected_stocks_data['Change_data'].apply(lambda x: np.std(x) if x is not None else np.nan)
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
        import numpy as np
        import pandas as pd
        import cvxpy as cp

        df = self.selected_stocks_data
        symbols = df['symbol'].tolist()
        n = len(symbols)

        std_dict = dict(zip(df['symbol'], df['standard_deviation']))

        # Build covariance matrix
        cov_matrix = np.zeros((n, n))
        for i in range(n):
            for j in range(n):
                if i == j:
                    cov_matrix[i][j] = std_dict[symbols[i]] ** 2
                else:
                    cov_ij = df[df['symbol'] == symbols[i]].iloc[0].get(f"{symbols[j]}_COV", None)
                    if pd.isna(cov_ij):
                        cov_ij = df[df['symbol'] == symbols[j]].iloc[0].get(f"{symbols[i]}_COV", 0)
                    cov_matrix[i][j] = cov_ij if cov_ij is not None else 0

        # Define optimization variable
        w = cp.Variable(n)

        # Objective: Minimize portfolio variance
        portfolio_variance = cp.quad_form(w, cov_matrix)
        objective = cp.Minimize(portfolio_variance)

        # Constraints: weights sum to 1, no short-selling
        constraints = [
            cp.sum(w) == 1,
            w >= 0
        ]

        problem = cp.Problem(objective, constraints)
        problem.solve()

        if w.value is None:
            raise ValueError("❌ Optimization failed — check inputs")

        weights = w.value
        result_df = pd.DataFrame({
            'symbol': symbols,
            'weight': weights,
            'investment': weights * self.money_to_invest
        })
        result_df['weight'] = result_df['weight'].round(6)
        result_df['investment'] = result_df['investment'].round(2)

        # Store result in the class
        self.optimal_portfolio_df = result_df

        # Also return portfolio std deviation
        portfolio_std = np.sqrt(weights.T @ cov_matrix @ weights)
        self.portfolio_std = float(round(portfolio_std, 6))

        return result_df, self.portfolio_std


if __name__ == "__main__":
    # Load Excel file once
    excel_file_path = "C:\Projects\MVP_SmartRisk_Capital\server\stocks_data_MVP.csv"
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