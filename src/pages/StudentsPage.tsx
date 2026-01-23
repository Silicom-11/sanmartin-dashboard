import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, Search, Eye, Edit, 
  Users, Check, X, GraduationCap, Loader2, Trash2,
  MapPin, Heart, UserPlus, RefreshCw,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { studentsManagementService } from '@/services/api'

// Constantes
const GRADE_LEVELS = [
  '1º Primaria', '2º Primaria', '3º Primaria', '4º Primaria', '5º Primaria', '6º Primaria',
  '1º Secundaria', '2º Secundaria', '3º Secundaria', '4º Secundaria', '5º Secundaria'
]
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F']
const SHIFTS = ['Mañana', 'Tarde']
const STATUSES = ['activo', 'inactivo', 'retirado', 'trasladado', 'egresado']
const RELATIONSHIPS = ['padre', 'madre', 'tutor', 'abuelo', 'abuela', 'tio', 'tia', 'hermano', 'hermana', 'otro']
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

interface Student {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  dni: string
  birthDate: string
  gender: 'Masculino' | 'Femenino'
  photo?: string
  studentCode?: string
  enrollmentNumber?: string
  gradeLevel?: string
  section?: string
  shift?: string
  status: string
  isActive: boolean
  address?: {
    street?: string
    district?: string
    city?: string
    reference?: string
  }
  medicalInfo?: {
    bloodType?: string
    allergies?: string[]
    conditions?: string[]
    medications?: string[]
  }
  guardians?: Array<{
    user?: { _id: string; firstName: string; lastName: string; email: string; phone?: string }
    parent?: { _id: string; firstName: string; lastName: string; email: string; phone?: string }
    relationship: string
    isPrimary: boolean
    canPickUp: boolean
    emergencyContact: boolean
  }>
  parent?: { firstName: string; lastName: string; email: string; phone?: string }
  createdAt: string
}

interface StudentFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  dni: string
  birthDate: string
  gender: 'Masculino' | 'Femenino'
  gradeLevel: string
  section: string
  shift: string
  address: {
    street: string
    district: string
    city: string
    reference: string
  }
  medicalInfo: {
    bloodType: string
    allergies: string[]
    conditions: string[]
  }
  parentId: string
  parentSource: 'parent' | 'user' | ''
  relationship: string
  previousSchool: string
}

interface ParentSearchResult {
  _id: string
  firstName: string
  lastName: string
  dni: string
  email: string
  phone?: string
  source: 'parent' | 'user'
  childrenCount?: number
}

// Componente de tarjeta de estadística
function StatCard({ title, value, icon: Icon, color, subValue }: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  color: string;
  subValue?: string 
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Modal de Estudiante (Crear/Editar)
function StudentModal({ 
  student, 
  onClose, 
  onSave, 
  isLoading 
}: { 
  student?: Student | null
  onClose: () => void
  onSave: (data: StudentFormData) => void
  isLoading?: boolean 
}) {
  const [formData, setFormData] = useState<StudentFormData>({
    firstName: student?.firstName || '',
    lastName: student?.lastName || '',
    email: student?.email || '',
    password: '',
    phone: student?.phone || '',
    dni: student?.dni || '',
    birthDate: student?.birthDate ? student.birthDate.split('T')[0] : '',
    gender: student?.gender || 'Masculino',
    gradeLevel: student?.gradeLevel || '',
    section: student?.section || 'A',
    shift: student?.shift || 'Mañana',
    address: {
      street: student?.address?.street || '',
      district: student?.address?.district || '',
      city: student?.address?.city || 'Lima',
      reference: student?.address?.reference || '',
    },
    medicalInfo: {
      bloodType: student?.medicalInfo?.bloodType || '',
      allergies: student?.medicalInfo?.allergies || [],
      conditions: student?.medicalInfo?.conditions || [],
    },
    parentId: '',
    parentSource: '',
    relationship: 'tutor',
    previousSchool: '',
  })

  const [parentSearch, setParentSearch] = useState('')
  const [parentResults, setParentResults] = useState<ParentSearchResult[]>([])
  const [selectedParent, setSelectedParent] = useState<ParentSearchResult | null>(null)
  const [searchingParents, setSearchingParents] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'academic' | 'medical' | 'parent'>('basic')

  // Buscar padres
  useEffect(() => {
    const searchParents = async () => {
      if (parentSearch.length < 2) {
        setParentResults([])
        return
      }
      setSearchingParents(true)
      try {
        const response = await studentsManagementService.searchParents(parentSearch)
        setParentResults(response.data || [])
      } catch (error) {
        console.error('Error buscando padres:', error)
      } finally {
        setSearchingParents(false)
      }
    }
    const timeout = setTimeout(searchParents, 300)
    return () => clearTimeout(timeout)
  }, [parentSearch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dataToSend: StudentFormData = {
      ...formData,
      parentId: selectedParent?._id || '',
      parentSource: (selectedParent?.source || '') as 'parent' | 'user' | '',
    }
    onSave(dataToSend)
  }

  const selectParent = (parent: ParentSearchResult) => {
    setSelectedParent(parent)
    setFormData({ ...formData, parentId: parent._id, parentSource: parent.source })
    setParentSearch('')
    setParentResults([])
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {student ? 'Editar Estudiante' : 'Nuevo Estudiante'}
              </h2>
              <p className="text-emerald-100 text-sm mt-1">
                {student ? 'Modifica los datos del estudiante' : 'Completa la información para registrar al estudiante'}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {[
              { id: 'basic', label: 'Datos Básicos', icon: Users },
              { id: 'academic', label: 'Académico', icon: GraduationCap },
              { id: 'medical', label: 'Médico', icon: Heart },
              { id: 'parent', label: 'Apoderado', icon: UserPlus },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === tab.id 
                    ? 'bg-white text-emerald-600' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Tab: Datos Básicos */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Nombres del estudiante"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Apellidos del estudiante"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DNI *</label>
                    <Input
                      value={formData.dni}
                      onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                      placeholder="12345678"
                      maxLength={8}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento *</label>
                    <Input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico *</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="estudiante@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña {student ? '(dejar vacío para mantener)' : '*'}
                    </label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      required={!student}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="987654321"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Género *</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Masculino' | 'Femenino' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Dirección
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Calle/Av.</label>
                      <Input
                        value={formData.address.street}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          address: { ...formData.address, street: e.target.value } 
                        })}
                        placeholder="Av. Principal 123"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Distrito</label>
                      <Input
                        value={formData.address.district}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          address: { ...formData.address, district: e.target.value } 
                        })}
                        placeholder="San Martín de Porres"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Académico */}
            {activeTab === 'academic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grado *</label>
                    <select
                      value={formData.gradeLevel}
                      onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="">Seleccionar grado</option>
                      {GRADE_LEVELS.map((grade) => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sección</label>
                    <select
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      {SECTIONS.map((section) => (
                        <option key={section} value={section}>{section}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
                    <select
                      value={formData.shift}
                      onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      {SHIFTS.map((shift) => (
                        <option key={shift} value={shift}>{shift}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Colegio Anterior</label>
                  <Input
                    value={formData.previousSchool}
                    onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                    placeholder="Nombre del colegio anterior (si aplica)"
                  />
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-emerald-800">Información</h4>
                      <p className="text-sm text-emerald-700 mt-1">
                        El código de estudiante y número de matrícula se generarán automáticamente al guardar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Médico */}
            {activeTab === 'medical' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Sangre</label>
                    <select
                      value={formData.medicalInfo.bloodType}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        medicalInfo: { ...formData.medicalInfo, bloodType: e.target.value } 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Seleccionar</option>
                      {BLOOD_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alergias (separar por coma)
                  </label>
                  <Input
                    value={formData.medicalInfo.allergies.join(', ')}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      medicalInfo: { 
                        ...formData.medicalInfo, 
                        allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      } 
                    })}
                    placeholder="Polen, Maní, Lácteos..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condiciones Médicas (separar por coma)
                  </label>
                  <Input
                    value={formData.medicalInfo.conditions.join(', ')}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      medicalInfo: { 
                        ...formData.medicalInfo, 
                        conditions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      } 
                    })}
                    placeholder="Asma, Diabetes, TDAH..."
                  />
                </div>
              </div>
            )}

            {/* Tab: Apoderado */}
            {activeTab === 'parent' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buscar Padre/Apoderado
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={parentSearch}
                      onChange={(e) => setParentSearch(e.target.value)}
                      placeholder="Buscar por nombre, DNI o email..."
                      className="pl-10"
                    />
                    {searchingParents && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                    )}
                  </div>

                  {/* Resultados de búsqueda */}
                  {parentResults.length > 0 && (
                    <div className="mt-2 border rounded-lg divide-y max-h-48 overflow-y-auto">
                      {parentResults.map((parent) => (
                        <button
                          key={parent._id}
                          type="button"
                          onClick={() => selectParent(parent)}
                          className="w-full p-3 text-left hover:bg-gray-50 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium">{parent.firstName} {parent.lastName}</p>
                            <p className="text-sm text-gray-500">{parent.email} • DNI: {parent.dni}</p>
                          </div>
                          <Badge variant="outline">
                            {parent.source === 'parent' ? 'Padre/Madre' : 'Usuario'}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Padre seleccionado */}
                {selectedParent && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                          {selectedParent.firstName[0]}{selectedParent.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {selectedParent.firstName} {selectedParent.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{selectedParent.email}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedParent(null)
                          setFormData({ ...formData, parentId: '', parentSource: '' })
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Relación</label>
                      <select
                        value={formData.relationship}
                        onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      >
                        {RELATIONSHIPS.map((rel) => (
                          <option key={rel} value={rel}>
                            {rel.charAt(0).toUpperCase() + rel.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {!selectedParent && !student && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">Opcional</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Puedes vincular un apoderado ahora o hacerlo después desde el perfil del estudiante.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-4 bg-gray-50 flex items-center justify-between">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {student ? 'Actualizar' : 'Registrar Estudiante'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal de Ver Detalle
function StudentDetailModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const { data: academicData } = useQuery({
    queryKey: ['student-academic', student._id],
    queryFn: () => studentsManagementService.getAcademic(student._id),
    enabled: !!student._id,
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header con Avatar */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold border-4 border-white/30">
                {student.firstName[0]}{student.lastName[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{student.firstName} {student.lastName}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <Badge className="bg-white/20 text-white border-0">
                    {student.studentCode || 'Sin código'}
                  </Badge>
                  <Badge className={`border-0 ${student.isActive ? 'bg-green-500' : 'bg-red-500'}`}>
                    {student.status || (student.isActive ? 'Activo' : 'Inactivo')}
                  </Badge>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Datos Personales */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" /> Datos Personales
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">DNI</span>
                  <span className="font-medium">{student.dni}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Correo</span>
                  <span className="font-medium text-sm">{student.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Teléfono</span>
                  <span className="font-medium">{student.phone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fecha de Nacimiento</span>
                  <span className="font-medium">
                    {student.birthDate ? formatDate(student.birthDate) : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Edad</span>
                  <span className="font-medium">
                    {student.birthDate ? `${calculateAge(student.birthDate)} años` : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Género</span>
                  <span className="font-medium">{student.gender}</span>
                </div>
              </div>
            </div>

            {/* Datos Académicos */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" /> Información Académica
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Grado</span>
                  <span className="font-medium">{student.gradeLevel || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sección</span>
                  <span className="font-medium">{student.section || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Turno</span>
                  <span className="font-medium">{student.shift || 'Mañana'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">N° Matrícula</span>
                  <span className="font-medium">{student.enrollmentNumber || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Promedio</span>
                  <span className="font-medium text-emerald-600">
                    {academicData?.data?.averageGrade || '-'}
                  </span>
                </div>
              </div>

              {/* Stats de asistencia */}
              {academicData?.data?.attendanceStats && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <p className="text-lg font-bold text-green-600">
                      {academicData.data.attendanceStats.presente || 0}
                    </p>
                    <p className="text-xs text-gray-500">Presente</p>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded-lg">
                    <p className="text-lg font-bold text-red-600">
                      {academicData.data.attendanceStats.ausente || 0}
                    </p>
                    <p className="text-xs text-gray-500">Ausente</p>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded-lg">
                    <p className="text-lg font-bold text-yellow-600">
                      {academicData.data.attendanceStats.tardanza || 0}
                    </p>
                    <p className="text-xs text-gray-500">Tardanza</p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <p className="text-lg font-bold text-blue-600">
                      {academicData.data.attendanceStats.rate || '0%'}
                    </p>
                    <p className="text-xs text-gray-500">Asistencia</p>
                  </div>
                </div>
              )}
            </div>

            {/* Apoderados */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" /> Apoderados
              </h3>
              
              {student.guardians && student.guardians.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {student.guardians.map((guardian, index) => {
                    const person = guardian.parent || guardian.user
                    if (!person) return null
                    return (
                      <div key={index} className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                          {person.firstName[0]}{person.lastName[0]}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{person.firstName} {person.lastName}</p>
                          <p className="text-sm text-gray-500">{person.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {guardian.relationship}
                            </Badge>
                            {guardian.isPrimary && (
                              <Badge className="text-xs bg-emerald-100 text-emerald-700 border-0">
                                Principal
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : student.parent ? (
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                    {student.parent.firstName[0]}{student.parent.lastName[0]}
                  </div>
                  <div>
                    <p className="font-medium">{student.parent.firstName} {student.parent.lastName}</p>
                    <p className="text-sm text-gray-500">{student.parent.email}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                  <p className="text-yellow-700">Sin apoderado registrado</p>
                </div>
              )}
            </div>

            {/* Información Médica */}
            {student.medicalInfo && (
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" /> Información Médica
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Tipo de Sangre</p>
                    <p className="font-medium">{student.medicalInfo.bloodType || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Alergias</p>
                    <p className="font-medium">
                      {student.medicalInfo.allergies?.length 
                        ? student.medicalInfo.allergies.join(', ') 
                        : 'Ninguna'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Condiciones</p>
                    <p className="font-medium">
                      {student.medicalInfo.conditions?.length 
                        ? student.medicalInfo.conditions.join(', ') 
                        : 'Ninguna'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Página Principal
export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [page, setPage] = useState(1)
  
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Query principal
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['students-management', page, searchTerm, selectedGrade, selectedSection, selectedStatus],
    queryFn: () => studentsManagementService.getAll({
      page,
      limit: 15,
      search: searchTerm || undefined,
      gradeLevel: selectedGrade || undefined,
      section: selectedSection || undefined,
      status: selectedStatus || undefined,
    }),
  })

  // Query de estadísticas
  const { data: statsData } = useQuery({
    queryKey: ['students-stats'],
    queryFn: () => studentsManagementService.getStats(),
  })

  const students = data?.data || []
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 }
  const stats = statsData?.data?.general || { total: 0, active: 0, inactive: 0, recentEnrollments: 0 }

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: StudentFormData) => studentsManagementService.create(data as Parameters<typeof studentsManagementService.create>[0]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-management'] })
      queryClient.invalidateQueries({ queryKey: ['students-stats'] })
      toast({ title: '✅ Estudiante registrado', description: 'El estudiante fue creado exitosamente' })
      setShowModal(false)
      setSelectedStudent(null)
    },
    onError: (error: Error) => {
      toast({ title: '❌ Error', description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StudentFormData> }) => 
      studentsManagementService.update(id, data as Parameters<typeof studentsManagementService.update>[1]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-management'] })
      toast({ title: '✅ Estudiante actualizado', description: 'Los cambios fueron guardados' })
      setShowModal(false)
      setSelectedStudent(null)
    },
    onError: (error: Error) => {
      toast({ title: '❌ Error', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentsManagementService.delete(id, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-management'] })
      queryClient.invalidateQueries({ queryKey: ['students-stats'] })
      toast({ title: '✅ Estudiante desactivado', description: 'El estudiante fue dado de baja' })
    },
    onError: (error: Error) => {
      toast({ title: '❌ Error', description: error.message, variant: 'destructive' })
    },
  })

  const handleSave = (formData: StudentFormData) => {
    if (selectedStudent) {
      updateMutation.mutate({ id: selectedStudent._id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (student: Student) => {
    setSelectedStudent(student)
    setShowModal(true)
  }

  const handleView = (student: Student) => {
    setSelectedStudent(student)
    setShowDetailModal(true)
  }

  const handleDelete = (student: Student) => {
    if (confirm(`¿Desactivar al estudiante ${student.firstName} ${student.lastName}?`)) {
      deleteMutation.mutate(student._id)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Estudiantes</h1>
          <p className="text-gray-500 mt-1">Administra los estudiantes registrados en el sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button 
            onClick={() => { setSelectedStudent(null); setShowModal(true); }}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Estudiante
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Estudiantes" value={stats.total} icon={Users} color="bg-emerald-500" />
        <StatCard title="Activos" value={stats.active} icon={Check} color="bg-green-500" />
        <StatCard title="Inactivos" value={stats.inactive} icon={X} color="bg-red-500" />
        <StatCard 
          title="Nuevas Matrículas" 
          value={stats.recentEnrollments} 
          icon={GraduationCap} 
          color="bg-blue-500" 
          subValue="Último mes"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, DNI, código o email..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <select
              value={selectedGrade}
              onChange={(e) => { setSelectedGrade(e.target.value); setPage(1); }}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos los grados</option>
              {GRADE_LEVELS.map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
            <select
              value={selectedSection}
              onChange={(e) => { setSelectedSection(e.target.value); setPage(1); }}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todas las secciones</option>
              {SECTIONS.map((section) => (
                <option key={section} value={section}>Sección {section}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos los estados</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estudiante</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">DNI</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Grado/Sección</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-36" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>No se encontraron estudiantes</p>
                  </td>
                </tr>
              ) : (
                students.map((student: Student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <span className="text-emerald-700 font-medium text-sm">
                            {student.firstName[0]}{student.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                          <p className="text-xs text-gray-500">{student.studentCode || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.dni}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {student.gradeLevel ? `${student.gradeLevel} - ${student.section || 'A'}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                    <td className="px-6 py-4">
                      <Badge className={`${
                        student.status === 'activo' || student.isActive
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      } border-0`}>
                        {student.status || (student.isActive ? 'Activo' : 'Inactivo')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleView(student)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(student)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(student)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Mostrando página {pagination.page} de {pagination.pages} ({pagination.total} estudiantes)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      {showModal && (
        <StudentModal
          student={selectedStudent}
          onClose={() => { setShowModal(false); setSelectedStudent(null); }}
          onSave={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {showDetailModal && selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => { setShowDetailModal(false); setSelectedStudent(null); }}
        />
      )}
    </div>
  )
}
