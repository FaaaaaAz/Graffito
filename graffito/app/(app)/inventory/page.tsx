"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import StockTable from "@/components/Inventory/StockTable";
import AdjustmentModal from "@/components/Inventory/AdjustmentModal";
import MovementHistory from "@/components/Inventory/MovementHistory";
import Loading from "@/components/Common/Loading";
import { useInventory } from "@/hooks/useInventory";
import { useAuth } from "@/hooks/useAuth";
import { adjustStock } from "@/lib/db";
import type { Producto, TipoMovimiento } from "@/lib/types";

export default function InventoryPage() {
  const { productos, movimientos, loading } = useInventory(20);
  const { user } = useAuth();

  const [adjusting, setAdjusting] = useState<{
    producto: Producto;
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
        productoId: adjusting.producto.id,
        nombre: adjusting.producto.nombre,
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

  const productosSimples = productos.filter((p) => p.tipo !== "combo");

  return (
    <div className="space-y-5">
      <StockTable
        productos={productosSimples}
        onRequestIncrease={(producto) => setAdjusting({ producto, mode: "entrada" })}
        onRequestDecrease={(producto) => setAdjusting({ producto, mode: "salida" })}
      />

      <MovementHistory movimientos={movimientos} />

      {adjusting && (
        <AdjustmentModal
          producto={adjusting.producto}
          mode={adjusting.mode}
          submitting={submitting}
          onClose={() => setAdjusting(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
