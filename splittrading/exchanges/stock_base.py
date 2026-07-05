from .base import ExchangeClient, OrderResult

class StockExchangeClient(ExchangeClient):
    def get_current_price(self, symbol: str) -> float:
        raise NotImplementedError

    def get_balance(self, asset: str) -> float:
        raise NotImplementedError

    def place_order(self, symbol: str, side: str, quantity: float, price: float | None = None) -> OrderResult:
        raise NotImplementedError
