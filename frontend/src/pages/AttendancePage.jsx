/**
 * Attendance Page — FIXED:
 * - Uses /attendance/summary endpoint (per-student aggregated data)
 * - Proper loading/error states
 * - Role-based UI
 */
import { useEffect, useState, useCallback } from 'react'
import { Plus, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import { attendanceAPI, studentsAPI, subjectsAPI } from '../api/services'
import { Modal, PageLoader, EmptyState, Field, Select } from '../components/UI'
import useAuthStore from '../context/authStore'
import toast from 'react-hot-toast'

export default function AttendancePage() {
  const [summary, setSummary] = useState([])
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [modal, setModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    student_id: '', subject_id: '',
    date: new Date().toISOString().split('T')[0],
    is_present: 'true'
  })
  const { user } = useAuthStore()
  const canEdit = ['super_admin', 'hod', 'faculty'].includes(user?.role)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [sumRes, subjRes, studRes] = await Promise.allSettled([
        attendanceAPI.summary(),
        subjectsAPI.list(),
        canEdit ? studentsAPI.list({ per_page: 100 }) : Promise.resolve({ data: { items: [] } }),
      ])
      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data || [])
      if (subjRes.status === 'fulfilled') setSubjects(subjRes.value.data || [])
      if (studRes.status === 'fulfilled') {
        const items = studRes.value?.data?.items || []
        if (items.length === 0 && canEdit) console.warn('No students returned from API')
        setStudents(items)
      } else if (studRes.status === 'rejected') {
        console.error('Failed to fetch students:', studRes.reason)
      }
    } catch (e) {
      console.error('Failed to load attendance data:', e)
      toast.error('Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }, [canEdit])

  useEffect(() => { load() }, [load])

  const handleMark = async (e) => {
    e.preventDefault()
    if (!form.student_id || !form.subject_id) {
      return toast.error('Select student and subject')
    }
    setSaving(true)
    try {
      await attendanceAPI.mark({
        student_id: parseInt(form.student_id),
        subject_id: parseInt(form.subject_id),
        date: form.date,
        is_present: form.is_present === 'true'
      })
      toast.success('Attendance marked!')
      setModal(false)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to mark attendance')
    } finally { setSaving(false) }
  }

  const pctColor = (pct) =>
    pct >= 75 ? 'text-emerald-600 dark:text-emerald-400'
    : pct >= 60 ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400'

  const barColor = (pct) =>
    pct >= 75 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'

  if (loading) return <PageLoader />

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {summary.length > 0 && (
            <div className="flex gap-4 text-sm">
              <span className="text-slate-500">Total: <b className="text-slate-800 dark:text-slate-200">{summary.length}</b></span>
              <span className="text-red-500">Low Attendance: <b>{summary.filter(s => s.low_attendance).length}</b></span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={load} className="btn-secondary">
            <RefreshCw size={15} /> Refresh
          </button>
          {canEdit && (
            <button className="btn-primary" onClick={() => setModal(true)}>
              <Plus size={16} /> Mark Attendance
            </button>
          )}
        </div>
      </div>

      {/* Summary Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white">Attendance Summary</h3>
          <span className="text-xs text-slate-400">{summary.length} students</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                {['Student','USN','Department','Classes','Present','Absent','Attendance %','Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.length === 0 ? (
                <tr><td colSpan={8}>
                  <EmptyState
                    title="No attendance records yet"
                    description="Mark attendance to see records here"
                    action={canEdit && (
                      <button className="btn-primary mt-2" onClick={() => setModal(true)}>
                        <Plus size={15} /> Mark Attendance
                      </button>
                    )}
                  />
                </td></tr>
              ) : summary.map(s => (
                <tr key={s.student_id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {s.student_name?.charAt(0) || '?'}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">{s.student_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.usn}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{s.department || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">{s.total_classes}</td>
                  <td className="px-4 py-3 text-emerald-600 font-semibold">{s.present}</td>
                  <td className="px-4 py-3 text-red-500">{s.absent}</td>
                  <td className="px-4 py-3">
                    {s.total_classes > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full w-20 min-w-[80px]">
                          <div className={`h-full rounded-full ${barColor(s.percentage)}`}
                            style={{ width: `${s.percentage}%` }} />
                        </div>
                        <span className={`font-bold text-sm w-12 text-right ${pctColor(s.percentage)}`}>
                          {s.percentage}%
                        </span>
                      </div>
                    ) : <span className="text-slate-400 text-xs">No data</span>}
                  </td>
                  <td className="px-4 py-3">
                    {s.total_classes === 0 ? (
                      <span className="badge badge-blue">No data</span>
                    ) : s.low_attendance ? (
                      <span className="badge badge-red flex items-center gap-1 w-fit">
                        <AlertTriangle size={10} /> Low
                      </span>
                    ) : (
                      <span className="badge badge-green flex items-center gap-1 w-fit">
                        <CheckCircle size={10} /> OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark Attendance Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Mark Attendance">
        <form onSubmit={handleMark} className="space-y-4">
          <Field label="Student *">
            <Select value={form.student_id} onChange={v => set('student_id', v)}
              options={students.map(s => ({ value: s.id, label: `${s.name} (${s.usn})` }))}
              placeholder="Select student..." />
          </Field>
          <Field label="Subject *">
            <Select value={form.subject_id} onChange={v => set('subject_id', v)}
              options={subjects.map(s => ({ value: s.id, label: `${s.name} (${s.code})` }))}
              placeholder="Select subject..." />
          </Field>
          <Field label="Date *">
            <input className="input" type="date" value={form.date}
              onChange={e => set('date', e.target.value)} required />
          </Field>
          <Field label="Status *">
            <Select value={form.is_present} onChange={v => set('is_present', v)}
              options={[
                { value: 'true', label: '✅ Present' },
                { value: 'false', label: '❌ Absent' }
              ]} />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Saving...' : 'Mark Attendance'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
