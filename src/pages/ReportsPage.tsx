import { Construction } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="p-4 bg-teal-100 rounded-full mb-4">
        <Construction className="w-12 h-12 text-teal-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Reportes y Estadísticas</h1>
      <p className="text-gray-500 max-w-md">
        Esta página está en desarrollo. Aquí podrás generar reportes de rendimiento académico,
        asistencia por período, análisis comparativos y exportar a PDF/Excel.
      </p>
      <p className="text-sm text-gray-400 mt-4">
        Disponible en: Día 19 del Plan de 30 días
      </p>
    </div>
  )
}
