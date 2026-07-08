"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { ensureSeedData } from "@/lib/db";
import { useAuth } from "@/hooks/useAuth";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/pos": "Punto de Venta",
  "/products": "Productos",
  "/inventory": "Inventario",
  "/sales": "Ventas",
  "/reports": "Reportes",
  "/settings": "Configuración",
};

function SeedRunner() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      ensureSeedData().catch((error) => {
        console.error("No se pudo inicializar la base de datos:", error);
      });
    }
  }, [user]);

  return null;
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const title = TITLES[pathname ?? ""] ?? "Graffito";

  return (
    <ProtectedRoute>
      <SeedRunner />
      <Sidebar />
      <div className="lg:pl-64">
        <Topbar title={title} />
        <main className="min-h-[calc(100vh-4rem)] px-4 py-6 lg:px-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
