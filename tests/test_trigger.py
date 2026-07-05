from datetime import datetime, timedelta

import pytest

from splittrading.strategy.trigger import (
    PriceDropTrigger,
    TimeIntervalTrigger,
    create_trigger,
)

NOW = datetime(2026, 1, 1, 12, 0, 0)


def test_price_drop_first_buy():
    t = PriceDropTrigger(5)
    assert t.should_buy(100, NOW, None, None) is True


def test_price_drop_boundary():
    t = PriceDropTrigger(5)
    assert t.should_buy(95, NOW, 100, NOW) is True
    assert t.should_buy(96, NOW, 100, NOW) is False
    assert t.should_buy(94, NOW, 100, NOW) is True


def test_time_interval_first_buy():
    t = TimeIntervalTrigger(10)
    assert t.should_buy(100, NOW, None, None) is True


def test_time_interval_boundary():
    t = TimeIntervalTrigger(10)
    last = NOW
    assert t.should_buy(100, NOW + timedelta(minutes=10), 100, last) is True
    assert t.should_buy(100, NOW + timedelta(minutes=9), 100, last) is False


def test_create_trigger_types():
    assert isinstance(create_trigger("price_drop", 5), PriceDropTrigger)
    assert isinstance(create_trigger("time_interval", 10), TimeIntervalTrigger)


def test_create_trigger_invalid():
    with pytest.raises(ValueError):
        create_trigger("foo", 1)
