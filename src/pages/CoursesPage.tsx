import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, BookOpen, Users, Clock, Calendar, GraduationCap, Eye, Edit, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/services/api'

interface CourseSection {
  _id: string
  subject: { name: string; code: string; area: string; color: string }
  classroom: { section: string; gradeLevel: { name: string; shortName: string } }
  teacher: { firstName: string; lastName: string }
  schedule: { day: string; startTime: string; endTime: string }[]
  studentsCount: number
  isActive: boolean
}

const mockCourses: CourseSection[] = [
  { _id: '1', subject: { name: 'Matemáticas', code: 'MAT', area: 'Ciencias', color: '#3B82F6' }, classroom: { section: 'A', gradeLevel: { name: '3° Primaria', shortName: '3°P' } }, teacher: { firstName: 'María', lastName: 'González' }, schedule: [{ day: 'lunes', startTime: '08:00', endTime: '09:30' }], studentsCount: 32, isActive: true },
  { _id: '2', subject: { name: 'Comunicación', code: 'COM', area: 'Humanidades', color: '#10B981' }, classroom: { section: 'A', gradeLevel: { name: '3° Primaria', shortName: '3°P' } }, teacher: { firstName: 'Carlos', lastName: 'Rodríguez' }, schedule: [{ day: 'martes', startTime: '10:00', endTime: '11:30' }], studentsCount: 32, isActive: true },
  { _id: '3', subject: { name: 'Ciencias Naturales', code: 'CTA', area: 'Ciencias', color: '#8B5CF6' }, classroom: { section: 'B', gradeLevel: { name: '4° Primaria', shortName: '4°P' } }, teacher: { firstName: 'Ana', lastName: 'Martínez' }, schedule: [{ day: 'miercoles', startTime: '08:00', endTime: '09:30' }], studentsCount: 30, isActive: true },
  { _id: '4', subject: { name: 'Historia', code: 'HIS', area: 'Humanidades', color: '#F59E0B' }, classroom: { section: 'A', gradeLevel: { name: '1° Secundaria', shortName: '1°S' } }, teacher: { firstName: 'Luis', lastName: 'Pérez' }, schedule: [{ day: 'jueves', startTime: '11:00', endTime: '12:30' }], studentsCount: 35, isActive: true },
  { _id: '5', subject: { name: 'Inglés', code: 'ING', area: 'Idiomas', color: '#EC4899' }, classroom: { section: 'B', gradeLevel: { name: '2° Secundaria', shortName: '2°S' } }, teacher: { firstName: 'María', lastName: 'González' }, schedule: [{ day: 'viernes', startTime: '09:00', endTime: '10:30' }], studentsCount: 28, isActive: true },
]

const mockStats = { totalCourses: 68, activeCourses: 65, totalStudents: 847, avgStudentsPerCourse: 28 }

const areas = ['Todas', 'Ciencias', 'Humanidades', 'Idiomas', 'Arte', 'Deportes']

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${color}`}><Icon className="w-6 h-6 text-white" /></div>
        </div>
      </CardContent>
    </Card>
  )
}

function CourseDetailModal({ course, onClose }: { course: CourseSection; onClose: () => void }) {
  const dayNames: Record<string, string> = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes' }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: course.subject.color }}>
              {course.subject.code}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{course.subject.name}</h2>
              <p className="text-gray-500">{course.classroom.gradeLevel.name} - Sección {course.classroom.section}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl">
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <p className="text-2xl font-bold">{course.studentsCount}</p>
              <p className="text-sm text-gray-500">Estudiantes</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <Clock className="w-8 h-8 text-purple-600 mb-2" />
              <p className="text-2xl font-bold">{course.schedule.length * 2}</p>
              <p className="text-sm text-gray-500">Horas/Semana</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2"><GraduationCap className="w-5 h-5" /> Docente Asignado</h4>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-sanmartin-primary to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {course.teacher.firstName[0]}{course.teacher.lastName[0]}
              </div>
              <div>
                <p className="font-medium">{course.teacher.firstName} {course.teacher.lastName}</p>
                <p className="text-sm text-gray-500">Docente</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2"><Calendar className="w-5 h-5" /> Horario</h4>
            <div className="space-y-2">
              {course.schedule.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{dayNames[s.day] || s.day}</span>
                  <Badge variant="outline">{s.startTime} - {s.endTime}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Pesos de Evaluación</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-lg font-bold text-blue-600">30%</p>
                <p className="text-xs text-gray-500">Exámenes</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-lg font-bold text-green-600">40%</p>
                <p className="text-xs text-gray-500">Trabajos</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-lg font-bold text-purple-600">30%</p>
                <p className="text-xs text-gray-500">Participación</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedArea, setSelectedArea] = useState('Todas')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<CourseSection | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['courses', searchTerm, selectedArea],
    queryFn: async () => {
      try {
        const response = await api.get('/api/course-sections')
        return response.data
      } catch {
        return { data: mockCourses }
      }
    },
  })

  const courses = (data?.data || mockCourses).filter((c: CourseSection) => {
    const matchesSearch = `${c.subject.name} ${c.classroom.gradeLevel.name} ${c.teacher.firstName}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesArea = selectedArea === 'Todas' || c.subject.area === selectedArea
    return matchesSearch && matchesArea
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
        <StatCard title="Total Cursos" value={mockStats.totalCourses} icon={BookOpen} color="bg-blue-500" />
        <StatCard title="Cursos Activos" value={mockStats.activeCourses} icon={Calendar} color="bg-green-500" />
        <StatCard title="Total Estudiantes" value={mockStats.totalStudents} icon={Users} color="bg-purple-500" />
        <StatCard title="Prom. Alumnos/Curso" value={mockStats.avgStudentsPerCourse} icon={GraduationCap} color="bg-orange-500" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Buscar cursos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {areas.map((area) => (
                <Button key={area} variant={selectedArea === area ? 'default' : 'outline'} onClick={() => setSelectedArea(area)} size="sm">
                  {area}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-12 w-12 rounded-xl mb-4" /><Skeleton className="h-4 w-3/4 mb-2" /><Skeleton className="h-3 w-1/2" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course: CourseSection) => (
            <Card key={course._id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => { setSelectedCourse(course); setShowDetailModal(true); }}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: course.subject.color }}>
                      {course.subject.code}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{course.subject.name}</h3>
                      <p className="text-sm text-gray-500">{course.classroom.gradeLevel.name} - {course.classroom.section}</p>
                    </div>
                  </div>
                  <Badge variant={course.isActive ? "default" : "secondary"}>{course.isActive ? 'Activo' : 'Inactivo'}</Badge>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                    <span>{course.teacher.firstName} {course.teacher.lastName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{course.studentsCount} estudiantes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{course.schedule.length * 2} hrs/semana</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1"><Eye className="w-4 h-4 mr-1" />Ver</Button>
                  <Button variant="outline" size="sm" className="flex-1"><Edit className="w-4 h-4 mr-1" />Editar</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showDetailModal && selectedCourse && (
        <CourseDetailModal course={selectedCourse} onClose={() => { setShowDetailModal(false); setSelectedCourse(null); }} />
      )}
    </div>
  )
}
