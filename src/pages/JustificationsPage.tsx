import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, FileText, Clock, CheckCircle, XCircle, Eye, Download, Image, X, AlertCircle, Loader2, Paperclip, Calendar, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import api from '@/services/api'

interface JustificationDocument {
  name: string
  url?: string
  key?: string
  mimetype?: string
  size?: number
  storage?: 'local' | 'r2'
}

interface Justification {
  _id: string
  student: { _id: string; firstName: string; lastName: string; enrollmentNumber?: string; gradeLevel?: string }
  parent?: { _id: string; firstName: string; lastName: string; phone?: string; email?: string }
  submittedBy?: { _id: string; firstName: string; lastName: string }
  dates: string[]
  reason: string
  observations?: string
  documents: JustificationDocument[]
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy?: { firstName: string; lastName: string }
  reviewComments?: string
  reviewedAt?: string
  coursesAffected?: string[]
  createdAt: string
  updatedAt: string
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

function JustificationDetailModal({ justification, onClose }: {
  justification: Justification
  onClose: () => void
}) {
  const [reviewComments, setReviewComments] = useState('')
  const config = statusConfig[justification.status]
  const StatusIcon = config.icon

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  }

  const isImageDoc = (doc: JustificationDocument) => {
    return doc.mimetype?.startsWith('image') || doc.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  }

  const getDocUrl = (doc: JustificationDocument) => {
    if (doc.url) return doc.url
    // Fallback to API base + uploads path
    const baseUrl = (api.defaults.baseURL || '').replace('/api', '')
    return `${baseUrl}/uploads/justifications/${doc.name}`
  }

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
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" disabled={isLoading}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Student & Parent info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Estudiante</h4>
              <p className="font-semibold">{justification.student.firstName} {justification.student.lastName}</p>
              {justification.student.gradeLevel && <p className="text-sm text-gray-500">{justification.student.gradeLevel}</p>}
              {justification.student.enrollmentNumber && <p className="text-xs text-gray-400">{justification.student.enrollmentNumber}</p>}
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Solicitante</h4>
              {justification.parent ? (
                <>
                  <p className="font-semibold">{justification.parent.firstName} {justification.parent.lastName}</p>
                  {justification.parent.phone && <p className="text-sm text-gray-500">{justification.parent.phone}</p>}
                </>
              ) : justification.submittedBy ? (
                <p className="font-semibold">{justification.submittedBy.firstName} {justification.submittedBy.lastName}</p>
              ) : (
                <p className="text-gray-400">No disponible</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Fechas de Inasistencia
            </h4>
            <div className="flex flex-wrap gap-2">
              {(justification.dates || []).map((date, i) => (
                <Badge key={i} variant="outline" className="text-sm">{formatDate(date)}</Badge>
              ))}
              {(!justification.dates || justification.dates.length === 0) && (
                <p className="text-gray-400 text-sm">Sin fechas registradas</p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Motivo</h4>
            <Badge variant="outline" className="text-sm">{justification.reason}</Badge>
          </div>

          {/* Observations */}
          {justification.observations && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Observaciones</h4>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">{justification.observations}</p>
            </div>
          )}

          {/* Documents */}
          {justification.documents && justification.documents.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <Paperclip className="w-4 h-4" /> Documentos Adjuntos ({justification.documents.length})
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {justification.documents.map((doc, i) => (
                  <a
                    key={i}
                    href={getDocUrl(doc)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border"
                  >
                    {isImageDoc(doc) ? (
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Image className="w-6 h-6 text-blue-500" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-red-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.name || `Documento ${i + 1}`}</p>
                      <p className="text-xs text-gray-500">
                        {doc.storage === 'r2' ? 'Nube' : 'Local'} • {doc.mimetype || 'archivo'}
                      </p>
                    </div>
                    <Download className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Review info (if already reviewed) */}
          {justification.status !== 'pending' && justification.reviewComments && (
            <div className={`p-4 rounded-xl ${justification.status === 'approved' ? 'bg-green-50' : 'bg-red-50'}`}>
              <h4 className="text-sm font-medium mb-1">Nota de Revisión</h4>
              <p className="text-gray-700">{justification.reviewComments}</p>
              {justification.reviewedBy && (
                <p className="text-xs text-gray-400 mt-2">
                  Por {justification.reviewedBy.firstName} {justification.reviewedBy.lastName}
                  {justification.reviewedAt && ` el ${formatDate(justification.reviewedAt)}`}
                </p>
              )}
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

  // Fetch justifications
  const { data, isLoading } = useQuery({
    queryKey: ['justifications', statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (statusFilter !== 'all') params.status = statusFilter
      const response = await api.get('/justifications', { params })
      return response.data
    },
  })

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['justifications-stats'],
    queryFn: async () => {
      const response = await api.get('/justifications/stats')
      return response.data
    },
  })

  const stats = statsData?.data || { total: 0, pending: 0, approved: 0, rejected: 0 }

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments: string }) => {
      const response = await api.put(`/justifications/${id}/review`, { status: 'approved', comments })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['justifications'] })
      queryClient.invalidateQueries({ queryKey: ['justifications-stats'] })
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast({ title: '✓ Justificación aprobada', description: 'La asistencia del alumno fue actualizada automáticamente a "Justificado"' })
      setSelectedJustification(null)
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments: string }) => {
      const response = await api.put(`/justifications/${id}/review`, { status: 'rejected', comments })
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

  const justifications: Justification[] = (data?.data || []).filter((j: Justification) => {
    const studentName = `${j.student?.firstName || ''} ${j.student?.lastName || ''}`.toLowerCase()
    const matchesSearch = studentName.includes(searchTerm.toLowerCase()) ||
      (j.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Justificaciones</h1>
          <p className="text-gray-500 mt-1">Registro de justificaciones de inasistencias presentadas por los padres</p>
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
            <span className="text-yellow-800">
              Hay <strong>{stats.pending}</strong> justificación{stats.pending !== 1 ? 'es' : ''} pendiente{stats.pending !== 1 ? 's' : ''} de revisión desde la app
            </span>
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
      ) : justifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin justificaciones</h3>
            <p className="text-gray-500">No hay solicitudes que coincidan con los filtros.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {justifications.map((justification) => {
            const config = statusConfig[justification.status]
            const StatusIcon = config.icon
            const docCount = justification.documents?.length || 0

            return (
              <Card key={justification._id} className={`hover:shadow-lg transition-shadow ${justification.status === 'pending' ? 'border-yellow-200' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-sanmartin-primary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {justification.student?.firstName?.[0]}{justification.student?.lastName?.[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{justification.student?.firstName} {justification.student?.lastName}</h3>
                          <Badge className={`${config.bg} ${config.text}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />{config.label}
                          </Badge>
                        </div>
                        {justification.student?.gradeLevel && (
                          <p className="text-sm text-gray-500">{justification.student.gradeLevel}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {(justification.dates || []).map(d => formatDate(d)).join(', ') || 'Sin fecha'}
                          </span>
                          <Badge variant="outline">{justification.reason}</Badge>
                          {docCount > 0 && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <Paperclip className="w-4 h-4" />
                              {docCount} archivo{docCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedJustification(justification)} className="flex-shrink-0">
                      <Eye className="w-4 h-4 mr-2" />Ver Detalle
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
        />
      )}
    </div>
  )
}
