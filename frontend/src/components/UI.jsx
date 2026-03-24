import { X, ChevronLeft, ChevronRight, Loader2, Inbox } from 'lucide-react'

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-scale-in`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-blue-500 ${className}`} />
}

// ── Full-page loader ──────────────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <Spinner size={32} />
      <p className="text-sm text-slate-400">Loading...</p>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ title = 'No data found', description = '', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <Inbox size={28} className="text-slate-400" />
      </div>
      <div>
        <p className="font-semibold text-slate-700 dark:text-slate-200">{title}</p>
        {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({ page, pages, total, perPage, onPage }) {
  if (pages <= 1) return null
  const from = (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700">
      <span className="text-sm text-slate-500">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: Math.min(5, pages) }, (_, i) => {
          const p = Math.max(1, Math.min(page - 2, pages - 4)) + i
          if (p < 1 || p > pages) return null
          return (
            <button key={p} onClick={() => onPage(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}>
              {p}
            </button>
          )
        })}
        <button onClick={() => onPage(page + 1)} disabled={page === pages}
          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ icon: Icon, label, value, sub, color = 'blue', trend }) {
  const colors = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  }
  return (
    <div className="stat-card animate-fade-in">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Form field wrapper ────────────────────────────────────────────────────────
export function Field({ label, children, error }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

// ── Search input ──────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-9 w-full"
      />
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ value, onChange, options, placeholder = 'Select...', className = '' }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={`input ${className}`}>
      <option value="">{placeholder}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

// ── Badge variants ────────────────────────────────────────────────────────────
export function RoleBadge({ role }) {
  const map = {
    super_admin: ['badge-purple', 'Super Admin'],
    hod: ['badge-blue', 'HOD'],
    faculty: ['badge-green', 'Faculty'],
    student: ['badge-amber', 'Student'],
  }
  const [cls, label] = map[role] || ['badge-blue', role]
  return <span className={cls}>{label}</span>
}

// ── Grade badge ───────────────────────────────────────────────────────────────
export function GradeBadge({ grade }) {
  const cls = grade === 'O' || grade === 'A+' ? 'badge-green'
    : grade === 'A' || grade === 'B+' ? 'badge-blue'
    : grade === 'F' ? 'badge-red' : 'badge-amber'
  return <span className={cls}>{grade || 'N/A'}</span>
}
