"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import toast from "react-hot-toast";
import { updateConfiguracion } from "@/lib/db";
import type { ConfiguracionGeneral } from "@/lib/types";

export default function CompanyInfo({
  configuracion,
}: {
  configuracion: ConfiguracionGeneral;
}) {
  const [form, setForm] = useState(configuracion);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateConfiguracion(form);
      toast.success("Datos de la empresa actualizados");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo guardar la información"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-panel-2 bg-panel p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-ink">Datos de la empresa</h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label="Nombre de la empresa"
          value={form.nombreEmpresa}
          onChange={(v) => setForm({ ...form, nombreEmpresa: v })}
        />
        <Field
          label="Logo (URL)"
          value={form.logoUrl}
          onChange={(v) => setForm({ ...form, logoUrl: v })}
        />
        <Field
          label="Teléfono"
          value={form.telefono}
          onChange={(v) => setForm({ ...form, telefono: v })}
        />
        <Field
          label="Correo electrónico"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
        />
        <div className="sm:col-span-2">
          <Field
            label="Dirección"
            value={form.direccion}
            onChange={(v) => setForm({ ...form, direccion: v })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-soft">
            Stock mínimo global
          </label>
          <input
            type="number"
            min={0}
            value={form.stockMinimoGlobal}
            onChange={(e) =>
              setForm({ ...form, stockMinimoGlobal: Number(e.target.value) })
            }
            className="w-full rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
          />
          <p className="mt-1 text-xs text-ink-soft">
            Valor por defecto para productos nuevos sin variantes definidas.
          </p>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-canvas transition-all duration-300 hover:brightness-95 disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-ink-soft">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
      />
    </div>
  );
}
