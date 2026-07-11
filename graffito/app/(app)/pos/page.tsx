"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import ProductSearcher from "@/components/POS/ProductSearcher";
import GrabadoOptions from "@/components/POS/GrabadoOptions";
import POSCart from "@/components/POS/POSCart";
import PaymentModal from "@/components/POS/PaymentModal";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { usePackaging } from "@/hooks/usePackaging";
import { useAuth } from "@/hooks/useAuth";
import { createVenta } from "@/lib/db";
import {
  packagingPorId,
  resizeGrabadoParaCantidad,
  vinculosPorProducto,
} from "@/lib/utils";
import type {
  CartItem,
  CartPackagingLine,
  GrabadoInfo,
  MetodoPago,
  Producto,
} from "@/lib/types";

export default function POSPage() {
  const { productos, loading } = useProducts();
  const { categorias } = useCategories();
  const { packaging, vinculos } = usePackaging();
  const { user } = useAuth();

  const packagingPorIdMap = useMemo(() => packagingPorId(packaging), [packaging]);
  const vinculosPorProductoMap = useMemo(
    () => vinculosPorProducto(vinculos),
    [vinculos]
  );

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("Efectivo");
  const [cliente, setCliente] = useState("");
  const [celular, setCelular] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleSelectProduct(producto: Producto, disponible: number) {
    setCart((prev) => {
      const existing = prev.find((item) => item.productoId === producto.id);
      if (existing) {
        const cantidad = Math.min(existing.cantidad + 1, existing.stockDisponible);
        return prev.map((item) =>
          item.productoId === producto.id
            ? {
                ...item,
                cantidad,
                grabado: resizeGrabadoParaCantidad(item.grabado, cantidad),
              }
            : item
        );
      }
      const vinculo = vinculosPorProductoMap.get(producto.codigo);
      const packagingInicial: CartPackagingLine[] = (vinculo?.packaging ?? [])
        .map((v): CartPackagingLine | null => {
          const pkg = packagingPorIdMap.get(v.packageId);
          if (!pkg) return null;
          return {
            packageId: pkg.id,
            codigo: pkg.codigo,
            nombre: pkg.nombre,
            imageUrl: pkg.imageUrl,
            cantidadPorUnidad: v.cantidad,
          };
        })
        .filter((p): p is CartPackagingLine => p !== null);

      const nuevo: CartItem = {
        productoId: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        categoria: producto.categoria,
        precioUnitario: producto.precio,
        cantidad: 1,
        stockDisponible: disponible,
        imageUrl: producto.imageUrl,
        tipo: producto.tipo,
        grabado: { modo: "ninguno" },
        packaging: packagingInicial,
      };
      return [...prev, nuevo];
    });
    setSelectedId(producto.id);
    toast.success(`${producto.nombre} agregado al carrito`, { duration: 2200 });
  }

  function handleRemovePackaging(productoId: string, packageId: string) {
    setCart((prev) =>
      prev.map((item) =>
        item.productoId === productoId
          ? {
              ...item,
              packaging: item.packaging.filter((p) => p.packageId !== packageId),
            }
          : item
      )
    );
  }

  function handleAddPackaging(
    productoId: string,
    packageId: string,
    cantidad: number
  ) {
    const pkg = packagingPorIdMap.get(packageId);
    if (!pkg) return;
    setCart((prev) =>
      prev.map((item) => {
        if (item.productoId !== productoId) return item;
        const existing = item.packaging.find((p) => p.packageId === packageId);
        const packaging = existing
          ? item.packaging.map((p) =>
              p.packageId === packageId
                ? { ...p, cantidadPorUnidad: p.cantidadPorUnidad + cantidad }
                : p
            )
          : [
              ...item.packaging,
              {
                packageId: pkg.id,
                codigo: pkg.codigo,
                nombre: pkg.nombre,
                imageUrl: pkg.imageUrl,
                cantidadPorUnidad: cantidad,
              },
            ];
        return { ...item, packaging };
      })
    );
    toast.success(`${pkg.nombre} agregado`, { duration: 1800 });
  }

  function handleIncrement(productoId: string) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productoId !== productoId) return item;
        const cantidad = Math.min(item.cantidad + 1, item.stockDisponible);
        return {
          ...item,
          cantidad,
          grabado: resizeGrabadoParaCantidad(item.grabado, cantidad),
        };
      })
    );
  }

  function handleDecrement(productoId: string) {
    setCart((prev) => {
      const target = prev.find((item) => item.productoId === productoId);
      if (!target) return prev;
      if (target.cantidad <= 1) {
        return prev.filter((item) => item.productoId !== productoId);
      }
      const cantidad = target.cantidad - 1;
      return prev.map((item) =>
        item.productoId === productoId
          ? {
              ...item,
              cantidad,
              grabado: resizeGrabadoParaCantidad(item.grabado, cantidad),
            }
          : item
      );
    });
  }

  function handleRemove(productoId: string) {
    setCart((prev) => prev.filter((item) => item.productoId !== productoId));
    setSelectedId((current) => (current === productoId ? null : current));
  }

  function handleGrabadoChange(grabado: GrabadoInfo) {
    if (!selectedId) return;
    setCart((prev) =>
      prev.map((item) =>
        item.productoId === selectedId ? { ...item, grabado } : item
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
          cantidad: item.cantidad,
          grabado: item.grabado,
          packaging: item.packaging.map((p) => ({
            packageId: p.packageId,
            cantidad: p.cantidadPorUnidad * item.cantidad,
          })),
        })),
        metodoPago,
        cliente,
        celular,
        usuarioId: user.uid,
      });
      toast.success("Venta registrada correctamente");
      setCart([]);
      setSelectedId(null);
      setCliente("");
      setCelular("");
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

  const selectedItem = cart.find((item) => item.productoId === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4 xl:h-[calc(100vh-7rem)] xl:grid xl:grid-cols-[1.4fr_1fr_1fr]">
      <div className="min-h-[420px] xl:min-h-0">
        <ProductSearcher
          productos={productos}
          categorias={categorias}
          loading={loading}
          onSelect={handleSelectProduct}
        />
      </div>
      <div className="min-h-[280px] xl:min-h-0">
        <GrabadoOptions
          key={selectedItem?.productoId ?? "none"}
          item={selectedItem}
          onChange={handleGrabadoChange}
        />
      </div>
      <div className="min-h-[420px] xl:min-h-0">
        <POSCart
          items={cart}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          onRemove={handleRemove}
          packagingCatalogo={packaging}
          onRemovePackaging={handleRemovePackaging}
          onAddPackaging={handleAddPackaging}
          metodoPago={metodoPago}
          onMetodoPagoChange={setMetodoPago}
          cliente={cliente}
          onClienteChange={setCliente}
          celular={celular}
          onCelularChange={setCelular}
          onConfirm={() => setShowPayment(true)}
        />
      </div>

      {showPayment && (
        <PaymentModal
          items={cart}
          metodoPago={metodoPago}
          cliente={cliente}
          celular={celular}
          submitting={submitting}
          onClose={() => setShowPayment(false)}
          onConfirm={handleConfirmVenta}
        />
      )}
    </div>
  );
}
