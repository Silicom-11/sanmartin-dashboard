import { Construction } from 'lucide-react'

export default function JustificationsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="p-4 bg-orange-100 rounded-full mb-4">
        <Construction className="w-12 h-12 text-orange-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Justificaciones</h1>
      <p className="text-gray-500 max-w-md">
        Esta página está en desarrollo. Aquí podrás revisar las justificaciones 
        de inasistencia enviadas por los padres, aprobar o rechazar solicitudes.
      </p>
      <p className="text-sm text-gray-400 mt-4">
        Disponible en: Día 9 del Plan de 30 días
      </p>
    </div>
  )
}
