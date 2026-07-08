"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import StockTable from "@/components/Inventory/StockTable";
import AdjustmentModal from "@/components/Inventory/AdjustmentModal";
import MovementHistory from "@/components/Inventory/MovementHistory";
import Loading from "@/components/Common/Loading";
import { useInventory, type StockRow } from "@/hooks/useInventory";
import { useAuth } from "@/hooks/useAuth";
import { adjustStock } from "@/lib/db";
import type { TipoMovimiento } from "@/lib/types";

export default function InventoryPage() {
  const { stockRows, movimientos, loading } = useInventory(20);
  const { user } = useAuth();

  const [adjusting, setAdjusting] = useState<{
    row: StockRow;
    mode: "entrada" | "salida";
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(
    cantidad: number,
    tipo: TipoMovimiento,
    notas: string
  ) {
    if (!adjusting || !user) return;
    setSubmitting(true);
    try {
      const delta = adjusting.mode === "entrada" ? cantidad : -cantidad;
      await adjustStock({
        productoId: adjusting.row.producto.id,
        varianteId: adjusting.row.variante.id,
        nombreProducto: adjusting.row.producto.nombre,
        nombreVariante: adjusting.row.variante.nombre,
        delta,
        tipo,
        notas,
        usuarioId: user.uid,
      });
      toast.success("Stock actualizado correctamente");
      setAdjusting(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo ajustar el stock"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loading label="Cargando inventario..." />;

  return (
    <div className="space-y-5">
      <StockTable
        rows={stockRows}
        onRequestIncrease={(row) => setAdjusting({ row, mode: "entrada" })}
        onRequestDecrease={(row) => setAdjusting({ row, mode: "salida" })}
      />

      <MovementHistory movimientos={movimientos} />

      {adjusting && (
        <AdjustmentModal
          row={adjusting.row}
          mode={adjusting.mode}
          submitting={submitting}
          onClose={() => setAdjusting(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
