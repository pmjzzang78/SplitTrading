import os

from ._ccxt_base import CcxtExchangeClient

class UpbitExchangeClient(CcxtExchangeClient):
    ccxt_id = "upbit"

    def __init__(self, symbol: str, access_key: str | None = None, secret_key: str | None = None):
        access_key = access_key if access_key is not None else os.environ.get("UPBIT_ACCESS_KEY")
        secret_key = secret_key if secret_key is not None else os.environ.get("UPBIT_SECRET_KEY")
        super().__init__(symbol, access_key, secret_key)
