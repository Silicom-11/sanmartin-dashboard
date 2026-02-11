import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'https://sanmartin-backend.onrender.com'

// Crear instancia de axios
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos
})

// Interceptor de request - agregar token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor de response - manejar errores
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    
    const message = error.response?.data?.message || 'Error de conexión'
    return Promise.reject(new Error(message))
  }
)

// ============ AUTH SERVICES ============

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },
  
  register: async (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    role: string
    phone?: string
    dni?: string
  }) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },
  
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },
  
  resetPassword: async (token: string, password: string) => {
    const response = await api.post('/auth/reset-password', { token, password })
    return response.data
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
  
  updateProfile: async (data: Partial<{
    firstName: string
    lastName: string
    phone: string
    avatar: string
  }>) => {
    const response = await api.put('/auth/me', data)
    return response.data
  },
}

// ============ STUDENTS SERVICES ============

export const studentsService = {
  getAll: async (params?: {
    page?: number
    limit?: number
    search?: string
    gradeLevel?: string
    section?: string
    status?: string
  }) => {
    const response = await api.get('/students', { params })
    return response.data
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/students/${id}`)
    return response.data
  },
  
  create: async (data: {
    firstName: string
    lastName: string
    dni: string
    birthDate: string
    gender: 'Masculino' | 'Femenino'
    gradeLevel: string
    section?: string
    parentId?: string
  }) => {
    const response = await api.post('/students', data)
    return response.data
  },
  
  update: async (id: string, data: Partial<{
    firstName: string
    lastName: string
    dni: string
    birthDate: string
    gender: string
    gradeLevel: string
    section: string
    address: string
    photo: string
  }>) => {
    const response = await api.put(`/students/${id}`, data)
    return response.data
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/students/${id}`)
    return response.data
  },
  
  getGrades: async (studentId: string, params?: { period?: string; year?: number }) => {
    const response = await api.get(`/students/${studentId}/grades`, { params })
    return response.data
  },
  
  getAttendance: async (studentId: string, params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get(`/students/${studentId}/attendance`, { params })
    return response.data
  },
}

// ============ TEACHERS (USERS) SERVICES ============

export const usersService = {
  getAll: async (params?: {
    page?: number
    limit?: number
    role?: string
    search?: string
  }) => {
    const response = await api.get('/users', { params })
    return response.data
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },
  
  update: async (id: string, data: Partial<{
    firstName: string
    lastName: string
    phone: string
    isActive: boolean
  }>) => {
    const response = await api.put(`/users/${id}`, data)
    return response.data
  },
  
  toggleActive: async (id: string, isActive: boolean) => {
    const response = await api.put(`/users/${id}/status`, { isActive })
    return response.data
  },
}

// ============ COURSES SERVICES ============

export const coursesService = {
  getAll: async (params?: {
    gradeLevel?: string
    section?: string
    teacherId?: string
    year?: number
  }) => {
    const response = await api.get('/courses', { params })
    return response.data
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/courses/${id}`)
    return response.data
  },
  
  create: async (data: {
    name: string
    code: string
    description?: string
    gradeLevel: string
    section?: string
    teacherId?: string
    studentIds?: string[]
    schedule?: Array<{
      day: string
      startTime: string
      endTime: string
      classroom?: string
    }>
  }) => {
    const response = await api.post('/courses', data)
    return response.data
  },
  
  update: async (id: string, data: Partial<{
    name: string
    code: string
    description: string
    gradeLevel: string
    section: string
    teacherId: string
    schedule: Array<{
      day: string
      startTime: string
      endTime: string
      classroom?: string
    }>
  }>) => {
    const response = await api.put(`/courses/${id}`, data)
    return response.data
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/courses/${id}`)
    return response.data
  },
  
  addStudent: async (courseId: string, studentIds: string[]) => {
    const response = await api.post(`/courses/${courseId}/students`, { studentIds })
    return response.data
  },
  
  removeStudent: async (courseId: string, studentId: string) => {
    const response = await api.delete(`/courses/${courseId}/students/${studentId}`)
    return response.data
  },
}

// ============ GRADES SERVICES (Bimester System) ============

export const gradesService = {
  getAll: async (params?: {
    courseId?: string
    studentId?: string
    bimester?: number
    year?: number
  }) => {
    const response = await api.get('/grades', { params })
    return response.data
  },

  getStats: async (params?: { year?: number; bimester?: number }) => {
    const response = await api.get('/grades/stats', { params })
    return response.data
  },

  getByCourse: async (courseId: string, params?: { bimester?: number; year?: number }) => {
    const response = await api.get(`/grades/course/${courseId}`, { params })
    return response.data
  },

  getByCourseSummary: async () => {
    const response = await api.get('/grades/by-course')
    return response.data
  },

  getReport: async (courseId: string, params?: { year?: number }) => {
    const response = await api.get(`/grades/report/${courseId}`, { params })
    return response.data
  },

  getHistory: async (studentId: string, params?: { year?: number }) => {
    const response = await api.get(`/grades/history/${studentId}`, { params })
    return response.data
  },

  saveScore: async (data: {
    studentId: string
    courseId: string
    evaluationId: string
    bimester: number
    score: number
    comments?: string
    academicYear?: number
  }) => {
    const response = await api.post('/grades/save-score', data)
    return response.data
  },

  saveBulk: async (data: {
    courseId: string
    evaluationId: string
    bimester: number
    academicYear?: number
    scores: Array<{
      studentId: string
      score: number
      comments?: string
    }>
  }) => {
    const response = await api.post('/grades/save-bulk', data)
    return response.data
  },

  closeBimester: async (data: { courseId: string; bimester: number; academicYear?: number }) => {
    const response = await api.put('/grades/close-bimester', data)
    return response.data
  },

  reopenBimester: async (data: { courseId: string; bimester: number; academicYear?: number }) => {
    const response = await api.put('/grades/reopen-bimester', data)
    return response.data
  },

  publishBimester: async (data: { courseId: string; bimester: number; academicYear?: number }) => {
    const response = await api.put('/grades/publish-bimester', data)
    return response.data
  },
}

// ============ EVALUATIONS SERVICES ============

export const evaluationsService = {
  getByCourse: async (courseId: string, params?: { bimester?: number; year?: number }) => {
    const response = await api.get(`/evaluations/course/${courseId}`, { params })
    return response.data
  },

  create: async (data: {
    courseId: string
    name: string
    type: 'examen' | 'tarea' | 'practica' | 'proyecto' | 'participacion' | 'exposicion' | 'otro'
    bimester: number
    maxGrade?: number
    weight?: number
    date?: string
    description?: string
    academicYear?: number
  }) => {
    const response = await api.post('/evaluations', data)
    return response.data
  },

  update: async (id: string, data: Partial<{
    name: string
    type: string
    maxGrade: number
    weight: number
    date: string
    description: string
  }>) => {
    const response = await api.put(`/evaluations/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await api.delete(`/evaluations/${id}`)
    return response.data
  },

  reorder: async (evaluationIds: string[]) => {
    const response = await api.put('/evaluations/reorder', { evaluationIds })
    return response.data
  },
}

// ============ ATTENDANCE SERVICES ============

export const attendanceService = {
  getAll: async (params?: {
    courseId?: string
    studentId?: string
    date?: string
    status?: string
  }) => {
    const response = await api.get('/attendance', { params })
    return response.data
  },
  
  getByCourseAndDate: async (courseId: string, date: string) => {
    const response = await api.get(`/attendance/course/${courseId}/date/${date}`)
    return response.data
  },
  
  save: async (data: {
    studentId: string
    courseId: string
    date: string
    status: 'present' | 'absent' | 'late' | 'justified'
    arrivalTime?: string
    observations?: string
  }) => {
    const response = await api.post('/attendance', data)
    return response.data
  },
  
  saveBulk: async (data: {
    courseId: string
    date: string
    students: Array<{
      studentId: string
      status: 'present' | 'absent' | 'late' | 'justified'
      arrivalTime?: string
      observations?: string
    }>
  }) => {
    const response = await api.post('/attendance/bulk', data)
    return response.data
  },
  
  getStats: async (params?: { studentId?: string; startDate?: string; endDate?: string }) => {
    const response = await api.get('/attendance/stats', { params })
    return response.data
  },
}

// ============ JUSTIFICATIONS SERVICES ============

export const justificationsService = {
  getAll: async (params?: {
    status?: 'pendiente' | 'aprobada' | 'rechazada'
    studentId?: string
  }) => {
    const response = await api.get('/justifications', { params })
    return response.data
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/justifications/${id}`)
    return response.data
  },
  
  review: async (id: string, data: {
    status: 'aprobada' | 'rechazada'
    reviewNotes?: string
  }) => {
    const response = await api.put(`/justifications/${id}/review`, data)
    return response.data
  },
}

// ============ NOTIFICATIONS SERVICES ============

export const notificationsService = {
  getAll: async (params?: { page?: number; limit?: number; unread?: boolean }) => {
    const response = await api.get('/notifications', { params })
    return response.data
  },
  
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count')
    return response.data
  },
  
  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`)
    return response.data
  },
  
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all')
    return response.data
  },
  
  create: async (data: {
    recipientId: string
    title: string
    message: string
    type?: 'info' | 'warning' | 'success' | 'error' | 'grade' | 'attendance' | 'event'
  }) => {
    const response = await api.post('/notifications', data)
    return response.data
  },
}

// ============ MESSAGES SERVICES ============

export const messagesService = {
  getConversations: async () => {
    const response = await api.get('/messages/conversations')
    return response.data
  },

  getMessages: async (conversationId: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/messages/conversations/${conversationId}`, { params })
    return response.data
  },

  send: async (data: { conversationId?: string; recipientId?: string; content: string }) => {
    const response = await api.post('/messages/send', data)
    return response.data
  },

  getContacts: async () => {
    const response = await api.get('/messages/contacts')
    return response.data
  },

  getUnreadCount: async () => {
    const response = await api.get('/messages/unread-count')
    return response.data
  },

  deleteMessage: async (id: string) => {
    const response = await api.delete(`/messages/${id}`)
    return response.data
  },
}

// ============ EVENTS / CALENDAR SERVICES ============

export const eventsService = {
  getAll: async (params?: { startDate?: string; endDate?: string; type?: string }) => {
    const response = await api.get('/events', { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await api.get(`/events/${id}`)
    return response.data
  },

  getUpcoming: async (limit: number = 10) => {
    const response = await api.get('/events/upcoming', { params: { limit } })
    return response.data
  },

  create: async (data: {
    title: string
    date: string
    time?: string
    type: string
    description?: string
    location?: string
    participants?: string
    notifyStudents?: boolean
    notifyParents?: boolean
    notifyTeachers?: boolean
  }) => {
    const response = await api.post('/events', data)
    return response.data
  },

  update: async (id: string, data: Partial<{
    title: string
    date: string
    time: string
    type: string
    description: string
    location: string
    participants: string
  }>) => {
    const response = await api.put(`/events/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await api.delete(`/events/${id}`)
    return response.data
  },

  sendReminder: async (id: string) => {
    const response = await api.post(`/events/${id}/reminder`)
    return response.data
  },
}

// ============ DASHBOARD SERVICES ============

export const dashboardService = {
  getAdminStats: async () => {
    const response = await api.get('/dashboard/admin')
    return response.data
  },
  
  getTeacherDashboard: async () => {
    const response = await api.get('/dashboard/teacher')
    return response.data
  },
  
  getParentDashboard: async () => {
    const response = await api.get('/dashboard/parent')
    return response.data
  },
}

// ============ LOCATION / GPS TRACKING SERVICES ============

export const locationService = {
  // Obtener ubicaciones de todos los estudiantes
  getStudentLocations: async (minutes: number = 30) => {
    const response = await api.get(`/location/students?minutes=${minutes}`)
    return response.data
  },
  
  // Obtener usuarios online
  getOnlineUsers: async (role?: string, minutes: number = 5) => {
    const params = new URLSearchParams()
    if (role) params.append('role', role)
    params.append('minutes', minutes.toString())
    const response = await api.get(`/location/users/online?${params}`)
    return response.data
  },
  
  // Obtener estadísticas de ubicación
  getLocationStats: async () => {
    const response = await api.get('/location/stats')
    return response.data
  },
  
  // Obtener ubicación de un usuario específico
  getUserLocation: async (userId: string) => {
    const response = await api.get(`/location/user/${userId}`)
    return response.data
  },
  
  // Obtener historial de ubicaciones de un usuario
  getUserLocationHistory: async (userId: string, hours: number = 24) => {
    const response = await api.get(`/location/user/${userId}/history?hours=${hours}`)
    return response.data
  },
}

// ============ TEACHERS SERVICES (Nueva Colección) ============

export const teachersService = {
  // Obtener todos los docentes con paginación
  getAll: async (params?: {
    page?: number
    limit?: number
    search?: string
    specialty?: string
    isActive?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) => {
    const response = await api.get('/teachers', { params })
    return response.data
  },
  
  // Estadísticas del panel
  getStats: async () => {
    const response = await api.get('/teachers/stats')
    return response.data
  },
  
  // Obtener un docente por ID
  getById: async (id: string) => {
    const response = await api.get(`/teachers/${id}`)
    return response.data
  },
  
  // Crear nuevo docente
  create: async (data: {
    firstName: string
    lastName: string
    dni: string
    email: string
    password?: string
    phone?: string
    birthDate?: string
    gender?: 'Masculino' | 'Femenino'
    address?: string
    specialty: string
    secondarySpecialties?: string[]
    educationLevel?: string
    university?: string
    contractType?: 'Nombrado' | 'Contratado' | 'Tiempo Completo' | 'Tiempo Parcial'
    workSchedule?: 'Completo' | 'Mañana' | 'Tarde'
    hireDate?: string
  }) => {
    const response = await api.post('/teachers', data)
    return response.data
  },
  
  // Actualizar docente
  update: async (id: string, data: Partial<{
    firstName: string
    lastName: string
    phone: string
    address: string
    specialty: string
    secondarySpecialties: string[]
    educationLevel: string
    university: string
    contractType: string
    workSchedule: string
    isActive: boolean
  }>) => {
    const response = await api.put(`/teachers/${id}`, data)
    return response.data
  },
  
  // Eliminar docente (soft delete)
  delete: async (id: string, permanent: boolean = false) => {
    const response = await api.delete(`/teachers/${id}`, { params: { permanent } })
    return response.data
  },
  
  // Reactivar docente
  reactivate: async (id: string) => {
    const response = await api.post(`/teachers/${id}/reactivate`)
    return response.data
  },
  
  // Cambiar contraseña
  changePassword: async (id: string, newPassword: string) => {
    const response = await api.put(`/teachers/${id}/password`, { newPassword })
    return response.data
  },
  
  // Asignar curso
  assignCourse: async (id: string, courseId: string, role?: 'titular' | 'auxiliar') => {
    const response = await api.post(`/teachers/${id}/courses`, { courseId, role })
    return response.data
  },
  
  // Remover curso
  removeCourse: async (id: string, courseId: string) => {
    const response = await api.delete(`/teachers/${id}/courses/${courseId}`)
    return response.data
  },
}

// ============ PARENTS MANAGEMENT SERVICES (Nueva Colección) ============

export const parentsService = {
  // Obtener todos los padres con paginación
  getAll: async (params?: {
    page?: number
    limit?: number
    search?: string
    hasChildren?: boolean
    isActive?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) => {
    const response = await api.get('/parents-management', { params })
    return response.data
  },
  
  // Estadísticas del panel
  getStats: async () => {
    const response = await api.get('/parents-management/stats')
    return response.data
  },
  
  // Buscar estudiantes para vincular
  searchStudents: async (search: string) => {
    const response = await api.get('/parents-management/search-students', { params: { search } })
    return response.data
  },
  
  // Obtener un padre por ID
  getById: async (id: string) => {
    const response = await api.get(`/parents-management/${id}`)
    return response.data
  },
  
  // Crear nuevo padre
  create: async (data: {
    firstName: string
    lastName: string
    dni: string
    email: string
    password?: string
    phone?: string
    secondaryPhone?: string
    address?: string
    birthDate?: string
    gender?: 'Masculino' | 'Femenino'
    occupation?: string
    workplace?: string
    children?: Array<{
      studentId: string
      relationship: string
      isPrimaryContact?: boolean
      canPickUp?: boolean
      isEmergencyContact?: boolean
    }>
  }) => {
    const response = await api.post('/parents-management', data)
    return response.data
  },
  
  // Actualizar padre
  update: async (id: string, data: Partial<{
    firstName: string
    lastName: string
    phone: string
    secondaryPhone: string
    address: string
    occupation: string
    workplace: string
    isActive: boolean
  }>) => {
    const response = await api.put(`/parents-management/${id}`, data)
    return response.data
  },
  
  // Eliminar padre (soft delete)
  delete: async (id: string, permanent: boolean = false) => {
    const response = await api.delete(`/parents-management/${id}`, { params: { permanent } })
    return response.data
  },
  
  // Reactivar padre
  reactivate: async (id: string) => {
    const response = await api.post(`/parents-management/${id}/reactivate`)
    return response.data
  },
  
  // Cambiar contraseña
  changePassword: async (id: string, newPassword: string) => {
    const response = await api.put(`/parents-management/${id}/password`, { newPassword })
    return response.data
  },
  
  // Vincular hijo
  addChild: async (id: string, childData: {
    studentId: string
    relationship: string
    isPrimaryContact?: boolean
    canPickUp?: boolean
    isEmergencyContact?: boolean
  }) => {
    const response = await api.post(`/parents-management/${id}/children`, childData)
    return response.data
  },
  
  // Desvincular hijo
  removeChild: async (id: string, studentId: string) => {
    const response = await api.delete(`/parents-management/${id}/children/${studentId}`)
    return response.data
  },
}

// ============ STUDENTS MANAGEMENT SERVICES (Nueva Colección con Auth) ============

export const studentsManagementService = {
  // Obtener todos los estudiantes con paginación
  getAll: async (params?: {
    page?: number
    limit?: number
    search?: string
    gradeLevel?: string
    section?: string
    status?: string
    gender?: string
    hasParent?: boolean
    isActive?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) => {
    const response = await api.get('/students-management', { params })
    return response.data
  },
  
  // Estadísticas del panel
  getStats: async () => {
    const response = await api.get('/students-management/stats')
    return response.data
  },
  
  // Buscar padres para vincular
  searchParents: async (search: string) => {
    const response = await api.get('/students-management/search-parents', { params: { search } })
    return response.data
  },
  
  // Obtener un estudiante por ID
  getById: async (id: string) => {
    const response = await api.get(`/students-management/${id}`)
    return response.data
  },
  
  // Obtener información académica
  getAcademic: async (id: string, year?: number) => {
    const response = await api.get(`/students-management/${id}/academic`, { params: { year } })
    return response.data
  },
  
  // Crear nuevo estudiante
  create: async (data: {
    firstName: string
    lastName: string
    dni: string
    email: string
    password?: string
    birthDate: string
    gender: 'Masculino' | 'Femenino'
    phone?: string
    address?: {
      street?: string
      district?: string
      city?: string
      reference?: string
    }
    gradeLevel: string
    section?: string
    shift?: 'Mañana' | 'Tarde'
    parentId?: string
    parentSource?: 'parent' | 'user'
    relationship?: string
    medicalInfo?: {
      bloodType?: string
      allergies?: string[]
      conditions?: string[]
      medications?: string[]
    }
    previousSchool?: string
  }) => {
    const response = await api.post('/students-management', data)
    return response.data
  },
  
  // Actualizar estudiante
  update: async (id: string, data: Partial<{
    firstName: string
    lastName: string
    phone: string
    address: object
    photo: string
    gradeLevel: string
    section: string
    shift: string
    status: string
    isActive: boolean
    medicalInfo: object
  }>) => {
    const response = await api.put(`/students-management/${id}`, data)
    return response.data
  },
  
  // Eliminar estudiante (soft delete)
  delete: async (id: string, permanent: boolean = false) => {
    const response = await api.delete(`/students-management/${id}`, { params: { permanent } })
    return response.data
  },
  
  // Reactivar estudiante
  reactivate: async (id: string) => {
    const response = await api.post(`/students-management/${id}/reactivate`)
    return response.data
  },
  
  // Cambiar contraseña
  changePassword: async (id: string, newPassword: string) => {
    const response = await api.put(`/students-management/${id}/password`, { newPassword })
    return response.data
  },
  
  // Vincular padre/tutor
  addGuardian: async (id: string, guardianData: {
    parentId: string
    parentSource: 'parent' | 'user'
    relationship: string
    isPrimary?: boolean
    canPickUp?: boolean
    emergencyContact?: boolean
  }) => {
    const response = await api.post(`/students-management/${id}/guardians`, guardianData)
    return response.data
  },
  
  // Desvincular padre/tutor
  removeGuardian: async (id: string, guardianId: string) => {
    const response = await api.delete(`/students-management/${id}/guardians/${guardianId}`)
    return response.data
  },
}

export default api
