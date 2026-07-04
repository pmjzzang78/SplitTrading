from abc import ABC, abstractmethod
from datetime import datetime, timedelta


class SplitTrigger(ABC):
    def __init__(self, trigger_value: float):
        self.trigger_value = trigger_value

    @abstractmethod
    def should_buy(
        self,
        current_price: float,
        now: datetime,
        last_buy_price: float | None,
        last_buy_time: datetime | None,
    ) -> bool: ...


class PriceDropTrigger(SplitTrigger):
    def should_buy(self, current_price, now, last_buy_price, last_buy_time) -> bool:
        if last_buy_price is None:
            return True
        return current_price <= last_buy_price * (1 - self.trigger_value / 100)


class TimeIntervalTrigger(SplitTrigger):
    def should_buy(self, current_price, now, last_buy_price, last_buy_time) -> bool:
        if last_buy_time is None:
            return True
        return now - last_buy_time >= timedelta(minutes=self.trigger_value)


def create_trigger(trigger_type: str, trigger_value: float) -> SplitTrigger:
    if trigger_type == "price_drop":
        return PriceDropTrigger(trigger_value)
    if trigger_type == "time_interval":
        return TimeIntervalTrigger(trigger_value)
    raise ValueError(f"unknown trigger_type: {trigger_type}")
