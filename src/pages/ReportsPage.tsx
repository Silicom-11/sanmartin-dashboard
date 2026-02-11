import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileSpreadsheet, Download, TrendingUp, TrendingDown, Users, BookOpen, Calendar, BarChart3, PieChart, Award, Clock, Filter, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/services/api'

interface ReportType {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  formats: string[]
  lastGenerated?: string
}

interface ReportMetrics {
  avgScore: number
  attendanceRate: number
  passingRate: number
  excellentStudents: number
  totalStudents: number
  totalCourses: number
}

interface TopCourse {
  name: string
  avg: number
  change: string
}

const reportTypes: ReportType[] = [
  { id: 'academic', title: 'Rendimiento Académico', description: 'Notas por curso, grado y período. Promedios y tendencias.', icon: BookOpen, color: 'bg-blue-500', formats: ['PDF', 'Excel'], lastGenerated: '2024-01-15' },
  { id: 'attendance', title: 'Asistencia General', description: 'Estadísticas de asistencia por aula, mes y estudiante.', icon: Calendar, color: 'bg-green-500', formats: ['PDF', 'Excel'], lastGenerated: '2024-01-14' },
  { id: 'students', title: 'Listado de Estudiantes', description: 'Padrón actualizado con datos de contacto y tutores.', icon: Users, color: 'bg-purple-500', formats: ['PDF', 'Excel', 'CSV'] },
  { id: 'grades-detail', title: 'Libreta de Notas', description: 'Boleta individual por estudiante con todas las materias.', icon: Award, color: 'bg-orange-500', formats: ['PDF'] },
  { id: 'teachers', title: 'Carga Docente', description: 'Asignación de cursos, horas y secciones por docente.', icon: BarChart3, color: 'bg-teal-500', formats: ['PDF', 'Excel'] },
  { id: 'comparative', title: 'Análisis Comparativo', description: 'Comparación entre períodos, años y secciones.', icon: PieChart, color: 'bg-pink-500', formats: ['PDF'] },
]

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('B1')
  const [selectedYear] = useState('2024')

  // Cargar estadisticas de calificaciones (incluye distribucion y byBimester)
  const { data: statsData } = useQuery({
    queryKey: ['report-grade-stats'],
    queryFn: async () => {
      const res = await api.get('/grades/stats')
      return res.data.data
    },
  })

  // Cargar metricas reales
  const { data: metricsData, isLoading: metricsLoading, error } = useQuery({
    queryKey: ['report-metrics'],
    queryFn: async () => {
      const [gradesStats, attendanceStats, coursesStats] = await Promise.all([
        api.get('/grades/stats'),
        api.get('/attendance/stats'),
        api.get('/courses/stats')
      ])
      return {
        avgScore: gradesStats.data.data?.avgScore || 0,
        attendanceRate: attendanceStats.data.data?.attendanceRate || 0,
        passingRate: gradesStats.data.data?.passingRate || 0,
        excellentStudents: gradesStats.data.data?.excellentStudents || 0,
        totalStudents: coursesStats.data.data?.totalStudents || 0,
        totalCourses: coursesStats.data.data?.totalCourses || 0,
      } as ReportMetrics
    },
  })

  // Cargar cursos con mejores y peores rendimientos
  const { data: coursesData } = useQuery({
    queryKey: ['report-courses-performance'],
    queryFn: async () => {
      const response = await api.get('/grades/by-course')
      const courses = response.data.data || []
      const sorted = [...courses].sort((a: TopCourse, b: TopCourse) => (b.avg || 0) - (a.avg || 0))
      return {
        top: sorted.slice(0, 3).map((c: TopCourse) => ({ name: c.name, avg: c.avg || 0, change: '+0.0' })),
        low: sorted.slice(-2).reverse().map((c: TopCourse) => ({ name: c.name, avg: c.avg || 0, change: '-0.0' })),
      }
    },
  })

  const metrics = metricsData || { avgScore: 0, attendanceRate: 0, passingRate: 0, excellentStudents: 0, totalStudents: 0, totalCourses: 0 }
  const topCourses = coursesData?.top || []
  const lowCourses = coursesData?.low || []

  // Convertir a números seguros
  const safeMetrics = {
    avgScore: Number(metrics.avgScore) || 0,
    attendanceRate: Number(metrics.attendanceRate) || 0,
    passingRate: Number(metrics.passingRate) || 0,
    excellentStudents: Number(metrics.excellentStudents) || 0,
    totalStudents: Number(metrics.totalStudents) || 0,
    totalCourses: Number(metrics.totalCourses) || 0
  }

  const metricCards = [
    { label: 'Promedio General', value: safeMetrics.avgScore.toFixed(1), trend: 'up', change: '+0.0' },
    { label: 'Tasa de Asistencia', value: `${safeMetrics.attendanceRate.toFixed(1)}%`, trend: 'up', change: '+0.0%' },
    { label: 'Tasa de Aprobación', value: `${safeMetrics.passingRate}%`, trend: 'up', change: '+0.0%' },
    { label: 'Estudiantes Destacados', value: safeMetrics.excellentStudents, trend: 'up', change: '+0' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes y Estadísticas</h1>
          <p className="text-gray-500 mt-1">Genera y descarga informes académicos y administrativos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" />Filtros</Button>
          <div className="flex gap-1">
            {['B1', 'B2', 'B3', 'B4', 'Anual'].map((period) => (
              <Button key={period} variant={selectedPeriod === period ? 'default' : 'outline'} size="sm" onClick={() => setSelectedPeriod(period)}>
                {period}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>Error al cargar las estadísticas. Por favor, intenta de nuevo.</span>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metricCards.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">{metric.label}</p>
                <div className={`flex items-center gap-1 text-sm ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {metric.change}
                </div>
              </div>
              {metricsLoading ? (
                <Skeleton className="h-9 w-24 mt-2" />
              ) : (
                <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" />Rendimiento por Período</CardTitle>
            <CardDescription>Comparación de promedios generales - Año {selectedYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((bim) => {
                const bimData = (statsData as any)?.byBimester?.[bim]
                const value = bimData?.avg || 0
                const hasData = value > 0
                return (
                  <div key={bim} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Bimestre {bim}</span>
                      <span className={`text-sm ${hasData ? 'font-bold' : 'text-gray-400'}`}>
                        {hasData ? value.toFixed(1) : 'Sin datos'}
                      </span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${hasData ? 'bg-gradient-to-r from-sanmartin-primary to-blue-400' : 'bg-gray-200'}`} style={{ width: hasData ? `${(value / 20) * 100}%` : '0%' }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />Mejores Rendimientos
                </h4>
                <div className="space-y-2">
                  {topCourses.length > 0 ? topCourses.map((course: TopCourse) => (
                    <div key={course.name} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                      <span className="text-sm truncate flex-1">{course.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-green-700">{course.avg?.toFixed(1)}</span>
                        <span className="text-xs text-green-600">{course.change}</span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-400 italic">Sin datos</p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />Requieren Atención
                </h4>
                <div className="space-y-2">
                  {lowCourses.length > 0 ? lowCourses.map((course: TopCourse) => (
                    <div key={course.name} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                      <span className="text-sm truncate flex-1">{course.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-700">{course.avg?.toFixed(1)}</span>
                        <span className="text-xs text-red-600">{course.change}</span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-400 italic">Sin datos</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PieChart className="w-5 h-5" />Distribución de Notas</CardTitle>
            <CardDescription>Bimestre 1 - 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                const dist = (statsData as any)?.distribution || { AD: 0, A: 0, B: 0, C: 0 }
                const total = dist.AD + dist.A + dist.B + dist.C || 1
                return [
                  { label: 'AD (17-20)', count: dist.AD, percent: Math.round(dist.AD / total * 100), color: 'bg-green-500' },
                  { label: 'A (14-16)', count: dist.A, percent: Math.round(dist.A / total * 100), color: 'bg-blue-500' },
                  { label: 'B (11-13)', count: dist.B, percent: Math.round(dist.B / total * 100), color: 'bg-yellow-500' },
                  { label: 'C (0-10)', count: dist.C, percent: Math.round(dist.C / total * 100), color: 'bg-red-500' },
                ]
              })().map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-gray-500">{item.count} ({item.percent}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded-xl">
                  {metricsLoading ? (
                    <Skeleton className="h-8 w-16 mx-auto" />
                  ) : (
                    <p className="text-2xl font-bold text-sanmartin-primary">{metrics.totalStudents}</p>
                  )}
                  <p className="text-xs text-gray-500">Total Estudiantes</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  {metricsLoading ? (
                    <Skeleton className="h-8 w-16 mx-auto" />
                  ) : (
                    <p className="text-2xl font-bold text-sanmartin-primary">{metrics.passingRate}%</p>
                  )}
                  <p className="text-xs text-gray-500">Aprobados</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="w-5 h-5" />Generar Reportes</CardTitle>
          <CardDescription>Selecciona un tipo de reporte para generar y descargar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((report) => {
              const Icon = report.icon
              return (
                <div key={report.id} className="p-4 border rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${report.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{report.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                      <div className="flex items-center gap-2 mt-3">
                        {report.formats.map((format) => (
                          <Button key={format} variant="outline" size="sm" className="h-7">
                            <Download className="w-3 h-3 mr-1" />{format}
                          </Button>
                        ))}
                      </div>
                      {report.lastGenerated && (
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />Último: {new Date(report.lastGenerated).toLocaleDateString('es-PE')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
