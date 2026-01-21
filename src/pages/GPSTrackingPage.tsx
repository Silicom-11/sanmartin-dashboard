import { useState, useEffect, useCallback } from 'react'
import { MapPin, Shield, Bell, Search, Users, Navigation, Clock, AlertTriangle, CheckCircle, Eye, X, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { locationService } from '@/services/api'

interface StudentLocationData {
  user: {
    _id: string
    firstName: string
    lastName: string
    email: string
    profilePhoto?: string
  }
  student?: {
    gradeLevel: string
    section: string
    studentCode?: string
  }
  location: {
    latitude: number
    longitude: number
    accuracy?: number
  }
  isOnline: boolean
  sessionStatus: string
  lastUpdate: string
  batteryLevel?: number
}

interface LocationStats {
  onlineByRole: {
    estudiante?: number
    docente?: number
    padre?: number
    administrativo?: number
  }
  totalActiveUsers: number
  locationRecordsToday: number
  timestamp: string
}

function StudentDetailModal({ student, onClose }: { student: StudentLocationData; onClose: () => void }) {
  const openInGoogleMaps = () => {
    const { latitude, longitude } = student.location
    window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, '_blank')
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return 'Ahora mismo'
    if (minutes < 60) return `Hace ${minutes} min`
    if (hours < 24) return `Hace ${hours} h`
    return date.toLocaleDateString('es-PE')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-sanmartin-primary rounded-full flex items-center justify-center text-white font-bold">
              {student.user.firstName[0]}{student.user.lastName[0]}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{student.user.firstName} {student.user.lastName}</h2>
              <p className="text-gray-500">
                {student.student ? `${student.student.gradeLevel} - ${student.student.section}` : 'Estudiante'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-gray-100 rounded-xl aspect-video flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-2 text-sanmartin-primary" />
              <p className="font-medium">Ubicación GPS</p>
              <p className="text-sm mt-1">
                {student.location.latitude.toFixed(6)}, {student.location.longitude.toFixed(6)}
              </p>
              {student.location.accuracy && (
                <p className="text-xs text-gray-400 mt-1">Precisión: ±{Math.round(student.location.accuracy)}m</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl ${student.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {student.isOnline ? <Wifi className="w-6 h-6 mb-2" /> : <WifiOff className="w-6 h-6 mb-2" />}
              <p className="font-semibold">{student.isOnline ? 'En Línea' : 'Desconectado'}</p>
              <p className="text-sm opacity-80">{formatTimeAgo(student.lastUpdate)}</p>
            </div>
            {student.batteryLevel !== undefined && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-4 h-4 rounded-full ${student.batteryLevel > 50 ? 'bg-green-500' : student.batteryLevel > 20 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  <span className="font-semibold">{student.batteryLevel}%</span>
                </div>
                <p className="text-sm text-gray-500">Batería del dispositivo</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="w-5 h-5 text-sanmartin-primary" />
              <span className="font-medium">Coordenadas</span>
            </div>
            <p className="text-gray-700 font-mono text-sm">
              {student.location.latitude.toFixed(6)}, {student.location.longitude.toFixed(6)}
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              <Bell className="w-4 h-4 mr-2" />Notificar Padre
            </Button>
            <Button 
              className="flex-1 bg-sanmartin-primary hover:bg-sanmartin-primary-dark"
              onClick={openInGoogleMaps}
            >
              <Navigation className="w-4 h-4 mr-2" />Ver en Google Maps
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color, alert, loading }: { 
  title: string
  value: number
  icon: React.ElementType
  color: string
  alert?: boolean
  loading?: boolean
}) {
  return (
    <Card className={alert ? 'border-red-300 bg-red-50' : ''}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {loading ? (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1" />
            ) : (
              <p className={`text-2xl font-bold mt-1 ${alert ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
            )}
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
  const [selectedStudent, setSelectedStudent] = useState<StudentLocationData | null>(null)
  const [students, setStudents] = useState<StudentLocationData[]>([])
  const [stats, setStats] = useState<LocationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const loadData = useCallback(async () => {
    try {
      setError(null)
      
      // Cargar ubicaciones y estadísticas en paralelo
      const [locationsRes, statsRes] = await Promise.all([
        locationService.getStudentLocations(60), // Últimos 60 minutos
        locationService.getLocationStats(),
      ])

      if (locationsRes.success) {
        setStudents(locationsRes.data || [])
      }

      if (statsRes.success) {
        setStats(statsRes.data)
      }

      setLastRefresh(new Date())
    } catch (err) {
      console.error('Error loading location data:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()

    // Auto-refresh cada 30 segundos
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(loadData, 30000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [loadData, autoRefresh])

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return 'Ahora'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })
  }

  const filteredStudents = students.filter((s) => {
    const fullName = `${s.user.firstName} ${s.user.lastName}`.toLowerCase()
    const matchesSearch = fullName.includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'online' && s.isOnline) ||
      (statusFilter === 'offline' && !s.isOnline)
    return matchesSearch && matchesStatus
  })

  const onlineCount = students.filter(s => s.isOnline).length
  const offlineCount = students.filter(s => !s.isOnline).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-7 h-7 text-sanmartin-primary" />
            GPS Tracking - Seguridad Escolar
          </h1>
          <p className="text-gray-500 mt-1">Monitoreo de ubicación en tiempo real de estudiantes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'border-green-300 bg-green-50' : ''}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Badge variant="outline" className="flex items-center gap-2 text-green-600 border-green-300">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Actualizado {formatTimeAgo(lastRefresh.toISOString())}
          </Badge>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
              <Button variant="outline" size="sm" className="ml-auto" onClick={loadData}>
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="En Línea" 
          value={onlineCount} 
          icon={Wifi} 
          color="bg-green-500" 
          loading={loading}
        />
        <StatCard 
          title="Desconectados" 
          value={offlineCount} 
          icon={WifiOff} 
          color="bg-gray-500" 
          loading={loading}
        />
        <StatCard 
          title="Usuarios Activos (30m)" 
          value={stats?.totalActiveUsers || 0} 
          icon={Users} 
          color="bg-blue-500" 
          loading={loading}
        />
        <StatCard 
          title="Registros Hoy" 
          value={stats?.locationRecordsToday || 0} 
          icon={MapPin} 
          color="bg-purple-500" 
          loading={loading}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Placeholder */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Mapa en Tiempo Real</CardTitle>
              <CardDescription>
                {students.length} estudiantes con ubicación registrada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gradient-to-br from-blue-50 to-green-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
                <div className="text-center p-8">
                  <div className="w-20 h-20 bg-sanmartin-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-10 h-10 text-sanmartin-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700">Mapa Interactivo</h3>
                  <p className="text-gray-500 mt-2 max-w-md">
                    Las ubicaciones se pueden abrir en <strong>Google Maps</strong> haciendo clic en "Ver" de cada estudiante.
                  </p>
                  <div className="flex justify-center gap-4 mt-4">
                    <Badge variant="outline" className="bg-white">🟢 {onlineCount} En línea</Badge>
                    <Badge variant="outline" className="bg-white">⚪ {offlineCount} Desconectados</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Estado del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-sm">Backend GPS</span>
                </div>
                <Badge className="bg-green-100 text-green-700">Activo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Wifi className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-sm">Tracking App</span>
                </div>
                <Badge className="bg-green-100 text-green-700">Operativo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-sm">Auto-refresh</span>
                </div>
                <Badge className={autoRefresh ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}>
                  {autoRefresh ? '30s' : 'Off'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Información
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  📍 Los estudiantes envían su ubicación cada <strong>60 segundos</strong> mientras usan la app.
                </p>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-700">
                  🔒 Solo los administradores pueden ver las ubicaciones de los estudiantes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Students List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Estudiantes Monitoreados ({students.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant={statusFilter === 'all' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setStatusFilter('all')}
              >
                Todos
              </Button>
              <Button 
                variant={statusFilter === 'online' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setStatusFilter('online')}
                className={statusFilter === 'online' ? 'bg-green-600' : ''}
              >
                <Wifi className="w-3 h-3 mr-1" /> En línea ({onlineCount})
              </Button>
              <Button 
                variant={statusFilter === 'offline' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setStatusFilter('offline')}
              >
                <WifiOff className="w-3 h-3 mr-1" /> Offline ({offlineCount})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Buscar estudiante por nombre..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10" 
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">No hay estudiantes con ubicación registrada</p>
              <p className="text-sm mt-1">
                Las ubicaciones aparecerán cuando los estudiantes inicien sesión en la app móvil.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStudents.map((student, index) => (
                <div 
                  key={student.user._id || index} 
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    student.isOnline ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-10 h-10 bg-sanmartin-primary rounded-full flex items-center justify-center text-white font-bold">
                        {student.user.firstName[0]}{student.user.lastName[0]}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        student.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold">{student.user.firstName} {student.user.lastName}</p>
                      <p className="text-sm text-gray-500">
                        {student.student ? `${student.student.gradeLevel} - ${student.student.section}` : 'Estudiante'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-gray-600 font-mono">
                        {student.location.latitude.toFixed(4)}, {student.location.longitude.toFixed(4)}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(student.lastUpdate)}
                      </p>
                    </div>
                    <Badge className={student.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                      {student.isOnline ? (
                        <><Wifi className="w-3 h-3 mr-1" /> En línea</>
                      ) : (
                        <><WifiOff className="w-3 h-3 mr-1" /> Offline</>
                      )}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(student)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}
    </div>
  )
}
