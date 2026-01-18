import { useState } from 'react'
import { Search, Send, Plus, Users, User, Bell, CheckCheck, Clock, Paperclip, X, Megaphone, Mail, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface Message {
  id: string
  type: 'individual' | 'group' | 'broadcast'
  recipient: string
  recipientType: 'parent' | 'teacher' | 'grade' | 'all'
  subject: string
  content: string
  sentAt: string
  status: 'sent' | 'delivered' | 'read'
  attachments?: number
}

interface Conversation {
  id: string
  name: string
  type: 'parent' | 'teacher'
  lastMessage: string
  lastMessageTime: string
  unread: number
  avatar?: string
}

const mockConversations: Conversation[] = [
  { id: '1', name: 'Roberto García', type: 'parent', lastMessage: 'Gracias por la información sobre la reunión', lastMessageTime: '10:30', unread: 0 },
  { id: '2', name: 'María González', type: 'teacher', lastMessage: '¿Podemos coordinar para el examen?', lastMessageTime: '09:15', unread: 2 },
  { id: '3', name: 'Ana López', type: 'parent', lastMessage: 'Mi hijo no asistirá mañana', lastMessageTime: 'Ayer', unread: 1 },
  { id: '4', name: 'Carlos Rodríguez', type: 'teacher', lastMessage: 'Listo, ya subí las notas', lastMessageTime: 'Ayer', unread: 0 },
  { id: '5', name: 'Patricia Sánchez', type: 'parent', lastMessage: '¿A qué hora es la salida el viernes?', lastMessageTime: 'Mar', unread: 0 },
]

const mockBroadcasts: Message[] = [
  { id: '1', type: 'broadcast', recipient: 'Todos los Padres', recipientType: 'all', subject: 'Reunión de Padres - Enero 2024', content: 'Estimados padres, les recordamos la reunión programada para...', sentAt: '2024-01-15 08:00', status: 'read', attachments: 1 },
  { id: '2', type: 'broadcast', recipient: '3° Primaria', recipientType: 'grade', subject: 'Materiales para Proyecto', content: 'Los estudiantes de 3° grado necesitarán traer...', sentAt: '2024-01-14 14:30', status: 'delivered' },
  { id: '3', type: 'broadcast', recipient: 'Docentes', recipientType: 'teacher', subject: 'Capacitación Virtual', content: 'Se les invita a la capacitación sobre...', sentAt: '2024-01-13 09:00', status: 'sent' },
]

const mockStats = { totalSent: 456, delivered: 423, read: 389, pending: 12 }

function NewMessageModal({ onClose }: { onClose: () => void }) {
  const [messageType, setMessageType] = useState<'individual' | 'group' | 'broadcast'>('broadcast')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Nuevo Mensaje</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de Mensaje</label>
            <div className="flex gap-2">
              <Button variant={messageType === 'broadcast' ? 'default' : 'outline'} onClick={() => setMessageType('broadcast')} className="flex-1">
                <Megaphone className="w-4 h-4 mr-2" />Comunicado
              </Button>
              <Button variant={messageType === 'group' ? 'default' : 'outline'} onClick={() => setMessageType('group')} className="flex-1">
                <Users className="w-4 h-4 mr-2" />Grupo
              </Button>
              <Button variant={messageType === 'individual' ? 'default' : 'outline'} onClick={() => setMessageType('individual')} className="flex-1">
                <User className="w-4 h-4 mr-2" />Individual
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Destinatarios</label>
            {messageType === 'broadcast' ? (
              <div className="flex gap-2 mt-2">
                {['Todos', 'Padres', 'Docentes', '3° Primaria', '1° Secundaria'].map((opt) => (
                  <Badge key={opt} variant="outline" className="cursor-pointer hover:bg-gray-100">{opt}</Badge>
                ))}
              </div>
            ) : (
              <Input placeholder="Buscar destinatario..." className="mt-1" />
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Asunto</label>
            <Input placeholder="Ingresa el asunto del mensaje" className="mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Mensaje</label>
            <textarea className="mt-1 w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-sanmartin-primary focus:border-transparent" placeholder="Escribe tu mensaje aquí..." />
          </div>

          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <Button variant="outline" size="sm"><Paperclip className="w-4 h-4 mr-1" />Adjuntar</Button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Bell className="w-4 h-4" />
              <span>Notificar vía:</span>
              <Badge variant="outline">App</Badge>
              <Badge variant="outline">Email</Badge>
              <Badge variant="outline">WhatsApp</Badge>
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className="bg-sanmartin-primary hover:bg-sanmartin-primary-dark">
            <Send className="w-4 h-4 mr-2" />Enviar Mensaje
          </Button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className={`p-4 rounded-xl ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon className="w-8 h-8 opacity-80" />
      </div>
    </div>
  )
}

export default function MessagesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState<'conversations' | 'broadcasts'>('broadcasts')
  const [showNewMessage, setShowNewMessage] = useState(false)

  const filteredConversations = mockConversations.filter((c) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const statusIcon = (status: string) => {
    if (status === 'read') return <CheckCheck className="w-4 h-4 text-blue-500" />
    if (status === 'delivered') return <CheckCheck className="w-4 h-4 text-gray-400" />
    return <Clock className="w-4 h-4 text-gray-400" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mensajería</h1>
          <p className="text-gray-500 mt-1">Comunicación con padres y docentes</p>
        </div>
        <Button onClick={() => setShowNewMessage(true)} className="bg-sanmartin-primary hover:bg-sanmartin-primary-dark">
          <Plus className="w-4 h-4 mr-2" />Nuevo Mensaje
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Enviados" value={mockStats.totalSent} icon={Send} color="bg-blue-100 text-blue-700" />
        <StatCard title="Entregados" value={mockStats.delivered} icon={CheckCheck} color="bg-green-100 text-green-700" />
        <StatCard title="Leídos" value={mockStats.read} icon={Mail} color="bg-purple-100 text-purple-700" />
        <StatCard title="Pendientes" value={mockStats.pending} icon={Clock} color="bg-yellow-100 text-yellow-700" />
      </div>

      <div className="flex gap-2">
        <Button variant={selectedTab === 'broadcasts' ? 'default' : 'outline'} onClick={() => setSelectedTab('broadcasts')}>
          <Megaphone className="w-4 h-4 mr-2" />Comunicados
        </Button>
        <Button variant={selectedTab === 'conversations' ? 'default' : 'outline'} onClick={() => setSelectedTab('conversations')}>
          <MessageSquare className="w-4 h-4 mr-2" />Conversaciones
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Buscar mensajes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      {selectedTab === 'broadcasts' ? (
        <div className="space-y-4">
          {mockBroadcasts.map((message) => (
            <Card key={message.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-sanmartin-primary/10 rounded-xl">
                      <Megaphone className="w-6 h-6 text-sanmartin-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{message.subject}</h3>
                        {message.attachments && <Badge variant="outline"><Paperclip className="w-3 h-3 mr-1" />{message.attachments}</Badge>}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">Para: {message.recipient}</p>
                      <p className="text-gray-600 line-clamp-2">{message.content}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-gray-400">{new Date(message.sentAt).toLocaleDateString('es-PE')}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      {statusIcon(message.status)}
                      <span className="text-sm text-gray-500 capitalize">{message.status === 'read' ? 'Leído' : message.status === 'delivered' ? 'Entregado' : 'Enviado'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredConversations.map((conversation) => (
                <div key={conversation.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-sanmartin-primary to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {conversation.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    {conversation.unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {conversation.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{conversation.name}</h3>
                      <span className="text-sm text-gray-400">{conversation.lastMessageTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{conversation.type === 'parent' ? 'Padre' : 'Docente'}</Badge>
                      <p className="text-sm text-gray-500 truncate">{conversation.lastMessage}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showNewMessage && <NewMessageModal onClose={() => setShowNewMessage(false)} />}
    </div>
  )
}
