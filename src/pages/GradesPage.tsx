import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, FileSpreadsheet, TrendingUp, Award, Users, BookOpen,
  Download, Eye, BarChart3, X, AlertCircle, Lock, Unlock, Plus, ChevronLeft,
  Loader2, CheckCircle2, Scale, Info, AlertTriangle, Shield
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
  { value: 'examen', label: 'Examen', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  { value: 'tarea', label: 'Tarea', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  { value: 'practica', label: 'Práctica', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  { value: 'proyecto', label: 'Proyecto', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  { value: 'participacion', label: 'Participación', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  { value: 'exposicion', label: 'Exposición', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  { value: 'otro', label: 'Otro', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' },
]

function getScoreColor(score: number) {
  if (score >= 17) return 'text-green-600 bg-green-50'
  if (score >= 14) return 'text-blue-600 bg-blue-50'
  if (score >= 11) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

function getScoreLabel(score: number) {
  if (score >= 17) return 'AD'
  if (score >= 14) return 'A'
  if (score >= 11) return 'B'
  return 'C'
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

function StatCard({ title, value, subtitle, icon: IconComp, color, loading }: {
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
          <div className={`p-3 rounded-xl ${color}`}><IconComp className="w-6 h-6 text-white" /></div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============ WEIGHTED AVERAGE CALCULATOR ============

function calculateWeightedAverage(
  scores: Record<string, { score: number; comments?: string }>,
  evaluations: EvaluationItem[]
): number {
  let weightedSum = 0
  let totalWeight = 0

  evaluations.forEach(ev => {
    const scoreData = scores[ev._id]
    if (scoreData?.score != null) {
      const weight = ev.weight || 1
      const maxGrade = ev.maxGrade || 20
      // Normalize to 0-20 scale if maxGrade differs
      const normalized = maxGrade !== 20 ? (scoreData.score / maxGrade) * 20 : scoreData.score
      weightedSum += normalized * weight
      totalWeight += weight
    }
  })

  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0
}

// ============ COURSE GRADE DETAIL (BIMESTER VIEW) ============

function CourseGradeDetail({ courseId, courseName, onBack }: {
  courseId: string; courseName: string; onBack: () => void
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedBimester, setSelectedBimester] = useState(1)
  const [showNewEval, setShowNewEval] = useState(false)
  const [newEvalData, setNewEvalData] = useState({ name: '', type: 'tarea', maxGrade: 20, weight: 1 })
  const [closeStep, setCloseStep] = useState(0)

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

  const totalWeight = evaluations.reduce((sum, ev) => sum + (ev.weight || 1), 0)

  // Class stats
  const classStats = useMemo(() => {
    let totalAvg = 0, count = 0, passing = 0, excellent = 0
    students.forEach(row => {
      const avg = calculateWeightedAverage(row.scores, evaluations)
      if (avg > 0) {
        totalAvg += avg
        count++
        if (avg >= 11) passing++
        if (avg >= 17) excellent++
      }
    })
    return {
      classAvg: count > 0 ? (totalAvg / count).toFixed(1) : '-',
      passingRate: count > 0 ? Math.round((passing / count) * 100) : 0,
      excellentCount: excellent,
      gradedCount: count,
    }
  }, [students, evaluations])

  // Create evaluation mutation
  const createEvalMutation = useMutation({
    mutationFn: (data: { name: string; type: string; maxGrade: number; weight: number }) =>
      evaluationsService.create({
        courseId,
        name: data.name,
        type: data.type as 'examen',
        bimester: selectedBimester,
        maxGrade: data.maxGrade,
        weight: data.weight,
      }),
    onSuccess: () => {
      toast({ title: 'Evaluación creada', description: 'La columna de notas fue agregada.' })
      queryClient.invalidateQueries({ queryKey: ['course-grades', courseId, selectedBimester] })
      setShowNewEval(false)
      setNewEvalData({ name: '', type: 'tarea', maxGrade: 20, weight: 1 })
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    },
  })

  // Delete evaluation mutation
  const deleteEvalMutation = useMutation({
    mutationFn: (evalId: string) => evaluationsService.delete(evalId),
    onSuccess: () => {
      toast({ title: 'Evaluación eliminada' })
      queryClient.invalidateQueries({ queryKey: ['course-grades', courseId, selectedBimester] })
    },
  })

  // Close bimester (triple confirm step 3)
  const closeBimesterMutation = useMutation({
    mutationFn: () => gradesService.closeBimester({ courseId, bimester: selectedBimester }),
    onSuccess: () => {
      toast({ title: 'Bimestre cerrado', description: 'Las notas ya no pueden ser modificadas.' })
      queryClient.invalidateQueries({ queryKey: ['course-grades', courseId, selectedBimester] })
      setCloseStep(0)
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
      setCloseStep(0)
    },
  })

  // Reopen
  const reopenBimesterMutation = useMutation({
    mutationFn: () => gradesService.reopenBimester({ courseId, bimester: selectedBimester }),
    onSuccess: () => {
      toast({ title: 'Bimestre reabierto' })
      queryClient.invalidateQueries({ queryKey: ['course-grades', courseId, selectedBimester] })
    },
  })

  // Publish
  const publishMutation = useMutation({
    mutationFn: () => gradesService.publishBimester({ courseId, bimester: selectedBimester }),
    onSuccess: () => {
      toast({ title: 'Notas publicadas', description: 'Los padres y estudiantes pueden ver las notas.' })
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
          <p className="text-gray-500 text-sm">{courseInfo.gradeLevel} - Sección {courseInfo.section}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusBadge(bimesterStatus)}>
            {bimesterStatus === 'abierto' ? '🟢 Abierto' : bimesterStatus === 'cerrado' ? '🔒 Cerrado' : '📢 Publicado'}
          </Badge>
          {bimesterStatus === 'abierto' && (
            <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setCloseStep(1)}>
              <Lock className="w-4 h-4 mr-1" />Cerrar Bimestre
            </Button>
          )}
          {bimesterStatus === 'cerrado' && (
            <>
              <Button variant="outline" size="sm" onClick={() => reopenBimesterMutation.mutate()} disabled={reopenBimesterMutation.isPending}>
                <Unlock className="w-4 h-4 mr-1" />Reabrir
              </Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
                <CheckCircle2 className="w-4 h-4 mr-1" />Publicar Notas
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

      {/* Class Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 font-medium">Promedio Clase</p>
            <p className={`text-2xl font-bold mt-1 ${classStats.classAvg !== '-' ? (parseFloat(classStats.classAvg) >= 14 ? 'text-green-600' : parseFloat(classStats.classAvg) >= 11 ? 'text-yellow-600' : 'text-red-600') : 'text-gray-300'}`}>
              {classStats.classAvg}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 font-medium">Aprobación</p>
            <p className="text-2xl font-bold mt-1 text-green-600">{classStats.passingRate}%</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 font-medium">Destacados (AD)</p>
            <p className="text-2xl font-bold mt-1 text-purple-600">{classStats.excellentCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 font-medium">Peso Total</p>
            <p className="text-2xl font-bold mt-1 text-orange-600">{totalWeight}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Actions Bar */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 font-medium">
                  {evaluations.length} evaluación(es) · {students.length} estudiante(s)
                </span>
              </div>
              {!isClosed && (
                <Button size="sm" variant="outline" onClick={() => setShowNewEval(true)}>
                  <Plus className="w-4 h-4 mr-1" />Nueva Evaluación
                </Button>
              )}
            </div>

            {/* Evaluations weight breakdown */}
            {evaluations.length > 0 && (
              <div className="p-4 border-b bg-blue-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <Scale className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">Distribución de pesos</span>
                  <span className="text-xs text-blue-500 ml-auto">Peso total: {totalWeight}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {evaluations.map(ev => {
                    const evalType = getEvalTypeInfo(ev.type)
                    const pct = totalWeight > 0 ? Math.round(((ev.weight || 1) / totalWeight) * 100) : 0
                    return (
                      <div key={ev._id} className="flex items-center gap-1.5 bg-white rounded-lg px-3 py-1.5 border border-blue-100 shadow-sm">
                        <div className={`w-2 h-2 rounded-full ${evalType.dot}`} />
                        <span className="text-xs font-medium text-gray-700 truncate max-w-[100px]" title={ev.name}>{ev.name}</span>
                        <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5">{ev.weight || 1}x</Badge>
                        <span className="text-xs text-gray-400">({pct}%)</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* New Evaluation Form */}
            {showNewEval && (
              <div className="p-4 border-b bg-green-50 space-y-3">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                    <Input value={newEvalData.name} onChange={(e) => setNewEvalData({ ...newEvalData, name: e.target.value })} placeholder="Ej: Examen Parcial 1" className="h-9" />
                  </div>
                  <div className="w-36">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                    <select value={newEvalData.type} onChange={(e) => setNewEvalData({ ...newEvalData, type: e.target.value })} className="w-full px-2 py-1.5 border rounded-md text-sm h-9">
                      {EVAL_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                    </select>
                  </div>
                  <div className="w-20">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Peso</label>
                    <select value={newEvalData.weight} onChange={(e) => setNewEvalData({ ...newEvalData, weight: parseInt(e.target.value) || 1 })} className="w-full px-2 py-1.5 border rounded-md text-sm h-9">
                      <option value={1}>1x Normal</option>
                      <option value={2}>2x Doble</option>
                      <option value={3}>3x Triple</option>
                    </select>
                  </div>
                  <div className="w-20">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Máx</label>
                    <Input type="number" value={newEvalData.maxGrade} onChange={(e) => setNewEvalData({ ...newEvalData, maxGrade: parseInt(e.target.value) || 20 })} className="h-9 text-center" min={1} max={100} />
                  </div>
                  <Button size="sm" onClick={() => createEvalMutation.mutate(newEvalData)} disabled={!newEvalData.name || createEvalMutation.isPending} className="h-9">
                    {createEvalMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Agregar'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewEval(false)} className="h-9">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-start gap-2 bg-white/80 rounded-lg p-2">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600">
                    El <strong>peso</strong> determina cuánto vale esta evaluación en el promedio ponderado.
                    Una evaluación con peso 2x tiene el doble de importancia que una de peso 1x.
                  </p>
                </div>
              </div>
            )}

            {/* Grades Table */}
            {evaluations.length === 0 && students.length === 0 ? (
              <div className="p-12 text-center">
                <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Sin evaluaciones</h3>
                <p className="text-gray-500 mb-4 text-sm">
                  No hay evaluaciones creadas para este bimestre.<br />
                  Crea una evaluación para comenzar a registrar notas.
                </p>
                {!isClosed && (
                  <Button variant="outline" onClick={() => setShowNewEval(true)}>
                    <Plus className="w-4 h-4 mr-2" />Crear Primera Evaluación
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
                        const pct = totalWeight > 0 ? Math.round(((ev.weight || 1) / totalWeight) * 100) : 0
                        return (
                          <th key={ev._id} className="text-center p-3 min-w-[110px]">
                            <div className="flex flex-col items-center gap-1">
                              <Badge className={`${evalType.color} text-[10px] px-1.5`}>{evalType.label}</Badge>
                              <span className="text-xs font-medium text-gray-700 truncate max-w-[100px]" title={ev.name}>{ev.name}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-gray-400">Peso {ev.weight || 1}x</span>
                                <span className="text-[10px] font-bold text-blue-500">({pct}%)</span>
                              </div>
                              {!isClosed && (
                                <button
                                  onClick={() => {
                                    if (confirm(`¿Eliminar "${ev.name}"? Se perderán todas las notas asociadas.`)) deleteEvalMutation.mutate(ev._id)
                                  }}
                                  className="text-gray-300 hover:text-red-500 transition-colors"
                                  title="Eliminar evaluación"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </th>
                        )
                      })}
                      <th className="text-center p-3 font-semibold text-gray-700 bg-blue-50 min-w-[90px]">
                        <div className="flex flex-col items-center">
                          <span>Prom.</span>
                          <span className="text-[10px] text-gray-400 font-normal">Ponderado</span>
                        </div>
                      </th>
                      <th className="text-center p-3 font-semibold text-gray-700 bg-blue-50 min-w-[60px]">Nivel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((row) => {
                      const weightedAvg = calculateWeightedAverage(row.scores, evaluations)
                      const label = weightedAvg > 0 ? getScoreLabel(weightedAvg) : '-'
                      return (
                        <tr key={row.student._id} className={`border-b hover:bg-gray-50 ${weightedAvg > 0 && weightedAvg < 11 ? 'bg-red-50/30' : ''}`}>
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
                          <td className="p-3 text-center bg-blue-50/50">
                            <span className={`px-2 py-1 rounded-lg font-bold text-sm ${weightedAvg > 0 ? getScoreColor(weightedAvg) : 'text-gray-300'}`}>
                              {weightedAvg > 0 ? weightedAvg.toFixed(1) : '-'}
                            </span>
                          </td>
                          <td className="p-3 text-center bg-blue-50/50">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${weightedAvg > 0 ? getScoreColor(weightedAvg) : 'text-gray-300'}`}>
                              {label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== CLOSE BIMESTER - TRIPLE CONFIRMATION ===== */}
      {closeStep > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            {closeStep === 1 && (
              <>
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-center mb-3">Cerrar Bimestre {selectedBimester}</h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Al cerrar el bimestre, <strong>ningún docente podrá modificar las notas</strong>.
                  Solo un administrador podrá reabrirlo.
                </p>
                <div className="bg-gray-50 rounded-lg p-3 text-center text-sm mb-4">
                  📊 {students.length} alumnos · {evaluations.length} evaluaciones<br />
                  {classStats.classAvg !== '-' ? `📈 Promedio: ${classStats.classAvg} · ✅ Aprobación: ${classStats.passingRate}%` : '⚠️ Sin notas registradas'}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setCloseStep(0)}>Cancelar</Button>
                  <Button className="flex-1 bg-yellow-500 hover:bg-yellow-600" onClick={() => setCloseStep(2)}>Continuar →</Button>
                </div>
              </>
            )}
            {closeStep === 2 && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-center mb-3">¿Estás seguro?</h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Esta acción cerrará <strong>permanentemente</strong> el Bimestre {selectedBimester} del curso <strong>{courseName}</strong>.
                  Los estudiantes y padres podrán ver las notas finales.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setCloseStep(0)}>Cancelar</Button>
                  <Button className="flex-1 bg-red-500 hover:bg-red-600" onClick={() => setCloseStep(3)}>Sí, continuar →</Button>
                </div>
              </>
            )}
            {closeStep === 3 && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-red-700" />
                </div>
                <h3 className="text-xl font-bold text-center mb-3">Última confirmación</h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Confirmo que deseo <strong className="text-red-600">CERRAR DEFINITIVAMENTE</strong> el Bimestre {selectedBimester} del curso <strong>{courseName}</strong>.
                  Solo un administrador podrá revertir esta acción.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setCloseStep(0)}>Cancelar</Button>
                  <Button className="flex-1 bg-red-700 hover:bg-red-800" onClick={() => closeBimesterMutation.mutate()} disabled={closeBimesterMutation.isPending}>
                    {closeBimesterMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Lock className="w-4 h-4 mr-1" />}
                    CERRAR BIMESTRE
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
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
          <p className="text-gray-500 mt-1">Sistema de evaluación por bimestres con promedios ponderados</p>
        </div>
        <Button className="bg-sanmartin-primary hover:bg-sanmartin-primary-dark">
          <Download className="w-4 h-4 mr-2" />Exportar Todo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Calificaciones" value={stats.totalGrades} subtitle="Este año académico" icon={FileSpreadsheet} color="bg-blue-500" loading={statsLoading} />
        <StatCard title="Promedio General" value={stats.avgScore} icon={BarChart3} color="bg-green-500" loading={statsLoading} />
        <StatCard title="Tasa de Aprobación" value={`${stats.passingRate}%`} icon={Award} color="bg-purple-500" loading={statsLoading} />
        <StatCard title="Estudiantes Destacados" value={stats.excellentStudents} subtitle="Nota >= 17 (AD)" icon={TrendingUp} color="bg-orange-500" loading={statsLoading} />
      </div>

      {/* Distribution badges */}
      {stats.distribution && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-6">
              <span className="text-sm font-medium text-gray-600">Distribución:</span>
              <div className="flex gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm"><strong>AD</strong> ({stats.distribution.AD})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm"><strong>A</strong> ({stats.distribution.A})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm"><strong>B</strong> ({stats.distribution.B})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm"><strong>C</strong> ({stats.distribution.C})</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" /> Error al cargar los datos. Por favor, intenta de nuevo.
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
            <p className="text-gray-500">{searchTerm ? 'No se encontraron cursos.' : 'Aún no hay cursos registrados.'}</p>
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
                        <p className="text-sm text-gray-500">{course.gradeLevel} - Sección {course.section}</p>
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
                        <p className="text-xs text-gray-500">Aprobación</p>
                        {passingRate > 0 ? (
                          <div className="flex items-center gap-1">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: `${passingRate}%` }} />
                            </div>
                            <span className="text-xs font-bold text-green-600">{passingRate}%</span>
                          </div>
                        ) : <span className="text-gray-300 font-bold">-</span>}
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
