import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesService, notificationsService } from '@/services/api'
import {
  Search, Send, Plus, Users, User,
  X, Megaphone, Mail, MessageSquare, ArrowLeft, Loader2, RefreshCw, AlertCircle, CheckCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

// ============ Types ============

interface Contact {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: string
  source?: string
  specialty?: string
  phone?: string
}

interface ConversationItem {
  _id: string
  type: string
  name: string
  participants: Array<{
    _id: string
    firstName: string
    lastName: string
    role?: string
  }>
  lastMessage?: {
    content: string
    sender?: { firstName: string; lastName: string }
    sentAt: string
  }
  unreadCount: number
}

interface MessageItem {
  _id: string
  sender: {
    _id: string
    firstName: string
    lastName: string
    avatar?: string
  }
  content: string
  type: string
  createdAt: string
  readBy?: Array<{ user: string; readAt: string }>
}

// ============ New Message Modal ============

function NewMessageModal({ onClose, onStartConversation }: {
  onClose: () => void
  onStartConversation: (contactId: string) => void
}) {
  const [tab, setTab] = useState<'individual' | 'broadcast'>('individual')
  const [searchTerm, setSearchTerm] = useState('')
  const [broadcastData, setBroadcastData] = useState({
    title: '',
    message: '',
    roles: [] as string[],
  })
  const { toast } = useToast()

  const { data: contactsData, isLoading: loadingContacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: messagesService.getContacts,
  })

  const contacts: Contact[] = contactsData?.data || []

  const filteredContacts = contacts.filter(
    (c) =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      return notificationsService.create({
        recipientId: 'broadcast',
        title: broadcastData.title,
        message: broadcastData.message,
        type: 'info',
      })
    },
    onSuccess: () => {
      toast({ title: 'Comunicado enviado', description: 'Las notificaciones fueron enviadas exitosamente' })
      onClose()
    },
    onError: () => {
      toast({ title: 'Error al enviar', description: 'Intenta nuevamente', variant: 'destructive' })
    },
  })

  const toggleRole = (role: string) => {
    setBroadcastData((prev) => ({
      ...prev,
      roles: prev.roles.includes(role) ? prev.roles.filter((r) => r !== role) : [...prev.roles, role],
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Nuevo Mensaje</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            <Button
              variant={tab === 'individual' ? 'default' : 'outline'}
              onClick={() => setTab('individual')}
              className="flex-1"
            >
              <User className="w-4 h-4 mr-2" />
              Conversación
            </Button>
            <Button
              variant={tab === 'broadcast' ? 'default' : 'outline'}
              onClick={() => setTab('broadcast')}
              className="flex-1"
            >
              <Megaphone className="w-4 h-4 mr-2" />
              Comunicado
            </Button>
          </div>

          {tab === 'individual' ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar contacto por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {loadingContacts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No se encontraron contactos</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y rounded-lg border">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact._id}
                      onClick={() => {
                        onStartConversation(contact._id)
                        onClose()
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {contact.firstName?.[0]}
                        {contact.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{contact.email}</p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {contact.role === 'docente'
                          ? 'Docente'
                          : contact.role === 'padre'
                          ? 'Padre'
                          : contact.role === 'administrativo'
                          ? 'Admin'
                          : contact.role}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Destinatarios</label>
                <div className="flex gap-2 mt-2">
                  {[
                    { id: 'docente', label: 'Docentes' },
                    { id: 'padre', label: 'Padres' },
                    { id: 'estudiante', label: 'Estudiantes' },
                  ].map((r) => (
                    <Badge
                      key={r.id}
                      variant={broadcastData.roles.includes(r.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleRole(r.id)}
                    >
                      {r.label}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Título</label>
                <Input
                  value={broadcastData.title}
                  onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })}
                  placeholder="Título del comunicado"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Mensaje</label>
                <textarea
                  value={broadcastData.message}
                  onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                  className="mt-1 w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Escribe el comunicado..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => broadcastMutation.mutate()}
                  disabled={!broadcastData.title || !broadcastData.message || broadcastMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {broadcastMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Enviar Comunicado
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============ Chat View ============

function ChatView({
  conversationId,
  onBack,
  userId,
}: {
  conversationId: string
  onBack: () => void
  userId: string
}) {
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => messagesService.getMessages(conversationId),
    refetchInterval: 5000,
  })

  const messages: MessageItem[] = data?.data?.messages || []
  const conversation = data?.data?.conversation

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      messagesService.send({ conversationId, content }),
    onSuccess: () => {
      setNewMessage('')
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: () => {
      toast({ title: 'Error al enviar mensaje', variant: 'destructive' })
    },
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (newMessage.trim()) {
      sendMutation.mutate(newMessage.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const otherParticipants = conversation?.participants?.filter(
    (p: { _id: string }) => p._id !== userId
  ) || []
  const chatName = otherParticipants.map((p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`).join(', ') || 'Conversación'

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-white rounded-t-xl">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {chatName.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
        </div>
        <div>
          <h3 className="font-semibold">{chatName}</h3>
          <p className="text-xs text-gray-500">
            {otherParticipants.length > 0 ? 'En línea' : ''}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="w-16 h-16 mb-3" />
            <p className="text-lg font-medium">Sin mensajes</p>
            <p className="text-sm">Envía el primer mensaje para iniciar la conversación</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender?._id === userId
            return (
              <div
                key={msg._id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                    isMine
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white text-gray-900 border rounded-bl-md'
                  }`}
                >
                  {!isMine && (
                    <p className="text-xs font-medium text-blue-600 mb-1">
                      {msg.sender?.firstName} {msg.sender?.lastName}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                    <span className={`text-xs ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString('es-PE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMine && <CheckCheck className="w-3.5 h-3.5 text-blue-200" />}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-white rounded-b-xl">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            className="flex-1"
            disabled={sendMutation.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
            size="icon"
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============ Main Page ============

export default function MessagesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Get current user ID from auth store
  const getUserId = (): string => {
    try {
      const token = localStorage.getItem('auth-storage')
      if (token) {
        const parsed = JSON.parse(token)
        return parsed?.state?.user?._id || parsed?.state?.user?.id || ''
      }
    } catch {
      // ignore
    }
    return ''
  }
  const userId = getUserId()

  // Fetch conversations
  const { data: conversationsData, isLoading, isError } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagesService.getConversations,
    refetchInterval: 10000,
  })

  const conversations: ConversationItem[] = conversationsData?.data || []

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: messagesService.getUnreadCount,
    refetchInterval: 10000,
  })
  const totalUnread = unreadData?.data?.count || 0

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Start new conversation
  const handleStartConversation = async (contactId: string) => {
    try {
      const result = await messagesService.send({
        recipientId: contactId,
        content: '👋',
      })
      if (result?.data?.conversation) {
        setActiveConversation(result.data.conversation.toString())
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    } catch {
      toast({ title: 'Error al iniciar conversación', variant: 'destructive' })
    }
  }

  // Chat view
  if (activeConversation) {
    return (
      <ChatView
        conversationId={activeConversation}
        onBack={() => {
          setActiveConversation(null)
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }}
        userId={userId}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mensajería</h1>
          <p className="text-gray-500 mt-1">Comunicación con padres, docentes y personal</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['conversations'] })}>
            <RefreshCw className="w-4 h-4 mr-2" />Actualizar
          </Button>
          <Button onClick={() => setShowNewMessage(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />Nuevo Mensaje
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-blue-100 text-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Conversaciones</p>
              <p className="text-2xl font-bold mt-1">{conversations.length}</p>
            </div>
            <MessageSquare className="w-8 h-8 opacity-80" />
          </div>
        </div>
        <div className="p-4 rounded-xl bg-red-100 text-red-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Sin Leer</p>
              <p className="text-2xl font-bold mt-1">{totalUnread}</p>
            </div>
            <Mail className="w-8 h-8 opacity-80" />
          </div>
        </div>
        <div className="p-4 rounded-xl bg-green-100 text-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Participantes</p>
              <p className="text-2xl font-bold mt-1">
                {conversations.reduce((acc, c) => acc + (c.participants?.length || 0), 0)}
              </p>
            </div>
            <Users className="w-8 h-8 opacity-80" />
          </div>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar conversaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Conversations List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Cargando conversaciones...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <AlertCircle className="w-12 h-12 mb-3 text-red-400" />
          <p className="text-lg font-medium">Error al cargar conversaciones</p>
          <p className="text-sm">Verifica tu conexión e intenta nuevamente</p>
          <Button variant="outline" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['conversations'] })}>
            Reintentar
          </Button>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <MessageSquare className="w-16 h-16 mb-3" />
          <p className="text-lg font-medium text-gray-600">Sin conversaciones</p>
          <p className="text-sm">
            {searchTerm ? 'No se encontraron resultados' : 'Inicia una conversación con el botón "Nuevo Mensaje"'}
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation._id}
                  onClick={() => setActiveConversation(conversation._id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors text-left"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {conversation.name?.split(' ').slice(0, 2).map((n) => n[0]).join('') || '?'}
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold text-sm ${conversation.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                        {conversation.name}
                      </h3>
                      <span className="text-xs text-gray-400">
                        {conversation.lastMessage?.sentAt
                          ? new Date(conversation.lastMessage.sentAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
                          : ''}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                      {conversation.lastMessage?.content || 'Sin mensajes'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showNewMessage && (
        <NewMessageModal
          onClose={() => setShowNewMessage(false)}
          onStartConversation={handleStartConversation}
        />
      )}
    </div>
  )
}
