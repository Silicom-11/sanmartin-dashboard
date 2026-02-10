import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Search, BookOpen, Users, Clock, Calendar, GraduationCap,
  Eye, Edit, X, AlertCircle, Loader2, Trash2, UserPlus, UserMinus,
  Save, BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { coursesService, teachersService, studentsManagementService } from '@/services/api'

// ============ TYPES ============

interface Teacher {
  _id: string
  firstName: string
  lastName: string
  email: string
  specialty?: string
}

interface StudentItem {
  _id: string
  firstName: string
  lastName: string
  dni?: string
  email?: string
  gradeLevel?: string
  section?: string
  enrollmentNumber?: string
  studentCode?: string
}

interface ScheduleItem {
  day: string
  startTime: string
  endTime: string
  classroom?: string
}

interface Course {
  _id: string
  name: string
  code: string
  description?: string
  gradeLevel: string
  section: string
  teacher: { _id: string; firstName: string; lastName: string; email: string } | null
  students: string[] | StudentItem[]
  schedule: ScheduleItem[]
  evaluationWeights: { exams: number; tasks: number; participation: number; projects: number }
  academicYear: number
  period: string
  isActive: boolean
  studentCount?: number
}

interface CourseFormData {
  name: string
  code: string
  description: string
  gradeLevel: string
  section: string
  teacherId: string
  period: string
  schedule: ScheduleItem[]
  evaluationWeights: { exams: number; tasks: number; participation: number; projects: number }
}

// ============ CONSTANTS ============

const GRADE_LEVELS = [
  '1º Primaria', '2º Primaria', '3º Primaria', '4º Primaria', '5º Primaria', '6º Primaria',
  '1º Secundaria', '2º Secundaria', '3º Secundaria', '4º Secundaria', '5º Secundaria'
]

const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F']
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const PERIODS = ['Anual', 'Primer Trimestre', 'Segundo Trimestre', 'Tercer Trimestre']

const SUBJECT_PRESETS: Record<string, { code: string; color: string }> = {
  'Matemáticas': { code: 'MAT', color: '#3B82F6' },
  'Comunicación': { code: 'COM', color: '#10B981' },
  'Ciencias Naturales': { code: 'CIE', color: '#8B5CF6' },
  'Ciencia y Tecnología': { code: 'CTA', color: '#8B5CF6' },
  'Historia': { code: 'HIS', color: '#F59E0B' },
  'Personal Social': { code: 'PSO', color: '#F59E0B' },
  'Inglés': { code: 'ING', color: '#EC4899' },
  'Arte y Cultura': { code: 'ART', color: '#6366F1' },
  'Educación Física': { code: 'EDF', color: '#14B8A6' },
  'Religión': { code: 'REL', color: '#F97316' },
  'Computación': { code: 'CMP', color: '#06B6D4' },
  'Educación para el Trabajo': { code: 'EPT', color: '#84CC16' },
  'Tutoría': { code: 'TUT', color: '#A855F7' },
}

const courseColors: Record<string, string> = {
  MAT: '#3B82F6', COM: '#10B981', CTA: '#8B5CF6', CIE: '#8B5CF6',
  HIS: '#F59E0B', PSO: '#F59E0B', ING: '#EC4899', ART: '#6366F1',
  EDF: '#14B8A6', REL: '#F97316', EPT: '#84CC16', TUT: '#A855F7',
  CMP: '#06B6D4', default: '#6B7280',
}

const getCodePrefix = (code: string) => code?.split('-')[0] || ''

const DEFAULT_WEIGHTS = { exams: 40, tasks: 30, participation: 10, projects: 20 }

const EMPTY_FORM: CourseFormData = {
  name: '',
  code: '',
  description: '',
  gradeLevel: '',
  section: 'A',
  teacherId: '',
  period: 'Anual',
  schedule: [],
  evaluationWeights: { ...DEFAULT_WEIGHTS },
}

// ============ STAT CARD ============

function StatCard({ title, value, icon: Icon, color, loading }: {
  title: string; value: string | number; icon: React.ElementType; color: string; loading?: boolean
}) {
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
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============ SCHEDULE EDITOR ============

function ScheduleEditor({ schedule, onChange, disabled }: {
  schedule: ScheduleItem[]; onChange: (s: ScheduleItem[]) => void; disabled?: boolean
}) {
  const addSlot = () => {
    onChange([...schedule, { day: 'Lunes', startTime: '08:00', endTime: '09:30', classroom: '' }])
  }

  const removeSlot = (index: number) => {
    onChange(schedule.filter((_, i) => i !== index))
  }

  const updateSlot = (index: number, field: keyof ScheduleItem, value: string) => {
    const updated = [...schedule]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {schedule.map((slot, i) => (
        <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <select
            value={slot.day}
            onChange={(e) => updateSlot(i, 'day', e.target.value)}
            className="px-2 py-1.5 border rounded-md text-sm flex-shrink-0"
            disabled={disabled}
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <Input
            type="time"
            value={slot.startTime}
            onChange={(e) => updateSlot(i, 'startTime', e.target.value)}
            className="w-28"
            disabled={disabled}
          />
          <span className="text-gray-400 text-sm">a</span>
          <Input
            type="time"
            value={slot.endTime}
            onChange={(e) => updateSlot(i, 'endTime', e.target.value)}
            className="w-28"
            disabled={disabled}
          />
          <Input
            placeholder="Aula"
            value={slot.classroom || ''}
            onChange={(e) => updateSlot(i, 'classroom', e.target.value)}
            className="w-28"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => removeSlot(i)}
            disabled={disabled}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addSlot} disabled={disabled}>
        <Plus className="w-4 h-4 mr-1" /> Agregar Horario
      </Button>
    </div>
  )
}

// ============ WEIGHTS EDITOR ============

function WeightsEditor({ weights, onChange, disabled }: {
  weights: { exams: number; tasks: number; participation: number; projects: number }
  onChange: (w: typeof weights) => void
  disabled?: boolean
}) {
  const total = weights.exams + weights.tasks + weights.participation + weights.projects
  const isValid = total === 100

  const update = (key: keyof typeof weights, val: string) => {
    const num = Math.max(0, Math.min(100, parseInt(val) || 0))
    onChange({ ...weights, [key]: num })
  }

  const labels = [
    { key: 'exams' as const, label: 'Exámenes', bg: 'bg-blue-50' },
    { key: 'tasks' as const, label: 'Tareas', bg: 'bg-green-50' },
    { key: 'participation' as const, label: 'Participación', bg: 'bg-purple-50' },
    { key: 'projects' as const, label: 'Proyectos', bg: 'bg-orange-50' },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {labels.map(({ key, label, bg }) => (
          <div key={key} className={`p-3 ${bg} rounded-lg`}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                max={100}
                value={weights[key]}
                onChange={(e) => update(key, e.target.value)}
                className="w-full text-center"
                disabled={disabled}
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>
        ))}
      </div>
      <div className={`text-sm text-center font-medium px-3 py-1.5 rounded-lg ${
        isValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
      }`}>
        Total: {total}% {isValid ? '✓' : '(debe sumar 100%)'}
      </div>
    </div>
  )
}

// ============ COURSE FORM MODAL ============

function CourseFormModal({ course, onClose, onSave, isLoading }: {
  course?: Course | null
  onClose: () => void
  onSave: (data: CourseFormData) => void
  isLoading?: boolean
}) {
  const isEditing = !!course

  const [formData, setFormData] = useState<CourseFormData>(() => {
    if (course) {
      return {
        name: course.name,
        code: course.code,
        description: course.description || '',
        gradeLevel: course.gradeLevel,
        section: course.section,
        teacherId: course.teacher?._id || '',
        period: course.period || 'Anual',
        schedule: course.schedule || [],
        evaluationWeights: course.evaluationWeights || { ...DEFAULT_WEIGHTS },
      }
    }
    return { ...EMPTY_FORM }
  })

  const [activeTab, setActiveTab] = useState<'general' | 'schedule' | 'evaluation'>('general')

  // Load available teachers
  const { data: teachersData } = useQuery({
    queryKey: ['teachers-for-courses'],
    queryFn: async () => {
      const res = await teachersService.getAll({ limit: 100 })
      return res.data?.teachers || res.data || []
    },
  })

  const teachers: Teacher[] = useMemo(() => {
    if (Array.isArray(teachersData)) return teachersData
    return []
  }, [teachersData])

  // Auto-generate code
  useEffect(() => {
    if (!isEditing && formData.name && formData.gradeLevel) {
      const preset = SUBJECT_PRESETS[formData.name]
      const prefix = preset?.code || formData.name.substring(0, 3).toUpperCase()
      const gradeMatch = formData.gradeLevel.match(/(\d+)º\s*(Primaria|Secundaria)/)
      if (gradeMatch) {
        const gradeNum = gradeMatch[1]
        const level = gradeMatch[2] === 'Primaria' ? 'P' : 'S'
        setFormData((prev) => ({ ...prev, code: `${prefix}-${gradeNum}${level}-${prev.section}` }))
      }
    }
  }, [formData.name, formData.gradeLevel, formData.section, isEditing])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const total =
      formData.evaluationWeights.exams +
      formData.evaluationWeights.tasks +
      formData.evaluationWeights.participation +
      formData.evaluationWeights.projects
    if (total !== 100) {
      alert('Los pesos de evaluación deben sumar 100%')
      return
    }
    onSave(formData)
  }

  const subjectNames = Object.keys(SUBJECT_PRESETS)

  const tabs = [
    { id: 'general' as const, label: 'General', icon: BookOpen },
    { id: 'schedule' as const, label: 'Horario', icon: Calendar },
    { id: 'evaluation' as const, label: 'Evaluación', icon: BarChart3 },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">
              {isEditing ? 'Editar Curso' : 'Nuevo Curso'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isEditing
                ? 'Actualizar información del curso'
                : 'Complete los datos para crear un nuevo curso'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" disabled={isLoading}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* TAB: General */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asignatura / Nombre del Curso *
                  </label>
                  <select
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={isLoading}
                  >
                    <option value="">Seleccionar asignatura</option>
                    {subjectNames.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grado *</label>
                    <select
                      value={formData.gradeLevel}
                      onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={isLoading}
                    >
                      <option value="">Seleccionar grado</option>
                      {GRADE_LEVELS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sección *</label>
                    <select
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={isLoading}
                    >
                      {SECTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Se genera automáticamente"
                    disabled={isLoading}
                    className="uppercase font-mono"
                  />
                  <p className="text-xs text-gray-400 mt-1">Se genera automáticamente al seleccionar asignatura y grado</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Docente Asignado</label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  >
                    <option value="">Sin docente asignado</option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.firstName} {t.lastName}{t.specialty ? ` (${t.specialty})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  >
                    {PERIODS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                    placeholder="Descripción opcional del curso"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* TAB: Horario */}
            {activeTab === 'schedule' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <Calendar className="w-5 h-5" />
                  <h3 className="font-medium">Horario Semanal</h3>
                </div>
                <p className="text-sm text-gray-500">
                  Define los bloques horarios semanales para este curso.
                </p>
                <ScheduleEditor
                  schedule={formData.schedule}
                  onChange={(s) => setFormData({ ...formData, schedule: s })}
                  disabled={isLoading}
                />
                {formData.schedule.length > 0 && (
                  <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
                    <span className="font-medium text-blue-700">
                      {formData.schedule.length} bloque(s)
                    </span>{' '}
                    ≈{' '}
                    <span className="font-medium text-blue-700">
                      {formData.schedule
                        .reduce((acc, s) => {
                          const [sh, sm] = s.startTime.split(':').map(Number)
                          const [eh, em] = s.endTime.split(':').map(Number)
                          return acc + (eh * 60 + em - sh * 60 - sm) / 60
                        }, 0)
                        .toFixed(1)}
                    </span>{' '}
                    horas/semana
                  </div>
                )}
              </div>
            )}

            {/* TAB: Evaluación */}
            {activeTab === 'evaluation' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <BarChart3 className="w-5 h-5" />
                  <h3 className="font-medium">Pesos de Evaluación</h3>
                </div>
                <p className="text-sm text-gray-500">
                  Define el porcentaje de cada tipo de evaluación. Deben sumar 100%.
                </p>
                <WeightsEditor
                  weights={formData.evaluationWeights}
                  onChange={(w) => setFormData({ ...formData, evaluationWeights: w })}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50 rounded-b-2xl">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> {isEditing ? 'Guardar Cambios' : 'Crear Curso'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============ COURSE DETAIL MODAL ============

function CourseDetailModal({ courseId, onClose, onEdit, onDelete }: {
  courseId: string
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showStudentSearch, setShowStudentSearch] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Load full course details
  const { data: courseData, isLoading } = useQuery({
    queryKey: ['course-detail', courseId],
    queryFn: async () => {
      const res = await coursesService.getById(courseId)
      return res.data?.course || res.data
    },
  })

  // Load enrolled students
  const { data: courseStudents, refetch: refetchStudents } = useQuery({
    queryKey: ['course-students', courseId],
    queryFn: async () => {
      try {
        const res = await coursesService.getById(courseId)
        const data = res.data?.course || res.data
        return data?.students || []
      } catch {
        return []
      }
    },
  })

  // Search students to add
  const { data: searchResults } = useQuery({
    queryKey: ['search-students-for-course', studentSearch],
    queryFn: async () => {
      if (studentSearch.length < 2) return []
      const res = await studentsManagementService.getAll({ search: studentSearch, limit: 10 })
      return res.data?.students || []
    },
    enabled: studentSearch.length >= 2,
  })

  // Add student mutation
  const addStudentMutation = useMutation({
    mutationFn: (studentId: string) => coursesService.addStudent(courseId, [studentId]),
    onSuccess: () => {
      toast({ title: 'Estudiante agregado', description: 'El estudiante fue agregado al curso exitosamente.' })
      refetchStudents()
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['courses-stats'] })
      queryClient.invalidateQueries({ queryKey: ['course-detail', courseId] })
      setStudentSearch('')
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  // Remove student mutation
  const removeStudentMutation = useMutation({
    mutationFn: (studentId: string) => coursesService.removeStudent(courseId, studentId),
    onSuccess: () => {
      toast({ title: 'Estudiante removido', description: 'El estudiante fue removido del curso.' })
      refetchStudents()
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['courses-stats'] })
      queryClient.invalidateQueries({ queryKey: ['course-detail', courseId] })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const course: Course | null = courseData || null
  const students: StudentItem[] = (courseStudents || []).filter(
    (s: StudentItem | string) => typeof s === 'object' && s !== null
  )

  // Filter out already enrolled students from search
  const existingStudentIds = new Set(students.map((s) => s._id))
  const filteredSearchResults = (searchResults || []).filter(
    (s: StudentItem) => !existingStudentIds.has(s._id)
  )

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-500 mt-3">Cargando curso...</p>
        </div>
      </div>
    )
  }

  if (!course) return null

  const color = courseColors[getCodePrefix(course.code)] || courseColors.default
  const totalHours =
    course.schedule?.reduce((acc, s) => {
      const [sh, sm] = s.startTime.split(':').map(Number)
      const [eh, em] = s.endTime.split(':').map(Number)
      return acc + (eh * 60 + em - sh * 60 - sm) / 60
    }, 0) || 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg"
              style={{ backgroundColor: color }}
            >
              {getCodePrefix(course.code)}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{course.name}</h2>
              <p className="text-gray-500">
                {course.gradeLevel} - Sección {course.section}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={course.isActive ? 'default' : 'secondary'}>
              {course.isActive ? 'Activo' : 'Inactivo'}
            </Badge>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl text-center">
              <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-700">{students.length}</p>
              <p className="text-xs text-gray-500">Estudiantes</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl text-center">
              <Clock className="w-6 h-6 text-purple-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-purple-700">{totalHours.toFixed(1)}</p>
              <p className="text-xs text-gray-500">Hrs/Semana</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl text-center">
              <Calendar className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-700">{course.schedule?.length || 0}</p>
              <p className="text-xs text-gray-500">Bloques</p>
            </div>
          </div>

          {/* Teacher */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <GraduationCap className="w-5 h-5" /> Docente Asignado
            </h4>
            {course.teacher ? (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {course.teacher.firstName?.[0]}
                  {course.teacher.lastName?.[0]}
                </div>
                <div>
                  <p className="font-medium">
                    {course.teacher.firstName} {course.teacher.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{course.teacher.email}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                No hay docente asignado. Edita el curso para asignar uno.
              </div>
            )}
          </div>

          {/* Schedule */}
          {course.schedule && course.schedule.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Horario
              </h4>
              <div className="space-y-2">
                {course.schedule.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm w-24">{s.day}</span>
                      <Badge variant="outline">
                        {s.startTime} - {s.endTime}
                      </Badge>
                    </div>
                    {s.classroom && (
                      <span className="text-sm text-gray-500">{s.classroom}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evaluation Weights */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" /> Pesos de Evaluación
            </h4>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Exámenes', value: course.evaluationWeights?.exams, bg: 'bg-blue-50', text: 'text-blue-600' },
                { label: 'Tareas', value: course.evaluationWeights?.tasks, bg: 'bg-green-50', text: 'text-green-600' },
                { label: 'Participación', value: course.evaluationWeights?.participation, bg: 'bg-purple-50', text: 'text-purple-600' },
                { label: 'Proyectos', value: course.evaluationWeights?.projects, bg: 'bg-orange-50', text: 'text-orange-600' },
              ].map(({ label, value, bg, text }) => (
                <div key={label} className={`text-center p-3 ${bg} rounded-lg`}>
                  <p className={`text-lg font-bold ${text}`}>{value || 0}%</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Students Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" /> Estudiantes ({students.length})
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowStudentSearch(!showStudentSearch)}
              >
                <UserPlus className="w-4 h-4 mr-1" /> Agregar
              </Button>
            </div>

            {/* Student Search Panel */}
            {showStudentSearch && (
              <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  Buscar estudiante para agregar:
                </label>
                <Input
                  placeholder="Nombre, apellido o DNI..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="mb-2"
                />
                {filteredSearchResults.length > 0 && (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {filteredSearchResults.map((s: StudentItem) => (
                      <div
                        key={s._id}
                        className="flex items-center justify-between p-2 bg-white rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <span className="font-medium text-sm">
                            {s.firstName} {s.lastName}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {s.gradeLevel} {s.section}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addStudentMutation.mutate(s._id)}
                          disabled={addStudentMutation.isPending}
                        >
                          {addStudentMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Plus className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {studentSearch.length >= 2 && filteredSearchResults.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    No se encontraron estudiantes para agregar.
                  </p>
                )}
              </div>
            )}

            {/* Enrolled Students List */}
            {students.length > 0 ? (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {students.map((s: StudentItem) => (
                  <div
                    key={s._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {s.firstName?.[0]}
                        {s.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {s.firstName} {s.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {s.dni && `DNI: ${s.dni}`}
                          {s.enrollmentNumber && ` • ${s.enrollmentNumber}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`¿Remover a ${s.firstName} ${s.lastName} del curso?`)) {
                          removeStudentMutation.mutate(s._id)
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-opacity"
                      title="Remover del curso"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No hay estudiantes en este curso</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50 rounded-b-2xl sticky bottom-0">
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Desactivar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" /> Editar Curso
            </Button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">¿Desactivar curso?</h3>
                  <p className="text-sm text-gray-500">
                    El curso <strong>{course.name}</strong> será desactivado. Los datos no se
                    eliminarán.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancelar
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    onDelete()
                  }}
                >
                  Sí, Desactivar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============ MAIN COURSES PAGE ============

export default function CoursesPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('Todos')
  const [showFormModal, setShowFormModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  // Load stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['courses-stats'],
    queryFn: async () => {
      const res = await coursesService.getAll()
      const courses: Course[] = res.data?.courses || []
      const active = courses.filter((c) => c.isActive)
      const totalStudents = courses.reduce(
        (sum, c) => sum + (c.students?.length || c.studentCount || 0),
        0
      )
      return {
        totalCourses: courses.length,
        activeCourses: active.length,
        totalStudents,
        avgStudentsPerCourse: active.length > 0 ? Math.round(totalStudents / active.length) : 0,
      }
    },
    staleTime: 30000,
  })

  // Load courses
  const {
    data: coursesData,
    isLoading: coursesLoading,
    error,
  } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await coursesService.getAll()
      return (res.data?.courses || []) as Course[]
    },
  })

  // Create course mutation
  const createMutation = useMutation({
    mutationFn: (data: CourseFormData) =>
      coursesService.create({
        name: data.name,
        code: data.code,
        description: data.description || undefined,
        gradeLevel: data.gradeLevel,
        section: data.section,
        teacherId: data.teacherId || undefined as unknown as string,
        schedule: data.schedule.length > 0 ? data.schedule : undefined,
      }),
    onSuccess: () => {
      toast({ title: 'Curso creado', description: 'El curso fue registrado exitosamente.' })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['courses-stats'] })
      setShowFormModal(false)
    },
    onError: (error: Error) => {
      toast({ title: 'Error al crear curso', description: error.message, variant: 'destructive' })
    },
  })

  // Update course mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CourseFormData }) =>
      coursesService.update(id, {
        name: data.name,
        code: data.code,
        description: data.description,
        gradeLevel: data.gradeLevel,
        section: data.section,
        teacherId: data.teacherId || undefined,
        schedule: data.schedule,
      }),
    onSuccess: () => {
      toast({ title: 'Curso actualizado', description: 'Los cambios fueron guardados exitosamente.' })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['courses-stats'] })
      queryClient.invalidateQueries({ queryKey: ['course-detail'] })
      setShowFormModal(false)
      setEditingCourse(null)
    },
    onError: (error: Error) => {
      toast({ title: 'Error al actualizar', description: error.message, variant: 'destructive' })
    },
  })

  // Delete (deactivate) course mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => coursesService.delete(id),
    onSuccess: () => {
      toast({ title: 'Curso desactivado', description: 'El curso fue desactivado correctamente.' })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['courses-stats'] })
      setShowDetailModal(false)
      setSelectedCourseId(null)
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const stats = statsData || {
    totalCourses: 0,
    activeCourses: 0,
    totalStudents: 0,
    avgStudentsPerCourse: 0,
  }
  const allCourses = coursesData || []

  // Filtering
  const courses = useMemo(
    () =>
      allCourses.filter((c) => {
        const text =
          `${c.name} ${c.gradeLevel} ${c.teacher?.firstName || ''} ${c.teacher?.lastName || ''} ${c.code}`.toLowerCase()
        const matchesSearch = text.includes(searchTerm.toLowerCase())
        const matchesGrade =
          selectedGradeLevel === 'Todos' || c.gradeLevel === selectedGradeLevel
        return matchesSearch && matchesGrade
      }),
    [allCourses, searchTerm, selectedGradeLevel]
  )

  const handleSave = (data: CourseFormData) => {
    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse._id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const openCreate = () => {
    setEditingCourse(null)
    setShowFormModal(true)
  }

  const openEdit = (course: Course) => {
    setEditingCourse(course)
    setShowDetailModal(false)
    setShowFormModal(true)
  }

  const openDetail = (courseId: string) => {
    setSelectedCourseId(courseId)
    setShowDetailModal(true)
  }

  const gradeLevelOptions = ['Todos', ...GRADE_LEVELS]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cursos</h1>
          <p className="text-gray-500 mt-1">Gestión de cursos y secciones académicas</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Curso
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Cursos" value={stats.totalCourses} icon={BookOpen} color="bg-blue-500" loading={statsLoading} />
        <StatCard title="Cursos Activos" value={stats.activeCourses} icon={Calendar} color="bg-green-500" loading={statsLoading} />
        <StatCard title="Total Estudiantes" value={stats.totalStudents} icon={Users} color="bg-purple-500" loading={statsLoading} />
        <StatCard title="Prom. Alumnos/Curso" value={stats.avgStudentsPerCourse} icon={GraduationCap} color="bg-orange-500" loading={statsLoading} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar cursos por nombre, grado o docente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedGradeLevel}
              onChange={(e) => setSelectedGradeLevel(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {gradeLevelOptions.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>Error al cargar los cursos. Verifica tu conexión e intenta de nuevo.</span>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {coursesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        /* Empty State */
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || selectedGradeLevel !== 'Todos'
                ? 'Sin resultados'
                : 'No hay cursos registrados'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchTerm || selectedGradeLevel !== 'Todos'
                ? 'No se encontraron cursos con los filtros seleccionados. Intenta cambiar los criterios de búsqueda.'
                : 'Comienza creando el primer curso para empezar a gestionar la oferta académica.'}
            </p>
            {!searchTerm && selectedGradeLevel === 'Todos' && (
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" /> Crear Primer Curso
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Course Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => {
            const color = courseColors[getCodePrefix(course.code)] || courseColors.default
            const studentCount = course.students?.length || course.studentCount || 0
            const hoursPerWeek =
              course.schedule?.reduce((acc, s) => {
                const [sh, sm] = s.startTime.split(':').map(Number)
                const [eh, em] = s.endTime.split(':').map(Number)
                return acc + (eh * 60 + em - sh * 60 - sm) / 60
              }, 0) || 0

            return (
              <Card key={course._id} className="hover:shadow-lg transition-all duration-200 group">
                <CardContent className="p-6">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md"
                        style={{ backgroundColor: color }}
                      >
                        {getCodePrefix(course.code)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{course.name}</h3>
                        <p className="text-sm text-gray-500">
                          {course.gradeLevel} – Sección {course.section}
                        </p>
                      </div>
                    </div>
                    <Badge variant={course.isActive ? 'default' : 'secondary'} className="text-xs">
                      {course.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>

                  {/* Card Info */}
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {course.teacher ? (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">
                          {course.teacher.firstName} {course.teacher.lastName}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs">Sin docente asignado</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>
                        {studentCount} estudiante{studentCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>
                        {hoursPerWeek > 0
                          ? `${hoursPerWeek.toFixed(0)} hrs/semana`
                          : 'Sin horario'}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openDetail(course._id)}
                    >
                      <Eye className="w-4 h-4 mr-1" /> Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEdit(course)}
                    >
                      <Edit className="w-4 h-4 mr-1" /> Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Count Footer */}
      {!coursesLoading && courses.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Mostrando {courses.length} de {allCourses.length} curso
          {allCourses.length !== 1 ? 's' : ''}
          {(searchTerm || selectedGradeLevel !== 'Todos') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedGradeLevel('Todos')
              }}
              className="ml-2 text-blue-600 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showFormModal && (
        <CourseFormModal
          course={editingCourse}
          onClose={() => {
            setShowFormModal(false)
            setEditingCourse(null)
          }}
          onSave={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedCourseId && (
        <CourseDetailModal
          courseId={selectedCourseId}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedCourseId(null)
          }}
          onEdit={() => {
            const course = allCourses.find((c) => c._id === selectedCourseId)
            if (course) openEdit(course)
          }}
          onDelete={() => {
            if (selectedCourseId) deleteMutation.mutate(selectedCourseId)
          }}
        />
      )}
    </div>
  )
}
