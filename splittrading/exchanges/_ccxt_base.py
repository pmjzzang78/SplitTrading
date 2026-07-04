import logging

from .base import ExchangeClient, OrderResult

logger = logging.getLogger(__name__)

class CcxtExchangeClient(ExchangeClient):
    ccxt_id: str = ""

    def __init__(self, symbol: str, api_key: str | None = None, api_secret: str | None = None):
        self.symbol = symbol
        self._api_key = api_key
        self._api_secret = api_secret
        self.dry_run = not (api_key and api_secret)
        self._client = None

    def _get_client(self):
        # ccxt 클라이언트는 실거래 시점에만 생성해 dry_run에서 import/네트워크 비용을 피한다.
        if self._client is None:
            import ccxt

            self._client = getattr(ccxt, self.ccxt_id)({
                "apiKey": self._api_key,
                "secret": self._api_secret,
                "enableRateLimit": True,
            })
        return self._client

    def get_current_price(self, symbol: str) -> float:
        if self.dry_run:
            logger.info("[dry_run] get_current_price %s", symbol)
            return 0.0
        ticker = self._get_client().fetch_ticker(symbol)
        return float(ticker["last"])

    def get_balance(self, asset: str) -> float:
        if self.dry_run:
            logger.info("[dry_run] get_balance %s", asset)
            return 0.0
        balance = self._get_client().fetch_balance()
        return float(balance.get(asset, {}).get("free", 0.0) or 0.0)

    def place_order(self, symbol: str, side: str, quantity: float, price: float | None = None) -> OrderResult:
        if self.dry_run:
            logger.info("[dry_run] place_order %s %s qty=%s price=%s", symbol, side, quantity, price)
            return OrderResult(
                order_id="dry-run",
                symbol=symbol,
                side=side,
                price=price if price is not None else 0.0,
                quantity=quantity,
                status="dry_run",
            )
        client = self._get_client()
        if price is None:
            order = client.create_order(symbol, "market", side, quantity)
        else:
            order = client.create_order(symbol, "limit", side, quantity, price)
        return OrderResult(
            order_id=str(order.get("id", "")),
            symbol=symbol,
            side=side,
            price=float(order.get("price") or (price if price is not None else 0.0)),
            quantity=float(order.get("amount") or quantity),
            status=order.get("status") or "filled",
        )
