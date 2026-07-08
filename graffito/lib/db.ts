import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  Categoria,
  CierreDiario,
  ConfiguracionGeneral,
  MetodoPago,
  MovimientoStock,
  Producto,
  TipoMovimiento,
  Variante,
  Venta,
  VentaItem,
} from "./types";

function withId<T>(snap: QueryDocumentSnapshot) {
  return { id: snap.id, ...snap.data() } as T;
}

// ---------------------------------------------------------------------------
// Categorías
// ---------------------------------------------------------------------------

export function subscribeCategorias(cb: (categorias: Categoria[]) => void) {
  const q = query(collection(db, "categorias"), orderBy("orden", "asc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => withId<Categoria>(d)));
  });
}

export async function addCategoria(nombre: string, orden: number, icono = "") {
  const ref = doc(collection(db, "categorias"));
  await setDoc(ref, { nombre, icono, orden });
  return ref.id;
}

export async function updateCategoria(
  id: string,
  data: Partial<Pick<Categoria, "nombre" | "icono" | "orden">>
) {
  await updateDoc(doc(db, "categorias", id), data);
}

export async function deleteCategoria(id: string) {
  await deleteDoc(doc(db, "categorias", id));
}

// ---------------------------------------------------------------------------
// Productos y variantes
// ---------------------------------------------------------------------------

export function subscribeProductos(cb: (productos: Producto[]) => void) {
  const q = query(collection(db, "productos"), orderBy("nombre", "asc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => withId<Producto>(d)));
  });
}

export function subscribeVariantesGroup(
  cb: (variantesPorProducto: Record<string, Variante[]>) => void
) {
  const q = collectionGroup(db, "variantes");
  return onSnapshot(q, (snap) => {
    const map: Record<string, Variante[]> = {};
    snap.docs.forEach((d) => {
      const productoId = d.ref.parent.parent?.id;
      if (!productoId) return;
      if (!map[productoId]) map[productoId] = [];
      map[productoId].push(withId<Variante>(d));
    });
    cb(map);
  });
}

export interface NuevaVariante {
  nombre: string;
  stock: number;
  stockMinimo: number;
  imageUrl?: string;
}

export async function addProducto(
  data: Omit<Producto, "id" | "creadoEn" | "actualizadoEn">,
  variantesIniciales: NuevaVariante[],
  stockMinimoGlobal: number
) {
  const productoRef = doc(collection(db, "productos"));
  const batch = writeBatch(db);

  batch.set(productoRef, {
    ...data,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });

  const variantes =
    variantesIniciales.length > 0
      ? variantesIniciales
      : [{ nombre: "Estándar", stock: 0, stockMinimo: stockMinimoGlobal }];

  variantes.forEach((v) => {
    const varRef = doc(collection(productoRef, "variantes"));
    batch.set(varRef, {
      nombre: v.nombre,
      stock: v.stock,
      stockMinimo: v.stockMinimo,
      imageUrl: v.imageUrl || data.imageUrl,
      codigoBarras: "",
    });
  });

  await batch.commit();
  return productoRef.id;
}

export async function updateProducto(
  id: string,
  data: Partial<Omit<Producto, "id" | "creadoEn" | "actualizadoEn">>
) {
  await updateDoc(doc(db, "productos", id), {
    ...data,
    actualizadoEn: serverTimestamp(),
  });
}

export async function deleteProducto(id: string) {
  const productoRef = doc(db, "productos", id);
  const variantesSnap = await getDocs(collection(productoRef, "variantes"));
  const batch = writeBatch(db);
  variantesSnap.docs.forEach((v) => batch.delete(v.ref));
  batch.delete(productoRef);
  await batch.commit();
}

export async function addVariante(productoId: string, data: NuevaVariante) {
  const productoRef = doc(db, "productos", productoId);
  const varRef = doc(collection(productoRef, "variantes"));
  await setDoc(varRef, {
    nombre: data.nombre,
    stock: data.stock,
    stockMinimo: data.stockMinimo,
    imageUrl: data.imageUrl ?? "",
    codigoBarras: "",
  });
  return varRef.id;
}

export async function updateVariante(
  productoId: string,
  varianteId: string,
  data: Partial<Omit<Variante, "id">>
) {
  await updateDoc(doc(db, "productos", productoId, "variantes", varianteId), data);
}

export async function deleteVariante(productoId: string, varianteId: string) {
  await deleteDoc(doc(db, "productos", productoId, "variantes", varianteId));
}

// ---------------------------------------------------------------------------
// Movimientos de stock
// ---------------------------------------------------------------------------

export function subscribeMovimientos(
  cb: (movimientos: MovimientoStock[]) => void,
  cantidad = 20
) {
  const q = query(
    collection(db, "movimientosStock"),
    orderBy("fecha", "desc"),
    limit(cantidad)
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => withId<MovimientoStock>(d)));
  });
}

export interface AjusteStockInput {
  productoId: string;
  varianteId: string;
  nombreProducto: string;
  nombreVariante: string;
  delta: number;
  tipo: TipoMovimiento;
  notas?: string;
  usuarioId: string;
}

export async function adjustStock(input: AjusteStockInput) {
  const varianteRef = doc(
    db,
    "productos",
    input.productoId,
    "variantes",
    input.varianteId
  );

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(varianteRef);
    if (!snap.exists()) {
      throw new Error("La variante ya no existe.");
    }
    const stockActual = (snap.data().stock as number) ?? 0;
    const nuevoStock = stockActual + input.delta;
    if (nuevoStock < 0) {
      throw new Error("El stock no puede quedar negativo.");
    }

    transaction.update(varianteRef, { stock: nuevoStock });

    const movimientoRef = doc(collection(db, "movimientosStock"));
    transaction.set(movimientoRef, {
      productoId: input.productoId,
      varianteId: input.varianteId,
      nombreProducto: input.nombreProducto,
      nombreVariante: input.nombreVariante,
      tipo: input.tipo,
      cantidad: input.delta,
      fecha: serverTimestamp(),
      usuarioId: input.usuarioId,
      notas: input.notas ?? "",
    });
  });
}

// ---------------------------------------------------------------------------
// Ventas
// ---------------------------------------------------------------------------

export interface NuevaVentaInput {
  items: VentaItem[];
  metodoPago: MetodoPago;
  cliente?: string;
  usuarioId: string;
}

export async function createVenta(input: NuevaVentaInput) {
  const ventaRef = doc(collection(db, "ventas"));
  const total = input.items.reduce(
    (sum, item) => sum + item.precioUnitario * item.cantidad,
    0
  );

  const varianteRefs = input.items.map((item) =>
    doc(db, "productos", item.productoId, "variantes", item.varianteId)
  );

  await runTransaction(db, async (transaction) => {
    const snaps = await Promise.all(
      varianteRefs.map((ref) => transaction.get(ref))
    );

    snaps.forEach((snap, index) => {
      const item = input.items[index];
      if (!snap.exists()) {
        throw new Error(`La variante "${item.nombreVariante}" ya no existe.`);
      }
      const stockActual = (snap.data().stock as number) ?? 0;
      if (stockActual < item.cantidad) {
        throw new Error(
          `Stock insuficiente para ${item.nombreProducto} (${item.nombreVariante}). Disponible: ${stockActual}.`
        );
      }
    });

    transaction.set(ventaRef, {
      items: input.items,
      total,
      metodoPago: input.metodoPago,
      cliente: input.cliente ?? "",
      fecha: serverTimestamp(),
      usuarioId: input.usuarioId,
    });

    snaps.forEach((snap, index) => {
      const item = input.items[index];
      const stockActual = (snap.data()!.stock as number) ?? 0;
      transaction.update(varianteRefs[index], {
        stock: stockActual - item.cantidad,
      });

      const movimientoRef = doc(collection(db, "movimientosStock"));
      transaction.set(movimientoRef, {
        productoId: item.productoId,
        varianteId: item.varianteId,
        nombreProducto: item.nombreProducto,
        nombreVariante: item.nombreVariante,
        tipo: "venta",
        cantidad: item.cantidad,
        fecha: serverTimestamp(),
        usuarioId: input.usuarioId,
        notas: "",
      });
    });
  });

  return { id: ventaRef.id, total };
}

export function subscribeVentasRango(
  inicio: Date,
  fin: Date,
  cb: (ventas: Venta[]) => void
) {
  const q = query(
    collection(db, "ventas"),
    where("fecha", ">=", Timestamp.fromDate(inicio)),
    where("fecha", "<", Timestamp.fromDate(fin)),
    orderBy("fecha", "desc")
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => withId<Venta>(d)));
  });
}

// ---------------------------------------------------------------------------
// Cierres diarios
// ---------------------------------------------------------------------------

export async function getCierrePorFecha(fecha: string): Promise<CierreDiario | null> {
  const q = query(
    collection(db, "cierresDiarios"),
    where("fecha", "==", fecha),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return withId<CierreDiario>(snap.docs[0]);
}

export async function crearCierreDiario(
  data: Omit<CierreDiario, "id" | "creadoEn">
) {
  const ref = doc(collection(db, "cierresDiarios"));
  await setDoc(ref, { ...data, creadoEn: serverTimestamp() });
  return ref.id;
}

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

export function subscribeConfiguracion(
  cb: (config: ConfiguracionGeneral) => void
) {
  return onSnapshot(doc(db, "configuracion", "general"), (snap) => {
    if (snap.exists()) cb(snap.data() as ConfiguracionGeneral);
  });
}

export async function updateConfiguracion(data: Partial<ConfiguracionGeneral>) {
  await setDoc(doc(db, "configuracion", "general"), data, { merge: true });
}

// ---------------------------------------------------------------------------
// Datos de ejemplo (seed)
// ---------------------------------------------------------------------------

export async function ensureSeedData() {
  // Claim the seed slot atomically so two concurrent callers (e.g. React
  // running effects twice in development) can't both pass the "is empty"
  // check and double-insert the sample data.
  const seedRef = doc(db, "meta", "seed");
  const claimed = await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(seedRef);
    if (snap.exists()) return false;
    transaction.set(seedRef, { seededAt: serverTimestamp() });
    return true;
  });
  if (!claimed) return;

  const batch = writeBatch(db);

  const categoriasDefault = [
    "Bolígrafos",
    "Tomatodos",
    "Agendas",
    "Manillas",
    "Collares",
    "Llaveros",
  ];
  categoriasDefault.forEach((nombre, index) => {
    const ref = doc(collection(db, "categorias"));
    batch.set(ref, { nombre, icono: "", orden: index });
  });

  batch.set(doc(db, "configuracion", "general"), {
    nombreEmpresa: "Graffito",
    logoUrl: "",
    telefono: "",
    email: "",
    direccion: "",
    stockMinimoGlobal: 5,
  });

  const productosSeed: Array<{
    nombre: string;
    categoria: string;
    precio: number;
    descripcion: string;
    imageUrl: string;
    variantes: Array<{ nombre: string; stock: number }>;
  }> = [
    {
      nombre: "Bolígrafo Parker",
      categoria: "Bolígrafos",
      precio: 45,
      descripcion: "Bolígrafo de gama alta, ideal para grabado personalizado.",
      imageUrl: "https://placehold.co/400x400/1E1E1E/F5C518?text=Boligrafo",
      variantes: [
        { nombre: "Negro", stock: 10 },
        { nombre: "Azul", stock: 8 },
        { nombre: "Dorado", stock: 5 },
      ],
    },
    {
      nombre: "Tomatodos de Vidrio",
      categoria: "Tomatodos",
      precio: 120,
      descripcion: "Tomatodo de vidrio resistente, listo para grabado láser.",
      imageUrl: "https://placehold.co/400x400/1E1E1E/F5C518?text=Tomatodo",
      variantes: [
        { nombre: "Transparente", stock: 15 },
        { nombre: "Translúcido", stock: 10 },
      ],
    },
    {
      nombre: "Agenda Ejecutiva",
      categoria: "Agendas",
      precio: 85,
      descripcion: "Agenda ejecutiva de cuero con grabado personalizado.",
      imageUrl: "https://placehold.co/400x400/1E1E1E/F5C518?text=Agenda",
      variantes: [
        { nombre: "Negra", stock: 7 },
        { nombre: "Marrón", stock: 5 },
      ],
    },
  ];

  productosSeed.forEach((p) => {
    const productoRef = doc(collection(db, "productos"));
    batch.set(productoRef, {
      nombre: p.nombre,
      categoria: p.categoria,
      precio: p.precio,
      descripcion: p.descripcion,
      imageUrl: p.imageUrl,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    });
    p.variantes.forEach((v) => {
      const varRef = doc(collection(productoRef, "variantes"));
      batch.set(varRef, {
        nombre: v.nombre,
        stock: v.stock,
        stockMinimo: 5,
        imageUrl: "",
        codigoBarras: "",
      });
    });
  });

  await batch.commit();
}
