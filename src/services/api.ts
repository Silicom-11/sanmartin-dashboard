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
    teacherId: string
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
  
  addStudent: async (courseId: string, studentId: string) => {
    const response = await api.post(`/courses/${courseId}/students`, { studentId })
    return response.data
  },
  
  removeStudent: async (courseId: string, studentId: string) => {
    const response = await api.delete(`/courses/${courseId}/students/${studentId}`)
    return response.data
  },
}

// ============ GRADES SERVICES ============

export const gradesService = {
  getAll: async (params?: {
    courseId?: string
    studentId?: string
    period?: string
    year?: number
  }) => {
    const response = await api.get('/grades', { params })
    return response.data
  },
  
  getByCourse: async (courseId: string, params?: { period?: string; year?: number }) => {
    const response = await api.get(`/grades/course/${courseId}`, { params })
    return response.data
  },
  
  save: async (data: {
    studentId: string
    courseId: string
    period: string
    academicYear?: number
    evaluations?: Array<{
      type: 'examen' | 'tarea' | 'participacion' | 'proyecto' | 'practica'
      name: string
      grade: number
      weight?: number
      date?: string
      observations?: string
    }>
  }) => {
    const response = await api.post('/grades', data)
    return response.data
  },
  
  saveBulk: async (data: {
    courseId: string
    period: string
    academicYear?: number
    students: Array<{
      studentId: string
      evaluations: Array<{
        type: string
        name: string
        grade: number
        weight?: number
      }>
    }>
  }) => {
    const response = await api.post('/grades/bulk', data)
    return response.data
  },
  
  publish: async (gradeId: string) => {
    const response = await api.put(`/grades/${gradeId}/publish`)
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

export default api
