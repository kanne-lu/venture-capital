import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "启峰创投 · 让好项目与长期资本相遇",
  description: "面向投资机构、FA、政府招商部门与项目方的启峰创投项目平台 Demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
