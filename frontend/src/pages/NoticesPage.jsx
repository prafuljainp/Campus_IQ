import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Bell, Trophy, Medal, Crown, RefreshCw } from 'lucide-react'
import { noticesAPI, departmentsAPI, studentsAPI, logsAPI } from '../api/services'
import { Modal, PageLoader, EmptyState, Field, Select, Pagination } from '../components/UI'
import useAuthStore from '../context/authStore'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

// ── Notices Page ─────────────────────────────────────────────────────────────
export function NoticesPage() {
  const [notices, setNotices] = useState([])
  const [departments, setDepartments] = useState([])
  const [modal, setModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', department_id: '' })
  const { user } = useAuthStore()
  const canEdit = ['super_admin', 'hod', 'faculty'].includes(user?.role)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [nRes, dRes] = await Promise.allSettled([
        noticesAPI.list(),
        departmentsAPI.list(),
      ])
      if (nRes.status === 'fulfilled') setNotices(nRes.value.data || [])
      if (dRes.status === 'fulfilled') setDepartments(dRes.value.data || [])
    } catch { toast.error('Failed to load notices') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.title || !form.content) return toast.error('Title and content required')
    setSaving(true)
    try {
      await noticesAPI.create({
        ...form,
        department_id: form.department_id ? parseInt(form.department_id) : null
      })
      toast.success('Notice posted!')
      setModal(false)
      setForm({ title: '', content: '', department_id: '' })
      load()
    } catch { toast.error('Failed to post notice') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this notice?')) return
    try { await noticesAPI.delete(id); toast.success('Deleted'); load() }
    catch { toast.error('Delete failed') }
  }

  const COLORS = ['from-blue-500 to-blue-600','from-purple-500 to-purple-600','from-emerald-500 to-emerald-600','from-amber-500 to-amber-600','from-red-500 to-red-600']

  if (loading) return <PageLoader />
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{notices.length} notices</span>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary"><RefreshCw size={15} /></button>
          {canEdit && <button className="btn-primary" onClick={() => setModal(true)}><Plus size={16} />Post Notice</button>}
        </div>
      </div>
      <div className="space-y-3">
        {notices.length === 0
          ? <EmptyState title="No notices yet" description={canEdit ? "Post the first notice" : "Check back later"} />
          : notices.map((n, i) => (
          <div key={n.id} className="card p-5 flex gap-4 hover:shadow-md transition-all duration-200">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${COLORS[i % COLORS.length]} flex items-center justify-center flex-shrink-0`}>
              <Bell size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{n.title}</h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {n.department_id && <span className="badge badge-blue">Dept</span>}
                  <span className="text-xs text-slate-400">{format(new Date(n.created_at), 'd MMM yyyy')}</span>
                  {canEdit && (
                    <button onClick={() => handleDelete(n.id)}
                      className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{n.content}</p>
            </div>
          </div>
        ))}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Post New Notice">
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Title *"><input className="input" value={form.title} onChange={e => set('title', e.target.value)} required /></Field>
          <Field label="Content *"><textarea className="input" rows={4} value={form.content} onChange={e => set('content', e.target.value)} required /></Field>
          <Field label="Target Department (leave blank for all)">
            <Select value={form.department_id} onChange={v => set('department_id', v)}
              options={departments.map(d => ({ value: d.id, label: d.name }))} placeholder="All Departments" />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Posting...' : 'Post Notice'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// ── Ranking Page ─────────────────────────────────────────────────────────────
export function RankingPage() {
  const [ranking, setRanking] = useState([])
  const [departments, setDepartments] = useState([])
  const [deptFilter, setDeptFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (deptFilter) params.department_id = deptFilter
      const r = await studentsAPI.ranking(params)
      setRanking(r.data || [])
    } catch { toast.error('Failed to load rankings') }
    finally { setLoading(false) }
  }, [deptFilter])

  useEffect(() => { departmentsAPI.list().then(r => setDepartments(r.data || [])).catch(() => {}) }, [])
  useEffect(() => { load() }, [load])

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown size={16} className="text-yellow-500" />
    if (rank === 2) return <Medal size={16} className="text-slate-400" />
    if (rank === 3) return <Medal size={16} className="text-amber-600" />
    return <span className="text-slate-400 text-xs font-bold">{rank}</span>
  }

  if (loading) return <PageLoader />
  const maxScore = ranking[0]?.score || 1

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
          <Trophy size={20} className="text-amber-500" /> Student Leaderboard
          <span className="text-sm text-slate-400 font-normal ml-1">({ranking.length} students)</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-secondary"><RefreshCw size={15} /></button>
          <Select value={deptFilter} onChange={setDeptFilter}
            options={departments.map(d => ({ value: d.id, label: d.code }))}
            placeholder="All Departments" className="w-44" />
        </div>
      </div>

      {ranking.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {[ranking[1], ranking[0], ranking[2]].map((s, idx) => {
            if (!s) return null
            const ringClass = idx === 1 ? 'ring-2 ring-yellow-400 dark:ring-yellow-500' : ''
            const avatarColors = ['bg-slate-500','bg-yellow-500','bg-amber-700']
            return (
              <div key={s.id} className={`card p-5 flex flex-col items-center text-center ${ringClass}`}>
                <div className={`w-12 h-12 rounded-2xl ${avatarColors[idx]} flex items-center justify-center text-white font-bold text-lg mb-2`}>
                  {s.name.charAt(0)}
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">{s.name}</div>
                <div className="text-xs text-slate-400 mt-0.5 truncate w-full px-2">{s.department}</div>
                <div className="font-bold text-emerald-600 mt-2">{s.cgpa} CGPA</div>
                <div className="mt-1">{getRankIcon(s.rank)}</div>
              </div>
            )
          })}
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              {['Rank','Student','Department','CGPA','Skills','Internships','Score'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranking.length === 0
              ? <tr><td colSpan={7}><EmptyState title="No ranking data available" /></td></tr>
              : ranking.map(s => (
              <tr key={s.id} className={`table-row ${s.rank <= 3 ? 'bg-amber-50/40 dark:bg-amber-900/10' : ''}`}>
                <td className="px-4 py-3"><div className="flex items-center w-7">{getRankIcon(s.rank)}</div></td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900 dark:text-white">{s.name}</div>
                  <div className="text-xs text-slate-400 font-mono">{s.usn}</div>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{s.department}</td>
                <td className="px-4 py-3 font-bold text-blue-600">{s.cgpa}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.skills_count}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.internships_count}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full max-w-16">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ width: `${(s.score / maxScore) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{s.score}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Activity Logs Page ────────────────────────────────────────────────────────
export function ActivityLogsPage() {
  const [logs, setLogs] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await logsAPI.list({ page, per_page: 50 })
      setLogs(r.data?.items || [])
      setTotal(r.data?.total || 0)
    } catch { toast.error('Failed to load logs') }
    finally { setLoading(false) }
  }, [page])

  useEffect(() => { load() }, [load])

  const actionColor = (action = '') => {
    if (action.includes('LOGIN')) return 'badge-blue'
    if (action.includes('CREATED')) return 'badge-green'
    if (action.includes('UPDATED') || action.includes('MARKS')) return 'badge-amber'
    if (action.includes('DELETED')) return 'badge-red'
    return 'badge-purple'
  }

  if (loading) return <PageLoader />
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-500">{total} log entries</span>
        <button onClick={load} className="btn-secondary"><RefreshCw size={15} /></button>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                {['Timestamp','User','Role','Action','Details'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0
                ? <tr><td colSpan={5}><EmptyState title="No activity logs yet" description="User actions will appear here" /></td></tr>
                : logs.map(log => (
                <tr key={log.id} className="table-row">
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono whitespace-nowrap">
                    {format(new Date(log.created_at), 'dd/MM/yy HH:mm:ss')}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 max-w-[180px] truncate">
                    {log.user_email || 'System'}
                  </td>
                  <td className="px-4 py-3">
                    {log.user_role && (
                      <span className="badge badge-blue text-[10px] capitalize">{log.user_role.replace('_', ' ')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${actionColor(log.action)} text-[10px]`}>{log.action}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 max-w-xs truncate">{log.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pages={Math.ceil(total / 50)} total={total} perPage={50} onPage={setPage} />
      </div>
    </div>
  )
}

export default NoticesPage
