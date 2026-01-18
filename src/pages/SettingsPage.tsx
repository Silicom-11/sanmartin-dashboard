import { Construction } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="p-4 bg-gray-100 rounded-full mb-4">
        <Construction className="w-12 h-12 text-gray-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuración</h1>
      <p className="text-gray-500 max-w-md">
        Esta página está en desarrollo. Aquí podrás configurar el sistema escolar,
        períodos académicos, escalas de calificación, horarios y permisos de usuarios.
      </p>
      <p className="text-sm text-gray-400 mt-4">
        Disponible en: Día 25 del Plan de 30 días
      </p>
    </div>
  )
}
