import { Construction } from 'lucide-react'

export default function CalendarPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="p-4 bg-purple-100 rounded-full mb-4">
        <Construction className="w-12 h-12 text-purple-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Calendario Escolar</h1>
      <p className="text-gray-500 max-w-md">
        Esta página está en desarrollo. Aquí podrás gestionar eventos escolares,
        fechas de exámenes, reuniones de padres y actividades extracurriculares.
      </p>
      <p className="text-sm text-gray-400 mt-4">
        Disponible en: Día 10 del Plan de 30 días
      </p>
    </div>
  )
}
