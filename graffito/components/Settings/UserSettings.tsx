"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { authErrorMessage, changePassword, logout } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";

export default function UserSettings() {
  const { user } = useAuth();
  const router = useRouter();

  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  async function handleChangePassword() {
    if (nuevaPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    setSaving(true);
    try {
      await changePassword(nuevaPassword);
      toast.success("Contraseña actualizada correctamente");
      setNuevaPassword("");
      setConfirmarPassword("");
    } catch (error) {
      toast.error(authErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-panel-2 bg-panel p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-ink">
          Información de usuario
        </h3>

        <div className="mb-4">
          <p className="text-xs font-medium text-ink-soft">
            Correo del administrador
          </p>
          <p className="text-sm text-ink">{user?.email}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleChangePassword}
          disabled={saving}
          className="mt-4 flex items-center gap-2 rounded-lg bg-panel-2 px-4 py-2.5 text-sm font-semibold text-ink transition-all duration-300 hover:bg-panel-2/70 disabled:opacity-60"
        >
          <KeyRound className="h-4 w-4" />
          {saving ? "Actualizando..." : "Cambiar contraseña"}
        </button>
      </div>

      <button
        onClick={() => setConfirmLogout(true)}
        className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition-all duration-300 hover:bg-red-500/20"
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </button>

      <ConfirmDialog
        open={confirmLogout}
        title="Cerrar sesión"
        message="¿Seguro que deseas cerrar la sesión actual?"
        confirmLabel="Cerrar sesión"
        danger
        onCancel={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
