"use client";

import { Bell, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Topbar({ title }: { title?: string }) {
  const { user } = useAuth();
  const initial = user?.email?.charAt(0).toUpperCase() ?? "A";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-panel-2 bg-canvas-soft/95 px-4 backdrop-blur lg:px-8">
      <div className="min-w-0">
        {title && (
          <h1 className="truncate text-lg font-semibold text-ink">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-56 rounded-lg border border-panel-2 bg-panel py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none"
          />
        </div>

        <button
          type="button"
          aria-label="Notificaciones"
          className="relative rounded-lg p-2 text-ink-soft transition-all duration-300 hover:bg-panel hover:text-ink"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 rounded-lg border border-panel-2 bg-panel px-2.5 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/20 text-sm font-semibold text-gold">
            {initial}
          </div>
          <span className="hidden max-w-[140px] truncate text-sm text-ink-soft sm:inline">
            {user?.email ?? "Administrador"}
          </span>
        </div>
      </div>
    </header>
  );
}
