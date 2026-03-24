/**
 * Marks Page — FIXED:
 * - Proper loading/error states with Promise.allSettled
 * - Real-time data after add
 * - Role-based visibility
 */
import { useEffect, useState, useCallback } from 'react'
import { Plus, RefreshCw, BookOpen } from 'lucide-react'
import { marksAPI, subjectsAPI, studentsAPI } from '../api/services'
import { Modal, PageLoader, EmptyState, Field, Select, GradeBadge } from '../components/UI'
import useAuthStore from '../context/authStore'
import toast from 'react-hot-toast'

export function MarksPage() {
  const [marks, setMarks] = useState([])
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [modal, setModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filterStudent, setFilterStudent] = useState('')
  const [filterSem, setFilterSem] = useState('')
  const [form, setForm] = useState({
    student_id: '', subject_id: '', semester: 1,
    internal_marks: '', external_marks: ''
  })
  const { user } = useAuthStore()
  const canEdit = ['super_admin', 'hod', 'faculty'].includes(user?.role)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterStudent) params.student_id = filterStudent
      if (filterSem) params.semester = filterSem

      const [mRes, sRes, stRes] = await Promise.allSettled([
        marksAPI.list(params),
        subjectsAPI.list(),
        canEdit ? studentsAPI.list({ per_page: 200 }) : Promise.resolve({ data: { items: [] } }),
      ])
      if (mRes.status === 'fulfilled') setMarks(mRes.value.data || [])
      if (sRes.status === 'fulfilled') setSubjects(sRes.value.data || [])
      if (stRes.status === 'fulfilled') setStudents(stRes.value.data?.items || [])
    } catch (e) {
      toast.error('Failed to load marks data')
    } finally {
      setLoading(false)
    }
  }, [filterStudent, filterSem, canEdit])

  useEffect(() => { load() }, [load])

  const handleAdd = async (e) => {
    e.preventDefault()
    const internal = parseFloat(form.internal_marks)
    const external = parseFloat(form.external_marks)
    if (isNaN(internal) || isNaN(external)) return toast.error('Enter valid marks')
    if (internal > 50) return toast.error('Internal marks cannot exceed 50')
    if (external > 100) return toast.error('External marks cannot exceed 100')

    setSaving(true)
    try {
      const res = await marksAPI.add({
        student_id: parseInt(form.student_id),
        subject_id: parseInt(form.subject_id),
        semester: parseInt(form.semester),
        internal_marks: internal,
        external_marks: external,
      })
      toast.success(`Marks saved! Grade: ${res.data.grade} (${res.data.grade_points} GP)`)
      setModal(false)
      setForm({ student_id: '', subject_id: '', semester: 1, internal_marks: '', external_marks: '' })
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to save marks')
    } finally { setSaving(false) }
  }

  // Group marks by student for better display
  const studentMap = {}
  marks.forEach(m => {
    const name = m.student_name || `Student #${m.student_id}`
    if (!studentMap[name]) studentMap[name] = { name, usn: m.student_usn, marks: [] }
    studentMap[name].marks.push(m)
  })
  const studentGroups = Object.values(studentMap)

  const SEMESTERS = [1,2,3,4,5,6,7,8].map(s => ({ value: s, label: `Sem ${s}` }))

  if (loading) return <PageLoader />

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {canEdit && (
          <Select value={filterStudent} onChange={setFilterStudent}
            options={students.map(s => ({ value: s.id, label: `${s.name} (${s.usn})` }))}
            placeholder="Filter by student" className="w-52" />
        )}
        <Select value={filterSem} onChange={setFilterSem} options={SEMESTERS}
          placeholder="All Semesters" className="w-36" />
        <div className="ml-auto flex items-center gap-2">
          <button onClick={load} className="btn-secondary"><RefreshCw size={15} /></button>
          {canEdit && (
            <button className="btn-primary" onClick={() => setModal(true)}>
              <Plus size={16} /> Enter Marks
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      {marks.length > 0 && (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {['O','A+','A','B+','B','F'].map(g => {
            const cnt = marks.filter(m => m.grade === g).length
            const colors = { O:'badge-green', 'A+':'badge-green', A:'badge-blue', 'B+':'badge-blue', B:'badge-amber', F:'badge-red' }
            return (
              <div key={g} className="card p-3 text-center">
                <GradeBadge grade={g} />
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{cnt}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Marks Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen size={16} className="text-blue-500" /> Academic Records
          </h3>
          <span className="text-xs text-slate-400">{marks.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                {['Student','USN','Subject','Sem','Internal /50','External /100','Total /150','Grade','GP','Result'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {marks.length === 0 ? (
                <tr><td colSpan={10}>
                  <EmptyState
                    title="No marks recorded yet"
                    description={canEdit ? "Click 'Enter Marks' to add academic records" : "No marks available"}
                    action={canEdit && (
                      <button className="btn-primary mt-2" onClick={() => setModal(true)}>
                        <Plus size={15} /> Enter Marks
                      </button>
                    )}
                  />
                </td></tr>
              ) : marks.map(m => (
                <tr key={m.id} className="table-row">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{m.student_name || `#${m.student_id}`}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{m.student_usn || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{m.subject_name || `Subject #${m.subject_id}`}</div>
                    {m.subject_code && <div className="text-xs text-slate-400">{m.subject_code}</div>}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{m.semester}</td>
                  <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{m.internal_marks}</td>
                  <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{m.external_marks}</td>
                  <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white">{m.total_marks?.toFixed(1)}</td>
                  <td className="px-4 py-3 text-center"><GradeBadge grade={m.grade} /></td>
                  <td className="px-4 py-3 text-center font-bold text-blue-600">{m.grade_points}</td>
                  <td className="px-4 py-3 text-center">
                    {m.is_pass
                      ? <span className="badge badge-green">Pass</span>
                      : <span className="badge badge-red">Fail</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Marks Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Enter Marks">
        <form onSubmit={handleAdd} className="space-y-4">
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
          <div className="grid grid-cols-3 gap-3">
            <Field label="Semester *">
              <Select value={form.semester} onChange={v => set('semester', v)} options={SEMESTERS} />
            </Field>
            <Field label="Internal (max 50)">
              <input className="input" type="number" min="0" max="50" step="0.5"
                value={form.internal_marks} onChange={e => set('internal_marks', e.target.value)}
                placeholder="0 – 50" required />
            </Field>
            <Field label="External (max 100)">
              <input className="input" type="number" min="0" max="100" step="0.5"
                value={form.external_marks} onChange={e => set('external_marks', e.target.value)}
                placeholder="0 – 100" required />
            </Field>
          </div>
          {form.internal_marks && form.external_marks && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-sm">
              <span className="text-slate-500">Total: </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {(parseFloat(form.internal_marks || 0) + parseFloat(form.external_marks || 0)).toFixed(1)} / 150
              </span>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Saving...' : 'Save Marks'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default MarksPage
