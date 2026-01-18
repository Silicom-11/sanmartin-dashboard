import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { studentsService } from '@/services/api'
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react'
import { GRADE_LEVELS, SECTIONS } from '@/lib/utils'

// Mock data para desarrollo
const mockStudents = [
  { id: '1', firstName: 'Ana', lastName: 'García', dni: '12345678', gradeLevel: '5º Primaria', section: 'A', status: 'matriculado' },
  { id: '2', firstName: 'Carlos', lastName: 'Torres', dni: '23456789', gradeLevel: '4º Primaria', section: 'B', status: 'matriculado' },
  { id: '3', firstName: 'María', lastName: 'López', dni: '34567890', gradeLevel: '3º Secundaria', section: 'A', status: 'matriculado' },
  { id: '4', firstName: 'Pedro', lastName: 'Ramírez', dni: '45678901', gradeLevel: '2º Primaria', section: 'C', status: 'matriculado' },
  { id: '5', firstName: 'Lucía', lastName: 'Mendoza', dni: '56789012', gradeLevel: '1º Secundaria', section: 'A', status: 'retirado' },
]

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedSection, setSelectedSection] = useState('')

  const { data } = useQuery({
    queryKey: ['students', searchTerm, selectedGrade, selectedSection],
    queryFn: () => studentsService.getAll({
      search: searchTerm,
      gradeLevel: selectedGrade,
      section: selectedSection,
    }),
  })

  const students = data?.data?.students || mockStudents

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estudiantes</h1>
          <p className="text-gray-500 mt-1">Gestión de estudiantes matriculados</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-sanmartin-primary hover:bg-sanmartin-primary-dark text-white font-medium py-2.5 px-4 rounded-lg transition-colors">
          <Plus className="w-5 h-5" />
          Nuevo Estudiante
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sanmartin-primary focus:border-sanmartin-primary outline-none"
            />
          </div>

          {/* Grade Filter */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sanmartin-primary focus:border-sanmartin-primary outline-none"
          >
            <option value="">Todos los grados</option>
            {GRADE_LEVELS.map((grade) => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>

          {/* Section Filter */}
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sanmartin-primary focus:border-sanmartin-primary outline-none"
          >
            <option value="">Todas las secciones</option>
            {SECTIONS.map((section) => (
              <option key={section} value={section}>Sección {section}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Estudiante
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  DNI
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Grado
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Sección
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student: typeof mockStudents[0]) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sanmartin-primary flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {student.firstName[0]}{student.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {student.dni}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {student.gradeLevel}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {student.section}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      student.status === 'matriculado' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando 1-{students.length} de {students.length} estudiantes
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled>
              Anterior
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled>
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
