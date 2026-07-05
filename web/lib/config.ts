export type SplitTradingConfig = {
  market_type: string;
  exchange: string;
  symbol: string;
  total_investment: number;
  split_count: number;
  trigger_type: string;
  trigger_value: number;
  target_profit_pct: number;
  dry_run: boolean;
};

export const sampleConfig: SplitTradingConfig = {
  market_type: "crypto",
  exchange: "upbit",
  symbol: "BTC/KRW",
  total_investment: 1000000,
  split_count: 5,
  trigger_type: "price_drop",
  trigger_value: 3,
  target_profit_pct: 5,
  dry_run: true,
};

export type ConfigField = {
  key: keyof SplitTradingConfig;
  label: string;
  format: (value: SplitTradingConfig[keyof SplitTradingConfig]) => string;
};

export const configFields: ConfigField[] = [
  { key: "market_type", label: "마켓 종류", format: (v) => String(v) },
  { key: "exchange", label: "거래소", format: (v) => String(v) },
  { key: "symbol", label: "심볼", format: (v) => String(v) },
  {
    key: "total_investment",
    label: "총 투자금",
    format: (v) => Number(v).toLocaleString("ko-KR"),
  },
  { key: "split_count", label: "분할 횟수", format: (v) => String(v) },
  { key: "trigger_type", label: "트리거 종류", format: (v) => String(v) },
  { key: "trigger_value", label: "트리거 값", format: (v) => `${v}%` },
  {
    key: "target_profit_pct",
    label: "목표 수익률",
    format: (v) => `${v}%`,
  },
  {
    key: "dry_run",
    label: "드라이런",
    format: (v) => (v ? "true (모의)" : "false (실거래)"),
  },
];
