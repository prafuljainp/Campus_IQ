import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { facultyAPI, departmentsAPI } from '../api/services'
import { Modal, PageLoader, EmptyState, SearchInput, Select, Field } from '../components/UI'
import useAuthStore from '../context/authStore'
import toast from 'react-hot-toast'

function FacultyForm({ initial = {}, departments, onSubmit, loading }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', department_id: '', designation: '',
    qualification: '', experience_years: 0, password: 'Faculty@123', ...initial
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Full Name *"><input className="input" value={form.name} onChange={e => set('name', e.target.value)} required /></Field></div>
        <Field label="Email *"><input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} required /></Field>
        <Field label="Phone"><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
        <Field label="Department">
          <Select value={form.department_id} onChange={v => set('department_id', v)}
            options={departments.map(d => ({ value: d.id, label: d.name }))} />
        </Field>
        <Field label="Designation"><input className="input" value={form.designation} onChange={e => set('designation', e.target.value)} /></Field>
        <Field label="Qualification"><input className="input" value={form.qualification} onChange={e => set('qualification', e.target.value)} /></Field>
        <Field label="Experience (years)"><input className="input" type="number" min="0" value={form.experience_years} onChange={e => set('experience_years', parseInt(e.target.value))} /></Field>
        {!initial.id && <Field label="Password"><input className="input" value={form.password} onChange={e => set('password', e.target.value)} /></Field>}
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? 'Saving...' : (initial.id ? 'Update Faculty' : 'Add Faculty')}
      </button>
    </form>
  )
}

export function FacultyPage() {
  const [faculty, setFaculty] = useState([])
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'super_admin'

  const load = useCallback(() => {
    setLoading(true)
    facultyAPI.list({ department_id: deptFilter || undefined })
      .then(r => setFaculty(r.data))
      .finally(() => setLoading(false))
  }, [deptFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { departmentsAPI.list().then(r => setDepartments(r.data)) }, [])

  const filtered = faculty.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async (form) => {
    setSaving(true)
    try { await facultyAPI.create(form); toast.success('Faculty added!'); setModal(null); load() }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }
  const handleUpdate = async (form) => {
    setSaving(true)
    try { await facultyAPI.update(selected.id, form); toast.success('Updated!'); setModal(null); load() }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }
  const handleDelete = async (id) => {
    if (!confirm('Deactivate this faculty member?')) return
    await facultyAPI.delete(id); toast.success('Deactivated'); load()
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search faculty..." />
        <Select value={deptFilter} onChange={setDeptFilter}
          options={departments.map(d => ({ value: d.id, label: d.code }))}
          placeholder="All Departments" className="w-44" />
        {isAdmin && (
          <button className="btn-primary ml-auto" onClick={() => { setSelected(null); setModal('create') }}>
            <Plus size={16} /> Add Faculty
          </button>
        )}
      </div>

      {loading ? <PageLoader /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(f => (
            <div key={f.id} className="card p-5 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {f.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 dark:text-white truncate">{f.name}</div>
                  <div className="text-xs text-slate-400 truncate">{f.email}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {f.department_name && <span className="badge badge-blue">{f.department_name}</span>}
                    {f.designation && <span className="badge badge-purple text-[10px]">{f.designation}</span>}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex flex-col gap-1">
                    <button onClick={() => { setSelected(f); setModal('edit') }}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-amber-500 transition-colors">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => handleDelete(f.id)}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <span>📚 {f.qualification || '—'}</span>
                <span>⏱ {f.experience_years}y exp</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && !loading && <div className="col-span-3"><EmptyState title="No faculty found" /></div>}
        </div>
      )}

      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Add Faculty">
        <FacultyForm departments={departments} onSubmit={handleCreate} loading={saving} />
      </Modal>
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Edit Faculty">
        {selected && <FacultyForm initial={selected} departments={departments} onSubmit={handleUpdate} loading={saving} />}
      </Modal>
    </div>
  )
}

export default FacultyPage
