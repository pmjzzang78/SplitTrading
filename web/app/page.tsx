import ConfigPanel from "@/components/ConfigPanel";
import StatusPanel from "@/components/StatusPanel";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          SplitTrading 대시보드
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          분할매매 엔진 설정 및 상태 확인용 대시보드
        </p>
      </header>

      <div className="space-y-6">
        <ConfigPanel />
        <StatusPanel />
      </div>
    </main>
  );
}
