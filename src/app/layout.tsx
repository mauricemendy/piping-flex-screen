import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Piping Flexibility Screening — ASME B31.3",
  description:
    "Quick screening tool to determine if formal piping flexibility analysis is required per ASME B31.3 §319.4.1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
