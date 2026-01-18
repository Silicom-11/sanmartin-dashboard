import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, FileSpreadsheet, TrendingUp, TrendingDown, Award, Users, BookOpen, Download, Eye, BarChart3, X } from 'lucide-react'
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
  gradeLevel: string
  section: string
  teacher: string
  studentsCount: number
  averageScore: number
  passingRate: number
}

const mockCourseGrades: CourseGrades[] = [
  { _id: '1', courseName: 'Matemáticas', gradeLevel: '3° Primaria', section: 'A', teacher: 'María González', studentsCount: 32, averageScore: 14.8, passingRate: 91 },
  { _id: '2', courseName: 'Comunicación', gradeLevel: '3° Primaria', section: 'A', teacher: 'Carlos Rodríguez', studentsCount: 32, averageScore: 15.2, passingRate: 94 },
  { _id: '3', courseName: 'Ciencias Naturales', gradeLevel: '4° Primaria', section: 'B', teacher: 'Ana Martínez', studentsCount: 30, averageScore: 13.5, passingRate: 85 },
  { _id: '4', courseName: 'Historia', gradeLevel: '1° Secundaria', section: 'A', teacher: 'Luis Pérez', studentsCount: 35, averageScore: 14.1, passingRate: 88 },
  { _id: '5', courseName: 'Inglés', gradeLevel: '2° Secundaria', section: 'B', teacher: 'María González', studentsCount: 28, averageScore: 15.6, passingRate: 96 },
]

const mockStudentGrades: StudentGrade[] = [
  { _id: '1', student: { firstName: 'Juan', lastName: 'Pérez', enrollmentNumber: '2024-001' }, grades: [{ period: 1, score: 16, status: 'A' }, { period: 2, score: 17, status: 'A' }], average: 16.5, status: 'aprobado' },
  { _id: '2', student: { firstName: 'María', lastName: 'López', enrollmentNumber: '2024-002' }, grades: [{ period: 1, score: 18, status: 'AD' }, { period: 2, score: 19, status: 'AD' }], average: 18.5, status: 'aprobado' },
  { _id: '3', student: { firstName: 'Carlos', lastName: 'García', enrollmentNumber: '2024-003' }, grades: [{ period: 1, score: 12, status: 'B' }, { period: 2, score: 13, status: 'B' }], average: 12.5, status: 'aprobado' },
  { _id: '4', student: { firstName: 'Ana', lastName: 'Martínez', enrollmentNumber: '2024-004' }, grades: [{ period: 1, score: 9, status: 'C' }, { period: 2, score: 10, status: 'C' }], average: 9.5, status: 'desaprobado' },
  { _id: '5', student: { firstName: 'Pedro', lastName: 'Sánchez', enrollmentNumber: '2024-005' }, grades: [{ period: 1, score: 15, status: 'A' }, { period: 2, score: 14, status: 'A' }], average: 14.5, status: 'aprobado' },
]

const mockStats = { totalGrades: 2456, avgScore: 14.7, passingRate: 89, excellentStudents: 124 }

const periods = ['Bimestre 1', 'Bimestre 2', 'Bimestre 3', 'Bimestre 4']

function StatCard({ title, value, subtitle, icon: Icon, color, trend }: { title: string; value: string | number; subtitle?: string; icon: React.ElementType; color: string; trend?: 'up' | 'down' }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {trend && (trend === 'up' ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />)}
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
              <p className="text-3xl font-bold text-blue-600">{course.averageScore}</p>
              <p className="text-sm text-gray-500">Promedio General</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-green-600">{course.passingRate}%</p>
              <p className="text-sm text-gray-500">Tasa de Aprobación</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-purple-600">{course.studentsCount}</p>
              <p className="text-sm text-gray-500">Estudiantes</p>
            </div>
          </div>

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
                {mockStudentGrades.map((sg) => (
                  <tr key={sg._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-sanmartin-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {sg.student.firstName[0]}{sg.student.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium">{sg.student.firstName} {sg.student.lastName}</p>
                          <p className="text-xs text-gray-400">{sg.student.enrollmentNumber}</p>
                        </div>
                      </div>
                    </td>
                    {[0, 1, 2, 3].map((i) => (
                      <td key={i} className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-lg font-medium ${getScoreColor(sg.grades[i]?.score || 0)}`}>
                          {sg.grades[i]?.score || '-'}
                        </span>
                      </td>
                    ))}
                    <td className="p-3 text-center">
                      <span className={`px-3 py-1 rounded-lg font-bold ${getScoreColor(sg.average)}`}>
                        {sg.average.toFixed(1)}
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

  const { data, isLoading } = useQuery({
    queryKey: ['grades', searchTerm, selectedPeriod],
    queryFn: async () => {
      try {
        const response = await api.get('/grades')
        return response.data
      } catch {
        return null
      }
    },
  })

  // Asegurar que siempre sea un array
  const rawData = data?.data?.grades || data?.data || data?.grades || []
  const courseData = Array.isArray(rawData) ? rawData : mockCourseGrades
  
  const courses = courseData.filter((c: CourseGrades) => 
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
        <StatCard title="Total Calificaciones" value={mockStats.totalGrades} subtitle="Este bimestre" icon={FileSpreadsheet} color="bg-blue-500" />
        <StatCard title="Promedio General" value={mockStats.avgScore} icon={BarChart3} color="bg-green-500" trend="up" />
        <StatCard title="Tasa de Aprobación" value={`${mockStats.passingRate}%`} icon={Award} color="bg-purple-500" trend="up" />
        <StatCard title="Estudiantes Destacados" value={mockStats.excellentStudents} subtitle="Nota ≥ 17" icon={TrendingUp} color="bg-orange-500" />
      </div>

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

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
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
                        <span className="font-bold text-lg">{course.studentsCount}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Promedio</p>
                      <p className={`font-bold text-2xl ${getScoreColor(course.averageScore)}`}>{course.averageScore}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Aprobación</p>
                      <div className="flex items-center gap-1">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${course.passingRate}%` }} />
                        </div>
                        <span className="font-bold text-sm text-green-600">{course.passingRate}%</span>
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
