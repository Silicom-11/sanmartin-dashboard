import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-PE', options || {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(amount)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getGradeColor(grade: number): string {
  if (grade >= 15) return 'text-green-600'
  if (grade >= 11) return 'text-yellow-600'
  return 'text-red-600'
}

export function getAttendanceStatusColor(status: string): string {
  switch (status) {
    case 'present':
      return 'bg-green-100 text-green-800'
    case 'late':
      return 'bg-yellow-100 text-yellow-800'
    case 'absent':
      return 'bg-red-100 text-red-800'
    case 'justified':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getAttendanceStatusLabel(status: string): string {
  switch (status) {
    case 'present':
      return 'Presente'
    case 'late':
      return 'Tardanza'
    case 'absent':
      return 'Ausente'
    case 'justified':
      return 'Justificado'
    default:
      return status
  }
}

export const GRADE_LEVELS = [
  '1º Primaria',
  '2º Primaria',
  '3º Primaria',
  '4º Primaria',
  '5º Primaria',
  '6º Primaria',
  '1º Secundaria',
  '2º Secundaria',
  '3º Secundaria',
  '4º Secundaria',
  '5º Secundaria',
]

export const SECTIONS = ['A', 'B', 'C', 'D']

export const PERIODS = [
  'Primer Trimestre',
  'Segundo Trimestre',
  'Tercer Trimestre',
  'Anual',
]

export const EVALUATION_TYPES = [
  { value: 'examen', label: 'Examen' },
  { value: 'tarea', label: 'Tarea' },
  { value: 'participacion', label: 'Participación' },
  { value: 'proyecto', label: 'Proyecto' },
  { value: 'practica', label: 'Práctica' },
]

export const DAYS_OF_WEEK = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
]
