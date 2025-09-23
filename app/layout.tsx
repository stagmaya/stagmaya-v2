import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STAGMAYA",
  description: "Created by Febriant Yapson",
  icons: "/logo/logo.png"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
