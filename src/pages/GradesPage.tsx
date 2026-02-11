import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, FileSpreadsheet, TrendingUp, Award, Users, BookOpen,
  Download, Eye, BarChart3, X, AlertCircle, Lock, Unlock, Plus, ChevronLeft,
  Loader2, CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import api from '@/services/api'
import { gradesService, evaluationsService, coursesService } from '@/services/api'

// ============ TYPES ============

interface EvaluationItem {
  _id: string
  name: string
  type: string
  maxGrade: number
  weight: number
  date: string
  order: number
}

interface StudentGradeRow {
  student: { _id: string; firstName: string; lastName: string; enrollmentNumber: string }
  gradeId: string | null
  average: number
  status: string
  scores: Record<string, { score: number; comments?: string }>
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

interface GradeStats {
  totalGrades: number
  avgScore: string
  passingRate: string
  excellentStudents: number
  uniqueStudents: number
  distribution: { AD: number; A: number; B: number; C: number }
}

const BIMESTERS = [
  { value: 1, label: 'Bimestre 1' },
  { value: 2, label: 'Bimestre 2' },
  { value: 3, label: 'Bimestre 3' },
  { value: 4, label: 'Bimestre 4' },
]

const EVAL_TYPES = [
  { value: 'examen', label: 'Examen', color: 'bg-red-100 text-red-700' },
  { value: 'tarea', label: 'Tarea', color: 'bg-blue-100 text-blue-700' },
  { value: 'practica', label: 'Practica', color: 'bg-green-100 text-green-700' },
  { value: 'proyecto', label: 'Proyecto', color: 'bg-purple-100 text-purple-700' },
  { value: 'participacion', label: 'Participacion', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'exposicion', label: 'Exposicion', color: 'bg-orange-100 text-orange-700' },
  { value: 'otro', label: 'Otro', color: 'bg-gray-100 text-gray-700' },
]

function getScoreColor(score: number) {
  if (score >= 17) return 'text-green-600 bg-green-50'
  if (score >= 14) return 'text-blue-600 bg-blue-50'
  if (score >= 11) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    abierto: 'bg-green-100 text-green-700',
    cerrado: 'bg-yellow-100 text-yellow-700',
    publicado: 'bg-blue-100 text-blue-700',
  }
  return map[status] || 'bg-gray-100 text-gray-700'
}

function getEvalTypeInfo(type: string) {
  return EVAL_TYPES.find(t => t.value === type) || EVAL_TYPES[EVAL_TYPES.length - 1]
}

function StatCard({ title, value, subtitle, icon: Icon, color, loading }: {
  title: string; value: string | number; subtitle?: string; icon: React.ElementType; color: string; loading?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {loading ? <Skeleton className="h-8 w-20 mt-1" /> : (
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

// ============ COURSE GRADE DETAIL (BIMESTER VIEW) ============

function CourseGradeDetail({ courseId, courseName, onBack }: {
  courseId: string; courseName: string; onBack: () => void
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedBimester, setSelectedBimester] = useState(1)
  const [showNewEval, setShowNewEval] = useState(false)
  const [newEvalData, setNewEvalData] = useState({ name: '', type: 'examen', maxGrade: 20 })

  // Fetch course grades for selected bimester
  const { data: gradeData, isLoading } = useQuery({
    queryKey: ['course-grades', courseId, selectedBimester],
    queryFn: async () => {
      const res = await gradesService.getByCourse(courseId, { bimester: selectedBimester })
      return res.data
    },
  })

  const evaluations: EvaluationItem[] = gradeData?.evaluations || []
  const students: StudentGradeRow[] = gradeData?.students || []
  const bimesterStatus: string = gradeData?.bimesterStatus || 'abierto'
  const courseInfo = gradeData?.course || { name: courseName }

  // Create evaluation mutation
  const createEvalMutation = useMutation({
    mutationFn: (data: { name: string; type: string; maxGrade: number }) =>
      evaluationsService.create({
        courseId,
        name: data.name,
        type: data.type as 'examen',
        bimester: selectedBimester,
        maxGrade: data.maxGrade,
      }),
    onSuccess: () => {
      toast({ title: 'Evaluacion creada', description: 'La columna de notas fue agregada.' })
      queryClient.invalidateQueries({ queryKey: ['course-grades', courseId, selectedBimester] })
      setShowNewEval(false)
      setNewEvalData({ name: '', type: 'examen', maxGrade: 20 })
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    },
  })

  // Delete evaluation mutation
  const deleteEvalMutation = useMutation({
    mutationFn: (evalId: string) => evaluationsService.delete(evalId),
    onSuccess: () => {
      toast({ title: 'Evaluacion eliminada' })
      queryClient.invalidateQueries({ queryKey: ['course-grades', courseId, selectedBimester] })
    },
  })

  // Close/Reopen bimester
  const closeBimesterMutation = useMutation({
    mutationFn: () => gradesService.closeBimester({ courseId, bimester: selectedBimester }),
    onSuccess: () => {
      toast({ title: 'Bimestre cerrado', description: 'Las notas ya no pueden ser modificadas.' })
      queryClient.invalidateQueries({ queryKey: ['course-grades', courseId, selectedBimester] })
    },
  })

  const reopenBimesterMutation = useMutation({
    mutationFn: () => gradesService.reopenBimester({ courseId, bimester: selectedBimester }),
    onSuccess: () => {
      toast({ title: 'Bimestre reabierto', description: 'Las notas pueden ser modificadas nuevamente.' })
      queryClient.invalidateQueries({ queryKey: ['course-grades', courseId, selectedBimester] })
    },
  })

  // Publish
  const publishMutation = useMutation({
    mutationFn: () => gradesService.publishBimester({ courseId, bimester: selectedBimester }),
    onSuccess: () => {
      toast({ title: 'Notas publicadas', description: 'Los padres seran notificados.' })
      queryClient.invalidateQueries({ queryKey: ['course-grades', courseId, selectedBimester] })
    },
  })

  // Save individual score
  const saveScoreMutation = useMutation({
    mutationFn: (data: { studentId: string; evaluationId: string; score: number }) =>
      gradesService.saveScore({
        studentId: data.studentId,
        courseId,
        evaluationId: data.evaluationId,
        bimester: selectedBimester,
        score: data.score,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-grades', courseId, selectedBimester] })
    },
  })

  const isClosed = bimesterStatus === 'cerrado' || bimesterStatus === 'publicado'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-1" />Volver
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{courseInfo.name}</h2>
          <p className="text-gray-500 text-sm">{courseInfo.gradeLevel} - Seccion {courseInfo.section}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusBadge(bimesterStatus)}>
            {bimesterStatus === 'abierto' ? 'Abierto' : bimesterStatus === 'cerrado' ? 'Cerrado' : 'Publicado'}
          </Badge>
          {bimesterStatus === 'abierto' && (
            <Button variant="outline" size="sm" onClick={() => closeBimesterMutation.mutate()} disabled={closeBimesterMutation.isPending}>
              <Lock className="w-4 h-4 mr-1" />Cerrar Bimestre
            </Button>
          )}
          {bimesterStatus === 'cerrado' && (
            <>
              <Button variant="outline" size="sm" onClick={() => reopenBimesterMutation.mutate()} disabled={reopenBimesterMutation.isPending}>
                <Unlock className="w-4 h-4 mr-1" />Reabrir
              </Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
                <CheckCircle2 className="w-4 h-4 mr-1" />Publicar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Bimester Tabs */}
      <div className="flex gap-2">
        {BIMESTERS.map((b) => (
          <Button
            key={b.value}
            variant={selectedBimester === b.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedBimester(b.value)}
          >
            {b.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Actions Bar */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <span className="text-sm text-gray-600">
                {evaluations.length} evaluacion(es) - {students.length} estudiante(s)
              </span>
              {!isClosed && (
                <Button size="sm" variant="outline" onClick={() => setShowNewEval(true)}>
                  <Plus className="w-4 h-4 mr-1" />Nueva Evaluacion
                </Button>
              )}
            </div>

            {/* New Evaluation Form */}
            {showNewEval && (
              <div className="p-4 border-b bg-blue-50 flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                  <Input
                    value={newEvalData.name}
                    onChange={(e) => setNewEvalData({ ...newEvalData, name: e.target.value })}
                    placeholder="Ej: Examen Parcial 1"
                    className="h-9"
                  />
                </div>
                <div className="w-40">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                  <select
                    value={newEvalData.type}
                    onChange={(e) => setNewEvalData({ ...newEvalData, type: e.target.value })}
                    className="w-full px-2 py-1.5 border rounded-md text-sm h-9"
                  >
                    {EVAL_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="w-20">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max</label>
                  <Input
                    type="number"
                    value={newEvalData.maxGrade}
                    onChange={(e) => setNewEvalData({ ...newEvalData, maxGrade: parseInt(e.target.value) || 20 })}
                    className="h-9 text-center"
                    min={1}
                    max={100}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => createEvalMutation.mutate(newEvalData)}
                  disabled={!newEvalData.name || createEvalMutation.isPending}
                  className="h-9"
                >
                  {createEvalMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Agregar'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowNewEval(false)} className="h-9">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Grades Table */}
            {evaluations.length === 0 && students.length === 0 ? (
              <div className="p-12 text-center">
                <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Sin evaluaciones</h3>
                <p className="text-gray-500 mb-4 text-sm">
                  No hay evaluaciones creadas para este bimestre.<br />
                  El docente puede crear evaluaciones desde la app movil, o puedes agregar una aqui.
                </p>
                {!isClosed && (
                  <Button variant="outline" onClick={() => setShowNewEval(true)}>
                    <Plus className="w-4 h-4 mr-2" />Crear Primera Evaluacion
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 font-medium text-gray-700 sticky left-0 bg-gray-50 min-w-[200px]">
                        Estudiante
                      </th>
                      {evaluations.map((ev) => {
                        const evalType = getEvalTypeInfo(ev.type)
                        return (
                          <th key={ev._id} className="text-center p-3 min-w-[100px]">
                            <div className="flex flex-col items-center gap-1">
                              <Badge className={`${evalType.color} text-[10px] px-1.5`}>{evalType.label}</Badge>
                              <span className="text-xs font-medium text-gray-700 truncate max-w-[90px]" title={ev.name}>{ev.name}</span>
                              {!isClosed && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Eliminar "${ev.name}"?`)) deleteEvalMutation.mutate(ev._id)
                                  }}
                                  className="text-gray-300 hover:text-red-500 transition-colors"
                                  title="Eliminar evaluacion"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </th>
                        )
                      })}
                      <th className="text-center p-3 font-semibold text-gray-700 bg-gray-100 min-w-[80px]">Prom.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((row) => (
                      <tr key={row.student._id} className="border-b hover:bg-gray-50">
                        <td className="p-3 sticky left-0 bg-white">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {row.student.firstName?.[0]}{row.student.lastName?.[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{row.student.lastName}, {row.student.firstName}</p>
                              <p className="text-xs text-gray-400">{row.student.enrollmentNumber}</p>
                            </div>
                          </div>
                        </td>
                        {evaluations.map((ev) => {
                          const scoreData = row.scores[ev._id]
                          const currentScore = scoreData?.score
                          return (
                            <td key={ev._id} className="p-2 text-center">
                              {isClosed ? (
                                <span className={`px-2 py-1 rounded text-sm font-medium ${currentScore != null ? getScoreColor(currentScore) : 'text-gray-300'}`}>
                                  {currentScore != null ? currentScore : '-'}
                                </span>
                              ) : (
                                <input
                                  type="number"
                                  min={0}
                                  max={ev.maxGrade}
                                  step={0.5}
                                  defaultValue={currentScore ?? ''}
                                  placeholder="-"
                                  onBlur={(e) => {
                                    const val = parseFloat(e.target.value)
                                    if (!isNaN(val) && val >= 0 && val <= ev.maxGrade) {
                                      if (val !== currentScore) {
                                        saveScoreMutation.mutate({
                                          studentId: row.student._id,
                                          evaluationId: ev._id,
                                          score: val,
                                        })
                                      }
                                    }
                                  }}
                                  className="w-16 px-1.5 py-1 text-center text-sm border rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                                />
                              )}
                            </td>
                          )
                        })}
                        <td className="p-3 text-center bg-gray-50">
                          <span className={`px-2 py-1 rounded-lg font-bold text-sm ${row.average > 0 ? getScoreColor(row.average) : 'text-gray-300'}`}>
                            {row.average > 0 ? row.average.toFixed(1) : '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============ MAIN GRADES PAGE ============

export default function GradesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<{ id: string; name: string } | null>(null)

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['grades-stats'],
    queryFn: async () => {
      const response = await api.get('/grades/stats')
      return response.data.data as GradeStats
    },
  })

  const { data: coursesData, isLoading: coursesLoading, error } = useQuery({
    queryKey: ['all-courses-for-grades'],
    queryFn: async () => {
      const res = await coursesService.getAll()
      return (res.data?.courses || []) as Array<{
        _id: string; name: string; code: string; gradeLevel: string; section: string;
        teacher: { firstName: string; lastName: string } | null;
        students: string[] | { _id: string }[];
        isActive: boolean;
      }>
    },
  })

  const { data: gradesByCourse } = useQuery({
    queryKey: ['grades-by-course'],
    queryFn: async () => {
      const response = await api.get('/grades/by-course')
      return response.data.data as CourseGrades[]
    },
  })

  const stats = statsData || { totalGrades: 0, avgScore: '0.0', passingRate: '0', excellentStudents: 0, uniqueStudents: 0, distribution: { AD: 0, A: 0, B: 0, C: 0 } }
  const allCourses = coursesData || []
  const courseGradesMap = useMemo(() => {
    const map: Record<string, CourseGrades> = {}
    ;(gradesByCourse || []).forEach(cg => { map[cg._id] = cg })
    return map
  }, [gradesByCourse])

  const courses = useMemo(() => allCourses.filter(c =>
    c.isActive && `${c.name} ${c.gradeLevel} ${c.teacher?.firstName || ''} ${c.teacher?.lastName || ''} ${c.code}`.toLowerCase().includes(searchTerm.toLowerCase())
  ), [allCourses, searchTerm])

  // If a course is selected, show the detail view
  if (selectedCourse) {
    return (
      <CourseGradeDetail
        courseId={selectedCourse.id}
        courseName={selectedCourse.name}
        onBack={() => setSelectedCourse(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calificaciones</h1>
          <p className="text-gray-500 mt-1">Sistema de evaluacion por bimestres</p>
        </div>
        <Button className="bg-sanmartin-primary hover:bg-sanmartin-primary-dark">
          <Download className="w-4 h-4 mr-2" />Exportar Todo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Calificaciones" value={stats.totalGrades} subtitle="Este ano academico" icon={FileSpreadsheet} color="bg-blue-500" loading={statsLoading} />
        <StatCard title="Promedio General" value={stats.avgScore} icon={BarChart3} color="bg-green-500" loading={statsLoading} />
        <StatCard title="Tasa de Aprobacion" value={`${stats.passingRate}%`} icon={Award} color="bg-purple-500" loading={statsLoading} />
        <StatCard title="Estudiantes Destacados" value={stats.excellentStudents} subtitle="Nota >= 17" icon={TrendingUp} color="bg-orange-500" loading={statsLoading} />
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>Error al cargar los datos. Por favor, intenta de nuevo.</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Buscar por curso, grado o docente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay cursos</h3>
            <p className="text-gray-500">
              {searchTerm ? 'No se encontraron cursos con los filtros.' : 'Aun no hay cursos registrados en el sistema.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => {
            const gradeInfo = courseGradesMap[course._id]
            const avgScore = gradeInfo?.averageScore || 0
            const passingRate = gradeInfo?.passingRate || 0
            const studentsCount = Array.isArray(course.students) ? course.students.length : 0
            const teacherName = course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : 'Sin docente'

            return (
              <Card key={course._id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCourse({ id: course._id, name: course.name })}>
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{course.name}</h3>
                        <p className="text-sm text-gray-500">{course.gradeLevel} - Seccion {course.section}</p>
                        <p className="text-xs text-gray-400">Prof. {teacherName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Alumnos</p>
                        <div className="flex items-center gap-1 justify-center">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-bold">{studentsCount}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Promedio</p>
                        <p className={`font-bold text-xl ${avgScore > 0 ? (avgScore >= 14 ? 'text-green-600' : avgScore >= 11 ? 'text-yellow-600' : 'text-red-600') : 'text-gray-300'}`}>
                          {avgScore > 0 ? avgScore.toFixed(1) : '-'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Aprobacion</p>
                        {passingRate > 0 ? (
                          <div className="flex items-center gap-1">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: `${passingRate}%` }} />
                            </div>
                            <span className="text-xs font-bold text-green-600">{passingRate}%</span>
                          </div>
                        ) : (
                          <span className="text-gray-300 font-bold">-</span>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedCourse({ id: course._id, name: course.name }) }}>
                        <Eye className="w-4 h-4 mr-1" />Ver Notas
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
