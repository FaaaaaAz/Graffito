import type { Timestamp } from "firebase/firestore";

export type MetodoPago = "Efectivo" | "Tarjeta" | "Transferencia" | "Otro";

export type TipoMovimiento =
  | "entrada"
  | "salida"
  | "venta"
  | "ajuste"
  | "perdida";

export type EstadoStock = "en-stock" | "bajo" | "agotado";

export interface Categoria {
  id: string;
  nombre: string;
  icono?: string;
  orden: number;
}

export interface Variante {
  id: string;
  nombre: string;
  stock: number;
  stockMinimo: number;
  imageUrl?: string;
  codigoBarras?: string;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  descripcion: string;
  imageUrl: string;
  creadoEn: Timestamp | null;
  actualizadoEn: Timestamp | null;
}

export interface ProductoConVariantes extends Producto {
  variantes: Variante[];
}

export interface MovimientoStock {
  id: string;
  productoId: string;
  varianteId: string;
  nombreProducto: string;
  nombreVariante: string;
  tipo: TipoMovimiento;
  cantidad: number;
  fecha: Timestamp | null;
  usuarioId: string;
  notas?: string;
}

export interface VentaItem {
  productoId: string;
  varianteId: string;
  nombreProducto: string;
  nombreVariante: string;
  cantidad: number;
  precioUnitario: number;
  grabado: boolean;
  textoGrabado?: string;
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
  key: string;
  productoId: string;
  varianteId: string;
  nombreProducto: string;
  nombreVariante: string;
  precioUnitario: number;
  cantidad: number;
  stockDisponible: number;
  imageUrl: string;
  grabado: boolean;
  textoGrabado: string;
}
