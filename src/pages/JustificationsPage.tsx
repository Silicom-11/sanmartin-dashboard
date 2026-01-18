import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, FileText, Clock, CheckCircle, XCircle, Eye, Download, Image, X, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
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

function JustificationDetailModal({ justification, onClose, onApprove, onReject, isLoading }: { justification: Justification; onClose: () => void; onApprove: (note: string) => void; onReject: (note: string) => void; isLoading?: boolean }) {
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
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" disabled={isLoading}><X className="w-5 h-5" /></button>
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
                <Input value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Añade una nota..." className="mt-1" disabled={isLoading} />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 border-red-500 text-red-600 hover:bg-red-50" onClick={() => onReject(reviewNote)} disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}Rechazar
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => onApprove(reviewNote)} disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}Aprobar
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
  
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Query para obtener justificaciones
  const { data, isLoading } = useQuery({
    queryKey: ['justifications', searchTerm, statusFilter],
    queryFn: async () => {
      const response = await api.get('/justifications', { params: statusFilter !== 'all' ? { status: statusFilter } : {} })
      return response.data
    },
  })

  // Query para estadísticas
  const { data: statsData } = useQuery({
    queryKey: ['justifications-stats'],
    queryFn: async () => {
      const response = await api.get('/justifications/stats')
      return response.data
    },
  })

  const stats = statsData?.data || { total: 0, pending: 0, approved: 0, rejected: 0 }

  // Mutation para aprobar
  const approveMutation = useMutation({
    mutationFn: async ({ id, reviewNote }: { id: string; reviewNote: string }) => {
      const response = await api.put(`/justifications/${id}/review`, { status: 'approved', reviewNote })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['justifications'] })
      queryClient.invalidateQueries({ queryKey: ['justifications-stats'] })
      toast({ title: 'Justificación aprobada', description: 'La solicitud fue aprobada exitosamente' })
      setSelectedJustification(null)
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  // Mutation para rechazar
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reviewNote }: { id: string; reviewNote: string }) => {
      const response = await api.put(`/justifications/${id}/review`, { status: 'rejected', reviewNote })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['justifications'] })
      queryClient.invalidateQueries({ queryKey: ['justifications-stats'] })
      toast({ title: 'Justificación rechazada', description: 'La solicitud fue rechazada' })
      setSelectedJustification(null)
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const justifications = (data?.data || []).filter((j: Justification) => {
    const matchesSearch = `${j.student.firstName} ${j.student.lastName} ${j.reason}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleApprove = (reviewNote: string) => {
    if (selectedJustification) {
      approveMutation.mutate({ id: selectedJustification._id, reviewNote })
    }
  }

  const handleReject = (reviewNote: string) => {
    if (selectedJustification) {
      rejectMutation.mutate({ id: selectedJustification._id, reviewNote })
    }
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
        <StatCard title="Total Solicitudes" value={stats.total} icon={FileText} color="bg-blue-500" />
        <StatCard title="Pendientes" value={stats.pending} icon={Clock} color="bg-yellow-500" />
        <StatCard title="Aprobadas" value={stats.approved} icon={CheckCircle} color="bg-green-500" />
        <StatCard title="Rechazadas" value={stats.rejected} icon={XCircle} color="bg-red-500" />
      </div>

      {stats.pending > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800">Tienes <strong>{stats.pending}</strong> justificaciones pendientes de revisión</span>
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
        <JustificationDetailModal 
          justification={selectedJustification} 
          onClose={() => setSelectedJustification(null)} 
          onApprove={handleApprove} 
          onReject={handleReject}
          isLoading={approveMutation.isPending || rejectMutation.isPending}
        />
      )}
    </div>
  )
}
