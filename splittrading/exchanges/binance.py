import os

from ._ccxt_base import CcxtExchangeClient

class BinanceExchangeClient(CcxtExchangeClient):
    ccxt_id = "binance"

    def __init__(self, symbol: str, api_key: str | None = None, api_secret: str | None = None):
        api_key = api_key if api_key is not None else os.environ.get("BINANCE_API_KEY")
        api_secret = api_secret if api_secret is not None else os.environ.get("BINANCE_API_SECRET")
        super().__init__(symbol, api_key, api_secret)
