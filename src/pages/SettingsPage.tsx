import { useState } from 'react'
import { Save, Building2, Calendar, Clock, Users, Bell, Shield, Palette, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface InstitutionSettings {
  name: string
  code: string
  address: string
  phone: string
  email: string
  logo: string
}

interface AcademicSettings {
  currentYear: string
  evaluationSystem: 'bimestral' | 'trimestral' | 'semestral'
  gradeScale: 'vigesimal' | 'centesimal' | 'literal'
  passingGrade: number
  startDate: string
  endDate: string
}

const mockInstitution: InstitutionSettings = {
  name: 'Colegio San Martín',
  code: 'CSM-001',
  address: 'Av. Educación 123, Lima',
  phone: '+51 999 888 777',
  email: 'contacto@sanmartin.edu.pe',
  logo: '/logo.png'
}

const mockAcademic: AcademicSettings = {
  currentYear: '2024',
  evaluationSystem: 'bimestral',
  gradeScale: 'vigesimal',
  passingGrade: 11,
  startDate: '2024-03-01',
  endDate: '2024-12-20'
}

function SettingSection({ title, description, icon: Icon, children }: { title: string; description: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sanmartin-primary/10 rounded-lg">
            <Icon className="w-5 h-5 text-sanmartin-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const [institution, setInstitution] = useState(mockInstitution)
  const [academic, setAcademic] = useState(mockAcademic)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-500 mt-1">Administra la configuración del sistema escolar</p>
        </div>
        <Button onClick={handleSave} className="bg-sanmartin-primary hover:bg-sanmartin-primary-dark">
          {saved ? <><CheckCircle className="w-4 h-4 mr-2" />Guardado!</> : <><Save className="w-4 h-4 mr-2" />Guardar Cambios</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SettingSection title="Información Institucional" description="Datos básicos de la institución educativa" icon={Building2}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nombre de la Institución</label>
              <Input value={institution.name} onChange={(e) => setInstitution({ ...institution, name: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Código Modular</label>
                <Input value={institution.code} onChange={(e) => setInstitution({ ...institution, code: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Teléfono</label>
                <Input value={institution.phone} onChange={(e) => setInstitution({ ...institution, phone: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Dirección</label>
              <Input value={institution.address} onChange={(e) => setInstitution({ ...institution, address: e.target.value })} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Correo Electrónico</label>
              <Input type="email" value={institution.email} onChange={(e) => setInstitution({ ...institution, email: e.target.value })} className="mt-1" />
            </div>
          </div>
        </SettingSection>

        <SettingSection title="Configuración Académica" description="Año escolar, períodos y sistema de evaluación" icon={Calendar}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Año Académico</label>
                <Input value={academic.currentYear} onChange={(e) => setAcademic({ ...academic, currentYear: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Nota Mínima Aprobatoria</label>
                <Input type="number" value={academic.passingGrade} onChange={(e) => setAcademic({ ...academic, passingGrade: Number(e.target.value) })} className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Sistema de Evaluación</label>
              <div className="flex gap-2">
                {(['bimestral', 'trimestral', 'semestral'] as const).map((sys) => (
                  <Button key={sys} variant={academic.evaluationSystem === sys ? 'default' : 'outline'} onClick={() => setAcademic({ ...academic, evaluationSystem: sys })} className="capitalize">
                    {sys}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Escala de Calificación</label>
              <div className="flex gap-2">
                {[{ id: 'vigesimal', label: '0-20' }, { id: 'centesimal', label: '0-100' }, { id: 'literal', label: 'AD-A-B-C' }].map((scale) => (
                  <Button key={scale.id} variant={academic.gradeScale === scale.id ? 'default' : 'outline'} onClick={() => setAcademic({ ...academic, gradeScale: scale.id as 'vigesimal' | 'centesimal' | 'literal' })}>
                    {scale.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Inicio de Clases</label>
                <Input type="date" value={academic.startDate} onChange={(e) => setAcademic({ ...academic, startDate: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Fin de Clases</label>
                <Input type="date" value={academic.endDate} onChange={(e) => setAcademic({ ...academic, endDate: e.target.value })} className="mt-1" />
              </div>
            </div>
          </div>
        </SettingSection>

        <SettingSection title="Horarios y Períodos" description="Configuración de horarios escolares" icon={Clock}>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="font-medium mb-3">Períodos Académicos Activos</h4>
              <div className="space-y-2">
                {['Bimestre 1: 01 Mar - 10 May', 'Bimestre 2: 20 May - 26 Jul', 'Bimestre 3: 12 Ago - 18 Oct', 'Bimestre 4: 28 Oct - 20 Dic'].map((period, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-white rounded-lg border">
                    <span className="text-sm">{period}</span>
                    <Badge variant={i === 0 ? 'default' : 'outline'}>{i === 0 ? 'Actual' : 'Próximo'}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Hora de Entrada</label>
                <Input type="time" defaultValue="07:45" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Hora de Salida</label>
                <Input type="time" defaultValue="14:30" className="mt-1" />
              </div>
            </div>
          </div>
        </SettingSection>

        <SettingSection title="Notificaciones" description="Configuración de alertas y comunicaciones" icon={Bell}>
          <div className="space-y-3">
            {[
              { id: 'attendance', label: 'Notificar ausencias a padres', desc: 'Envío automático por WhatsApp/Email', enabled: true },
              { id: 'grades', label: 'Notificar calificaciones publicadas', desc: 'Cuando el docente registra notas', enabled: true },
              { id: 'events', label: 'Recordatorios de eventos', desc: 'Reuniones, exámenes, actividades', enabled: false },
              { id: 'emergency', label: 'Alertas de emergencia', desc: 'Notificaciones prioritarias', enabled: true },
            ].map((notif) => (
              <div key={notif.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{notif.label}</p>
                  <p className="text-xs text-gray-500">{notif.desc}</p>
                </div>
                <Button variant={notif.enabled ? 'default' : 'outline'} size="sm">
                  {notif.enabled ? 'Activo' : 'Inactivo'}
                </Button>
              </div>
            ))}
          </div>
        </SettingSection>

        <SettingSection title="Roles y Permisos" description="Gestión de acceso al sistema" icon={Shield}>
          <div className="space-y-3">
            {[
              { role: 'Administrador', count: 2, color: 'bg-red-100 text-red-700', perms: 'Acceso total' },
              { role: 'Director', count: 1, color: 'bg-purple-100 text-purple-700', perms: 'Gestión académica' },
              { role: 'Docente', count: 24, color: 'bg-blue-100 text-blue-700', perms: 'Notas y asistencia' },
              { role: 'Padre/Tutor', count: 156, color: 'bg-green-100 text-green-700', perms: 'Solo lectura' },
            ].map((r) => (
              <div key={r.role} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge className={r.color}>{r.role}</Badge>
                  <span className="text-sm text-gray-600">{r.perms}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{r.count}</span>
                </div>
              </div>
            ))}
          </div>
        </SettingSection>

        <SettingSection title="Personalización" description="Apariencia y branding" icon={Palette}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Color Principal</label>
              <div className="flex gap-2">
                {['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'].map((color) => (
                  <button key={color} className="w-8 h-8 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform" style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-sanmartin-primary to-blue-600 rounded-xl text-white">
              <h4 className="font-semibold mb-1">Vista Previa</h4>
              <p className="text-sm opacity-90">Así se verá tu dashboard con los colores seleccionados</p>
            </div>
          </div>
        </SettingSection>
      </div>
    </div>
  )
}
