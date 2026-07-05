import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SplitTrading Dashboard",
  description: "분할매매 엔진 설정 및 상태 대시보드",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
