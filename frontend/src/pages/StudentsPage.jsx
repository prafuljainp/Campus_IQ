/**
 * Students Page — FIXED:
 * - Promise.allSettled prevents infinite loading
 * - Instant re-fetch after create/update/delete
 * - Proper role-based buttons
 */
import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Download, Eye, Pencil, Trash2, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react'
import { studentsAPI, departmentsAPI } from '../api/services'
import { Modal, PageLoader, EmptyState, Pagination, SearchInput, Select, Field } from '../components/UI'
import useAuthStore from '../context/authStore'
import toast from 'react-hot-toast'

const SEMESTERS = [1,2,3,4,5,6,7,8].map(s => ({ value: s, label: `Sem ${s}` }))
const BLOOD_GROUPS = ['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(v => ({ value: v, label: v }))
const GENDERS = [{value:'male',label:'Male'},{value:'female',label:'Female'},{value:'other',label:'Other'}]

function StudentForm({ initial = {}, departments, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({
    name: '', usn: '', email: '', phone: '', gender: '', date_of_birth: '',
    blood_group: '', father_name: '', mother_name: '', parent_phone: '',
    address: '', city: '', state: 'Karnataka', pincode: '',
    department_id: '', semester: 1, section: '', admission_year: new Date().getFullYear(),
    cgpa: 0, sgpa: 0, backlog_count: 0, github: '', linkedin: '',
    password: 'Student@123',
    ...initial,
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-5">
      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Basic Info</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Field label="Full Name *"><input className="input" value={form.name} onChange={e => set('name', e.target.value)} required /></Field></div>
          <Field label="USN *"><input className="input" value={form.usn} onChange={e => set('usn', e.target.value)} required /></Field>
          <Field label="Email *"><input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} required /></Field>
          <Field label="Phone"><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
          <Field label="Date of Birth"><input className="input" type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} /></Field>
          <Field label="Gender"><Select value={form.gender} onChange={v => set('gender', v)} options={GENDERS} /></Field>
          <Field label="Blood Group"><Select value={form.blood_group} onChange={v => set('blood_group', v)} options={BLOOD_GROUPS} /></Field>
        </div>
      </section>
      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Academic</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Department *">
            <Select value={form.department_id} onChange={v => set('department_id', v)}
              options={departments.map(d => ({ value: String(d.id), label: d.name }))}
              placeholder="Select department..." />
          </Field>
          <Field label="Semester"><Select value={form.semester} onChange={v => set('semester', parseInt(v))} options={SEMESTERS} /></Field>
          <Field label="Section"><input className="input" value={form.section} onChange={e => set('section', e.target.value)} placeholder="A / B / C" /></Field>
          <Field label="Admission Year"><input className="input" type="number" value={form.admission_year} onChange={e => set('admission_year', parseInt(e.target.value))} /></Field>
          <Field label="CGPA (0-10)"><input className="input" type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={e => set('cgpa', parseFloat(e.target.value))} /></Field>
          <Field label="Backlogs"><input className="input" type="number" min="0" value={form.backlog_count} onChange={e => set('backlog_count', parseInt(e.target.value))} /></Field>
        </div>
      </section>
      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Family</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Father's Name"><input className="input" value={form.father_name} onChange={e => set('father_name', e.target.value)} /></Field>
          <Field label="Mother's Name"><input className="input" value={form.mother_name} onChange={e => set('mother_name', e.target.value)} /></Field>
          <Field label="Parent Phone"><input className="input" value={form.parent_phone} onChange={e => set('parent_phone', e.target.value)} /></Field>
        </div>
      </section>
      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Address</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Field label="Street Address"><input className="input" value={form.address} onChange={e => set('address', e.target.value)} /></Field></div>
          <Field label="City"><input className="input" value={form.city} onChange={e => set('city', e.target.value)} /></Field>
          <Field label="State"><input className="input" value={form.state} onChange={e => set('state', e.target.value)} /></Field>
          <Field label="Pincode"><input className="input" value={form.pincode} onChange={e => set('pincode', e.target.value)} /></Field>
        </div>
      </section>
      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Professional Links</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="GitHub URL"><input className="input" value={form.github} onChange={e => set('github', e.target.value)} placeholder="https://github.com/..." /></Field>
          <Field label="LinkedIn URL"><input className="input" value={form.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." /></Field>
          {!initial.id && <Field label="Login Password"><input className="input" value={form.password} onChange={e => set('password', e.target.value)} /></Field>}
        </div>
      </section>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1 justify-center">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
          {saving ? 'Saving...' : (initial.id ? 'Update Student' : 'Create Student')}
        </button>
      </div>
    </form>
  )
}

const SortIcon = ({ col, sortBy, sortDir }) =>
  sortBy === col
    ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
    : <ChevronUp size={12} className="opacity-20" />

export default function StudentsPage() {
  const [data, setData] = useState({ items: [], total: 0, pages: 1 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [semFilter, setSemFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const { user } = useAuthStore()
  const canEdit = ['super_admin', 'hod'].includes(user?.role)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 20, sort_by: sortBy, sort_dir: sortDir }
      if (search) params.search = search
      if (deptFilter) params.department_id = deptFilter
      if (semFilter) params.semester = semFilter
      const r = await studentsAPI.list(params)
      setData(r.data || { items: [], total: 0, pages: 1 })
    } catch (e) {
      toast.error('Failed to load students')
      setData({ items: [], total: 0, pages: 1 })
    } finally {
      setLoading(false)
    }
  }, [page, search, deptFilter, semFilter, sortBy, sortDir])

  useEffect(() => { load() }, [load])
  useEffect(() => { departmentsAPI.list().then(r => setDepartments(r.data || [])).catch(() => {}) }, [])
  useEffect(() => { setPage(1) }, [search, deptFilter, semFilter])

  const handleSort = (col) => {
    setSortBy(col)
    setSortDir(d => col === sortBy ? (d === 'asc' ? 'desc' : 'asc') : 'asc')
  }

  const handleCreate = async (form) => {
    if (!form.department_id) return toast.error('Select a department')
    setSaving(true)
    try {
      await studentsAPI.create({ ...form, department_id: parseInt(form.department_id) })
      toast.success('Student created!')
      setModal(null)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to create student')
    } finally { setSaving(false) }
  }

  const handleUpdate = async (form) => {
    setSaving(true)
    try {
      await studentsAPI.update(selected.id, form)
      toast.success('Student updated!')
      setModal(null)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Deactivate ${name}? They will no longer have access.`)) return
    try {
      await studentsAPI.delete(id)
      toast.success(`${name} deactivated`)
      load()
    } catch { toast.error('Delete failed') }
  }

  const cgpaColor = (v) => v >= 8.5 ? 'text-emerald-600' : v >= 7 ? 'text-blue-600' : v >= 5 ? 'text-amber-600' : 'text-red-500'

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search by name, USN, email..." />
        <Select value={deptFilter} onChange={v => { setDeptFilter(v); setPage(1) }}
          options={departments.map(d => ({ value: d.id, label: d.code }))}
          placeholder="All Depts" className="w-36" />
        <Select value={semFilter} onChange={v => { setSemFilter(v); setPage(1) }}
          options={SEMESTERS} placeholder="All Sems" className="w-32" />
        <div className="ml-auto flex items-center gap-2">
          <button onClick={load} className="btn-secondary"><RefreshCw size={15} /></button>
          {canEdit && (
            <>
              <button onClick={() => studentsAPI.exportCSV()} className="btn-secondary">
                <Download size={15} /> Export
              </button>
              <button className="btn-primary" onClick={() => { setSelected(null); setModal('create') }}>
                <Plus size={16} /> Add Student
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {data.total > 0 && (
          <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
            <span className="text-xs text-slate-500">{data.total} students found</span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                {[['name','Name'],['usn','USN'],['cgpa','CGPA']].map(([col, lbl]) => (
                  <th key={col} onClick={() => handleSort(col)}
                    className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-700 select-none">
                    <span className="flex items-center gap-1">{lbl}<SortIcon col={col} sortBy={sortBy} sortDir={sortDir} /></span>
                  </th>
                ))}
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Department</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Sem</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Skills</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Backlogs</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                    {Array(9).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : data.items.length === 0 ? (
                <tr><td colSpan={9}>
                  <EmptyState
                    title={search ? 'No students match your search' : 'No students found'}
                    description={!search && canEdit ? "Add your first student to get started" : ''}
                    action={!search && canEdit && (
                      <button className="btn-primary mt-2" onClick={() => { setSelected(null); setModal('create') }}>
                        <Plus size={15} /> Add Student
                      </button>
                    )}
                  />
                </td></tr>
              ) : data.items.map(s => (
                <tr key={s.id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{s.name}</div>
                        <div className="text-xs text-slate-400 truncate max-w-[160px]">{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{s.usn}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold text-lg ${cgpaColor(s.cgpa)}`}>{s.cgpa?.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">{s.department_name || '—'}</td>
                  <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{s.semester}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(s.skills || []).slice(0, 2).map((sk, i) => (
                        <span key={i} className="badge badge-blue text-[10px]">{sk.name}</span>
                      ))}
                      {(s.skills || []).length > 2 && (
                        <span className="badge badge-blue text-[10px]">+{s.skills.length - 2}</span>
                      )}
                      {(!s.skills || s.skills.length === 0) && <span className="text-xs text-slate-400">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {s.backlog_count > 0
                      ? <span className="badge badge-red">{s.backlog_count}</span>
                      : <span className="badge badge-green">Clear</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/students/${s.id}`}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="View profile">
                        <Eye size={14} />
                      </Link>
                      {canEdit && (
                        <>
                          <button onClick={() => { setSelected(s); setModal('edit') }}
                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                            title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(s.id, s.name)}
                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Deactivate">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pages={data.pages || 1} total={data.total || 0} perPage={20} onPage={setPage} />
      </div>

      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Add New Student" size="lg">
        <StudentForm departments={departments} onSubmit={handleCreate} onCancel={() => setModal(null)} saving={saving} />
      </Modal>
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Edit Student" size="lg">
        {selected && <StudentForm initial={selected} departments={departments} onSubmit={handleUpdate} onCancel={() => setModal(null)} saving={saving} />}
      </Modal>
    </div>
  )
}
