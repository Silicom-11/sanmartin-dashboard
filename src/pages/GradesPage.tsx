import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, FileSpreadsheet, TrendingUp, TrendingDown, Award, Users, BookOpen, Download, Eye, BarChart3, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/services/api'

interface StudentGrade {
  _id: string
  student: { firstName: string; lastName: string; enrollmentNumber: string }
  grades: { period: number; score: number; status: string }[]
  average: number
  status: 'aprobado' | 'desaprobado' | 'proceso'
}

interface CourseGrades {
  _id: string
  courseName: string
  courseCode: string
  gradeLevel: string
  section: string
  teacher: string
  studentsCount: number
  averageScore: number
  passingRate: number
}

interface GradeStats {
  totalGrades: number
  avgScore: number
  passingRate: number
  excellentStudents: number
}

const periods = ['Bimestre 1', 'Bimestre 2', 'Bimestre 3', 'Bimestre 4']

function StatCard({ title, value, subtitle, icon: Icon, color, trend, loading }: { title: string; value: string | number; subtitle?: string; icon: React.ElementType; color: string; trend?: 'up' | 'down'; loading?: boolean }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <div className="flex items-center gap-2 mt-1">
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  {trend && (trend === 'up' ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />)}
                </>
              )}
            </div>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color}`}><Icon className="w-6 h-6 text-white" /></div>
        </div>
      </CardContent>
    </Card>
  )
}

function GradeDetailModal({ course, onClose }: { course: CourseGrades; onClose: () => void }) {
  const getScoreColor = (score: number) => {
    if (score >= 17) return 'text-green-600 bg-green-50'
    if (score >= 14) return 'text-blue-600 bg-blue-50'
    if (score >= 11) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  // Cargar notas detalladas de estudiantes para este curso
  const { data: studentGradesData, isLoading: loadingStudents } = useQuery({
    queryKey: ['course-student-grades', course._id],
    queryFn: async () => {
      const response = await api.get(`/grades/course/${course._id}`)
      return response.data.data as StudentGrade[]
    },
  })

  const studentGrades = studentGradesData || []

  const getStatusBadge = (status: string) => {
    const styles = { aprobado: 'bg-green-100 text-green-700', desaprobado: 'bg-red-100 text-red-700', proceso: 'bg-yellow-100 text-yellow-700' }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-semibold">{course.courseName}</h2>
            <p className="text-gray-500">{course.gradeLevel} - Sección {course.section} • Prof. {course.teacher}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" />Exportar</Button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-blue-600">{course.averageScore?.toFixed(1) || '0.0'}</p>
              <p className="text-sm text-gray-500">Promedio General</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-green-600">{course.passingRate || 0}%</p>
              <p className="text-sm text-gray-500">Tasa de Aprobación</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-purple-600">{course.studentsCount || 0}</p>
              <p className="text-sm text-gray-500">Estudiantes</p>
            </div>
          </div>

          {loadingStudents ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : studentGrades.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay notas registradas para este curso.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-700">Estudiante</th>
                    <th className="text-center p-3 font-medium text-gray-700">B1</th>
                    <th className="text-center p-3 font-medium text-gray-700">B2</th>
                    <th className="text-center p-3 font-medium text-gray-700">B3</th>
                    <th className="text-center p-3 font-medium text-gray-700">B4</th>
                    <th className="text-center p-3 font-medium text-gray-700">Prom.</th>
                    <th className="text-center p-3 font-medium text-gray-700">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {studentGrades.map((sg) => (
                    <tr key={sg._id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-sanmartin-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {sg.student.firstName?.[0]}{sg.student.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium">{sg.student.firstName} {sg.student.lastName}</p>
                            <p className="text-xs text-gray-400">{sg.student.enrollmentNumber}</p>
                          </div>
                        </div>
                      </td>
                      {[0, 1, 2, 3].map((i) => (
                        <td key={i} className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-lg font-medium ${getScoreColor(sg.grades?.[i]?.score || 0)}`}>
                            {sg.grades?.[i]?.score || '-'}
                          </span>
                        </td>
                      ))}
                      <td className="p-3 text-center">
                        <span className={`px-3 py-1 rounded-lg font-bold ${getScoreColor(sg.average || 0)}`}>
                          {(sg.average || 0).toFixed(1)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={getStatusBadge(sg.status)}>
                          {sg.status === 'aprobado' ? 'Aprobado' : sg.status === 'desaprobado' ? 'Desaprobado' : 'En Proceso'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GradesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('Bimestre 1')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<CourseGrades | null>(null)

  // Cargar estadísticas reales
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['grades-stats'],
    queryFn: async () => {
      const response = await api.get('/grades/stats')
      return response.data.data as GradeStats
    },
  })

  // Cargar cursos con calificaciones
  const { data: coursesData, isLoading: coursesLoading, error } = useQuery({
    queryKey: ['grades-by-course', selectedPeriod],
    queryFn: async () => {
      const response = await api.get('/grades/by-course')
      return response.data.data as CourseGrades[]
    },
  })

  const stats = statsData || { totalGrades: 0, avgScore: 0, passingRate: 0, excellentStudents: 0 }
  const allCourses = coursesData || []

  const courses = allCourses.filter((c: CourseGrades) => 
    `${c.courseName} ${c.gradeLevel} ${c.teacher}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getScoreColor = (score: number) => {
    if (score >= 15) return 'text-green-600'
    if (score >= 11) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calificaciones</h1>
          <p className="text-gray-500 mt-1">Gestión y seguimiento del rendimiento académico</p>
        </div>
        <Button className="bg-sanmartin-primary hover:bg-sanmartin-primary-dark">
          <Download className="w-4 h-4 mr-2" />Exportar Todo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Calificaciones" value={stats.totalGrades} subtitle="Este bimestre" icon={FileSpreadsheet} color="bg-blue-500" loading={statsLoading} />
        <StatCard title="Promedio General" value={stats.avgScore?.toFixed(1) || '0.0'} icon={BarChart3} color="bg-green-500" trend="up" loading={statsLoading} />
        <StatCard title="Tasa de Aprobación" value={`${stats.passingRate}%`} icon={Award} color="bg-purple-500" trend="up" loading={statsLoading} />
        <StatCard title="Estudiantes Destacados" value={stats.excellentStudents} subtitle="Nota ≥ 17" icon={TrendingUp} color="bg-orange-500" loading={statsLoading} />
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>Error al cargar las calificaciones. Por favor, intenta de nuevo.</span>
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
            <div className="flex gap-2 flex-wrap">
              {periods.map((period) => (
                <Button key={period} variant={selectedPeriod === period ? 'default' : 'outline'} onClick={() => setSelectedPeriod(period)} size="sm">
                  {period}
                </Button>
              ))}
            </div>
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
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay calificaciones</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'No se encontraron cursos con los filtros seleccionados.' : 'Aún no hay calificaciones registradas en el sistema.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {courses.map((course: CourseGrades) => (
            <Card key={course._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-sanmartin-primary to-blue-600 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{course.courseName}</h3>
                      <p className="text-gray-500">{course.gradeLevel} - Sección {course.section}</p>
                      <p className="text-sm text-gray-400">Prof. {course.teacher}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Estudiantes</p>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="font-bold text-lg">{course.studentsCount || 0}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Promedio</p>
                      <p className={`font-bold text-2xl ${getScoreColor(course.averageScore || 0)}`}>{(course.averageScore || 0).toFixed(1)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Aprobación</p>
                      <div className="flex items-center gap-1">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${course.passingRate || 0}%` }} />
                        </div>
                        <span className="font-bold text-sm text-green-600">{course.passingRate || 0}%</span>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => { setSelectedCourse(course); setShowDetailModal(true); }}>
                      <Eye className="w-4 h-4 mr-2" />Ver Notas
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showDetailModal && selectedCourse && (
        <GradeDetailModal course={selectedCourse} onClose={() => { setShowDetailModal(false); setSelectedCourse(null); }} />
      )}
    </div>
  )
}
