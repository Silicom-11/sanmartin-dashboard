import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, FileText, Eye, Download, Image, X, Paperclip, Calendar, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
  student: { _id: string; firstName: string; lastName: string; enrollmentNumber?: string; gradeLevel?: string; section?: string }
  parent?: { _id: string; firstName: string; lastName: string; phone?: string; email?: string }
  dates: string[]
  reason: string
  observations?: string
  documents: JustificationDocument[]
  status: string
  createdAt: string
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
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  }

  const isImageDoc = (doc: JustificationDocument) => {
    return doc.mimetype?.startsWith('image') || doc.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  }

  const getDocUrl = (doc: JustificationDocument) => {
    const baseUrl = (api.defaults.baseURL || '').replace('/api', '')
    if (doc.url) {
      if (doc.url.startsWith('/api/')) return `${baseUrl}${doc.url}`
      if (doc.url.startsWith('http') && !doc.url.includes('r2.cloudflarestorage.com')) return doc.url
      if (doc.key) return `${baseUrl}/api/uploads/r2/${doc.key}`
      return doc.url
    }
    if (doc.key) return `${baseUrl}/api/uploads/r2/${doc.key}`
    return `${baseUrl}/uploads/justifications/${doc.name}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <FileText className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Justificación de Inasistencia</h2>
              <p className="text-sm text-gray-500">Presentada por padre/apoderado</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Estudiante</h4>
              <p className="font-semibold">{justification.student.firstName} {justification.student.lastName}</p>
              {justification.student.gradeLevel && (
                <p className="text-sm text-gray-500">
                  {justification.student.gradeLevel}
                  {justification.student.section ? ` - Sección ${justification.student.section}` : ''}
                </p>
              )}
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Presentada por</h4>
              {justification.parent ? (
                <>
                  <p className="font-semibold">{justification.parent.firstName} {justification.parent.lastName}</p>
                  {justification.parent.phone && <p className="text-sm text-gray-500">{justification.parent.phone}</p>}
                  {justification.parent.email && <p className="text-xs text-gray-400">{justification.parent.email}</p>}
                </>
              ) : (
                <p className="text-gray-400">No disponible</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Fechas de Inasistencia
            </h4>
            <div className="flex flex-wrap gap-2">
              {(justification.dates || []).map((date, i) => (
                <Badge key={i} variant="outline" className="text-sm">{formatDate(date)}</Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Motivo</h4>
            <Badge variant="outline" className="text-sm">{justification.reason}</Badge>
          </div>

          {justification.observations && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Observaciones</h4>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">{justification.observations}</p>
            </div>
          )}

          {justification.documents && justification.documents.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <Paperclip className="w-4 h-4" /> Documentos Adjuntos ({justification.documents.length})
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {justification.documents.map((doc, i) => {
                  const docUrl = getDocUrl(doc)
                  const handleDownload = async (e: React.MouseEvent) => {
                    e.preventDefault()
                    try {
                      const response = await fetch(docUrl)
                      const blob = await response.blob()
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = doc.name || `documento-${i + 1}`
                      document.body.appendChild(a)
                      a.click()
                      window.URL.revokeObjectURL(url)
                      document.body.removeChild(a)
                    } catch {
                      window.open(docUrl, '_blank')
                    }
                  }
                  return (
                  <button
                    key={i}
                    onClick={handleDownload}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border text-left"
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
                  </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-400 text-right">
            Registrada el {new Date(justification.createdAt).toLocaleDateString('es-PE', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function JustificationsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedJustification, setSelectedJustification] = useState<Justification | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['justifications'],
    queryFn: async () => {
      const response = await api.get('/justifications')
      return response.data
    },
  })

  const { data: statsData } = useQuery({
    queryKey: ['justifications-stats'],
    queryFn: async () => {
      const response = await api.get('/justifications/stats')
      return response.data
    },
  })

  const stats = statsData?.data || { total: 0, recentCount: 0 }
  const allJustifications: Justification[] = data?.data || []
  const uniqueStudents = new Set(allJustifications.map(j => j.student?._id)).size

  const justifications = allJustifications.filter((j: Justification) => {
    const studentName = `${j.student?.firstName || ''} ${j.student?.lastName || ''}`.toLowerCase()
    return studentName.includes(searchTerm.toLowerCase()) ||
      (j.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Justificaciones" value={stats.total} icon={FileText} color="bg-blue-500" />
        <StatCard title="Estudiantes Justificados" value={uniqueStudents} icon={Users} color="bg-green-500" />
        <StatCard title="Esta Semana" value={stats.recentCount || 0} icon={Calendar} color="bg-purple-500" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Buscar por estudiante o motivo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
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
            <p className="text-gray-500">No hay justificaciones registradas aún.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {justifications.map((justification) => {
            const docCount = justification.documents?.length || 0
            return (
              <Card key={justification._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {justification.student?.firstName?.[0]}{justification.student?.lastName?.[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold">{justification.student?.firstName} {justification.student?.lastName}</h3>
                        {justification.student?.gradeLevel && (
                          <p className="text-sm text-gray-500">
                            {justification.student.gradeLevel}
                            {justification.student.section ? ` - Sección ${justification.student.section}` : ''}
                          </p>
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
                          {justification.parent && (
                            <span className="text-gray-400">
                              por {justification.parent.firstName} {justification.parent.lastName}
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
