import type { Complejo } from '@shared/types/complejo';

interface ResumenPanelProps {
  complejos: Complejo[];
}

export default function ResumenPanel({ complejos }: ResumenPanelProps) {
  const activos = complejos.filter((c) => c.activo);
  const capacidadTotal = activos.reduce((sum, c) => sum + c.capacidad * c.cantidadUnidades, 0);
  const totalUnidades = activos.reduce((sum, c) => sum + c.cantidadUnidades, 0);

  const preciosBaja = activos.flatMap((c) =>
    c.tarifas.filter((t) => t.temporada === 'baja').map((t) => t.precioNoche)
  );
  const precioMin = preciosBaja.length > 0 ? Math.min(...preciosBaja) : 0;
  const precioMax = preciosBaja.length > 0 ? Math.max(...preciosBaja) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Resumen</h3>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{activos.length}</p>
          <p className="text-xs text-blue-600">Activos</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-purple-700">{totalUnidades}</p>
          <p className="text-xs text-purple-600">Unidades</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{capacidadTotal}</p>
          <p className="text-xs text-green-600">Capacidad total</p>
        </div>
      </div>

      {preciosBaja.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rango precios (temp. baja)</p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            ${precioMin.toLocaleString('es-AR')} - ${precioMax.toLocaleString('es-AR')}/noche
          </p>
        </div>
      )}

      <div>
        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Departamentos</h4>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 dark:text-gray-500">
              <th className="text-left pb-1">Nombre</th>
              <th className="text-center pb-1">Uds.</th>
              <th className="text-center pb-1">Cap.</th>
              <th className="text-right pb-1">Baja</th>
            </tr>
          </thead>
          <tbody>
            {activos.map((c) => {
              const baja = c.tarifas.find((t) => t.temporada === 'baja');
              return (
                <tr key={c.id} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="py-1 font-medium text-gray-700 dark:text-gray-300">{c.nombre}</td>
                  <td className="py-1 text-center text-gray-500 dark:text-gray-400">{c.cantidadUnidades}</td>
                  <td className="py-1 text-center text-gray-500 dark:text-gray-400">{c.capacidad}</td>
                  <td className="py-1 text-right text-gray-600 dark:text-gray-400">
                    {baja ? `$${baja.precioNoche.toLocaleString('es-AR')}` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
