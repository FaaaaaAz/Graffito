"use client";

import { useEffect, useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { crearCierreDiario, getCierrePorFecha } from "@/lib/db";
import { useAuth } from "@/hooks/useAuth";
import { dateKey, formatCurrency } from "@/lib/utils";
import type { CierreDiario } from "@/lib/types";

export default function CashierClosing({
  stats,
}: {
  stats: {
    totalVendido: number;
    cantidadProductos: number;
    numeroTransacciones: number;
    ticketPromedio: number;
  };
}) {
  const { user } = useAuth();
  const [cierre, setCierre] = useState<CierreDiario | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const todayKey = dateKey(new Date());

  useEffect(() => {
    let active = true;
    getCierrePorFecha(todayKey).then((data) => {
      if (active) {
        setCierre(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [todayKey]);

  async function handleClose() {
    if (!user) return;
    setClosing(true);
    try {
      await crearCierreDiario({
        fecha: todayKey,
        totalVendido: stats.totalVendido,
        cantidadProductos: stats.cantidadProductos,
        numeroTransacciones: stats.numeroTransacciones,
        ticketPromedio: stats.ticketPromedio,
        usuarioId: user.uid,
      });
      toast.success("Caja cerrada correctamente");
      setConfirmOpen(false);
      const data = await getCierrePorFecha(todayKey);
      setCierre(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo cerrar la caja"
      );
    } finally {
      setClosing(false);
    }
  }

  if (loading) return null;

  if (cierre) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
        <Lock className="h-4 w-4" />
        Caja del día cerrada · Total: {formatCurrency(cierre.totalVendido)}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-panel-2 bg-panel px-4 py-2.5 text-sm font-medium text-ink transition-all duration-300 hover:bg-panel-2"
      >
        <LockOpen className="h-4 w-4" />
        Cerrar caja del día
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Cerrar caja del día"
        message={`Se registrará un total de ${formatCurrency(
          stats.totalVendido
        )} en ${stats.numeroTransacciones} transacciones. Esta acción no se puede deshacer.`}
        confirmLabel="Cerrar caja"
        loading={closing}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleClose}
      />
    </>
  );
}
