from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class OrderResult:
    order_id: str
    symbol: str
    side: str          # "buy" | "sell"
    price: float
    quantity: float
    status: str         # 예: "filled", "dry_run"

class ExchangeClient(ABC):
    @abstractmethod
    def get_current_price(self, symbol: str) -> float: ...

    @abstractmethod
    def get_balance(self, asset: str) -> float: ...

    @abstractmethod
    def place_order(self, symbol: str, side: str, quantity: float, price: float | None = None) -> OrderResult: ...
