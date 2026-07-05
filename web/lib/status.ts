export type FilledOrder = {
  id: string;
  side: "buy" | "sell";
  price: number;
  amount: number;
  filledAt: string;
};

export type EngineStatus = {
  filledOrders: FilledOrder[];
  averagePrice: number | null;
  heldAmount: number;
};

export const initialStatus: EngineStatus = {
  filledOrders: [],
  averagePrice: null,
  heldAmount: 0,
};
