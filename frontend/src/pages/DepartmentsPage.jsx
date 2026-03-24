import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Users, GraduationCap, BarChart2 } from 'lucide-react'
import { departmentsAPI } from '../api/services'
import { Modal, EmptyState, PageLoader, Field } from '../components/UI'
import toast from 'react-hot-toast'

function DeptForm({ initial = {}, onSubmit, loading }) {
  const [form, setForm] = useState({ name: '', code: '', description: '', ...initial })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <Field label="Department Name *"><input className="input" value={form.name} onChange={e => set('name', e.target.value)} required /></Field>
      <Field label="Short Code *"><input className="input" value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="e.g. CSE" required /></Field>
      <Field label="Description"><textarea className="input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} /></Field>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? 'Saving...' : (initial.id ? 'Update' : 'Create Department')}
      </button>
    </form>
  )
}

export default function DepartmentsPage() {
  const [depts, setDepts] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const r = await departmentsAPI.list()
    setDepts(r.data)
    // Load stats for each
    const statsMap = {}
    await Promise.all(r.data.map(async d => {
      try {
        const s = await departmentsAPI.stats(d.id)
        statsMap[d.id] = s.data
      } catch {}
    }))
    setStats(statsMap)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (form) => {
    setSaving(true)
    try { await departmentsAPI.create(form); toast.success('Department created!'); setModal(null); load() }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }
  const handleUpdate = async (form) => {
    setSaving(true)
    try { await departmentsAPI.update(selected.id, form); toast.success('Updated!'); setModal(null); load() }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }
  const handleDelete = async (id) => {
    if (!confirm('Delete this department?')) return
    try { await departmentsAPI.delete(id); toast.success('Deleted'); load() }
    catch (e) { toast.error(e.response?.data?.detail || 'Cannot delete') }
  }

  const DEPT_COLORS = ['from-blue-500 to-blue-700', 'from-purple-500 to-purple-700', 'from-emerald-500 to-emerald-700', 'from-amber-500 to-amber-700', 'from-red-500 to-red-700']

  if (loading) return <PageLoader />

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => { setSelected(null); setModal('create') }}>
          <Plus size={16} /> New Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {depts.map((d, i) => {
          const s = stats[d.id] || {}
          return (
            <div key={d.id} className="card overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <div className={`bg-gradient-to-r ${DEPT_COLORS[i % DEPT_COLORS.length]} px-5 py-4`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-3xl font-black text-white/30 leading-none">{d.code}</div>
                    <div className="text-white font-bold mt-1 text-sm leading-tight">{d.name}</div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setSelected(d); setModal('edit') }}
                      className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => handleDelete(d.id)}
                      className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{s.total_students ?? '—'}</div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center justify-center gap-1"><Users size={10} />Students</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{s.total_faculty ?? '—'}</div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center justify-center gap-1"><GraduationCap size={10} />Faculty</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-600">{s.avg_cgpa ?? '—'}</div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center justify-center gap-1"><BarChart2 size={10} />Avg CGPA</div>
                </div>
              </div>
              {d.description && <p className="px-4 pb-4 text-xs text-slate-400">{d.description}</p>}
            </div>
          )
        })}
        {depts.length === 0 && <div className="col-span-3"><EmptyState title="No departments yet" /></div>}
      </div>

      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Create Department">
        <DeptForm onSubmit={handleCreate} loading={saving} />
      </Modal>
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Edit Department">
        {selected && <DeptForm initial={selected} onSubmit={handleUpdate} loading={saving} />}
      </Modal>
    </div>
  )
}
