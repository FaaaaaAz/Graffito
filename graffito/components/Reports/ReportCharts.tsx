import {
  CategoryDonutChart,
  SalesLineChart,
  TopProductsBarChart,
} from "@/components/Dashboard/Charts";
import type { CategoriaVentas, TopItem, VentasPorDia } from "@/hooks/useReports";

function Card({
  title,
  span,
  children,
}: {
  title: string;
  span?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border border-panel-2 bg-panel p-5 shadow-sm ${
        span ? "xl:col-span-2" : ""
      }`}
    >
      <h3 className="mb-2 text-sm font-semibold text-ink">{title}</h3>
      {children}
    </div>
  );
}

export default function ReportCharts({
  ventasPorDia,
  ventasPorCategoria,
  topProductos,
}: {
  ventasPorDia: VentasPorDia[];
  ventasPorCategoria: CategoriaVentas[];
  topProductos: TopItem[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card title="Ventas totales por período" span>
        <SalesLineChart data={ventasPorDia} />
      </Card>
      <Card title="Categoría más vendida">
        <CategoryDonutChart data={ventasPorCategoria} />
      </Card>
      <Card title="Producto / variante más vendida (top 3)">
        <TopProductsBarChart
          data={topProductos
            .slice(0, 3)
            .map((p) => ({ nombre: p.nombre, cantidad: p.cantidad }))}
        />
      </Card>
    </div>
  );
}
