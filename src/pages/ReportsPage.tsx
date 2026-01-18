import { useState } from 'react'
import { FileSpreadsheet, Download, TrendingUp, TrendingDown, Users, BookOpen, Calendar, BarChart3, PieChart, Award, Clock, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface ReportType {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  formats: string[]
  lastGenerated?: string
}

const reportTypes: ReportType[] = [
  { id: 'academic', title: 'Rendimiento Académico', description: 'Notas por curso, grado y período. Promedios y tendencias.', icon: BookOpen, color: 'bg-blue-500', formats: ['PDF', 'Excel'], lastGenerated: '2024-01-15' },
  { id: 'attendance', title: 'Asistencia General', description: 'Estadísticas de asistencia por aula, mes y estudiante.', icon: Calendar, color: 'bg-green-500', formats: ['PDF', 'Excel'], lastGenerated: '2024-01-14' },
  { id: 'students', title: 'Listado de Estudiantes', description: 'Padrón actualizado con datos de contacto y tutores.', icon: Users, color: 'bg-purple-500', formats: ['PDF', 'Excel', 'CSV'] },
  { id: 'grades-detail', title: 'Libreta de Notas', description: 'Boleta individual por estudiante con todas las materias.', icon: Award, color: 'bg-orange-500', formats: ['PDF'] },
  { id: 'teachers', title: 'Carga Docente', description: 'Asignación de cursos, horas y secciones por docente.', icon: BarChart3, color: 'bg-teal-500', formats: ['PDF', 'Excel'] },
  { id: 'comparative', title: 'Análisis Comparativo', description: 'Comparación entre períodos, años y secciones.', icon: PieChart, color: 'bg-pink-500', formats: ['PDF'] },
]

const mockMetrics = [
  { label: 'Promedio General', value: '14.7', trend: 'up', change: '+0.3' },
  { label: 'Tasa de Asistencia', value: '95.8%', trend: 'up', change: '+1.2%' },
  { label: 'Tasa de Aprobación', value: '89%', trend: 'down', change: '-2%' },
  { label: 'Estudiantes Destacados', value: '124', trend: 'up', change: '+12' },
]

const mockTopCourses = [
  { name: 'Inglés - 2° Secundaria B', avg: 15.6, change: '+0.8' },
  { name: 'Comunicación - 3° Primaria A', avg: 15.2, change: '+0.4' },
  { name: 'Matemáticas - 3° Primaria A', avg: 14.8, change: '+0.2' },
]

const mockLowCourses = [
  { name: 'Ciencias - 4° Primaria B', avg: 13.5, change: '-0.5' },
  { name: 'Historia - 1° Secundaria A', avg: 14.1, change: '-0.3' },
]

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('B1')
  const [selectedYear] = useState('2024')

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {mockMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">{metric.label}</p>
                <div className={`flex items-center gap-1 text-sm ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {metric.change}
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
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
              {['Bimestre 1', 'Bimestre 2', 'Bimestre 3', 'Bimestre 4'].map((period, i) => {
                const value = [14.7, 14.9, 0, 0][i]
                const isComplete = i < 2
                return (
                  <div key={period} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{period}</span>
                      <span className={`text-sm ${isComplete ? 'font-bold' : 'text-gray-400'}`}>
                        {isComplete ? value : 'Pendiente'}
                      </span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${isComplete ? 'bg-gradient-to-r from-sanmartin-primary to-blue-400' : 'bg-gray-200'}`} style={{ width: isComplete ? `${(value / 20) * 100}%` : '0%' }} />
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
                  {mockTopCourses.map((course) => (
                    <div key={course.name} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                      <span className="text-sm truncate flex-1">{course.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-green-700">{course.avg}</span>
                        <span className="text-xs text-green-600">{course.change}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />Requieren Atención
                </h4>
                <div className="space-y-2">
                  {mockLowCourses.map((course) => (
                    <div key={course.name} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                      <span className="text-sm truncate flex-1">{course.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-700">{course.avg}</span>
                        <span className="text-xs text-red-600">{course.change}</span>
                      </div>
                    </div>
                  ))}
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
              {[
                { label: 'AD (17-20)', count: 124, percent: 15, color: 'bg-green-500' },
                { label: 'A (14-16)', count: 342, percent: 40, color: 'bg-blue-500' },
                { label: 'B (11-13)', count: 287, percent: 34, color: 'bg-yellow-500' },
                { label: 'C (0-10)', count: 94, percent: 11, color: 'bg-red-500' },
              ].map((item) => (
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
                  <p className="text-2xl font-bold text-sanmartin-primary">847</p>
                  <p className="text-xs text-gray-500">Total Estudiantes</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-sanmartin-primary">89%</p>
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
