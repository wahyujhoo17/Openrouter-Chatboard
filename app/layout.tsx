import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumicloud Chat",
  description: "Modern AI Chatboard powered by Lumicloud",
  icons: {
    icon: [
      { rel: "icon", url: "/favicon.ico" },
      { rel: "icon", url: "/img/logo1.png", type: "image/png" },
    ],
    apple: "/img/logo1.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
