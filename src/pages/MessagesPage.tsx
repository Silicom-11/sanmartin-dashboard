import { Construction } from 'lucide-react'

export default function MessagesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="p-4 bg-blue-100 rounded-full mb-4">
        <Construction className="w-12 h-12 text-blue-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Sistema de Mensajería</h1>
      <p className="text-gray-500 max-w-md">
        Esta página está en desarrollo. Aquí podrás enviar comunicados masivos,
        mensajes individuales a padres y docentes, con notificaciones en tiempo real.
      </p>
      <p className="text-sm text-gray-400 mt-4">
        Disponible en: Día 12 del Plan de 30 días
      </p>
    </div>
  )
}
