import os
from dataclasses import dataclass

@dataclass
class SplitTradingConfig:
    market_type: str
    exchange: str
    symbol: str
    total_investment: float
    split_count: int
    trigger_type: str
    trigger_value: float
    target_profit_pct: float
    dry_run: bool = True

def _parse_bool(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "on"}

def load_config_from_env() -> SplitTradingConfig:
    return SplitTradingConfig(
        market_type=os.environ.get("SPLIT_MARKET_TYPE", "crypto"),
        exchange=os.environ.get("SPLIT_EXCHANGE", "upbit"),
        symbol=os.environ.get("SPLIT_SYMBOL", "BTC/KRW"),
        total_investment=float(os.environ.get("SPLIT_TOTAL_INVESTMENT", "1000000")),
        split_count=int(os.environ.get("SPLIT_COUNT", "5")),
        trigger_type=os.environ.get("SPLIT_TRIGGER_TYPE", "price_drop"),
        trigger_value=float(os.environ.get("SPLIT_TRIGGER_VALUE", "3")),
        target_profit_pct=float(os.environ.get("SPLIT_TARGET_PROFIT_PCT", "5")),
        dry_run=_parse_bool(os.environ.get("SPLIT_DRY_RUN", "true")),
    )
