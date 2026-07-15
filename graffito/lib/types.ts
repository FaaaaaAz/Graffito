import type { Timestamp } from "firebase/firestore";

export type MetodoPago = "Efectivo" | "Tarjeta" | "Transferencia";

export const TIPOGRAFIAS = [
  "Graffito",
  "Arial",
  "Courier",
  "Comic Sans",
  "Times New Roman",
  "Brush Script",
] as const;

export type Tipografia = (typeof TIPOGRAFIAS)[number];

export type TipoMovimiento =
  | "entrada"
  | "salida"
  | "venta"
  | "ajuste"
  | "perdida";

export type EstadoStock = "en-stock" | "bajo" | "agotado";

export type TipoProductoBase = "tomatodo" | "agenda" | "muller" | "refill";

export interface Categoria {
  id: string;
  nombre: string;
  icono?: string;
  orden: number;
}

export interface ItemBaseCombo {
  tipoProducto: TipoProductoBase;
  codigo: string;
  cantidad: number;
}

/** Document id in `productos/{codigo}` is always the product's `codigo`. */
export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
  descripcion: string;
  imageUrl: string;
  stock: number;
  stockMinimo: number;
  creadoEn: Timestamp | null;
  actualizadoEn: Timestamp | null;
  /** Present only on combo products. */
  tipo?: "combo";
  /** Present only on combo products — the base products a sale must atomically decrement. */
  itemsBase?: ItemBaseCombo[];
}

export interface MovimientoStock {
  id: string;
  productoId: string;
  codigo: string;
  nombre: string;
  tipo: TipoMovimiento;
  cantidad: number;
  fecha: Timestamp | null;
  usuarioId: string;
  notas?: string;
  /** True when `productoId` refers to a `packaging/{id}` doc instead of `productos/{codigo}`. */
  esPackaging?: boolean;
  /** Present only on movements created by a sale — lets `eliminarVenta` find and revert exactly the movements a given sale caused. */
  ventaId?: string;
}

// ---------------------------------------------------------------------------
// Packaging (bags/boxes) — no price, no engraving, stock-tracked, and either
// auto-linked to a product via `productosPackaging` or added manually in the
// cart. See lib/db.ts and hooks/usePackaging.ts.
// ---------------------------------------------------------------------------

export type PackagingCategoria = "bag" | "box";

/** Document id in `packaging/{id}` is a stable slug (e.g. "pkg-bag-mediana"), distinct from `codigo`. */
export interface ProductoPackaging {
  id: string;
  codigo: string;
  nombre: string;
  categoria: PackagingCategoria;
  /** Only meaningful for bags ("Pequeña"/"Mediana"/"Grande"). */
  tamanio?: string;
  imageUrl: string;
  stock: number;
  stockMinimo: number;
  creadoEn: Timestamp | null;
  actualizadoEn: Timestamp | null;
}

export interface VinculoPackagingEntry {
  packageId: string;
  cantidad: number;
}

/** Document id in `productosPackaging/{productoId}` — defines the packaging auto-attached when that product is added to the cart. */
export interface VinculoProductoPackaging {
  id: string;
  productoId: string;
  packaging: VinculoPackagingEntry[];
}

export interface GrabadoTexto {
  texto: string;
  tipografia: Tipografia;
}

/**
 * Engraving choice for a cart/sale line.
 * - "ninguno": not engraved.
 * - "unico": one engraving shared by every unit in the line.
 * - "individual": one engraving per unit (`unidades.length === cantidad`).
 * - "combo": independent engraving for the agenda and the pen that make up a combo.
 *
 * `agenda`/`boligrafo` are always present keys — `null` when that component
 * isn't engraved, never `undefined` — because Firestore rejects `undefined`
 * field values outright (this is what caused the combo engraving bug).
 */
export type GrabadoInfo =
  | { modo: "ninguno" }
  | ({ modo: "unico" } & GrabadoTexto)
  | { modo: "individual"; unidades: GrabadoTexto[] }
  | { modo: "combo"; agenda: GrabadoTexto | null; boligrafo: GrabadoTexto | null };

/** A packaging line actually consumed by a sale item, resolved at checkout time for the receipt/audit trail. */
export interface VentaItemPackaging {
  packageId: string;
  codigo: string;
  nombre: string;
  /** Total units consumed for this sale line (already multiplied by the item's cantidad). */
  cantidad: number;
}

export interface VentaItem {
  productoId: string;
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  grabado: GrabadoInfo;
  packaging: VentaItemPackaging[];
}

export interface Venta {
  id: string;
  items: VentaItem[];
  total: number;
  metodoPago: MetodoPago;
  cliente: string;
  celular: string;
  fecha: Timestamp | null;
  usuarioId: string;
}

/** Audit trail entry — currently written only when a sale is deleted (see `eliminarVenta` in lib/db.ts). */
export interface AuditoriaVenta {
  id: string;
  tipo: "venta-eliminada";
  ventaId: string;
  ventaOriginal: Venta;
  fecha: Timestamp | null;
  usuarioId: string;
}

export interface CierreDiario {
  id: string;
  fecha: string;
  totalVendido: number;
  cantidadProductos: number;
  numeroTransacciones: number;
  ticketPromedio: number;
  usuarioId: string;
  creadoEn: Timestamp | null;
}

export interface UsuarioDoc {
  id: string;
  email: string;
  rol: string;
  creadoEn: Timestamp | null;
  ultimoLogin: Timestamp | null;
}

export interface ConfiguracionGeneral {
  nombreEmpresa: string;
  logoUrl: string;
  telefono: string;
  email: string;
  direccion: string;
  stockMinimoGlobal: number;
}

/**
 * A packaging type attached to a cart line. `cantidadTotal` is the
 * authoritative quantity actually consumed at checkout. While `manual` is
 * false it's kept in sync with the product's `cantidad` via
 * `cantidadPorUnidad` (units of packaging per 1 unit of product) — see
 * `resizePackagingParaCantidad` in lib/utils.ts, which mirrors how
 * `resizeGrabadoParaCantidad` keeps engraving in sync. Once the admin edits
 * a line's quantity directly (+/- in the packaging modal), `manual` flips to
 * true and that line stops auto-scaling — it becomes a fixed override.
 */
export interface CartPackagingLine {
  packageId: string;
  codigo: string;
  nombre: string;
  imageUrl: string;
  cantidadPorUnidad: number;
  cantidadTotal: number;
  manual: boolean;
}

export interface CartItem {
  productoId: string;
  codigo: string;
  nombre: string;
  categoria: string;
  precioUnitario: number;
  cantidad: number;
  stockDisponible: number;
  imageUrl: string;
  tipo?: "combo";
  grabado: GrabadoInfo;
  packaging: CartPackagingLine[];
}
