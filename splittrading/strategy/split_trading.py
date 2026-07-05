from datetime import datetime

from .trigger import create_trigger


class SplitTradingEngine:
    def __init__(self, exchange_client, config):
        self.client = exchange_client
        self.config = config
        self.symbol = config.symbol
        self.split_count = config.split_count
        self.per_buy_amount = config.total_investment / config.split_count
        self.target_profit_pct = config.target_profit_pct
        self.dry_run = config.dry_run
        self.trigger = create_trigger(config.trigger_type, config.trigger_value)

        self.filled_orders = []
        self.average_price = None
        self.total_quantity = 0.0
        self.total_cost = 0.0
        self.last_buy_price = None
        self.last_buy_time = None

    def _reset(self):
        self.filled_orders = []
        self.average_price = None
        self.total_quantity = 0.0
        self.total_cost = 0.0
        self.last_buy_price = None
        self.last_buy_time = None

    def _buy(self, current_price: float, now: datetime):
        quantity = self.per_buy_amount / current_price
        if not self.dry_run:
            self.client.place_order(self.symbol, "buy", quantity, price=current_price)
        self.filled_orders.append({"price": current_price, "quantity": quantity, "time": now})
        self.total_quantity += quantity
        self.total_cost += quantity * current_price
        self.average_price = self.total_cost / self.total_quantity
        self.last_buy_price = current_price
        self.last_buy_time = now

    def _sell_all(self, current_price: float):
        if not self.dry_run:
            self.client.place_order(self.symbol, "sell", self.total_quantity, price=current_price)
        self._reset()

    def on_price_update(self, current_price: float, now: datetime | None = None):
        if now is None:
            now = datetime.now()

        if len(self.filled_orders) < self.split_count:
            if self.trigger.should_buy(current_price, now, self.last_buy_price, self.last_buy_time):
                self._buy(current_price, now)

        if self.total_quantity > 0 and current_price >= self.average_price * (
            1 + self.target_profit_pct / 100
        ):
            self._sell_all(current_price)
