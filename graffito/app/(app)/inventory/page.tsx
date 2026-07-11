"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import StockTable from "@/components/Inventory/StockTable";
import PackagingTable from "@/components/Inventory/PackagingTable";
import AdjustmentModal from "@/components/Inventory/AdjustmentModal";
import MovementHistory from "@/components/Inventory/MovementHistory";
import Loading from "@/components/Common/Loading";
import { useInventory } from "@/hooks/useInventory";
import { usePackaging } from "@/hooks/usePackaging";
import { useAuth } from "@/hooks/useAuth";
import { adjustPackagingStock, adjustStock } from "@/lib/db";
import { cn } from "@/lib/utils";
import type { Producto, ProductoPackaging, TipoMovimiento } from "@/lib/types";

type Tab = "productos" | "packaging";

export default function InventoryPage() {
  const { productos, movimientos, loading } = useInventory(20);
  const { packaging, loading: loadingPackaging } = usePackaging();
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>("productos");

  const [adjusting, setAdjusting] = useState<{
    producto: Producto;
    mode: "entrada" | "salida";
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [adjustingPackaging, setAdjustingPackaging] = useState<{
    packaging: ProductoPackaging;
    mode: "entrada" | "salida";
  } | null>(null);
  const [submittingPackaging, setSubmittingPackaging] = useState(false);

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

  async function handleSubmitPackaging(
    cantidad: number,
    tipo: TipoMovimiento,
    notas: string
  ) {
    if (!adjustingPackaging || !user) return;
    setSubmittingPackaging(true);
    try {
      const delta =
        adjustingPackaging.mode === "entrada" ? cantidad : -cantidad;
      await adjustPackagingStock({
        packageId: adjustingPackaging.packaging.id,
        delta,
        tipo,
        notas,
        usuarioId: user.uid,
      });
      toast.success("Stock actualizado correctamente");
      setAdjustingPackaging(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo ajustar el stock"
      );
    } finally {
      setSubmittingPackaging(false);
    }
  }

  const productosSimples = productos.filter((p) => p.tipo !== "combo");

  return (
    <div className="space-y-5">
      <div className="flex gap-1.5 rounded-lg border border-panel-2 bg-panel p-1 w-fit">
        {(
          [
            { id: "productos" as const, label: "Productos" },
            { id: "packaging" as const, label: "Packaging" },
          ]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-all duration-300",
              tab === t.id
                ? "bg-accent text-canvas"
                : "text-ink-soft hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "productos" ? (
        loading ? (
          <Loading label="Cargando inventario..." />
        ) : (
          <StockTable
            productos={productosSimples}
            onRequestIncrease={(producto) =>
              setAdjusting({ producto, mode: "entrada" })
            }
            onRequestDecrease={(producto) =>
              setAdjusting({ producto, mode: "salida" })
            }
          />
        )
      ) : loadingPackaging ? (
        <Loading label="Cargando packaging..." />
      ) : (
        <PackagingTable
          packaging={packaging}
          onRequestIncrease={(pkg) =>
            setAdjustingPackaging({ packaging: pkg, mode: "entrada" })
          }
          onRequestDecrease={(pkg) =>
            setAdjustingPackaging({ packaging: pkg, mode: "salida" })
          }
        />
      )}

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

      {adjustingPackaging && (
        <AdjustmentModal
          producto={adjustingPackaging.packaging}
          mode={adjustingPackaging.mode}
          submitting={submittingPackaging}
          onClose={() => setAdjustingPackaging(null)}
          onSubmit={handleSubmitPackaging}
        />
      )}
    </div>
  );
}
