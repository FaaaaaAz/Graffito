import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/components/Auth/AuthProvider";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Graffito | Centro de Operaciones",
  description: "Sistema de punto de venta e inventario para Graffito.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${poppins.variable} h-full`}>
      <body className="h-full bg-canvas text-ink antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1E1E1E",
                color: "#F3F4F6",
                border: "1px solid #2A2A2A",
              },
              success: {
                iconTheme: { primary: "#F5C518", secondary: "#0D0D0D" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#0D0D0D" },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
