import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Calendar, Check, X, Clock, AlertTriangle, Users, FileText, Download, Eye, UserCheck, UserX, AlertCircle, Paperclip, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/services/api'

interface JustificationDoc {
  name: string
  url: string | null
  mimetype: string
  size?: number
  storage?: string
}

interface JustificationInfo {
  justificationId: string
  status: string
  reason: string
  observations: string | null
  parentName: string | null
  parentEmail?: string
  parentPhone?: string
  documents: JustificationDoc[]
  documentCount: number
  createdAt: string
  reviewedAt?: string
  reviewNote?: string
}

interface AttendanceRecord {
  _id: string
  student: { _id?: string; firstName: string; lastName: string; enrollmentNumber: string }
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

interface AttendanceStats {
  totalStudents: number
  present: number
  absent: number
  late: number
  justified: number
  attendanceRate: number
}

interface AttendanceAlert {
  type: 'consecutive_absences' | 'frequent_lates' | 'pending_justifications'
  count: number
  message: string
}

function StatCard({ title, value, subtitle, icon: Icon, color, loading }: { title: string; value: string | number; subtitle?: string; icon: React.ElementType; color: string; loading?: boolean }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            )}
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color}`}><Icon className="w-6 h-6 text-white" /></div>
        </div>
      </CardContent>
    </Card>
  )
}

function AttendanceDetailModal({ course, onClose }: { course: CourseAttendance; onClose: () => void }) {
  const [selectedJustification, setSelectedJustification] = useState<JustificationInfo | null>(null)

  // Cargar registros de asistencia detallados para este curso
  const { data: recordsData, isLoading: loadingRecords } = useQuery({
    queryKey: ['course-attendance-records', course._id, course.date],
    queryFn: async () => {
      const response = await api.get(`/attendance/course/${course._id}`, { params: { date: course.date } })
      return response.data.data as AttendanceRecord[]
    },
  })

  // Cargar justificaciones para esta fecha
  const { data: justificationsData } = useQuery({
    queryKey: ['justifications-for-date', course.date],
    queryFn: async () => {
      const response = await api.get('/justifications/for-date', { params: { date: course.date } })
      return response.data.data as Record<string, JustificationInfo>
    },
  })

  const attendanceRecords = recordsData || []
  const justificationsMap = justificationsData || {}

  const getDocUrl = (doc: JustificationDoc) => {
    if (doc.url) return doc.url
    const baseUrl = (api.defaults.baseURL || '').replace('/api', '')
    return `${baseUrl}/uploads/justifications/${doc.name}`
  }

  const isImageDoc = (doc: JustificationDoc) => {
    return doc.mimetype?.startsWith('image') || doc.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  }

  const getReasonLabel = (reason: string) => {
    const reasonMap: Record<string, string> = {
      illness: 'Enfermedad',
      medical_appointment: 'Cita Médica',
      family_emergency: 'Emergencia Familiar',
      travel: 'Viaje',
      other: 'Otro',
    }
    return reasonMap[reason] || reason
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved': return { label: 'Aprobada', bg: 'bg-green-100', text: 'text-green-700' }
      case 'rejected': return { label: 'Rechazada', bg: 'bg-red-100', text: 'text-red-700' }
      default: return { label: 'Pendiente', bg: 'bg-yellow-100', text: 'text-yellow-700' }
    }
  }

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

  const attendanceRate = course.total > 0 ? ((course.present + course.justified) / course.total * 100).toFixed(1) : '0.0'

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

          {loadingRecords ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay registros de asistencia para esta fecha.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-700">Estudiante</th>
                    <th className="text-center p-3 font-medium text-gray-700">Estado</th>
                    <th className="text-center p-3 font-medium text-gray-700">Hora</th>
                    <th className="text-left p-3 font-medium text-gray-700">Observación</th>
                    <th className="text-center p-3 font-medium text-gray-700">Justif.</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record) => {
                    const studentId = record.student._id || record._id
                    const justification = justificationsMap[studentId]
                    return (
                    <tr key={record._id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-sanmartin-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {record.student.firstName?.[0]}{record.student.lastName?.[0]}
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
                    <td className="p-3 text-center">
                      {justification ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedJustification(justification); }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                          title="Ver justificación"
                        >
                          <Eye className="w-4 h-4" />
                          {justification.documentCount > 0 && (
                            <span className="text-xs font-medium">{justification.documentCount}</span>
                          )}
                        </button>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
          )}

          {/* Justification Detail Panel */}
          {selectedJustification && (
            <div className="mt-6 border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Detalle de Justificación
                </h3>
                <button onClick={() => setSelectedJustification(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Motivo</p>
                  <p className="font-medium">{getReasonLabel(selectedJustification.reason)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Estado</p>
                  <Badge className={`${getStatusConfig(selectedJustification.status).bg} ${getStatusConfig(selectedJustification.status).text}`}>
                    {getStatusConfig(selectedJustification.status).label}
                  </Badge>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Padre / Apoderado</p>
                  <p className="font-medium">{selectedJustification.parentName || 'No especificado'}</p>
                  {selectedJustification.parentPhone && (
                    <p className="text-xs text-gray-400 mt-0.5">{selectedJustification.parentPhone}</p>
                  )}
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Fecha de envío</p>
                  <p className="font-medium">
                    {new Date(selectedJustification.createdAt).toLocaleDateString('es-PE', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {selectedJustification.observations && (
                <div className="p-3 bg-gray-50 rounded-xl mb-4">
                  <p className="text-xs text-gray-500 mb-1">Observaciones del padre</p>
                  <p className="text-sm">{selectedJustification.observations}</p>
                </div>
              )}

              {selectedJustification.reviewNote && (
                <div className="p-3 bg-amber-50 rounded-xl mb-4">
                  <p className="text-xs text-amber-600 mb-1">Nota del revisor</p>
                  <p className="text-sm">{selectedJustification.reviewNote}</p>
                </div>
              )}

              {selectedJustification.documents.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Paperclip className="w-4 h-4" />
                    Documentos adjuntos ({selectedJustification.documents.length})
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedJustification.documents.map((doc, idx) => {
                      const url = getDocUrl(doc)
                      return (
                        <div key={idx} className="border rounded-xl overflow-hidden">
                          {isImageDoc(doc) && url ? (
                            <div className="relative">
                              <img
                                src={url}
                                alt={doc.name}
                                className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(url, '_blank')}
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                <p className="text-xs text-white truncate">{doc.name}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 flex items-center gap-3">
                              <div className="p-2 bg-gray-100 rounded-lg">
                                <FileText className="w-5 h-5 text-gray-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{doc.name}</p>
                                <p className="text-xs text-gray-400">{doc.mimetype}</p>
                              </div>
                              {url && (
                                <a href={url} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-gray-100 rounded">
                                  <ExternalLink className="w-4 h-4 text-blue-500" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
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

  // Cargar estadísticas reales
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['attendance-stats', selectedDate],
    queryFn: async () => {
      const response = await api.get('/attendance/stats', { params: { date: selectedDate } })
      return response.data.data as AttendanceStats
    },
  })

  // Cargar asistencia por curso
  const { data: coursesData, isLoading: coursesLoading, error } = useQuery({
    queryKey: ['attendance-by-course', selectedDate],
    queryFn: async () => {
      const response = await api.get('/attendance/by-course', { params: { date: selectedDate } })
      return response.data.data as CourseAttendance[]
    },
  })

  // Cargar alertas
  const { data: alertsData } = useQuery({
    queryKey: ['attendance-alerts'],
    queryFn: async () => {
      const response = await api.get('/attendance/alerts')
      return response.data.data as AttendanceAlert[]
    },
  })

  const stats = statsData || { totalStudents: 0, present: 0, absent: 0, late: 0, justified: 0, attendanceRate: 0 }
  const allCourses = coursesData || []
  const alerts = alertsData || []

  // Convertir a números seguros
  const safeStats = {
    totalStudents: Number(stats.totalStudents) || 0,
    present: Number(stats.present) || 0,
    absent: Number(stats.absent) || 0,
    late: Number(stats.late) || 0,
    justified: Number(stats.justified) || 0,
    attendanceRate: Number(stats.attendanceRate) || 0
  }

  const courses = allCourses.filter((c: CourseAttendance) => 
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
        <StatCard title="Total Estudiantes" value={safeStats.totalStudents} icon={Users} color="bg-blue-500" loading={statsLoading} />
        <StatCard title="Presentes" value={safeStats.present} icon={UserCheck} color="bg-green-500" loading={statsLoading} />
        <StatCard title="Ausentes" value={safeStats.absent} icon={UserX} color="bg-red-500" loading={statsLoading} />
        <StatCard title="Tardanzas" value={safeStats.late} icon={Clock} color="bg-yellow-500" loading={statsLoading} />
        <StatCard title="Tasa Asistencia" value={`${safeStats.attendanceRate.toFixed(1)}%`} icon={Calendar} color="bg-purple-500" loading={statsLoading} />
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>Error al cargar la asistencia. Por favor, intenta de nuevo.</span>
          </CardContent>
        </Card>
      )}

      {alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Alertas de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {alerts.map((alert, i) => (
                <Badge 
                  key={i}
                  variant={alert.type === 'consecutive_absences' ? 'destructive' : 'outline'} 
                  className={`flex items-center gap-1 ${
                    alert.type === 'frequent_lates' ? 'border-yellow-500 text-yellow-700' : 
                    alert.type === 'pending_justifications' ? 'border-blue-500 text-blue-700' : ''
                  }`}
                >
                  {alert.type === 'consecutive_absences' && <UserX className="w-3 h-3" />}
                  {alert.type === 'frequent_lates' && <Clock className="w-3 h-3" />}
                  {alert.type === 'pending_justifications' && <FileText className="w-3 h-3" />}
                  {alert.message || `${alert.count} alertas`}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

      {coursesLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay registros</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'No se encontraron cursos con los filtros seleccionados.' : 'No hay registros de asistencia para esta fecha.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course: CourseAttendance) => {
            const attendanceRate = course.total > 0 ? ((course.present + course.justified) / course.total * 100).toFixed(1) : '0.0'
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
                      <p className="text-lg font-bold text-green-600">{course.present || 0}</p>
                      <p className="text-xs text-gray-500">Presentes</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded-lg">
                      <p className="text-lg font-bold text-red-600">{course.absent || 0}</p>
                      <p className="text-xs text-gray-500">Ausentes</p>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded-lg">
                      <p className="text-lg font-bold text-yellow-600">{course.late || 0}</p>
                      <p className="text-xs text-gray-500">Tardanzas</p>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <p className="text-lg font-bold text-blue-600">{course.justified || 0}</p>
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
