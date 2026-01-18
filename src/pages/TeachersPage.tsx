import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Plus, Search, Eye, Edit, Mail, Phone, BookOpen, 
  Users, Check, Clock, X, Award
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/services/api'

interface Teacher {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  dni: string
  specialty?: string
  assignedCourses?: number
  isActive: boolean
  createdAt: string
}

const mockTeachers: Teacher[] = [
  { _id: '1', firstName: 'María', lastName: 'González', email: 'maria.gonzalez@sanmartin.edu.pe', phone: '987654321', dni: '12345678', specialty: 'Matemáticas', assignedCourses: 4, isActive: true, createdAt: '2024-01-15' },
  { _id: '2', firstName: 'Carlos', lastName: 'Rodríguez', email: 'carlos.rodriguez@sanmartin.edu.pe', phone: '987654322', dni: '23456789', specialty: 'Comunicación', assignedCourses: 3, isActive: true, createdAt: '2024-02-20' },
  { _id: '3', firstName: 'Ana', lastName: 'Martínez', email: 'ana.martinez@sanmartin.edu.pe', phone: '987654323', dni: '34567890', specialty: 'Ciencias', assignedCourses: 5, isActive: true, createdAt: '2024-01-10' },
  { _id: '4', firstName: 'Luis', lastName: 'Pérez', email: 'luis.perez@sanmartin.edu.pe', phone: '987654324', dni: '45678901', specialty: 'Historia', assignedCourses: 2, isActive: false, createdAt: '2023-08-01' },
]

const mockStats = { totalTeachers: 45, activeTeachers: 42, withCourses: 38, avgCourses: 3.5 }

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TeacherModal({ teacher, onClose, onSave }: { teacher?: Teacher | null; onClose: () => void; onSave: (data: unknown) => void }) {
  const [formData, setFormData] = useState({
    firstName: teacher?.firstName || '',
    lastName: teacher?.lastName || '',
    email: teacher?.email || '',
    phone: teacher?.phone || '',
    dni: teacher?.dni || '',
    specialty: teacher?.specialty || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{teacher ? 'Editar Docente' : 'Nuevo Docente'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
              <Input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
              <Input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
            <Input value={formData.dni} onChange={(e) => setFormData({...formData, dni: e.target.value})} maxLength={8} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
            <select value={formData.specialty} onChange={(e) => setFormData({...formData, specialty: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sanmartin-primary">
              <option value="">Seleccionar</option>
              <option value="Matemáticas">Matemáticas</option>
              <option value="Comunicación">Comunicación</option>
              <option value="Ciencias">Ciencias</option>
              <option value="Historia">Historia</option>
              <option value="Inglés">Inglés</option>
              <option value="Educación Física">Educación Física</option>
              <option value="Arte">Arte</option>
              <option value="Computación">Computación</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" className="flex-1 bg-sanmartin-primary hover:bg-sanmartin-primary-dark">{teacher ? 'Guardar' : 'Registrar'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TeacherDetailModal({ teacher, onClose }: { teacher: Teacher; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">Perfil del Docente</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-sanmartin-primary to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {teacher.firstName[0]}{teacher.lastName[0]}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{teacher.firstName} {teacher.lastName}</h3>
              <p className="text-gray-500">{teacher.specialty || 'Sin especialidad'}</p>
              <Badge variant={teacher.isActive ? "default" : "secondary"} className="mt-2">{teacher.isActive ? 'Activo' : 'Inactivo'}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Mail className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">Correo</p><p className="font-medium">{teacher.email}</p></div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Phone className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">Teléfono</p><p className="font-medium">{teacher.phone || 'No registrado'}</p></div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{teacher.assignedCourses || 0}</p>
              <p className="text-sm text-gray-500">Cursos</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">156</p>
              <p className="text-sm text-gray-500">Estudiantes</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">24</p>
              <p className="text-sm text-gray-500">Hrs/Semana</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Cursos Asignados</h4>
            <div className="space-y-2">
              {['Matemáticas - 3°A Primaria', 'Matemáticas - 3°B Primaria', 'Matemáticas - 4°A Primaria'].map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3"><div className="w-2 h-2 bg-sanmartin-primary rounded-full" /><span className="font-medium">{c}</span></div>
                  <Badge variant="outline">32 alumnos</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TeachersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['teachers', searchTerm],
    queryFn: async () => {
      try {
        const response = await api.get('/api/users?role=docente')
        return response.data
      } catch {
        return { data: mockTeachers }
      }
    },
  })

  const teachers = (data?.data || mockTeachers).filter((t: Teacher) => {
    const matchesSearch = `${t.firstName} ${t.lastName} ${t.email}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? t.isActive : !t.isActive)
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Docentes</h1>
          <p className="text-gray-500 mt-1">Gestión del personal docente</p>
        </div>
        <Button onClick={() => { setSelectedTeacher(null); setShowModal(true); }} className="bg-sanmartin-primary hover:bg-sanmartin-primary-dark">
          <Plus className="w-4 h-4 mr-2" />Nuevo Docente
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Docentes" value={mockStats.totalTeachers} icon={Users} color="bg-blue-500" />
        <StatCard title="Docentes Activos" value={mockStats.activeTeachers} icon={Check} color="bg-green-500" />
        <StatCard title="Con Cursos" value={mockStats.withCourses} icon={BookOpen} color="bg-purple-500" />
        <StatCard title="Prom. Cursos" value={mockStats.avgCourses} icon={Award} color="bg-orange-500" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Buscar por nombre, email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-2">
              {['all', 'active', 'inactive'].map((s) => (
                <Button key={s} variant={filterStatus === s ? 'default' : 'outline'} onClick={() => setFilterStatus(s as typeof filterStatus)} size="sm">
                  {s === 'all' ? 'Todos' : s === 'active' ? 'Activos' : 'Inactivos'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-16 rounded-full mb-4" /><Skeleton className="h-4 w-3/4 mb-2" /><Skeleton className="h-3 w-1/2" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((teacher: Teacher) => (
            <Card key={teacher._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-sanmartin-primary to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {teacher.firstName[0]}{teacher.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{teacher.firstName} {teacher.lastName}</h3>
                      <p className="text-sm text-gray-500">{teacher.specialty || 'Sin especialidad'}</p>
                    </div>
                  </div>
                  <Badge variant={teacher.isActive ? "default" : "secondary"}>{teacher.isActive ? 'Activo' : 'Inactivo'}</Badge>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /><span className="truncate">{teacher.email}</span></div>
                  <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-gray-400" /><span>{teacher.assignedCourses || 0} cursos</span></div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedTeacher(teacher); setShowDetailModal(true); }}><Eye className="w-4 h-4 mr-1" />Ver</Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedTeacher(teacher); setShowModal(true); }}><Edit className="w-4 h-4 mr-1" />Editar</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && <TeacherModal teacher={selectedTeacher} onClose={() => { setShowModal(false); setSelectedTeacher(null); }} onSave={() => { setShowModal(false); setSelectedTeacher(null); }} />}
      {showDetailModal && selectedTeacher && <TeacherDetailModal teacher={selectedTeacher} onClose={() => { setShowDetailModal(false); setSelectedTeacher(null); }} />}
    </div>
  )
}
