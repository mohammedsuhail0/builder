import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/app-layout";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Buildr | Student Builder Community Platform",
  description: "Join the elite student builder network. Showcase projects, share ideas, and find campus collaborators in real-time.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Buildr | Student Builder Network",
    description: "The platform for student creators. Showcase projects, share loops, and collaborate.",
    url: "https://buildr.com",
    siteName: "Buildr",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Buildr Student Platform Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Buildr | Student Builder Network",
    description: "Share build updates and find partners at university campuses.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AppLayout>{children}</AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}

