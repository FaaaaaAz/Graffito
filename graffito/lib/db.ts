import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
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
  type DocumentReference,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { dateKey, sanitizeForFirestore } from "./utils";
import type {
  Categoria,
  CierreDiario,
  ConfiguracionGeneral,
  GrabadoInfo,
  ItemBaseCombo,
  MetodoPago,
  MovimientoStock,
  PackagingCategoria,
  Producto,
  ProductoPackaging,
  TipoMovimiento,
  Venta,
  VentaItem,
  VinculoPackagingEntry,
  VinculoProductoPackaging,
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
// Productos (flat — no variantes subcollection; document id === codigo)
// ---------------------------------------------------------------------------

export function subscribeProductos(cb: (productos: Producto[]) => void) {
  const q = query(collection(db, "productos"), orderBy("nombre", "asc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => withId<Producto>(d)));
  });
}

export interface NuevoProductoInput {
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
  descripcion: string;
  imageUrl: string;
  stock: number;
  stockMinimo: number;
  tipo?: "combo";
  itemsBase?: ItemBaseCombo[];
}

export async function addProducto(data: NuevoProductoInput) {
  const codigo = data.codigo.trim().toUpperCase();
  const ref = doc(db, "productos", codigo);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    throw new Error(`Ya existe un producto con el código "${codigo}".`);
  }

  await setDoc(ref, {
    ...data,
    codigo,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });
  return codigo;
}

export async function updateProducto(
  codigo: string,
  data: Partial<Omit<NuevoProductoInput, "codigo">>
) {
  await updateDoc(doc(db, "productos", codigo), {
    ...data,
    actualizadoEn: serverTimestamp(),
  });
}

export async function deleteProducto(codigo: string) {
  await deleteDoc(doc(db, "productos", codigo));
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
  nombre: string;
  delta: number;
  tipo: TipoMovimiento;
  notas?: string;
  usuarioId: string;
}

export async function adjustStock(input: AjusteStockInput) {
  const ref = doc(db, "productos", input.productoId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) {
      throw new Error("El producto ya no existe.");
    }
    const stockActual = (snap.data().stock as number) ?? 0;
    const nuevoStock = stockActual + input.delta;
    if (nuevoStock < 0) {
      throw new Error("El stock no puede quedar negativo.");
    }

    transaction.update(ref, { stock: nuevoStock });

    const movimientoRef = doc(collection(db, "movimientosStock"));
    transaction.set(movimientoRef, {
      productoId: input.productoId,
      codigo: input.productoId,
      nombre: input.nombre,
      tipo: input.tipo,
      cantidad: input.delta,
      fecha: serverTimestamp(),
      usuarioId: input.usuarioId,
      notas: input.notas ?? "",
    });
  });
}

// ---------------------------------------------------------------------------
// Packaging (bags/boxes) — fixed catalog, stock-tracked, no price/engraving.
// ---------------------------------------------------------------------------

export function subscribePackaging(cb: (packaging: ProductoPackaging[]) => void) {
  const q = query(collection(db, "packaging"), orderBy("nombre", "asc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => withId<ProductoPackaging>(d)));
  });
}

export function subscribeVinculosPackaging(
  cb: (vinculos: VinculoProductoPackaging[]) => void
) {
  return onSnapshot(collection(db, "productosPackaging"), (snap) => {
    cb(snap.docs.map((d) => withId<VinculoProductoPackaging>(d)));
  });
}

export interface AjustePackagingInput {
  packageId: string;
  delta: number;
  tipo: TipoMovimiento;
  notas?: string;
  usuarioId: string;
}

export async function adjustPackagingStock(input: AjustePackagingInput) {
  const ref = doc(db, "packaging", input.packageId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) {
      throw new Error("El packaging ya no existe.");
    }
    const data = snap.data() as ProductoPackaging;
    const nuevoStock = data.stock + input.delta;
    if (nuevoStock < 0) {
      throw new Error("El stock no puede quedar negativo.");
    }

    transaction.update(ref, { stock: nuevoStock, actualizadoEn: serverTimestamp() });

    const movimientoRef = doc(collection(db, "movimientosStock"));
    transaction.set(movimientoRef, {
      productoId: input.packageId,
      codigo: data.codigo,
      nombre: data.nombre,
      tipo: input.tipo,
      cantidad: input.delta,
      fecha: serverTimestamp(),
      usuarioId: input.usuarioId,
      notas: input.notas ?? "",
      esPackaging: true,
    });
  });
}

// ---------------------------------------------------------------------------
// Ventas — atomic, combo-aware stock deduction
// ---------------------------------------------------------------------------

export interface NuevaVentaItemPackagingInput {
  packageId: string;
  /** Total units needed for this cart line (already multiplied by the line's cantidad). */
  cantidad: number;
}

export interface NuevaVentaItemInput {
  productoId: string;
  cantidad: number;
  grabado: GrabadoInfo;
  packaging?: NuevaVentaItemPackagingInput[];
}

export interface NuevaVentaInput {
  items: NuevaVentaItemInput[];
  metodoPago: MetodoPago;
  cliente: string;
  celular: string;
  usuarioId: string;
}

/**
 * Sells one or more products/combos in a single atomic transaction.
 *
 * A combo's own `stock` is never touched by a sale — only the underlying
 * `itemsBase` products are decremented (mirrors how the combo is physically
 * assembled from existing agenda + pen inventory). Quantities needed for the
 * same base product are summed across every cart line (whether it comes from
 * a combo or is bought directly) before a single stock check + write, so a
 * mixed cart can never oversell a shared base product.
 */
export async function createVenta(input: NuevaVentaInput) {
  const ventaRef = doc(collection(db, "ventas"));
  const topRefs = input.items.map((item) =>
    doc(db, "productos", item.productoId)
  );

  const total = await runTransaction(db, async (transaction) => {
    const topSnaps = await Promise.all(
      topRefs.map((ref) => transaction.get(ref))
    );

    const ventaItems: VentaItem[] = [];
    const descuentos = new Map<
      string,
      { ref: DocumentReference; cantidad: number; snap?: DocumentSnapshot }
    >();
    const packagingDescuentos = new Map<
      string,
      { ref: DocumentReference; cantidad: number; snap?: DocumentSnapshot }
    >();

    topSnaps.forEach((snap, index) => {
      const item = input.items[index];
      if (!snap.exists()) {
        throw new Error(`El producto "${item.productoId}" ya no existe.`);
      }
      const data = snap.data() as Producto;

      ventaItems.push({
        productoId: data.codigo,
        codigo: data.codigo,
        nombre: data.nombre,
        cantidad: item.cantidad,
        precioUnitario: data.precio,
        subtotal: data.precio * item.cantidad,
        grabado: item.grabado,
        packaging: [],
      });

      if (data.tipo === "combo" && data.itemsBase && data.itemsBase.length > 0) {
        data.itemsBase.forEach((base) => {
          const cantidadNecesaria = base.cantidad * item.cantidad;
          const existing = descuentos.get(base.codigo);
          descuentos.set(base.codigo, {
            ref: doc(db, "productos", base.codigo),
            cantidad: (existing?.cantidad ?? 0) + cantidadNecesaria,
          });
        });
      } else {
        const existing = descuentos.get(data.codigo);
        descuentos.set(data.codigo, {
          ref: topRefs[index],
          cantidad: (existing?.cantidad ?? 0) + item.cantidad,
          snap, // already fetched above — no need to re-read
        });
      }

      (item.packaging ?? []).forEach((pkg) => {
        if (pkg.cantidad <= 0) return;
        const existing = packagingDescuentos.get(pkg.packageId);
        packagingDescuentos.set(pkg.packageId, {
          ref: doc(db, "packaging", pkg.packageId),
          cantidad: (existing?.cantidad ?? 0) + pkg.cantidad,
        });
      });
    });

    const entries = Array.from(descuentos.entries());
    const pending = entries.filter(([, d]) => !d.snap);
    const fetched = await Promise.all(
      pending.map(([, d]) => transaction.get(d.ref))
    );
    pending.forEach(([, d], i) => {
      d.snap = fetched[i];
    });

    const packagingEntries = Array.from(packagingDescuentos.entries());
    const packagingFetched = await Promise.all(
      packagingEntries.map(([, d]) => transaction.get(d.ref))
    );
    packagingEntries.forEach(([, d], i) => {
      d.snap = packagingFetched[i];
    });

    entries.forEach(([codigo, d]) => {
      const snap = d.snap!;
      if (!snap.exists()) {
        throw new Error(`El producto base "${codigo}" ya no existe.`);
      }
      const stockActual = (snap.data()!.stock as number) ?? 0;
      if (stockActual < d.cantidad) {
        throw new Error(
          `Stock insuficiente de "${
            (snap.data()!.nombre as string) ?? codigo
          }". Disponible: ${stockActual}, necesario: ${d.cantidad}.`
        );
      }
    });

    packagingEntries.forEach(([packageId, d]) => {
      const snap = d.snap!;
      if (!snap.exists()) {
        throw new Error(`El packaging "${packageId}" ya no existe.`);
      }
      const stockActual = (snap.data()!.stock as number) ?? 0;
      if (stockActual < d.cantidad) {
        throw new Error(
          `Stock insuficiente de "${
            (snap.data()!.nombre as string) ?? packageId
          }". Por favor, contacta al administrador.`
        );
      }
    });

    // Attach the resolved packaging (codigo/nombre) to each sale line for
    // the receipt/audit trail — the cart already knows quantities, but not
    // necessarily the freshest codigo/nombre.
    ventaItems.forEach((vi, index) => {
      const pkgList = input.items[index].packaging ?? [];
      vi.packaging = pkgList
        .filter((p) => p.cantidad > 0)
        .map((p) => {
          const data = packagingDescuentos.get(p.packageId)?.snap?.data();
          return {
            packageId: p.packageId,
            codigo: (data?.codigo as string) ?? p.packageId,
            nombre: (data?.nombre as string) ?? p.packageId,
            cantidad: p.cantidad,
          };
        });
    });

    const total = ventaItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Firestore rejects `undefined` field values outright — the GrabadoInfo
    // type no longer allows constructing one, but every item is sanitized
    // again here as a last line of defense right at the write boundary.
    const ventaItemsSaneados = ventaItems.map((item) => ({
      ...item,
      grabado: sanitizeForFirestore(item.grabado),
      packaging: sanitizeForFirestore(item.packaging),
    }));

    transaction.set(ventaRef, {
      items: ventaItemsSaneados,
      total,
      metodoPago: input.metodoPago,
      cliente: input.cliente,
      celular: input.celular,
      fecha: serverTimestamp(),
      usuarioId: input.usuarioId,
    });

    entries.forEach(([codigo, d]) => {
      const snap = d.snap!;
      const stockActual = (snap.data()!.stock as number) ?? 0;
      transaction.update(d.ref, { stock: stockActual - d.cantidad });

      const movimientoRef = doc(collection(db, "movimientosStock"));
      transaction.set(movimientoRef, {
        productoId: codigo,
        codigo,
        nombre: (snap.data()!.nombre as string) ?? codigo,
        tipo: "venta",
        cantidad: d.cantidad,
        fecha: serverTimestamp(),
        usuarioId: input.usuarioId,
        notas: "",
        ventaId: ventaRef.id,
      });
    });

    packagingEntries.forEach(([packageId, d]) => {
      const snap = d.snap!;
      const data = snap.data()!;
      const stockActual = (data.stock as number) ?? 0;
      transaction.update(d.ref, {
        stock: stockActual - d.cantidad,
        actualizadoEn: serverTimestamp(),
      });

      const movimientoRef = doc(collection(db, "movimientosStock"));
      transaction.set(movimientoRef, {
        productoId: packageId,
        codigo: (data.codigo as string) ?? packageId,
        nombre: (data.nombre as string) ?? packageId,
        tipo: "venta",
        cantidad: d.cantidad,
        fecha: serverTimestamp(),
        usuarioId: input.usuarioId,
        notas: "",
        esPackaging: true,
        ventaId: ventaRef.id,
      });
    });

    return total;
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

export interface EliminarVentaResult {
  ventaId: string;
  productsReverted: number;
  packagingReverted: number;
}

/**
 * Deletes a sale and reverts everything it did: product/combo stock,
 * packaging stock, and the movimientosStock entries it created — then
 * writes an audit record of the deletion. Restricted to sales made today,
 * so cierres diarios for past days stay stable.
 *
 * Reverting is driven entirely by the movimientosStock docs tagged with
 * this venta's id (see `ventaId` in createVenta), not by re-deriving
 * quantities from `venta.items`. That's deliberate: for a combo sale, the
 * items array records the combo itself, but the actual stock deduction was
 * already flattened onto its base products (and merged with any matching
 * direct purchases in the same cart) at sale time — the movimientosStock
 * entries are the only accurate record of what was actually decremented,
 * so reversing exactly those is correct regardless of whether the combo's
 * own definition has changed since.
 */
export async function eliminarVenta(
  ventaId: string,
  usuarioId: string
): Promise<EliminarVentaResult> {
  const ventaRef = doc(db, "ventas", ventaId);
  const ventaSnap = await getDoc(ventaRef);
  if (!ventaSnap.exists()) {
    throw new Error("Venta no encontrada.");
  }
  const venta = ventaSnap.data() as Venta;
  if (!venta.fecha) {
    throw new Error("La venta no tiene una fecha válida.");
  }
  if (dateKey(venta.fecha.toDate()) !== dateKey(new Date())) {
    throw new Error("Solo se pueden eliminar ventas registradas el día de hoy.");
  }

  const movimientosSnap = await getDocs(
    query(collection(db, "movimientosStock"), where("ventaId", "==", ventaId))
  );

  const reversiones = new Map<
    string,
    { ref: DocumentReference; delta: number; esPackaging: boolean }
  >();
  movimientosSnap.forEach((movSnap) => {
    const mov = movSnap.data() as MovimientoStock;
    const esPackaging = Boolean(mov.esPackaging);
    const coleccion = esPackaging ? "packaging" : "productos";
    const key = `${coleccion}/${mov.productoId}`;
    const existing = reversiones.get(key);
    reversiones.set(key, {
      ref: doc(db, coleccion, mov.productoId),
      delta: (existing?.delta ?? 0) + mov.cantidad,
      esPackaging,
    });
  });

  await runTransaction(db, async (transaction) => {
    const freshVentaSnap = await transaction.get(ventaRef);
    if (!freshVentaSnap.exists()) {
      throw new Error("La venta ya fue eliminada.");
    }

    reversiones.forEach(({ ref, delta, esPackaging }) => {
      transaction.update(ref, {
        stock: increment(delta),
        ...(esPackaging ? { actualizadoEn: serverTimestamp() } : {}),
      });
    });

    movimientosSnap.forEach((movSnap) => {
      transaction.delete(movSnap.ref);
    });

    const auditRef = doc(collection(db, "auditoria"));
    transaction.set(auditRef, {
      tipo: "venta-eliminada",
      ventaId,
      ventaOriginal: sanitizeForFirestore(venta),
      fecha: serverTimestamp(),
      usuarioId,
    });

    transaction.delete(ventaRef);
  });

  const valores = Array.from(reversiones.values());
  return {
    ventaId,
    productsReverted: valores.filter((r) => !r.esPackaging).length,
    packagingReverted: valores.filter((r) => r.esPackaging).length,
  };
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
// Datos de ejemplo (seed) — Graffito's real catalog
// ---------------------------------------------------------------------------

interface ProductoSeed extends NuevoProductoInput {
  codigo: string;
}

function buildCatalogoSeed(): ProductoSeed[] {
  const tomatodos: ProductoSeed[] = [
    ["MOODNE", "Tomatodo Negro", "tomatodo-negro"],
    ["MOODROSA", "Tomatodo Rosado", "tomatodo-rosado"],
    ["MOODVE", "Tomatodo Verde", "tomatodo-verde"],
    ["MOODCE", "Tomatodo Celeste", "tomatodo-celeste"],
    ["MOODMI", "Tomatodo Mint", "tomatodo-mint"],
    ["MOODLI", "Tomatodo Lila", "tomatodo-lila"],
    ["MOODCA", "Tomatodo Café", "tomatodo-cafe"],
    ["MOODAZ", "Tomatodo Azul", "tomatodo-azul"],
    ["MOODTU", "Tomatodo Turquesa", "tomatodo-turquesa"],
  ].map(([codigo, nombre, archivo]) => ({
    codigo,
    nombre,
    categoria: "Tomatodos",
    precio: 200,
    descripcion: "",
    imageUrl: `/images/products/tomatodos/${archivo}.jpg`,
    stock: 10,
    stockMinimo: 5,
  }));

  const agendas: ProductoSeed[] = [
    ["AGNE", "Agenda Negra", "agenda-negro"],
    ["AGAZ", "Agenda Azul", "agenda-azul"],
    ["AGCA", "Agenda Café", "agenda-cafe"],
    ["AGRO", "Agenda Roja", "agenda-rojo"],
    ["AGNA", "Agenda Amarilla", "agenda-amarillo"],
    ["AGROS", "Agenda Rosada", "agenda-rosada"],
  ].map(([codigo, nombre, archivo]) => ({
    codigo,
    nombre,
    categoria: "Agendas",
    precio: 100,
    descripcion: "",
    imageUrl: `/images/products/agendas/${archivo}.jpg`,
    stock: 8,
    stockMinimo: 5,
  }));

  const mullerPrecios: Array<[string, number]> = [
    ["MU1101", 160],
    ["MU1107", 150],
    ["MU1108", 150],
    ["MU1109", 150],
    ["MU1110", 150],
    ["MU1111", 150],
    ["MU1100", 160],
    ["MU1112", 160],
    ["MU4000", 200],
    ["MU5000", 200],
    ["MU5001", 200],
    ["MU6000", 250],
    ["MU7000", 190],
    ["MU8000", 170],
    ["MU4001", 200],
    ["MU8001", 180],
    ["MU9000", 180],
    ["MU9001", 180],
    ["MU9002", 170],
  ];
  const muller: ProductoSeed[] = mullerPrecios.map(([codigo, precio]) => ({
    codigo,
    nombre: `Muller ${codigo}`,
    categoria: "Muller",
    precio,
    descripcion: "",
    imageUrl: `/images/products/muller/${codigo.toLowerCase()}.jpg`,
    stock: 12,
    stockMinimo: 5,
  }));

  const combosSeed: Array<{
    codigo: string;
    agenda: { codigo: string; nombre: string };
    muller: string;
    imagen: string;
  }> = [
    { codigo: "AG1108", agenda: { codigo: "AGRO", nombre: "Agenda Roja" }, muller: "MU1108", imagen: "ag1108" },
    { codigo: "AG1110-1", agenda: { codigo: "AGNE", nombre: "Agenda Negra" }, muller: "MU1110", imagen: "ag1110-1" },
    { codigo: "AG1107", agenda: { codigo: "AGAZ", nombre: "Agenda Azul" }, muller: "MU1107", imagen: "ag1107" },
    { codigo: "AG1101-3", agenda: { codigo: "AGAZ", nombre: "Agenda Azul" }, muller: "MU1101", imagen: "ag1101-3" },
    { codigo: "AG1101-5", agenda: { codigo: "AGNA", nombre: "Agenda Amarilla" }, muller: "MU1101", imagen: "ag1101-5" },
    { codigo: "AG1101-2", agenda: { codigo: "AGNE", nombre: "Agenda Negra" }, muller: "MU1101", imagen: "ag1101-2" },
    { codigo: "AG1100-1", agenda: { codigo: "AGCA", nombre: "Agenda Café" }, muller: "MU1100", imagen: "ag1100-1" },
    { codigo: "AG5001", agenda: { codigo: "AGNE", nombre: "Agenda Negra" }, muller: "MU5001", imagen: "ag5001" },
    { codigo: "AG5001-CAFE", agenda: { codigo: "AGCA", nombre: "Agenda Café" }, muller: "MU5001", imagen: "ag5001-cafe" },
    { codigo: "AG5000", agenda: { codigo: "AGAZ", nombre: "Agenda Azul" }, muller: "MU5000", imagen: "ag5000" },
    { codigo: "AG6000", agenda: { codigo: "AGCA", nombre: "Agenda Café" }, muller: "MU6000", imagen: "ag6000" },
  ];
  const mullerPrecioPorCodigo = new Map(mullerPrecios);
  const combos: ProductoSeed[] = combosSeed.map((c) => {
    const precioMuller = mullerPrecioPorCodigo.get(c.muller) ?? 0;
    return {
      codigo: c.codigo,
      nombre: `Combo ${c.agenda.nombre} + Bolígrafo ${c.muller}`,
      categoria: "Combos",
      precio: 100 + precioMuller - 10,
      descripcion: "",
      imageUrl: `/images/products/combos/${c.imagen}.jpg`,
      stock: 5,
      stockMinimo: 5,
      tipo: "combo" as const,
      itemsBase: [
        { tipoProducto: "agenda" as const, codigo: c.agenda.codigo, cantidad: 1 },
        { tipoProducto: "muller" as const, codigo: c.muller, cantidad: 1 },
      ],
    };
  });

  const refills: ProductoSeed[] = [
    { codigo: "TINTA-SECA", nombre: "Tinta Seca", categoria: "Refills", precio: 25, descripcion: "", imageUrl: "/images/products/refills/tinta_seca.jpg", stock: 50, stockMinimo: 5 },
    { codigo: "TINTA-HUMEDA", nombre: "Tinta Húmeda", categoria: "Refills", precio: 15, descripcion: "", imageUrl: "/images/products/refills/tinta_humeda.jpg", stock: 50, stockMinimo: 5 },
    { codigo: "PLUMA-FUENTE", nombre: "Pluma Fuente", categoria: "Refills", precio: 20, descripcion: "", imageUrl: "/images/products/refills/pluma_fuente.jpg", stock: 50, stockMinimo: 5 },
  ];

  return [...tomatodos, ...agendas, ...muller, ...combos, ...refills];
}

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

  const categoriasDefault = ["Tomatodos", "Agendas", "Muller", "Combos", "Refills"];
  categoriasDefault.forEach((nombre, index) => {
    const ref = doc(collection(db, "categorias"));
    batch.set(ref, { nombre, icono: "", orden: index });
  });

  batch.set(doc(db, "configuracion", "general"), {
    nombreEmpresa: "Graffito",
    logoUrl: "/images/graffitoLogo.png",
    telefono: "",
    email: "",
    direccion: "",
    stockMinimoGlobal: 5,
  });

  buildCatalogoSeed().forEach((producto) => {
    const ref = doc(db, "productos", producto.codigo);
    batch.set(ref, {
      ...producto,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    });
  });

  await batch.commit();
}

// ---------------------------------------------------------------------------
// Datos de ejemplo (seed) — Packaging catalog + default product↔packaging
// links. Gated by its own `meta/seedPackaging` claim (independent of
// `meta/seed`) so it also runs for installs whose product catalog was
// already seeded before packaging existed.
// ---------------------------------------------------------------------------

interface PackagingSeedItem {
  id: string;
  codigo: string;
  nombre: string;
  categoria: PackagingCategoria;
  tamanio?: string;
  imageUrl: string;
  stock: number;
  stockMinimo: number;
}

const PACKAGING_SEED: PackagingSeedItem[] = [
  { id: "pkg-bag-pequena", codigo: "BAG-PEQUENA", nombre: "Bolsa Pequeña", categoria: "bag", tamanio: "Pequeña", imageUrl: "/images/products/packaging/bags/bolsa-pequena.jpg", stock: 100, stockMinimo: 10 },
  { id: "pkg-bag-mediana", codigo: "BAG-MEDIANA", nombre: "Bolsa Mediana", categoria: "bag", tamanio: "Mediana", imageUrl: "/images/products/packaging/bags/bolsa-mediana.jpg", stock: 100, stockMinimo: 10 },
  { id: "pkg-bag-grande", codigo: "BAG-GRANDE", nombre: "Bolsa Grande", categoria: "bag", tamanio: "Grande", imageUrl: "/images/products/packaging/bags/bolsa-grande.jpg", stock: 100, stockMinimo: 10 },
  { id: "pkg-box-agenda-bloc", codigo: "BOX-AGENDA-BLOC", nombre: "Caja Agenda + Bloc", categoria: "box", imageUrl: "/images/products/packaging/boxes/caja-agenda-bloc.jpg", stock: 50, stockMinimo: 5 },
  { id: "pkg-box-muller", codigo: "BOX-MULLER", nombre: "Caja Bolígrafo Muller", categoria: "box", imageUrl: "/images/products/packaging/boxes/caja-boligrafo-muller.jpg", stock: 100, stockMinimo: 10 },
  { id: "pkg-box-collar", codigo: "BOX-COLLAR", nombre: "Caja Collar/Manilla", categoria: "box", imageUrl: "/images/products/packaging/boxes/caja-collar-manilla.jpg", stock: 50, stockMinimo: 5 },
];

/**
 * Default packaging links are derived from category, not hand-listed per
 * product: every Agenda gets a medium bag, every Muller pen gets a medium
 * bag + its box, every combo gets the agenda+bloc box + a large bag, and
 * Tomatodos/Refills get none (the user can still attach packaging manually
 * in the cart). This mirrors how grabado eligibility is category-driven
 * (see grabadoElegibilidad in lib/utils.ts) and stays correct automatically
 * if the catalog changes, instead of drifting out of sync with a static list.
 */
function buildPackagingVinculosSeed(
  catalogo: ProductoSeed[]
): Array<{ productoId: string; packaging: VinculoPackagingEntry[] }> {
  const vinculos: Array<{ productoId: string; packaging: VinculoPackagingEntry[] }> = [];

  catalogo.forEach((producto) => {
    if (producto.tipo === "combo") {
      vinculos.push({
        productoId: producto.codigo,
        packaging: [
          { packageId: "pkg-box-agenda-bloc", cantidad: 1 },
          { packageId: "pkg-bag-grande", cantidad: 1 },
        ],
      });
    } else if (producto.categoria === "Agendas") {
      vinculos.push({
        productoId: producto.codigo,
        packaging: [{ packageId: "pkg-bag-mediana", cantidad: 1 }],
      });
    } else if (producto.categoria === "Muller") {
      vinculos.push({
        productoId: producto.codigo,
        packaging: [
          { packageId: "pkg-bag-mediana", cantidad: 1 },
          { packageId: "pkg-box-muller", cantidad: 1 },
        ],
      });
    }
    // Tomatodos & Refills: no default packaging.
  });

  return vinculos;
}

export async function ensurePackagingSeedData() {
  const seedRef = doc(db, "meta", "seedPackaging");
  const claimed = await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(seedRef);
    if (snap.exists()) return false;
    transaction.set(seedRef, { seededAt: serverTimestamp() });
    return true;
  });
  if (!claimed) return;

  const batch = writeBatch(db);

  PACKAGING_SEED.forEach((pkg) => {
    const ref = doc(db, "packaging", pkg.id);
    batch.set(ref, {
      codigo: pkg.codigo,
      nombre: pkg.nombre,
      categoria: pkg.categoria,
      ...(pkg.tamanio ? { tamanio: pkg.tamanio } : {}),
      imageUrl: pkg.imageUrl,
      stock: pkg.stock,
      stockMinimo: pkg.stockMinimo,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    });
  });

  buildPackagingVinculosSeed(buildCatalogoSeed()).forEach((vinculo) => {
    const ref = doc(db, "productosPackaging", vinculo.productoId);
    batch.set(ref, vinculo);
  });

  await batch.commit();
}
