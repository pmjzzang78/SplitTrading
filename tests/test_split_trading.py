from datetime import datetime, timedelta
from types import SimpleNamespace

import pytest

from splittrading.strategy.split_trading import SplitTradingEngine


class FakeExchangeClient:
    def __init__(self, price=100.0):
        self.price = price
        self.orders = []

    def get_current_price(self, symbol):
        return self.price

    def get_balance(self, asset):
        return 0.0

    def place_order(self, symbol, side, quantity, price=None):
        order = SimpleNamespace(
            order_id=str(len(self.orders)),
            symbol=symbol,
            side=side,
            price=price,
            quantity=quantity,
            status="filled",
        )
        self.orders.append(order)
        return order


def make_config(**overrides):
    base = dict(
        market_type="crypto",
        exchange="fake",
        symbol="BTC/USDT",
        total_investment=1000.0,
        split_count=4,
        trigger_type="price_drop",
        trigger_value=5.0,
        target_profit_pct=10.0,
        dry_run=False,
    )
    base.update(overrides)
    return SimpleNamespace(**base)


NOW = datetime(2026, 1, 1, 12, 0, 0)


def test_buys_split_count_on_falling_price():
    client = FakeExchangeClient()
    engine = SplitTradingEngine(client, make_config())
    prices = [100, 94, 88, 83]  # each >5% below previous
    for i, p in enumerate(prices):
        engine.on_price_update(p, NOW + timedelta(minutes=i))
    buys = [o for o in client.orders if o.side == "buy"]
    assert len(buys) == 4


def test_no_more_buys_after_split_count():
    client = FakeExchangeClient()
    engine = SplitTradingEngine(client, make_config())
    prices = [100, 94, 88, 83, 78, 70]
    for i, p in enumerate(prices):
        engine.on_price_update(p, NOW + timedelta(minutes=i))
    buys = [o for o in client.orders if o.side == "buy"]
    assert len(buys) == 4


def test_sell_all_on_profit_target():
    client = FakeExchangeClient()
    engine = SplitTradingEngine(client, make_config(target_profit_pct=10.0))
    engine.on_price_update(100, NOW)
    held = engine.total_quantity
    assert held > 0
    engine.on_price_update(111, NOW + timedelta(minutes=1))
    sells = [o for o in client.orders if o.side == "sell"]
    assert len(sells) == 1
    assert sells[0].quantity == pytest.approx(held)
    assert engine.total_quantity == 0
    assert engine.average_price is None


def test_average_price_calculation():
    client = FakeExchangeClient()
    # split_count=2, per buy = 500. high target so no sell triggers.
    engine = SplitTradingEngine(
        client, make_config(total_investment=1000.0, split_count=2, target_profit_pct=1000.0)
    )
    engine.on_price_update(100, NOW)
    engine.on_price_update(90, NOW + timedelta(minutes=1))  # 10% drop triggers 2nd buy
    # qty1 = 500/100 = 5, qty2 = 500/90 = 5.5556, total cost 1000
    total_qty = 500 / 100 + 500 / 90
    expected_avg = 1000 / total_qty
    assert engine.average_price == pytest.approx(expected_avg)
