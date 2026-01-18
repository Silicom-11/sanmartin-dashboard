import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/api'
import {
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { formatDate } from '@/lib/utils'

// Datos de ejemplo mientras se conecta el API
const mockStats = {
  totalStudents: 847,
  activeStudents: 823,
  totalTeachers: 45,
  totalParents: 712,
  totalCourses: 68,
  pendingJustifications: 12,
  todayAttendance: 94.5,
  attendanceTrend: 2.3,
}

const mockAttendanceWeek = [
  { day: 'Lun', value: 95 },
  { day: 'Mar', value: 93 },
  { day: 'Mié', value: 96 },
  { day: 'Jue', value: 92 },
  { day: 'Vie', value: 94 },
]

const mockStudentsByGrade = [
  { name: '1° Pri', count: 78 },
  { name: '2° Pri', count: 82 },
  { name: '3° Pri', count: 75 },
  { name: '4° Pri', count: 80 },
  { name: '5° Pri', count: 77 },
  { name: '6° Pri', count: 74 },
  { name: '1° Sec', count: 85 },
  { name: '2° Sec', count: 88 },
  { name: '3° Sec', count: 72 },
  { name: '4° Sec', count: 70 },
  { name: '5° Sec', count: 66 },
]

const mockRecentActivity = [
  { id: 1, type: 'attendance', message: 'Asistencia registrada - 4°A Matemáticas', time: '10 min' },
  { id: 2, type: 'grade', message: 'Notas publicadas - 3°B Historia', time: '25 min' },
  { id: 3, type: 'justification', message: 'Nueva justificación - Juan Pérez', time: '1 hora' },
  { id: 4, type: 'student', message: 'Nuevo estudiante registrado - María García', time: '2 horas' },
]

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ElementType
  iconColor: string
  iconBg: string
}

function StatCard({ title, value, change, icon: Icon, iconColor, iconBg }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{Math.abs(change)}%</span>
              <span className="text-xs text-gray-500">vs semana pasada</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getAdminStats,
    refetchInterval: 30000, // Refrescar cada 30 segundos
  })

  // Usar datos del API o mock
  const stats = data?.data || mockStats

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Bienvenido al panel de administración - {formatDate(new Date())}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Estudiantes"
          value={stats.totalStudents || mockStats.totalStudents}
          change={3.2}
          icon={GraduationCap}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Docentes Activos"
          value={stats.totalTeachers || mockStats.totalTeachers}
          icon={Users}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
        <StatCard
          title="Cursos Activos"
          value={stats.totalCourses || mockStats.totalCourses}
          icon={BookOpen}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
        <StatCard
          title="Justificaciones Pendientes"
          value={stats.pendingJustifications || mockStats.pendingJustifications}
          icon={FileText}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
        />
      </div>

      {/* Attendance Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Asistencia de Hoy</h2>
            <p className="text-sm text-gray-500">Porcentaje de asistencia general</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-sanmartin-primary">
              {mockStats.todayAttendance}%
            </p>
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">+{mockStats.attendanceTrend}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Asistencia Semanal
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockAttendanceWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} domain={[80, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0066CC"
                  strokeWidth={3}
                  dot={{ fill: '#0066CC', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Students by Grade */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Estudiantes por Grado
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockStudentsByGrade}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="#0066CC" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Actividad Reciente
          </h3>
          <div className="space-y-4">
            {mockRecentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'attendance' ? 'bg-green-100' :
                  activity.type === 'grade' ? 'bg-blue-100' :
                  activity.type === 'justification' ? 'bg-orange-100' :
                  'bg-purple-100'
                }`}>
                  {activity.type === 'attendance' && <Clock className="w-4 h-4 text-green-600" />}
                  {activity.type === 'grade' && <BookOpen className="w-4 h-4 text-blue-600" />}
                  {activity.type === 'justification' && <FileText className="w-4 h-4 text-orange-600" />}
                  {activity.type === 'student' && <GraduationCap className="w-4 h-4 text-purple-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Hace {activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Alertas Pendientes
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  5 estudiantes con más de 3 faltas
                </p>
                <p className="text-xs text-red-700 mt-0.5">
                  Requieren atención inmediata
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900">
                  12 justificaciones sin revisar
                </p>
                <p className="text-xs text-orange-700 mt-0.5">
                  Pendientes desde hace 3 días
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Reunión de padres mañana
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  14 de Enero - 3:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
