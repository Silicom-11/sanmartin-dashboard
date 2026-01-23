import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, Search, Eye, Edit, Mail, Phone, BookOpen, 
  Users, Check, Clock, X, Award, Loader2, Trash2,
  GraduationCap, Building, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { teachersService } from '@/services/api'

interface Teacher {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  dni: string
  specialty?: string
  secondarySpecialties?: string[]
  educationLevel?: string
  university?: string
  employeeCode?: string
  contractType?: 'nombrado' | 'contratado' | 'practicante'
  workSchedule?: 'completo' | 'parcial'
  hireDate?: string
  courses?: Array<{ course: string; role: string }>
  assignedCourses?: number
  isActive: boolean
  createdAt: string
}

interface TeacherFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dni: string
  specialty: string
  secondarySpecialties: string[]
  educationLevel: string
  university: string
  contractType: 'nombrado' | 'contratado' | 'practicante'
  workSchedule: 'completo' | 'parcial'
  password?: string
}

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

function TeacherModal({ teacher, onClose, onSave, isLoading }: { teacher?: Teacher | null; onClose: () => void; onSave: (data: TeacherFormData) => void; isLoading?: boolean }) {
  const [formData, setFormData] = useState<TeacherFormData>({
    firstName: teacher?.firstName || '',
    lastName: teacher?.lastName || '',
    email: teacher?.email || '',
    phone: teacher?.phone || '',
    dni: teacher?.dni || '',
    specialty: teacher?.specialty || '',
    secondarySpecialties: teacher?.secondarySpecialties || [],
    educationLevel: teacher?.educationLevel || '',
    university: teacher?.university || '',
    contractType: teacher?.contractType || 'contratado',
    workSchedule: teacher?.workSchedule || 'completo',
    password: '',
  })

  const specialties = [
    'Matemáticas', 'Comunicación', 'Ciencias', 'Historia', 'Inglés',
    'Educación Física', 'Arte', 'Computación', 'Religión', 'Personal Social',
    'Ciencia y Tecnología', 'Educación para el Trabajo'
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">{teacher ? 'Editar Docente' : 'Nuevo Docente'}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {teacher ? 'Actualizar información del docente' : 'Complete los datos para registrar un nuevo docente'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" disabled={isLoading}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Datos Personales */}
          <div className="border-b pb-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> Datos Personales
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
                <Input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} required disabled={isLoading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
                <Input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} required disabled={isLoading} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DNI *</label>
                <Input value={formData.dni} onChange={(e) => setFormData({...formData, dni: e.target.value})} maxLength={8} required disabled={isLoading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} disabled={isLoading} />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico *</label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required disabled={isLoading} />
            </div>
            {!teacher && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                <Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required minLength={6} disabled={isLoading} placeholder="Mínimo 6 caracteres" />
              </div>
            )}
          </div>

          {/* Información Profesional */}
          <div className="border-b pb-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Información Profesional
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad Principal *</label>
              <select value={formData.specialty} onChange={(e) => setFormData({...formData, specialty: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sanmartin-primary" disabled={isLoading} required>
                <option value="">Seleccionar especialidad</option>
                {specialties.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de Educación</label>
                <select value={formData.educationLevel} onChange={(e) => setFormData({...formData, educationLevel: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled={isLoading}>
                  <option value="">Seleccionar</option>
                  <option value="licenciatura">Licenciatura</option>
                  <option value="maestria">Maestría</option>
                  <option value="doctorado">Doctorado</option>
                  <option value="tecnico">Técnico</option>
                  <option value="bachiller">Bachiller</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Universidad</label>
                <Input value={formData.university} onChange={(e) => setFormData({...formData, university: e.target.value})} disabled={isLoading} placeholder="Universidad de egreso" />
              </div>
            </div>
          </div>

          {/* Datos Laborales */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Building className="w-4 h-4" /> Datos Laborales
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contrato</label>
                <select value={formData.contractType} onChange={(e) => setFormData({...formData, contractType: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled={isLoading}>
                  <option value="contratado">Contratado</option>
                  <option value="nombrado">Nombrado</option>
                  <option value="practicante">Practicante</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horario</label>
                <select value={formData.workSchedule} onChange={(e) => setFormData({...formData, workSchedule: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled={isLoading}>
                  <option value="completo">Tiempo Completo</option>
                  <option value="parcial">Tiempo Parcial</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-sanmartin-primary hover:bg-sanmartin-primary-dark" disabled={isLoading}>
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : teacher ? 'Guardar Cambios' : 'Registrar Docente'}
            </Button>
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
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={teacher.isActive ? "default" : "secondary"}>{teacher.isActive ? 'Activo' : 'Inactivo'}</Badge>
                {teacher.employeeCode && <Badge variant="outline">{teacher.employeeCode}</Badge>}
                {teacher.contractType && (
                  <Badge variant="outline" className="capitalize">
                    {teacher.contractType}
                  </Badge>
                )}
              </div>
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

          {/* Información profesional */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
              <GraduationCap className="w-5 h-5 text-blue-500" />
              <div><p className="text-xs text-gray-500">Nivel Educativo</p><p className="font-medium capitalize">{teacher.educationLevel || 'No especificado'}</p></div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
              <Building className="w-5 h-5 text-green-500" />
              <div><p className="text-xs text-gray-500">Universidad</p><p className="font-medium">{teacher.university || 'No especificada'}</p></div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{teacher.courses?.length || 0}</p>
              <p className="text-sm text-gray-500">Cursos</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">--</p>
              <p className="text-sm text-gray-500">Estudiantes</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{teacher.workSchedule === 'completo' ? '40' : '20'}</p>
              <p className="text-sm text-gray-500">Hrs/Semana</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Cursos Asignados</h4>
            {teacher.courses && teacher.courses.length > 0 ? (
              <div className="space-y-2">
                {teacher.courses.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-sanmartin-primary rounded-full" />
                      <span className="font-medium">{typeof c.course === 'string' ? c.course : 'Curso'}</span>
                    </div>
                    <Badge variant="outline" className="capitalize">{c.role}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm p-3 bg-gray-50 rounded-lg">No tiene cursos asignados</p>
            )}
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
  const [currentPage, setCurrentPage] = useState(1)
  
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Query para obtener docentes desde la nueva colección teachers
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['teachers', searchTerm, filterStatus, currentPage],
    queryFn: async () => {
      const params: Record<string, unknown> = { 
        page: currentPage, 
        limit: 12,
        sortBy: 'lastName',
        sortOrder: 'asc'
      }
      if (searchTerm) params.search = searchTerm
      if (filterStatus !== 'all') params.isActive = filterStatus === 'active'
      return await teachersService.getAll(params)
    },
  })

  // Query para estadísticas
  const { data: statsData } = useQuery({
    queryKey: ['teachers-stats'],
    queryFn: async () => await teachersService.getStats(),
  })

  const stats = statsData?.data?.general || { total: 0, active: 0, withCourses: 0, avgCoursesPerTeacher: 0 }

  // Mutation para crear docente
  const createMutation = useMutation({
    mutationFn: async (data: TeacherFormData) => {
      return await teachersService.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      queryClient.invalidateQueries({ queryKey: ['teachers-stats'] })
      toast({ title: '✅ Docente registrado', description: 'El docente fue creado exitosamente en la base de datos' })
      setShowModal(false)
      setSelectedTeacher(null)
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  // Mutation para actualizar docente
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TeacherFormData }) => {
      return await teachersService.update(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      toast({ title: '✅ Docente actualizado', description: 'Los cambios fueron guardados' })
      setShowModal(false)
      setSelectedTeacher(null)
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  // Mutation para eliminar (desactivar) docente
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await teachersService.delete(id, false)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      queryClient.invalidateQueries({ queryKey: ['teachers-stats'] })
      toast({ title: '✅ Docente desactivado', description: 'El docente fue desactivado del sistema' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  // Mutation para reactivar docente
  const reactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await teachersService.reactivate(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      queryClient.invalidateQueries({ queryKey: ['teachers-stats'] })
      toast({ title: '✅ Docente reactivado', description: 'El docente fue reactivado exitosamente' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const handleSave = (formData: TeacherFormData) => {
    if (selectedTeacher) {
      updateMutation.mutate({ id: selectedTeacher._id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (teacher: Teacher) => {
    if (confirm(`¿Estás seguro de desactivar a ${teacher.firstName} ${teacher.lastName}?`)) {
      deleteMutation.mutate(teacher._id)
    }
  }

  const handleReactivate = (teacher: Teacher) => {
    if (confirm(`¿Reactivar a ${teacher.firstName} ${teacher.lastName}?`)) {
      reactivateMutation.mutate(teacher._id)
    }
  }

  const teachers = data?.data || []
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Docentes</h1>
          <p className="text-gray-500 mt-1">Gestión del personal docente - Colección Teachers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={() => { setSelectedTeacher(null); setShowModal(true); }} className="bg-sanmartin-primary hover:bg-sanmartin-primary-dark">
            <Plus className="w-4 h-4 mr-2" />Nuevo Docente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Docentes" value={stats.total} icon={Users} color="bg-blue-500" />
        <StatCard title="Docentes Activos" value={stats.active} icon={Check} color="bg-green-500" />
        <StatCard title="Con Cursos" value={stats.withCourses} icon={BookOpen} color="bg-purple-500" />
        <StatCard title="Prom. Cursos" value={Number(stats.avgCoursesPerTeacher || 0).toFixed(1)} icon={Award} color="bg-orange-500" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Buscar por nombre, email, DNI..." 
                value={searchTerm} 
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                className="pl-10" 
              />
            </div>
            <div className="flex gap-2">
              {['all', 'active', 'inactive'].map((s) => (
                <Button 
                  key={s} 
                  variant={filterStatus === s ? 'default' : 'outline'} 
                  onClick={() => { setFilterStatus(s as typeof filterStatus); setCurrentPage(1); }} 
                  size="sm"
                >
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
      ) : teachers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay docentes registrados</h3>
            <p className="text-gray-500 mb-4">Comienza registrando el primer docente en el sistema</p>
            <Button onClick={() => setShowModal(true)} className="bg-sanmartin-primary hover:bg-sanmartin-primary-dark">
              <Plus className="w-4 h-4 mr-2" />Registrar Docente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
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
                        {teacher.employeeCode && (
                          <p className="text-xs text-gray-400 mt-0.5">{teacher.employeeCode}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge variant={teacher.isActive ? "default" : "secondary"}>
                        {teacher.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                      {teacher.contractType && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {teacher.contractType}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /><span className="truncate">{teacher.email}</span></div>
                    <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /><span>{teacher.phone || 'Sin teléfono'}</span></div>
                    <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-gray-400" /><span>{teacher.courses?.length || 0} cursos asignados</span></div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedTeacher(teacher); setShowDetailModal(true); }}>
                      <Eye className="w-4 h-4 mr-1" />Ver
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedTeacher(teacher); setShowModal(true); }}>
                      <Edit className="w-4 h-4 mr-1" />Editar
                    </Button>
                    {teacher.isActive ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:bg-red-50 hover:text-red-700" 
                        onClick={() => handleDelete(teacher)} 
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-green-600 hover:bg-green-50 hover:text-green-700" 
                        onClick={() => handleReactivate(teacher)} 
                        disabled={reactivateMutation.isPending}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Paginación */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {currentPage} de {pagination.pages} ({pagination.total} docentes)
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))} 
                disabled={currentPage === pagination.pages}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <TeacherModal 
          teacher={selectedTeacher} 
          onClose={() => { setShowModal(false); setSelectedTeacher(null); }} 
          onSave={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
      {showDetailModal && selectedTeacher && <TeacherDetailModal teacher={selectedTeacher} onClose={() => { setShowDetailModal(false); setSelectedTeacher(null); }} />}
    </div>
  )
}
