import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Cardory — 브랜드 카드뉴스 스튜디오",
  description: "브랜드의 목소리를 선명한 카드뉴스로 만드세요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}<Toaster position="top-center" richColors /></body>
    </html>
  );
}
