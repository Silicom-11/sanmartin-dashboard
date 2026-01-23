import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, Search, Eye, Edit, Mail, Phone, Users, Baby,
  Check, X, Loader2, Trash2, RefreshCw, UserPlus, Link2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { parentsService } from '@/services/api'

interface Child {
  student: {
    _id: string
    firstName: string
    lastName: string
    dni: string
    photo?: string
    gradeLevel?: string
    section?: string
  }
  relationship: string
  isPrimaryContact: boolean
  canPickUp: boolean
  isEmergencyContact: boolean
}

interface Parent {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  secondaryPhone?: string
  dni: string
  address?: string
  occupation?: string
  workplace?: string
  children: Child[]
  isActive: boolean
  isVerified: boolean
  createdAt: string
}

interface ParentFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  secondaryPhone: string
  dni: string
  address: string
  occupation: string
  workplace: string
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

function ParentModal({ parent, onClose, onSave, isLoading }: { parent?: Parent | null; onClose: () => void; onSave: (data: ParentFormData) => void; isLoading?: boolean }) {
  const [formData, setFormData] = useState<ParentFormData>({
    firstName: parent?.firstName || '',
    lastName: parent?.lastName || '',
    email: parent?.email || '',
    phone: parent?.phone || '',
    secondaryPhone: parent?.secondaryPhone || '',
    dni: parent?.dni || '',
    address: parent?.address || '',
    occupation: parent?.occupation || '',
    workplace: parent?.workplace || '',
    password: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">{parent ? 'Editar Padre/Apoderado' : 'Nuevo Padre/Apoderado'}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {parent ? 'Actualizar información' : 'Complete los datos para registrar'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Principal</label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} disabled={isLoading} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Secundario</label>
                <Input value={formData.secondaryPhone} onChange={(e) => setFormData({...formData, secondaryPhone: e.target.value})} disabled={isLoading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico *</label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required disabled={isLoading} />
              </div>
            </div>
            {!parent && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                <Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required minLength={6} disabled={isLoading} placeholder="Mínimo 6 caracteres" />
              </div>
            )}
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} disabled={isLoading} placeholder="Dirección de residencia" />
            </div>
          </div>

          {/* Información Laboral */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              💼 Información Laboral
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ocupación</label>
                <Input value={formData.occupation} onChange={(e) => setFormData({...formData, occupation: e.target.value})} disabled={isLoading} placeholder="Ej: Ingeniero, Docente, etc." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lugar de Trabajo</label>
                <Input value={formData.workplace} onChange={(e) => setFormData({...formData, workplace: e.target.value})} disabled={isLoading} placeholder="Empresa o institución" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-sanmartin-primary hover:bg-sanmartin-primary-dark" disabled={isLoading}>
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : parent ? 'Guardar Cambios' : 'Registrar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ParentDetailModal({ parent, onClose, onLinkChild }: { parent: Parent; onClose: () => void; onLinkChild: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">Perfil del Padre/Apoderado</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {parent.firstName[0]}{parent.lastName[0]}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{parent.firstName} {parent.lastName}</h3>
              <p className="text-gray-500">{parent.occupation || 'Sin ocupación registrada'}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={parent.isActive ? "default" : "secondary"}>{parent.isActive ? 'Activo' : 'Inactivo'}</Badge>
                {parent.isVerified && <Badge variant="outline" className="text-green-600 border-green-600">Verificado</Badge>}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Mail className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">Correo</p><p className="font-medium text-sm">{parent.email}</p></div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Phone className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">Teléfono</p><p className="font-medium">{parent.phone || 'No registrado'}</p></div>
            </div>
          </div>

          {parent.address && (
            <div className="p-4 bg-blue-50 rounded-xl mb-6">
              <p className="text-xs text-gray-500 mb-1">Dirección</p>
              <p className="font-medium">{parent.address}</p>
            </div>
          )}

          {parent.workplace && (
            <div className="p-4 bg-purple-50 rounded-xl mb-6">
              <p className="text-xs text-gray-500 mb-1">Lugar de Trabajo</p>
              <p className="font-medium">{parent.workplace}</p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Baby className="w-5 h-5" /> Hijos Vinculados ({parent.children?.length || 0})
              </h4>
              <Button variant="outline" size="sm" onClick={onLinkChild}>
                <UserPlus className="w-4 h-4 mr-1" /> Vincular Hijo
              </Button>
            </div>
            {parent.children && parent.children.length > 0 ? (
              <div className="space-y-3">
                {parent.children.map((child, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {child.student?.firstName?.[0]}{child.student?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium">{child.student?.firstName} {child.student?.lastName}</p>
                        <p className="text-sm text-gray-500">
                          {child.student?.gradeLevel} {child.student?.section && `- ${child.student.section}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{child.relationship}</Badge>
                      {child.isPrimaryContact && <Badge className="bg-green-100 text-green-700">Contacto Principal</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-gray-50 rounded-lg text-center">
                <Baby className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No hay hijos vinculados</p>
                <Button variant="link" className="text-sanmartin-primary" onClick={onLinkChild}>
                  Vincular un estudiante
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function LinkChildModal({ parentId, parentName, onClose, onSuccess }: { parentId: string; parentName: string; onClose: () => void; onSuccess: () => void }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<{ _id: string; firstName: string; lastName: string } | null>(null)
  const [relationship, setRelationship] = useState('padre')
  const [isPrimaryContact, setIsPrimaryContact] = useState(false)
  const { toast } = useToast()

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['search-students', searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 2) return { data: [] }
      return await parentsService.searchStudents(searchTerm)
    },
    enabled: searchTerm.length >= 2,
  })

  const linkMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStudent) throw new Error('Seleccione un estudiante')
      return await parentsService.addChild(parentId, {
        studentId: selectedStudent._id,
        relationship,
        isPrimaryContact,
        canPickUp: true,
        isEmergencyContact: true,
      })
    },
    onSuccess: () => {
      toast({ title: '✅ Hijo vinculado', description: 'El estudiante fue vinculado exitosamente' })
      onSuccess()
      onClose()
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Vincular Hijo</h2>
            <p className="text-sm text-gray-500">Padre: {parentName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Estudiante</label>
            <Input 
              placeholder="Nombre, apellido o DNI del estudiante..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            {isSearching && <p className="text-sm text-gray-500 mt-2">Buscando...</p>}
            {searchResults?.data && searchResults.data.length > 0 && !selectedStudent && (
              <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
                {searchResults.data.map((student: { _id: string; firstName: string; lastName: string; dni: string; gradeLevel?: string }) => (
                  <button
                    key={student._id}
                    className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium">{student.firstName} {student.lastName}</p>
                      <p className="text-sm text-gray-500">DNI: {student.dni} {student.gradeLevel && `| ${student.gradeLevel}`}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedStudent && (
            <div className="p-4 bg-green-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                  <p className="text-sm text-gray-500">Estudiante seleccionado</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Relación</label>
            <select 
              value={relationship} 
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="padre">Padre</option>
              <option value="madre">Madre</option>
              <option value="tutor">Tutor Legal</option>
              <option value="abuelo">Abuelo(a)</option>
              <option value="tio">Tío(a)</option>
              <option value="otro">Otro Familiar</option>
            </select>
          </div>

          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={isPrimaryContact} 
              onChange={(e) => setIsPrimaryContact(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Establecer como contacto principal</span>
          </label>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button 
              className="flex-1 bg-sanmartin-primary hover:bg-sanmartin-primary-dark" 
              disabled={!selectedStudent || linkMutation.isPending}
              onClick={() => linkMutation.mutate()}
            >
              {linkMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
              Vincular
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ParentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [filterChildren, setFilterChildren] = useState<'all' | 'with' | 'without'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Query para obtener padres
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['parents', searchTerm, filterStatus, filterChildren, currentPage],
    queryFn: async () => {
      const params: Record<string, unknown> = { 
        page: currentPage, 
        limit: 12,
        sortBy: 'lastName',
        sortOrder: 'asc'
      }
      if (searchTerm) params.search = searchTerm
      if (filterStatus !== 'all') params.isActive = filterStatus === 'active'
      if (filterChildren !== 'all') params.hasChildren = filterChildren === 'with'
      return await parentsService.getAll(params)
    },
  })

  // Query para estadísticas
  const { data: statsData } = useQuery({
    queryKey: ['parents-stats'],
    queryFn: async () => await parentsService.getStats(),
  })

  const stats = statsData?.data?.general || { total: 0, active: 0, withChildren: 0, verified: 0 }

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: ParentFormData) => await parentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] })
      queryClient.invalidateQueries({ queryKey: ['parents-stats'] })
      toast({ title: '✅ Padre registrado', description: 'El padre fue creado exitosamente' })
      setShowModal(false)
      setSelectedParent(null)
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ParentFormData }) => await parentsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] })
      toast({ title: '✅ Padre actualizado', description: 'Los cambios fueron guardados' })
      setShowModal(false)
      setSelectedParent(null)
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await parentsService.delete(id, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] })
      queryClient.invalidateQueries({ queryKey: ['parents-stats'] })
      toast({ title: '✅ Padre desactivado' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const reactivateMutation = useMutation({
    mutationFn: async (id: string) => await parentsService.reactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] })
      queryClient.invalidateQueries({ queryKey: ['parents-stats'] })
      toast({ title: '✅ Padre reactivado' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const handleSave = (formData: ParentFormData) => {
    if (selectedParent) {
      updateMutation.mutate({ id: selectedParent._id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (parent: Parent) => {
    if (confirm(`¿Desactivar a ${parent.firstName} ${parent.lastName}?`)) {
      deleteMutation.mutate(parent._id)
    }
  }

  const handleReactivate = (parent: Parent) => {
    if (confirm(`¿Reactivar a ${parent.firstName} ${parent.lastName}?`)) {
      reactivateMutation.mutate(parent._id)
    }
  }

  const parents = data?.data || []
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Padres de Familia</h1>
          <p className="text-gray-500 mt-1">Gestión de padres y apoderados - Colección Parents</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={() => { setSelectedParent(null); setShowModal(true); }} className="bg-sanmartin-primary hover:bg-sanmartin-primary-dark">
            <Plus className="w-4 h-4 mr-2" />Nuevo Padre
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Padres" value={stats.total} icon={Users} color="bg-blue-500" />
        <StatCard title="Activos" value={stats.active} icon={Check} color="bg-green-500" />
        <StatCard title="Con Hijos" value={stats.withChildren} icon={Baby} color="bg-purple-500" />
        <StatCard title="Verificados" value={stats.verified} icon={Check} color="bg-emerald-500" />
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
            <div className="flex gap-2 flex-wrap">
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
              <div className="border-l mx-2" />
              {['all', 'with', 'without'].map((s) => (
                <Button 
                  key={s} 
                  variant={filterChildren === s ? 'default' : 'outline'} 
                  onClick={() => { setFilterChildren(s as typeof filterChildren); setCurrentPage(1); }} 
                  size="sm"
                >
                  {s === 'all' ? 'Todos' : s === 'with' ? 'Con Hijos' : 'Sin Hijos'}
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
      ) : parents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay padres registrados</h3>
            <p className="text-gray-500 mb-4">Comienza registrando el primer padre en el sistema</p>
            <Button onClick={() => setShowModal(true)} className="bg-sanmartin-primary hover:bg-sanmartin-primary-dark">
              <Plus className="w-4 h-4 mr-2" />Registrar Padre
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parents.map((parent: Parent) => (
              <Card key={parent._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                        {parent.firstName[0]}{parent.lastName[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{parent.firstName} {parent.lastName}</h3>
                        <p className="text-sm text-gray-500">{parent.occupation || 'Sin ocupación'}</p>
                      </div>
                    </div>
                    <Badge variant={parent.isActive ? "default" : "secondary"}>
                      {parent.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /><span className="truncate">{parent.email}</span></div>
                    <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /><span>{parent.phone || 'Sin teléfono'}</span></div>
                    <div className="flex items-center gap-2">
                      <Baby className="w-4 h-4 text-gray-400" />
                      <span>{parent.children?.length || 0} hijos vinculados</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedParent(parent); setShowDetailModal(true); }}>
                      <Eye className="w-4 h-4 mr-1" />Ver
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedParent(parent); setShowModal(true); }}>
                      <Edit className="w-4 h-4 mr-1" />Editar
                    </Button>
                    {parent.isActive ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:bg-red-50" 
                        onClick={() => handleDelete(parent)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-green-600 hover:bg-green-50" 
                        onClick={() => handleReactivate(parent)}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

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
                Página {currentPage} de {pagination.pages} ({pagination.total} padres)
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
        <ParentModal 
          parent={selectedParent} 
          onClose={() => { setShowModal(false); setSelectedParent(null); }} 
          onSave={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
      
      {showDetailModal && selectedParent && (
        <ParentDetailModal 
          parent={selectedParent} 
          onClose={() => { setShowDetailModal(false); setSelectedParent(null); }}
          onLinkChild={() => { setShowDetailModal(false); setShowLinkModal(true); }}
        />
      )}

      {showLinkModal && selectedParent && (
        <LinkChildModal
          parentId={selectedParent._id}
          parentName={`${selectedParent.firstName} ${selectedParent.lastName}`}
          onClose={() => { setShowLinkModal(false); setSelectedParent(null); }}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['parents'] })}
        />
      )}
    </div>
  )
}
