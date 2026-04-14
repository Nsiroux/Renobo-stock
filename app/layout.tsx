import type { Metadata, Viewport } from "next";
import AuthGate from "@/components/AuthGate";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import "./globals.css";

export const metadata: Metadata = {
  title: "Renobo voorraad",
  description: "Interne stock app voor pads, panelen en toebehoren.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Renobo voorraad",
  },
  icons: {
    apple: "/apple-icon",
    icon: "/icon",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff1d25",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistration />
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
