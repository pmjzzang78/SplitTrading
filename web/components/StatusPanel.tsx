import { initialStatus } from "@/lib/status";

export default function StatusPanel() {
  const { filledOrders, averagePrice, heldAmount } = initialStatus;
  const isEmpty = filledOrders.length === 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">체결 상태</h2>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
            평단가
          </div>
          <div className="mt-1 font-mono text-sm text-slate-900">
            {averagePrice === null ? "—" : averagePrice.toLocaleString("ko-KR")}
          </div>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
            보유 수량
          </div>
          <div className="mt-1 font-mono text-sm text-slate-900">{heldAmount}</div>
        </div>
      </div>

      <h3 className="mb-3 text-sm font-medium text-slate-700">체결 내역</h3>
      <div className="overflow-hidden rounded-lg border border-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-2 font-medium">시각</th>
              <th className="px-4 py-2 font-medium">방향</th>
              <th className="px-4 py-2 font-medium">가격</th>
              <th className="px-4 py-2 font-medium">수량</th>
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-sm text-slate-400"
                >
                  엔진 연동 전 — 표시할 체결 내역이 없습니다.
                </td>
              </tr>
            ) : (
              filledOrders.map((order) => (
                <tr key={order.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-mono text-xs text-slate-600">
                    {order.filledAt}
                  </td>
                  <td className="px-4 py-2">{order.side}</td>
                  <td className="px-4 py-2 font-mono">
                    {order.price.toLocaleString("ko-KR")}
                  </td>
                  <td className="px-4 py-2 font-mono">{order.amount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
