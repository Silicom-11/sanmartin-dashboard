import { useState } from 'react'
import { MapPin, Shield, Bell, Search, Users, Navigation, Clock, AlertTriangle, CheckCircle, Eye, X, Bus, Home, School } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface StudentLocation {
  id: string
  name: string
  gradeLevel: string
  lastLocation: { lat: number; lng: number; address: string }
  lastUpdate: string
  status: 'in-school' | 'in-transit' | 'at-home' | 'alert'
  batteryLevel: number
}

interface SafeZone {
  id: string
  name: string
  type: 'school' | 'home' | 'custom'
  radius: number
  isActive: boolean
}

const mockStudents: StudentLocation[] = [
  { id: '1', name: 'María García', gradeLevel: '3° Primaria A', lastLocation: { lat: -12.0464, lng: -77.0428, address: 'Colegio San Martín' }, lastUpdate: '08:15', status: 'in-school', batteryLevel: 85 },
  { id: '2', name: 'Carlos López', gradeLevel: '1° Secundaria B', lastLocation: { lat: -12.0500, lng: -77.0450, address: 'Av. Arequipa 2450' }, lastUpdate: '08:10', status: 'in-transit', batteryLevel: 62 },
  { id: '3', name: 'Ana Martínez', gradeLevel: '4° Primaria A', lastLocation: { lat: -12.0520, lng: -77.0380, address: 'Calle Los Pinos 123' }, lastUpdate: '07:45', status: 'at-home', batteryLevel: 100 },
  { id: '4', name: 'Pedro Sánchez', gradeLevel: '2° Secundaria A', lastLocation: { lat: -12.0600, lng: -77.0500, address: 'Zona desconocida' }, lastUpdate: '07:30', status: 'alert', batteryLevel: 15 },
  { id: '5', name: 'Laura Díaz', gradeLevel: '5° Primaria B', lastLocation: { lat: -12.0464, lng: -77.0428, address: 'Colegio San Martín' }, lastUpdate: '08:20', status: 'in-school', batteryLevel: 78 },
]

const mockZones: SafeZone[] = [
  { id: '1', name: 'Colegio San Martín', type: 'school', radius: 100, isActive: true },
  { id: '2', name: 'Casa (Radio 500m)', type: 'home', radius: 500, isActive: true },
  { id: '3', name: 'Ruta Escolar', type: 'custom', radius: 50, isActive: true },
]

const mockStats = { inSchool: 234, inTransit: 45, atHome: 12, alerts: 2 }

const statusConfig = {
  'in-school': { label: 'En Colegio', color: 'bg-green-100 text-green-700', icon: School },
  'in-transit': { label: 'En Tránsito', color: 'bg-blue-100 text-blue-700', icon: Bus },
  'at-home': { label: 'En Casa', color: 'bg-purple-100 text-purple-700', icon: Home },
  'alert': { label: '⚠️ Alerta', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
}

function StudentDetailModal({ student, onClose }: { student: StudentLocation; onClose: () => void }) {
  const config = statusConfig[student.status]
  const StatusIcon = config.icon

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-sanmartin-primary rounded-full flex items-center justify-center text-white font-bold">
              {student.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{student.name}</h2>
              <p className="text-gray-500">{student.gradeLevel}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-gray-100 rounded-xl aspect-video flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-2 text-sanmartin-primary" />
              <p className="font-medium">Mapa Interactivo</p>
              <p className="text-sm">Integración con Leaflet/OpenStreetMap</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl ${config.color}`}>
              <StatusIcon className="w-6 h-6 mb-2" />
              <p className="font-semibold">{config.label}</p>
              <p className="text-sm opacity-80">Actualizado {student.lastUpdate}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-4 h-4 rounded-full ${student.batteryLevel > 50 ? 'bg-green-500' : student.batteryLevel > 20 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                <span className="font-semibold">{student.batteryLevel}%</span>
              </div>
              <p className="text-sm text-gray-500">Batería del dispositivo</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="w-5 h-5 text-sanmartin-primary" />
              <span className="font-medium">Última Ubicación</span>
            </div>
            <p className="text-gray-700">{student.lastLocation.address}</p>
            <p className="text-xs text-gray-400 mt-1">
              {student.lastLocation.lat.toFixed(4)}, {student.lastLocation.lng.toFixed(4)}
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1"><Bell className="w-4 h-4 mr-2" />Notificar Padre</Button>
            <Button className="flex-1 bg-sanmartin-primary hover:bg-sanmartin-primary-dark"><Navigation className="w-4 h-4 mr-2" />Ver en Mapa</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color, alert }: { title: string; value: number; icon: React.ElementType; color: string; alert?: boolean }) {
  return (
    <Card className={alert ? 'border-red-300 bg-red-50' : ''}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${alert ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${color}`}><Icon className="w-6 h-6 text-white" /></div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function GPSTrackingPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedStudent, setSelectedStudent] = useState<StudentLocation | null>(null)

  const filteredStudents = mockStudents.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-7 h-7 text-sanmartin-primary" />
            GPS Tracking
          </h1>
          <p className="text-gray-500 mt-1">Monitoreo de ubicación en tiempo real</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2 text-green-600 border-green-300">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Sistema Activo
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="En Colegio" value={mockStats.inSchool} icon={School} color="bg-green-500" />
        <StatCard title="En Tránsito" value={mockStats.inTransit} icon={Bus} color="bg-blue-500" />
        <StatCard title="En Casa" value={mockStats.atHome} icon={Home} color="bg-purple-500" />
        <StatCard title="Alertas" value={mockStats.alerts} icon={AlertTriangle} color="bg-red-500" alert />
      </div>

      {mockStats.alerts > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">{mockStats.alerts} estudiantes fuera de zonas seguras</span>
              <Button variant="destructive" size="sm" className="ml-auto">Ver Alertas</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Mapa en Tiempo Real</CardTitle>
              <CardDescription>Visualización de ubicaciones con zonas seguras</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gradient-to-br from-blue-50 to-green-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
                <div className="text-center p-8">
                  <div className="w-20 h-20 bg-sanmartin-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-10 h-10 text-sanmartin-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700">Mapa Interactivo</h3>
                  <p className="text-gray-500 mt-2 max-w-md">
                    Integración con <strong>Leaflet</strong> y <strong>OpenStreetMap</strong>.<br />
                    Visualiza ubicaciones en tiempo real, zonas seguras y rutas.
                  </p>
                  <div className="flex justify-center gap-4 mt-4">
                    <Badge variant="outline" className="bg-white">🟢 Zona Escuela</Badge>
                    <Badge variant="outline" className="bg-white">🔵 En Tránsito</Badge>
                    <Badge variant="outline" className="bg-white">🟣 Zona Casa</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />Zonas Seguras</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockZones.map((zone) => {
                const icons = { school: School, home: Home, custom: Navigation }
                const Icon = icons[zone.type]
                return (
                  <div key={zone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-sanmartin-primary" />
                      <div>
                        <p className="font-medium text-sm">{zone.name}</p>
                        <p className="text-xs text-gray-500">Radio: {zone.radius}m</p>
                      </div>
                    </div>
                    <Badge variant={zone.isActive ? 'default' : 'secondary'}>
                      {zone.isActive ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" />Últimas Alertas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium text-sm">Pedro Sánchez</span>
                </div>
                <p className="text-xs text-red-600 mt-1">Fuera de zona segura - hace 15 min</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium text-sm">María García</span>
                </div>
                <p className="text-xs text-green-600 mt-1">Ingresó al colegio - hace 30 min</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Estudiantes Monitoreados</CardTitle>
            <div className="flex gap-2">
              {Object.entries(statusConfig).map(([key, config]) => (
                <Button key={key} variant={statusFilter === key ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}>
                  {config.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Buscar estudiante..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>
          <div className="space-y-3">
            {filteredStudents.map((student) => {
              const config = statusConfig[student.status]
              const StatusIcon = config.icon
              return (
                <div key={student.id} className={`flex items-center justify-between p-4 rounded-xl border ${student.status === 'alert' ? 'border-red-300 bg-red-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-sanmartin-primary rounded-full flex items-center justify-center text-white font-bold">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.gradeLevel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-gray-600">{student.lastLocation.address}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />{student.lastUpdate}
                      </p>
                    </div>
                    <Badge className={config.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />{config.label}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(student)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {selectedStudent && <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
    </div>
  )
}
