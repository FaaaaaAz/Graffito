"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import ProductSearcher from "@/components/POS/ProductSearcher";
import GrabadoOptions from "@/components/POS/GrabadoOptions";
import POSCart from "@/components/POS/POSCart";
import PaymentModal from "@/components/POS/PaymentModal";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { createVenta } from "@/lib/db";
import type { CartItem, MetodoPago, ProductoConVariantes, Variante } from "@/lib/types";

export default function POSPage() {
  const { productos, loading } = useProducts();
  const { user } = useAuth();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("Efectivo");
  const [cliente, setCliente] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleSelectProduct(
    producto: ProductoConVariantes,
    variante: Variante
  ) {
    const key = `${producto.id}-${variante.id}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        return prev.map((item) =>
          item.key === key
            ? {
                ...item,
                cantidad: Math.min(item.cantidad + 1, item.stockDisponible),
              }
            : item
        );
      }
      const nuevo: CartItem = {
        key,
        productoId: producto.id,
        varianteId: variante.id,
        nombreProducto: producto.nombre,
        nombreVariante: variante.nombre,
        precioUnitario: producto.precio,
        cantidad: 1,
        stockDisponible: variante.stock,
        imageUrl: variante.imageUrl || producto.imageUrl,
        grabado: false,
        textoGrabado: "",
      };
      return [...prev, nuevo];
    });
    setSelectedKey(key);
  }

  function handleIncrement(key: string) {
    setCart((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, cantidad: Math.min(item.cantidad + 1, item.stockDisponible) }
          : item
      )
    );
  }

  function handleDecrement(key: string) {
    setCart((prev) => {
      const target = prev.find((item) => item.key === key);
      if (!target) return prev;
      if (target.cantidad <= 1) {
        return prev.filter((item) => item.key !== key);
      }
      return prev.map((item) =>
        item.key === key ? { ...item, cantidad: item.cantidad - 1 } : item
      );
    });
  }

  function handleRemove(key: string) {
    setCart((prev) => prev.filter((item) => item.key !== key));
    setSelectedKey((current) => (current === key ? null : current));
  }

  function handleGrabadoChange(grabado: boolean, textoGrabado: string) {
    if (!selectedKey) return;
    setCart((prev) =>
      prev.map((item) =>
        item.key === selectedKey ? { ...item, grabado, textoGrabado } : item
      )
    );
  }

  async function handleConfirmVenta() {
    if (!user || cart.length === 0) return;
    setSubmitting(true);
    try {
      await createVenta({
        items: cart.map((item) => ({
          productoId: item.productoId,
          varianteId: item.varianteId,
          nombreProducto: item.nombreProducto,
          nombreVariante: item.nombreVariante,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          grabado: item.grabado,
          textoGrabado: item.textoGrabado,
        })),
        metodoPago,
        cliente,
        usuarioId: user.uid,
      });
      toast.success("Venta registrada correctamente");
      setCart([]);
      setSelectedKey(null);
      setCliente("");
      setMetodoPago("Efectivo");
      setShowPayment(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo registrar la venta"
      );
    } finally {
      setSubmitting(false);
    }
  }

  const selectedItem = cart.find((item) => item.key === selectedKey) ?? null;

  return (
    <div className="flex flex-col gap-4 xl:h-[calc(100vh-7rem)] xl:grid xl:grid-cols-[1.4fr_1fr_1fr]">
      <div className="min-h-[420px] xl:min-h-0">
        <ProductSearcher
          productos={productos}
          loading={loading}
          onSelect={handleSelectProduct}
        />
      </div>
      <div className="min-h-[280px] xl:min-h-0">
        <GrabadoOptions item={selectedItem} onChange={handleGrabadoChange} />
      </div>
      <div className="min-h-[420px] xl:min-h-0">
        <POSCart
          items={cart}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          onRemove={handleRemove}
          metodoPago={metodoPago}
          onMetodoPagoChange={setMetodoPago}
          cliente={cliente}
          onClienteChange={setCliente}
          onConfirm={() => setShowPayment(true)}
        />
      </div>

      {showPayment && (
        <PaymentModal
          items={cart}
          metodoPago={metodoPago}
          cliente={cliente}
          submitting={submitting}
          onClose={() => setShowPayment(false)}
          onConfirm={handleConfirmVenta}
        />
      )}
    </div>
  );
}
