"use client";

import { Download } from "lucide-react";
import toast from "react-hot-toast";
import type { Venta } from "@/lib/types";
import { downloadCSV, ventasToCSV } from "@/lib/utils";

export default function ExportButton({
  ventas,
  filename,
}: {
  ventas: Venta[];
  filename: string;
}) {
  function handleExport() {
    if (ventas.length === 0) {
      toast.error("No hay ventas para exportar.");
      return;
    }
    downloadCSV(ventasToCSV(ventas), filename);
    toast.success("Exportación generada");
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="flex items-center gap-2 rounded-lg border border-panel-2 bg-panel px-4 py-2.5 text-sm font-medium text-ink transition-all duration-300 hover:bg-panel-2"
    >
      <Download className="h-4 w-4" />
      Exportar a CSV
    </button>
  );
}
