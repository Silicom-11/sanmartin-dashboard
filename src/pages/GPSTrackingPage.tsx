import { Construction, MapPin, Shield, Bell } from 'lucide-react'

export default function GPSTrackingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="p-4 bg-red-100 rounded-full mb-4">
        <MapPin className="w-12 h-12 text-red-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">🔒 GPS Tracking en Tiempo Real</h1>
      <p className="text-gray-500 max-w-md mb-6">
        <strong>FUNCIONALIDAD INNOVADORA:</strong> Sistema de seguridad para estudiantes
        que permite a padres y administradores visualizar la ubicación en tiempo real.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
        <div className="p-4 bg-white rounded-lg shadow border">
          <MapPin className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <h3 className="font-semibold">Mapa en Vivo</h3>
          <p className="text-sm text-gray-500">Visualización con Leaflet/OpenStreetMap</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow border">
          <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h3 className="font-semibold">Zonas Seguras</h3>
          <p className="text-sm text-gray-500">Geofencing con alertas automáticas</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow border">
          <Bell className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <h3 className="font-semibold">Notificaciones</h3>
          <p className="text-sm text-gray-500">Push notifications al salir de zona</p>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <Construction className="w-6 h-6 text-yellow-600 inline mr-2" />
        <span className="text-yellow-800">Disponible en: <strong>Días 15-17</strong> del Plan de 30 días</span>
      </div>
    </div>
  )
}
