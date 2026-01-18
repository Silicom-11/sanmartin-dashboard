import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, BookOpen, Users, Clock, Calendar, GraduationCap, Eye, Edit, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/services/api'

interface Course {
  _id: string
  name: string
  code: string
  description?: string
  gradeLevel: string
  section: string
  teacher: { _id: string; firstName: string; lastName: string; email: string }
  students: string[]
  schedule: { day: string; startTime: string; endTime: string; classroom?: string }[]
  evaluationWeights: { exams: number; tasks: number; participation: number; projects: number }
  academicYear: number
  period: string
  isActive: boolean
}

interface CourseStats {
  totalCourses: number
  activeCourses: number
  totalStudents: number
  avgStudentsPerCourse: number
}

// Colores por tipo de curso
const courseColors: Record<string, string> = {
  'MAT': '#3B82F6', 'COM': '#10B981', 'CTA': '#8B5CF6', 'HIS': '#F59E0B',
  'ING': '#EC4899', 'ART': '#6366F1', 'EDF': '#14B8A6', 'REL': '#F97316',
  'default': '#6B7280'
}

const gradeLevels = ['Todos', '1º Primaria', '2º Primaria', '3º Primaria', '4º Primaria', '5º Primaria', '6º Primaria', '1º Secundaria', '2º Secundaria', '3º Secundaria', '4º Secundaria', '5º Secundaria']

function StatCard({ title, value, icon: Icon, color, loading }: { title: string; value: string | number; icon: React.ElementType; color: string; loading?: boolean }) {
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
          </div>
          <div className={`p-3 rounded-xl ${color}`}><Icon className="w-6 h-6 text-white" /></div>
        </div>
      </CardContent>
    </Card>
  )
}

function CourseDetailModal({ course, onClose }: { course: Course; onClose: () => void }) {
  const color = courseColors[course.code] || courseColors.default
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: color }}>
              {course.code}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{course.name}</h2>
              <p className="text-gray-500">{course.gradeLevel} - Sección {course.section}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl">
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <p className="text-2xl font-bold">{course.students?.length || 0}</p>
              <p className="text-sm text-gray-500">Estudiantes</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <Clock className="w-8 h-8 text-purple-600 mb-2" />
              <p className="text-2xl font-bold">{(course.schedule?.length || 0) * 2}</p>
              <p className="text-sm text-gray-500">Horas/Semana</p>
            </div>
          </div>

          {course.teacher && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2"><GraduationCap className="w-5 h-5" /> Docente Asignado</h4>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-sanmartin-primary to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {course.teacher.firstName?.[0]}{course.teacher.lastName?.[0]}
                </div>
                <div>
                  <p className="font-medium">{course.teacher.firstName} {course.teacher.lastName}</p>
                  <p className="text-sm text-gray-500">Docente</p>
                </div>
              </div>
            </div>
          )}

          {course.schedule && course.schedule.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2"><Calendar className="w-5 h-5" /> Horario</h4>
              <div className="space-y-2">
                {course.schedule.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{s.day}</span>
                    <Badge variant="outline">{s.startTime} - {s.endTime}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {course.evaluationWeights && (
            <div>
              <h4 className="font-semibold mb-3">Pesos de Evaluación</h4>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-lg font-bold text-blue-600">{course.evaluationWeights.exams}%</p>
                  <p className="text-xs text-gray-500">Exámenes</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">{course.evaluationWeights.tasks}%</p>
                  <p className="text-xs text-gray-500">Tareas</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-lg font-bold text-purple-600">{course.evaluationWeights.participation}%</p>
                  <p className="text-xs text-gray-500">Participación</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-lg font-bold text-orange-600">{course.evaluationWeights.projects}%</p>
                  <p className="text-xs text-gray-500">Proyectos</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('Todos')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  // Cargar estadísticas reales
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['courses-stats'],
    queryFn: async () => {
      const response = await api.get('/courses/stats')
      return response.data.data as CourseStats
    },
  })

  // Cargar cursos reales
  const { data: coursesData, isLoading: coursesLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await api.get('/courses')
      return response.data.data.courses as Course[]
    },
  })

  const stats = statsData || { totalCourses: 0, activeCourses: 0, totalStudents: 0, avgStudentsPerCourse: 0 }
  const allCourses = coursesData || []
  
  const courses = allCourses.filter((c: Course) => {
    const matchesSearch = `${c.name} ${c.gradeLevel} ${c.teacher?.firstName || ''} ${c.teacher?.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGrade = selectedGradeLevel === 'Todos' || c.gradeLevel === selectedGradeLevel
    return matchesSearch && matchesGrade
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cursos</h1>
          <p className="text-gray-500 mt-1">Gestión de cursos y secciones académicas</p>
        </div>
        <Button className="bg-sanmartin-primary hover:bg-sanmartin-primary-dark">
          <Plus className="w-4 h-4 mr-2" />Nuevo Curso
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Cursos" value={stats.totalCourses} icon={BookOpen} color="bg-blue-500" loading={statsLoading} />
        <StatCard title="Cursos Activos" value={stats.activeCourses} icon={Calendar} color="bg-green-500" loading={statsLoading} />
        <StatCard title="Total Estudiantes" value={stats.totalStudents} icon={Users} color="bg-purple-500" loading={statsLoading} />
        <StatCard title="Prom. Alumnos/Curso" value={stats.avgStudentsPerCourse} icon={GraduationCap} color="bg-orange-500" loading={statsLoading} />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Buscar cursos por nombre, grado o docente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <select 
              value={selectedGradeLevel} 
              onChange={(e) => setSelectedGradeLevel(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sanmartin-primary"
            >
              {gradeLevels.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>Error al cargar los cursos. Por favor, intenta de nuevo.</span>
          </CardContent>
        </Card>
      )}

      {coursesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-12 w-12 rounded-xl mb-4" /><Skeleton className="h-4 w-3/4 mb-2" /><Skeleton className="h-3 w-1/2" /></CardContent></Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay cursos</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedGradeLevel !== 'Todos' 
                ? 'No se encontraron cursos con los filtros seleccionados.' 
                : 'Aún no hay cursos registrados en el sistema.'}
            </p>
            <Button className="bg-sanmartin-primary hover:bg-sanmartin-primary-dark">
              <Plus className="w-4 h-4 mr-2" />Crear Primer Curso
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course: Course) => {
            const color = courseColors[course.code] || courseColors.default
            return (
              <Card key={course._id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => { setSelectedCourse(course); setShowDetailModal(true); }}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: color }}>
                        {course.code}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{course.name}</h3>
                        <p className="text-sm text-gray-500">{course.gradeLevel} - Sección {course.section}</p>
                      </div>
                    </div>
                    <Badge variant={course.isActive ? "default" : "secondary"}>{course.isActive ? 'Activo' : 'Inactivo'}</Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {course.teacher && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <span>{course.teacher.firstName} {course.teacher.lastName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{course.students?.length || 0} estudiantes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{(course.schedule?.length || 0) * 2} hrs/semana</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1"><Eye className="w-4 h-4 mr-1" />Ver</Button>
                    <Button variant="outline" size="sm" className="flex-1"><Edit className="w-4 h-4 mr-1" />Editar</Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {showDetailModal && selectedCourse && (
        <CourseDetailModal course={selectedCourse} onClose={() => { setShowDetailModal(false); setSelectedCourse(null); }} />
      )}
    </div>
  )
}
