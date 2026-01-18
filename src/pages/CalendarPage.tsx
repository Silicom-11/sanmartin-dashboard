import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Users, Tag, X, GraduationCap, Flag, PartyPopper, Bell, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import api from '@/services/api'

interface CalendarEvent {
  _id?: string
  id?: string
  title: string
  date: string
  time?: string
  type: 'exam' | 'meeting' | 'holiday' | 'activity' | 'deadline'
  description?: string
  location?: string
  participants?: string
  notifyStudents?: boolean
  notifyParents?: boolean
  notifyTeachers?: boolean
}

const mockEvents: CalendarEvent[] = [
  { id: '1', title: 'Examen de Matemáticas - 3° Primaria', date: '2024-01-15', time: '08:00', type: 'exam', description: 'Evaluación Bimestre 1', location: 'Aulas 3A, 3B, 3C' },
  { id: '2', title: 'Reunión de Padres', date: '2024-01-18', time: '17:00', type: 'meeting', description: 'Entrega de libretas B1', location: 'Auditorio Principal', participants: 'Todos los grados' },
  { id: '3', title: 'Día del Maestro', date: '2024-01-20', type: 'holiday', description: 'Feriado escolar' },
  { id: '4', title: 'Olimpiadas Deportivas', date: '2024-01-22', time: '09:00', type: 'activity', description: 'Competencias interaulas', location: 'Campo deportivo' },
  { id: '5', title: 'Entrega de Notas B1', date: '2024-01-25', type: 'deadline', description: 'Fecha límite docentes' },
  { id: '6', title: 'Simulacro de Sismo', date: '2024-01-28', time: '10:00', type: 'activity', description: 'Evacuación general', participants: 'Toda la institución' },
]

const eventColors = {
  exam: { bg: 'bg-red-100', text: 'text-red-700', icon: GraduationCap },
  meeting: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Users },
  holiday: { bg: 'bg-green-100', text: 'text-green-700', icon: PartyPopper },
  activity: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Flag },
  deadline: { bg: 'bg-orange-100', text: 'text-orange-700', icon: Clock },
}

const eventLabels = { exam: 'Examen', meeting: 'Reunión', holiday: 'Feriado', activity: 'Actividad', deadline: 'Fecha Límite' }

// Modal para crear/editar evento
function CreateEventModal({ onClose, onSave, isLoading }: { onClose: () => void; onSave: (event: Omit<CalendarEvent, 'id'>) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    type: 'activity' as CalendarEvent['type'],
    description: '',
    location: '',
    participants: '',
    notifyStudents: true,
    notifyParents: true,
    notifyTeachers: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">Nuevo Evento</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" disabled={isLoading}><X className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título del Evento *</label>
            <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required placeholder="Ej: Examen de Matemáticas" disabled={isLoading} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required disabled={isLoading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
              <Input type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} disabled={isLoading} />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Evento *</label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(eventColors) as Array<keyof typeof eventColors>).map((type) => {
                const config = eventColors[type]
                const Icon = config.icon
                const isSelected = formData.type === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({...formData, type})}
                    className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${isSelected ? `${config.bg} ring-2 ring-offset-2 ring-gray-400` : 'bg-gray-50 hover:bg-gray-100'}`}
                    disabled={isLoading}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? config.text : 'text-gray-500'}`} />
                    <span className={`text-xs ${isSelected ? config.text : 'text-gray-500'}`}>{eventLabels[type]}</span>
                  </button>
                )
              })}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sanmartin-primary resize-none"
              rows={3}
              placeholder="Detalles adicionales del evento..."
              disabled={isLoading}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
              <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="Ej: Auditorio" disabled={isLoading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Participantes</label>
              <Input value={formData.participants} onChange={(e) => setFormData({...formData, participants: e.target.value})} placeholder="Ej: 3° Primaria" disabled={isLoading} />
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Notificar a:</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'notifyStudents', label: 'Estudiantes', icon: GraduationCap },
                { key: 'notifyParents', label: 'Padres', icon: Users },
                { key: 'notifyTeachers', label: 'Docentes', icon: Flag },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({...formData, [key]: !formData[key as keyof typeof formData]})}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${formData[key as keyof typeof formData] ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}
                  disabled={isLoading}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-blue-700 mt-2">Las notificaciones se enviarán automáticamente a la app móvil</p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-sanmartin-primary hover:bg-sanmartin-primary-dark" disabled={isLoading}>
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : <><Plus className="w-4 h-4 mr-2" />Crear Evento</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EventModal({ event, onClose, onSendReminder, onEdit }: { event: CalendarEvent; onClose: () => void; onSendReminder: () => void; onEdit: () => void }) {
  const config = eventColors[event.type]
  const Icon = config.icon

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className={`p-6 ${config.bg} rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 bg-white rounded-xl`}>
                <Icon className={`w-6 h-6 ${config.text}`} />
              </div>
              <Badge className={`${config.bg} ${config.text}`}>{eventLabels[event.type]}</Badge>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <h2 className="text-xl font-semibold mt-4">{event.title}</h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 text-gray-600">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <span>{new Date(event.date).toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          
          {event.time && (
            <div className="flex items-center gap-3 text-gray-600">
              <Clock className="w-5 h-5 text-gray-400" />
              <span>{event.time}</span>
            </div>
          )}
          
          {event.location && (
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span>{event.location}</span>
            </div>
          )}
          
          {event.participants && (
            <div className="flex items-center gap-3 text-gray-600">
              <Users className="w-5 h-5 text-gray-400" />
              <span>{event.participants}</span>
            </div>
          )}
          
          {event.description && (
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-gray-600">{event.description}</p>
            </div>
          )}
          
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={onEdit}>Editar</Button>
            <Button onClick={onSendReminder} className="flex-1 bg-sanmartin-primary hover:bg-sanmartin-primary-dark">
              <Send className="w-4 h-4 mr-2" />Enviar Recordatorio
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month')
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Query para obtener eventos de la API
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await api.get('/events')
      return response.data
    },
  })

  // Usar eventos de la API o array vacío
  const events: CalendarEvent[] = eventsData?.data || []

  // Mutation para crear evento y enviar notificaciones
  const createEventMutation = useMutation({
    mutationFn: async (eventData: Omit<CalendarEvent, 'id'>) => {
      const response = await api.post('/events', eventData)
      return response.data
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setShowCreateModal(false)
      
      const newEvent = response.data || response
      const notifications = []
      if (newEvent.notifyStudents) notifications.push('estudiantes')
      if (newEvent.notifyParents) notifications.push('padres')
      if (newEvent.notifyTeachers) notifications.push('docentes')
      
      toast({
        title: '✅ Evento creado exitosamente',
        description: notifications.length > 0 
          ? `Notificaciones push enviadas a: ${notifications.join(', ')}`
          : 'Evento guardado sin notificaciones',
      })
    },
    onError: () => {
      toast({
        title: 'Error al crear evento',
        description: 'Por favor intenta nuevamente',
        variant: 'destructive',
      })
    },
  })

  // Mutation para enviar recordatorio
  const sendReminderMutation = useMutation({
    mutationFn: async (event: CalendarEvent) => {
      const eventId = event._id || event.id
      if (eventId) {
        return api.post(`/events/${eventId}/reminder`)
      }
      // Fallback si no hay ID
      return api.post('/notifications/broadcast', {
        title: `⏰ Recordatorio: ${event.title}`,
        message: `${event.description || 'No olvides este evento'}${event.time ? ` - Hora: ${event.time}` : ''}`,
        type: 'reminder',
        roles: ['estudiante', 'padre', 'docente'],
      })
    },
    onSuccess: () => {
      toast({
        title: '📲 Recordatorio enviado',
        description: 'Las notificaciones push fueron enviadas a todos los participantes',
      })
      setSelectedEvent(null)
    },
  })

  const handleSendReminder = () => {
    if (selectedEvent) {
      sendReminderMutation.mutate(selectedEvent)
    }
  }

  const handleEditEvent = () => {
    toast({
      title: 'Función de edición',
      description: 'Próximamente podrás editar eventos existentes',
    })
  }

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const monthName = currentDate.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date === dateStr)
  }

  const today = new Date()
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()

  const upcomingEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario Escolar</h1>
          <p className="text-gray-500 mt-1">Gestión de eventos y actividades académicas</p>
        </div>
        <div className="flex gap-2">
          <Button variant={viewMode === 'month' ? 'default' : 'outline'} onClick={() => setViewMode('month')}>Mes</Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')}>Lista</Button>
          <Button onClick={() => setShowCreateModal(true)} className="bg-sanmartin-primary hover:bg-sanmartin-primary-dark"><Plus className="w-4 h-4 mr-2" />Nuevo Evento</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="w-5 h-5" /></Button>
                <CardTitle className="capitalize">{monthName}</CardTitle>
                <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="w-5 h-5" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                  <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-600">{day}</div>
                ))}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-white p-2 min-h-[80px]" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dayEvents = getEventsForDay(day)
                  const isToday = isCurrentMonth && day === today.getDate()

                  return (
                    <div key={day} className={`bg-white p-2 min-h-[80px] ${isToday ? 'ring-2 ring-sanmartin-primary ring-inset' : ''}`}>
                      <span className={`text-sm font-medium ${isToday ? 'bg-sanmartin-primary text-white px-2 py-0.5 rounded-full' : ''}`}>{day}</span>
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 2).map((event) => {
                          const config = eventColors[event.type]
                          return (
                            <button key={event.id} onClick={() => setSelectedEvent(event)} className={`w-full text-left text-xs p-1 rounded truncate ${config.bg} ${config.text}`}>
                              {event.title.substring(0, 15)}...
                            </button>
                          )
                        })}
                        {dayEvents.length > 2 && (
                          <span className="text-xs text-gray-500">+{dayEvents.length - 2} más</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><Tag className="w-5 h-5" />Tipos de Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(eventColors).map(([type, config]) => {
                const Icon = config.icon
                return (
                  <div key={type} className={`flex items-center gap-2 p-2 rounded-lg ${config.bg}`}>
                    <Icon className={`w-4 h-4 ${config.text}`} />
                    <span className={`text-sm font-medium ${config.text}`}>{eventLabels[type as keyof typeof eventLabels]}</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Próximos Eventos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.slice(0, 4).map((event) => {
                const config = eventColors[event.type]
                const Icon = config.icon
                return (
                  <button key={event.id} onClick={() => setSelectedEvent(event)} className="w-full text-left p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${config.bg}`}>
                        <Icon className={`w-4 h-4 ${config.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        <p className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onSendReminder={handleSendReminder} onEdit={handleEditEvent} />}
      
      {showCreateModal && (
        <CreateEventModal 
          onClose={() => setShowCreateModal(false)} 
          onSave={(data) => createEventMutation.mutate(data)}
          isLoading={createEventMutation.isPending}
        />
      )}
    </div>
  )
}
