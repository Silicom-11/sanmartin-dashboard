import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, FileText, Clock, CheckCircle, XCircle, Eye, Download, Image, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/services/api'

interface Justification {
  _id: string
  student: { firstName: string; lastName: string; enrollmentNumber: string; gradeLevel: string }
  parent: { firstName: string; lastName: string; phone: string }
  date: string
  reason: string
  description: string
  attachmentUrl?: string
  attachmentType?: 'image' | 'pdf'
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy?: string
  reviewedAt?: string
  reviewNote?: string
}

const mockJustifications: Justification[] = [
  { _id: '1', student: { firstName: 'María', lastName: 'García', enrollmentNumber: '2024-001', gradeLevel: '3° Primaria A' }, parent: { firstName: 'Roberto', lastName: 'García', phone: '+51 999 111 222' }, date: '2024-01-15', reason: 'Cita médica', description: 'Mi hija tenía cita con el pediatra para control de rutina.', attachmentUrl: '/uploads/justifications/cita-medica.jpg', attachmentType: 'image', status: 'pending' },
  { _id: '2', student: { firstName: 'Carlos', lastName: 'López', enrollmentNumber: '2024-002', gradeLevel: '1° Secundaria B' }, parent: { firstName: 'Ana', lastName: 'López', phone: '+51 999 333 444' }, date: '2024-01-14', reason: 'Enfermedad', description: 'El niño presentó fiebre alta desde la noche anterior. Adjunto certificado médico.', attachmentUrl: '/uploads/justifications/certificado.pdf', attachmentType: 'pdf', status: 'approved', reviewedBy: 'Admin', reviewedAt: '2024-01-14', reviewNote: 'Certificado válido' },
  { _id: '3', student: { firstName: 'Pedro', lastName: 'Martínez', enrollmentNumber: '2024-003', gradeLevel: '4° Primaria A' }, parent: { firstName: 'Carmen', lastName: 'Martínez', phone: '+51 999 555 666' }, date: '2024-01-13', reason: 'Viaje familiar', description: 'Viaje de emergencia por fallecimiento de familiar.', status: 'approved', reviewedBy: 'Director', reviewedAt: '2024-01-13' },
  { _id: '4', student: { firstName: 'Laura', lastName: 'Sánchez', enrollmentNumber: '2024-004', gradeLevel: '2° Secundaria A' }, parent: { firstName: 'José', lastName: 'Sánchez', phone: '+51 999 777 888' }, date: '2024-01-12', reason: 'Otro', description: 'Problemas de transporte, no había manera de llegar al colegio.', status: 'rejected', reviewedBy: 'Admin', reviewedAt: '2024-01-12', reviewNote: 'Motivo no justificable según reglamento' },
  { _id: '5', student: { firstName: 'Diego', lastName: 'Torres', enrollmentNumber: '2024-005', gradeLevel: '5° Primaria B' }, parent: { firstName: 'María', lastName: 'Torres', phone: '+51 999 999 000' }, date: '2024-01-15', reason: 'Cita médica', description: 'Tratamiento de ortodoncia programado.', attachmentUrl: '/uploads/justifications/ortodoncia.jpg', attachmentType: 'image', status: 'pending' },
]

const mockStats = { total: 156, pending: 12, approved: 132, rejected: 12 }

const statusConfig = {
  pending: { label: 'Pendiente', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
  approved: { label: 'Aprobada', bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  rejected: { label: 'Rechazada', bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${color}`}><Icon className="w-6 h-6 text-white" /></div>
        </div>
      </CardContent>
    </Card>
  )
}

function JustificationDetailModal({ justification, onClose, onApprove, onReject }: { justification: Justification; onClose: () => void; onApprove: () => void; onReject: () => void }) {
  const [reviewNote, setReviewNote] = useState('')
  const config = statusConfig[justification.status]
  const StatusIcon = config.icon

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bg}`}>
              <StatusIcon className={`w-5 h-5 ${config.text}`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Solicitud de Justificación</h2>
              <Badge className={`${config.bg} ${config.text}`}>{config.label}</Badge>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Estudiante</h4>
              <p className="font-semibold">{justification.student.firstName} {justification.student.lastName}</p>
              <p className="text-sm text-gray-500">{justification.student.gradeLevel}</p>
              <p className="text-xs text-gray-400">{justification.student.enrollmentNumber}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Padre/Tutor</h4>
              <p className="font-semibold">{justification.parent.firstName} {justification.parent.lastName}</p>
              <p className="text-sm text-gray-500">{justification.parent.phone}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Fecha de Inasistencia</h4>
            <p className="font-medium">{new Date(justification.date).toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Motivo</h4>
            <Badge variant="outline">{justification.reason}</Badge>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Descripción</h4>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">{justification.description}</p>
          </div>

          {justification.attachmentUrl && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Archivo Adjunto</h4>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                {justification.attachmentType === 'image' ? (
                  <Image className="w-8 h-8 text-blue-500" />
                ) : (
                  <FileText className="w-8 h-8 text-red-500" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{justification.attachmentType === 'image' ? 'Imagen adjunta' : 'Documento PDF'}</p>
                  <p className="text-sm text-gray-500">Clic para ver</p>
                </div>
                <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" />Descargar</Button>
              </div>
            </div>
          )}

          {justification.status !== 'pending' && justification.reviewNote && (
            <div className={`p-4 rounded-xl ${justification.status === 'approved' ? 'bg-green-50' : 'bg-red-50'}`}>
              <h4 className="text-sm font-medium mb-1">Nota de Revisión</h4>
              <p className="text-gray-700">{justification.reviewNote}</p>
              <p className="text-xs text-gray-400 mt-2">Por {justification.reviewedBy} el {justification.reviewedAt}</p>
            </div>
          )}

          {justification.status === 'pending' && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium text-gray-700">Nota de Revisión (opcional)</label>
                <Input value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Añade una nota..." className="mt-1" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 border-red-500 text-red-600 hover:bg-red-50" onClick={onReject}>
                  <XCircle className="w-4 h-4 mr-2" />Rechazar
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={onApprove}>
                  <CheckCircle className="w-4 h-4 mr-2" />Aprobar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function JustificationsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [selectedJustification, setSelectedJustification] = useState<Justification | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['justifications', searchTerm, statusFilter],
    queryFn: async () => {
      try {
        const response = await api.get('/api/justifications')
        return response.data
      } catch {
        return { data: mockJustifications }
      }
    },
  })

  const justifications = (data?.data || mockJustifications).filter((j: Justification) => {
    const matchesSearch = `${j.student.firstName} ${j.student.lastName} ${j.reason}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleApprove = () => {
    setSelectedJustification(null)
  }

  const handleReject = () => {
    setSelectedJustification(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Justificaciones</h1>
          <p className="text-gray-500 mt-1">Revisión de solicitudes de justificación de inasistencias</p>
        </div>
        <Button variant="outline"><Download className="w-4 h-4 mr-2" />Exportar</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Solicitudes" value={mockStats.total} icon={FileText} color="bg-blue-500" />
        <StatCard title="Pendientes" value={mockStats.pending} icon={Clock} color="bg-yellow-500" />
        <StatCard title="Aprobadas" value={mockStats.approved} icon={CheckCircle} color="bg-green-500" />
        <StatCard title="Rechazadas" value={mockStats.rejected} icon={XCircle} color="bg-red-500" />
      </div>

      {mockStats.pending > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800">Tienes <strong>{mockStats.pending}</strong> justificaciones pendientes de revisión</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Buscar por estudiante o motivo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                <Button key={status} variant={statusFilter === status ? 'default' : 'outline'} onClick={() => setStatusFilter(status)} size="sm">
                  {status === 'all' ? 'Todas' : statusConfig[status].label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {justifications.map((justification: Justification) => {
            const config = statusConfig[justification.status]
            const StatusIcon = config.icon
            
            return (
              <Card key={justification._id} className={`hover:shadow-lg transition-shadow ${justification.status === 'pending' ? 'border-yellow-200' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-sanmartin-primary rounded-full flex items-center justify-center text-white font-bold">
                        {justification.student.firstName[0]}{justification.student.lastName[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{justification.student.firstName} {justification.student.lastName}</h3>
                          <Badge className={`${config.bg} ${config.text}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />{config.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{justification.student.gradeLevel}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{new Date(justification.date).toLocaleDateString('es-PE')}</span>
                          <Badge variant="outline">{justification.reason}</Badge>
                          {justification.attachmentUrl && (
                            <span className="flex items-center gap-1 text-blue-600">
                              {justification.attachmentType === 'image' ? <Image className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                              Con adjunto
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedJustification(justification)}>
                      <Eye className="w-4 h-4 mr-2" />Revisar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {selectedJustification && (
        <JustificationDetailModal justification={selectedJustification} onClose={() => setSelectedJustification(null)} onApprove={handleApprove} onReject={handleReject} />
      )}
    </div>
  )
}
