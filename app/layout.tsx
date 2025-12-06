import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Linda | Tuuli Team Dashboard",
  description: "Geniální asistentka týmu Tuuli - Váš vítr v plachtách pro sledování výkonnosti",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="h-screen flex flex-col overflow-hidden">
            <main className="flex-1 overflow-auto">{children}</main>
            <footer className="py-4 text-center text-sm text-muted-foreground shrink-0">
              Made with{" "}
              <span className="text-blue-500">♥</span> by{" "}
              <a
                href="https://www.linkedin.com/in/ondrejkulhavy/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors underline underline-offset-4"
              >
                Ondřej Kulhavý
              </a>{" "}
              for Tuuli •{" "}
              <a
                href="https://github.com/OndrejKulhavy/linda"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors underline underline-offset-4"
              >
                GitHub
              </a>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
