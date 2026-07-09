import type { Timestamp } from "firebase/firestore";

export type MetodoPago = "Efectivo" | "Tarjeta" | "Transferencia" | "Otro";

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
}

/**
 * Engraving choice for a cart/sale line.
 * - "ninguno": not engraved.
 * - "unico": one engraving text shared by every unit in the line.
 * - "individual": one engraving text per unit (`textos.length === cantidad`).
 * - "combo": independent, optional engraving for the agenda and the pen that make up a combo.
 */
export type GrabadoInfo =
  | { modo: "ninguno" }
  | { modo: "unico"; texto: string }
  | { modo: "individual"; textos: string[] }
  | { modo: "combo"; agenda?: string; boligrafo?: string };

export interface VentaItem {
  productoId: string;
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  grabado: GrabadoInfo;
}

export interface Venta {
  id: string;
  items: VentaItem[];
  total: number;
  metodoPago: MetodoPago;
  cliente?: string;
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
}
