import { sampleConfig, configFields } from "@/lib/config";

export default function ConfigPanel() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">설정 (읽기 전용)</h2>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
          현재 백엔드와 실시간 연동되어 있지 않음
        </span>
      </div>
      <p className="mb-5 text-sm text-slate-500">
        아래 값은 <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">splittrading/config.py</code>{" "}
        의 <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">SplitTradingConfig</code> 기본값을 미러링한 샘플입니다.
      </p>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {configFields.map((field) => (
          <div
            key={field.key}
            className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
          >
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {field.label}
            </dt>
            <dd className="mt-1 font-mono text-sm text-slate-900">
              {field.format(sampleConfig[field.key])}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
