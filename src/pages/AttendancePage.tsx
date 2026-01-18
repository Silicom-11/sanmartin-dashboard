import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Calendar, Check, X, Clock, AlertTriangle, Users, FileText, Download, Eye, UserCheck, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/services/api'

interface AttendanceRecord {
  _id: string
  student: { firstName: string; lastName: string; enrollmentNumber: string }
  status: 'present' | 'absent' | 'late' | 'justified'
  time?: string
  note?: string
}

interface CourseAttendance {
  _id: string
  courseName: string
  gradeLevel: string
  section: string
  teacher: string
  date: string
  present: number
  absent: number
  late: number
  justified: number
  total: number
}

const mockCourseAttendance: CourseAttendance[] = [
  { _id: '1', courseName: 'Matemáticas', gradeLevel: '3° Primaria', section: 'A', teacher: 'María González', date: '2024-01-15', present: 28, absent: 2, late: 1, justified: 1, total: 32 },
  { _id: '2', courseName: 'Comunicación', gradeLevel: '3° Primaria', section: 'A', teacher: 'Carlos Rodríguez', date: '2024-01-15', present: 30, absent: 1, late: 0, justified: 1, total: 32 },
  { _id: '3', courseName: 'Ciencias Naturales', gradeLevel: '4° Primaria', section: 'B', teacher: 'Ana Martínez', date: '2024-01-15', present: 27, absent: 2, late: 1, justified: 0, total: 30 },
  { _id: '4', courseName: 'Historia', gradeLevel: '1° Secundaria', section: 'A', teacher: 'Luis Pérez', date: '2024-01-15', present: 32, absent: 1, late: 2, justified: 0, total: 35 },
  { _id: '5', courseName: 'Inglés', gradeLevel: '2° Secundaria', section: 'B', teacher: 'María González', date: '2024-01-15', present: 25, absent: 2, late: 1, justified: 0, total: 28 },
]

const mockAttendanceRecords: AttendanceRecord[] = [
  { _id: '1', student: { firstName: 'Juan', lastName: 'Pérez', enrollmentNumber: '2024-001' }, status: 'present', time: '07:45' },
  { _id: '2', student: { firstName: 'María', lastName: 'López', enrollmentNumber: '2024-002' }, status: 'present', time: '07:50' },
  { _id: '3', student: { firstName: 'Carlos', lastName: 'García', enrollmentNumber: '2024-003' }, status: 'late', time: '08:15', note: 'Tráfico' },
  { _id: '4', student: { firstName: 'Ana', lastName: 'Martínez', enrollmentNumber: '2024-004' }, status: 'absent' },
  { _id: '5', student: { firstName: 'Pedro', lastName: 'Sánchez', enrollmentNumber: '2024-005' }, status: 'justified', note: 'Cita médica' },
  { _id: '6', student: { firstName: 'Laura', lastName: 'Díaz', enrollmentNumber: '2024-006' }, status: 'present', time: '07:55' },
  { _id: '7', student: { firstName: 'Diego', lastName: 'Torres', enrollmentNumber: '2024-007' }, status: 'present', time: '07:48' },
]

const mockStats = { totalToday: 847, presentToday: 812, absentToday: 24, lateToday: 11, attendanceRate: 95.8 }

function StatCard({ title, value, subtitle, icon: Icon, color }: { title: string; value: string | number; subtitle?: string; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color}`}><Icon className="w-6 h-6 text-white" /></div>
        </div>
      </CardContent>
    </Card>
  )
}

function AttendanceDetailModal({ course, onClose }: { course: CourseAttendance; onClose: () => void }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <Check className="w-4 h-4 text-green-600" />
      case 'absent': return <X className="w-4 h-4 text-red-600" />
      case 'late': return <Clock className="w-4 h-4 text-yellow-600" />
      case 'justified': return <FileText className="w-4 h-4 text-blue-600" />
      default: return null
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      present: 'bg-green-100 text-green-700',
      absent: 'bg-red-100 text-red-700',
      late: 'bg-yellow-100 text-yellow-700',
      justified: 'bg-blue-100 text-blue-700',
    }
    const labels = { present: 'Presente', absent: 'Ausente', late: 'Tardanza', justified: 'Justificado' }
    return <Badge className={styles[status as keyof typeof styles]}>{labels[status as keyof typeof labels]}</Badge>
  }

  const attendanceRate = ((course.present + course.justified) / course.total * 100).toFixed(1)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-semibold">{course.courseName}</h2>
            <p className="text-gray-500">{course.gradeLevel} - Sección {course.section} • {new Date(course.date).toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" />Exportar</Button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-5 gap-3 mb-6">
            <div className="p-4 bg-green-50 rounded-xl text-center">
              <UserCheck className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-600">{course.present}</p>
              <p className="text-xs text-gray-500">Presentes</p>
            </div>
            <div className="p-4 bg-red-50 rounded-xl text-center">
              <UserX className="w-6 h-6 text-red-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-600">{course.absent}</p>
              <p className="text-xs text-gray-500">Ausentes</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-xl text-center">
              <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-yellow-600">{course.late}</p>
              <p className="text-xs text-gray-500">Tardanzas</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl text-center">
              <FileText className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-600">{course.justified}</p>
              <p className="text-xs text-gray-500">Justificados</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl text-center">
              <Users className="w-6 h-6 text-purple-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-purple-600">{attendanceRate}%</p>
              <p className="text-xs text-gray-500">Asistencia</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-medium text-gray-700">Estudiante</th>
                  <th className="text-center p-3 font-medium text-gray-700">Estado</th>
                  <th className="text-center p-3 font-medium text-gray-700">Hora</th>
                  <th className="text-left p-3 font-medium text-gray-700">Observación</th>
                </tr>
              </thead>
              <tbody>
                {mockAttendanceRecords.map((record) => (
                  <tr key={record._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-sanmartin-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {record.student.firstName[0]}{record.student.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium">{record.student.firstName} {record.student.lastName}</p>
                          <p className="text-xs text-gray-400">{record.student.enrollmentNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(record.status)}
                        {getStatusBadge(record.status)}
                      </div>
                    </td>
                    <td className="p-3 text-center text-gray-600">
                      {record.time || '-'}
                    </td>
                    <td className="p-3 text-gray-500 text-sm">
                      {record.note || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AttendancePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<CourseAttendance | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', searchTerm, selectedDate],
    queryFn: async () => {
      try {
        const response = await api.get('/attendance', { params: { date: selectedDate } })
        return response.data
      } catch {
        return null
      }
    },
  })

  // Asegurar que siempre sea un array
  const rawData = data?.data?.attendance || data?.data || data?.attendance || []
  const attendanceData = Array.isArray(rawData) ? rawData : mockCourseAttendance
  
  const courses = attendanceData.filter((c: CourseAttendance) => 
    `${c.courseName} ${c.gradeLevel} ${c.teacher}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control de Asistencia</h1>
          <p className="text-gray-500 mt-1">Monitoreo en tiempo real de la asistencia estudiantil</p>
        </div>
        <Button className="bg-sanmartin-primary hover:bg-sanmartin-primary-dark">
          <Download className="w-4 h-4 mr-2" />Reporte Diario
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard title="Total Estudiantes" value={mockStats.totalToday} icon={Users} color="bg-blue-500" />
        <StatCard title="Presentes" value={mockStats.presentToday} icon={UserCheck} color="bg-green-500" />
        <StatCard title="Ausentes" value={mockStats.absentToday} icon={UserX} color="bg-red-500" />
        <StatCard title="Tardanzas" value={mockStats.lateToday} icon={Clock} color="bg-yellow-500" />
        <StatCard title="Tasa Asistencia" value={`${mockStats.attendanceRate}%`} icon={Calendar} color="bg-purple-500" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Alertas de Hoy
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            <Badge variant="destructive" className="flex items-center gap-1">
              <UserX className="w-3 h-3" /> 3 estudiantes con 3+ faltas consecutivas
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 text-yellow-700">
              <Clock className="w-3 h-3" /> 5 estudiantes con tardanzas frecuentes
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 border-blue-500 text-blue-700">
              <FileText className="w-3 h-3" /> 2 justificaciones pendientes de revisión
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Buscar por curso, grado o docente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-auto" />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course: CourseAttendance) => {
            const attendanceRate = ((course.present + course.justified) / course.total * 100).toFixed(1)
            return (
              <Card key={course._id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => { setSelectedCourse(course); setShowDetailModal(true); }}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{course.courseName}</h3>
                      <p className="text-gray-500 text-sm">{course.gradeLevel} - Sección {course.section}</p>
                      <p className="text-gray-400 text-xs">Prof. {course.teacher}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-sanmartin-primary">{attendanceRate}%</p>
                      <p className="text-xs text-gray-400">Asistencia</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <p className="text-lg font-bold text-green-600">{course.present}</p>
                      <p className="text-xs text-gray-500">Presentes</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded-lg">
                      <p className="text-lg font-bold text-red-600">{course.absent}</p>
                      <p className="text-xs text-gray-500">Ausentes</p>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded-lg">
                      <p className="text-lg font-bold text-yellow-600">{course.late}</p>
                      <p className="text-xs text-gray-500">Tardanzas</p>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <p className="text-lg font-bold text-blue-600">{course.justified}</p>
                      <p className="text-xs text-gray-500">Justificados</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Button variant="outline" size="sm" className="w-full"><Eye className="w-4 h-4 mr-2" />Ver Detalle</Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {showDetailModal && selectedCourse && (
        <AttendanceDetailModal course={selectedCourse} onClose={() => { setShowDetailModal(false); setSelectedCourse(null); }} />
      )}
    </div>
  )
}
