import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "TableTalk | Lagos Kitchen",
  description: "Find your next meal with a voice assistant. A fictional restaurant demo.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
