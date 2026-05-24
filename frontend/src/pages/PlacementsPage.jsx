/**
 * Placements Page — FIXED:
 * - Promise.allSettled prevents infinite loading
 * - HOD/Student see filtered data
 * - Real export via fetch+blob
 */
import { useEffect, useState, useCallback } from 'react'
import { Plus, Download, Trash2, CheckCircle, TrendingUp, RefreshCw, Briefcase } from 'lucide-react'
import { placementsAPI, internshipsAPI, studentsAPI } from '../api/services'
import { Modal, PageLoader, EmptyState, Field, Select, SearchInput } from '../components/UI'
import useAuthStore from '../context/authStore'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

function PlacementForm({ students, onSubmit, loading }) {
  const [form, setForm] = useState({
    student_id: '', company: '', role: '', package_lpa: '',
    placement_date: '', location: '', is_confirmed: false
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.student_id) return toast.error('Select a student')
    if (!form.company || !form.role) return toast.error('Company and role are required')
    onSubmit({
      ...form,
      student_id: parseInt(form.student_id),
      package_lpa: form.package_lpa ? parseFloat(form.package_lpa) : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Student *">
        <Select value={form.student_id} onChange={v => set('student_id', v)}
          options={students.map(s => ({ value: s.id, label: `${s.name} (${s.usn})` }))}
          placeholder="Select student..." />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Company *">
          <input className="input" value={form.company} onChange={e => set('company', e.target.value)} placeholder="e.g. Google" required />
        </Field>
        <Field label="Role *">
          <input className="input" value={form.role} onChange={e => set('role', e.target.value)} placeholder="e.g. SDE-I" required />
        </Field>
        <Field label="Package (LPA)">
          <input className="input" type="number" step="0.1" min="0" value={form.package_lpa}
            onChange={e => set('package_lpa', e.target.value)} placeholder="e.g. 12.5" />
        </Field>
        <Field label="Location">
          <input className="input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Bangalore" />
        </Field>
        <Field label="Placement Date">
          <input className="input" type="date" value={form.placement_date} onChange={e => set('placement_date', e.target.value)} />
        </Field>
        <div className="flex items-end pb-2.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_confirmed}
              onChange={e => set('is_confirmed', e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600" />
            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Confirmed Offer</span>
          </label>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
          {loading ? 'Adding...' : 'Add Placement'}
        </button>
      </div>
    </form>
  )
}

export default function PlacementsPage() {
  const [placements, setPlacements] = useState([])
  const [internships, setInternships] = useState([])
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('placements')
  const [modal, setModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { user } = useAuthStore()
  const canEdit = ['super_admin', 'hod'].includes(user?.role)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, iRes, stRes] = await Promise.allSettled([
        placementsAPI.list(),
        internshipsAPI.list(),
        canEdit ? studentsAPI.list({ per_page: 100 }) : Promise.resolve({ data: { items: [] } }),
      ])
      if (pRes.status === 'fulfilled') setPlacements(pRes.value.data || [])
      if (iRes.status === 'fulfilled') setInternships(iRes.value.data || [])
      if (stRes.status === 'fulfilled') {
        const items = stRes.value?.data?.items || []
        if (items.length === 0 && canEdit) console.warn('No students returned from API')
        setStudents(items)
      } else if (stRes.status === 'rejected') {
        console.error('Failed to fetch students:', stRes.reason)
      }
    } catch (e) {
      console.error('Failed to load placement data:', e)
      toast.error('Failed to load placement data')
    } finally {
      setLoading(false)
    }
  }, [canEdit])

  useEffect(() => { load() }, [load])

  const filtered = (tab === 'placements' ? placements : internships).filter(p =>
    !search ||
    (p.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.company || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.student_usn || '').toLowerCase().includes(search.toLowerCase())
  )

  const confirmedPlacements = placements.filter(p => p.is_confirmed)
  const avgPkg = confirmedPlacements.length
    ? (confirmedPlacements.reduce((a, p) => a + (p.package_lpa || 0), 0) / confirmedPlacements.length).toFixed(2)
    : 0
  const maxPkg = Math.max(0, ...confirmedPlacements.map(p => p.package_lpa || 0))

  const handleAdd = async (form) => {
    setSaving(true)
    try {
      await placementsAPI.add(form)
      toast.success('Placement record added!')
      setModal(false)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to add placement')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this placement record?')) return
    try {
      await placementsAPI.delete(id)
      toast.success('Deleted')
      load()
    } catch { toast.error('Delete failed') }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
            <CheckCircle size={22} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Confirmed Placements</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{confirmedPlacements.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={22} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Average Package</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">₹{avgPkg} LPA</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
            <Briefcase size={22} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Highest Package</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">₹{maxPkg} LPA</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={22} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Internships</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{internships.length}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {['placements', 'internships'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {t} ({t === 'placements' ? placements.length : internships.length})
            </button>
          ))}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search student, company..." />
        <div className="ml-auto flex items-center gap-2">
          <button onClick={load} className="btn-secondary"><RefreshCw size={15} /></button>
          {canEdit && tab === 'placements' && (
            <>
              <button onClick={() => placementsAPI.exportCSV()} className="btn-secondary">
                <Download size={15} /> Export CSV
              </button>
              <button className="btn-primary" onClick={() => setModal(true)}>
                <Plus size={16} /> Add Placement
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Student</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Company</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Role</th>
                {tab === 'placements' ? <>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Package</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                </> : <>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Duration</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Stipend</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Period</th>
                </>}
                {canEdit && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={canEdit ? 9 : 8}>
                  <EmptyState
                    title={search ? 'No matches found' : `No ${tab} records yet`}
                    description={!search && canEdit && tab === 'placements' ? "Click 'Add Placement' to record a placement" : ''}
                    action={!search && canEdit && tab === 'placements' && (
                      <button className="btn-primary mt-2" onClick={() => setModal(true)}>
                        <Plus size={15} /> Add Placement
                      </button>
                    )}
                  />
                </td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(p.student_name || '?').charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{p.student_name || '—'}</div>
                        {p.student_usn && <div className="text-xs text-slate-400 font-mono">{p.student_usn}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{p.company}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.role}</td>
                  {tab === 'placements' ? <>
                    <td className="px-4 py-3 font-bold text-emerald-600">
                      {p.package_lpa ? `₹${p.package_lpa} LPA` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.location || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {p.placement_date ? format(new Date(p.placement_date), 'd MMM yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {p.is_confirmed
                        ? <span className="badge badge-green">Confirmed</span>
                        : <span className="badge badge-amber">Pending</span>}
                    </td>
                  </> : <>
                    <td className="px-4 py-3 text-slate-600">{p.duration_months}mo</td>
                    <td className="px-4 py-3 text-amber-600 font-medium">
                      {p.stipend ? `₹${p.stipend?.toLocaleString()}/mo` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {p.start_date ? format(new Date(p.start_date), 'MMM yy') : ''}
                      {p.end_date ? ` – ${format(new Date(p.end_date), 'MMM yy')}` : ''}
                    </td>
                  </>}
                  {canEdit && tab === 'placements' && (
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(p.id)}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Add Placement Record">
        <PlacementForm students={students} onSubmit={handleAdd} loading={saving} />
      </Modal>
    </div>
  )
}
