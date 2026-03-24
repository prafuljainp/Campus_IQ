/**
 * Dashboard — FIXED:
 * - Each API call has individual try/catch (one failure won't kill the whole page)
 * - loading=false always set in finally
 * - Student dashboard shows personal data
 * - Role-based content rendering
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, GraduationCap, Building2, Briefcase, TrendingUp,
  Award, BookOpen, Bell, ArrowRight, AlertTriangle, CheckCircle2,
  ClipboardCheck, Star
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from 'recharts'
import { analyticsAPI, noticesAPI, studentsAPI, attendanceAPI } from '../api/services'
import { StatCard, PageLoader } from '../components/UI'
import useAuthStore from '../context/authStore'
import { format } from 'date-fns'

const COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4']

async function safeCall(fn) {
  try { return await fn() } catch { return null }
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [cgpaDist, setCgpaDist] = useState([])
  const [deptPerf, setDeptPerf] = useState([])
  const [trends, setTrends] = useState([])
  const [notices, setNotices] = useState([])
  const [companies, setCompanies] = useState([])
  const [studentProfile, setStudentProfile] = useState(null)
  const [attSummary, setAttSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        // These are individual so one failure doesn't block others
        const [s, c, d, t, co, n] = await Promise.allSettled([
          analyticsAPI.summary(),
          analyticsAPI.cgpaDistribution(),
          analyticsAPI.departmentPerformance(),
          analyticsAPI.placementTrends(),
          analyticsAPI.topCompanies(),
          noticesAPI.list(),
        ])

        if (s.status === 'fulfilled') setSummary(s.value.data)
        if (c.status === 'fulfilled') setCgpaDist(c.value.data || [])
        if (d.status === 'fulfilled') setDeptPerf(d.value.data || [])
        if (t.status === 'fulfilled') setTrends(t.value.data || [])
        if (co.status === 'fulfilled') setCompanies((co.value.data || []).slice(0, 5))
        if (n.status === 'fulfilled') setNotices((n.value.data || []).slice(0, 5))

        // Student-specific data
        if (user?.role === 'student' && user?.student_id) {
          const [sp, att] = await Promise.allSettled([
            studentsAPI.get(user.student_id),
            attendanceAPI.percentage(user.student_id),
          ])
          if (sp.status === 'fulfilled') setStudentProfile(sp.value.data)
          if (att.status === 'fulfilled') setAttSummary(att.value.data)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [user?.role])

  if (loading) return <PageLoader />

  const isAdmin = ['super_admin', 'hod', 'faculty'].includes(user?.role)
  const isStudent = user?.role === 'student'

  const roleLabel = { super_admin: 'Super Admin', hod: 'HOD', faculty: 'Faculty', student: 'Student' }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="card p-6 border-0 text-white overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-16 translate-x-16" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-blue-200 text-sm">{roleLabel[user?.role]} Dashboard</p>
            <h2 className="text-2xl font-bold mt-1">Welcome, {user?.name} 👋</h2>
            <p className="text-blue-200 text-sm mt-1">
              {format(new Date(), 'EEEE, d MMMM yyyy')}
            </p>
          </div>
          {summary && (
            <div className="hidden sm:flex items-center gap-6 bg-white/10 rounded-2xl px-6 py-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{summary.placement_rate}%</div>
                <div className="text-blue-200 text-xs">Placement Rate</div>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <div className="text-2xl font-bold">{summary.avg_cgpa}</div>
                <div className="text-blue-200 text-xs">Avg CGPA</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin / HOD / Faculty Stats */}
      {isAdmin && summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Students" value={summary.total_students} sub="Active enrollments" color="blue" />
          <StatCard icon={GraduationCap} label="Faculty Members" value={summary.total_faculty} sub="Across departments" color="green" />
          <StatCard icon={Briefcase} label="Placed Students" value={summary.total_placements} sub={`Avg ₹${summary.avg_package} LPA`} color="amber" />
          <StatCard icon={Award} label="Campus Avg CGPA" value={summary.avg_cgpa} sub={`${summary.total_departments} departments`} color="purple" />
        </div>
      )}

      {/* Student personal stats */}
      {isStudent && studentProfile && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Award} label="My CGPA" value={studentProfile.cgpa?.toFixed(2)} sub={`Semester ${studentProfile.semester}`} color="blue" />
          <StatCard icon={BookOpen} label="Backlogs" value={studentProfile.backlog_count} sub={studentProfile.backlog_count === 0 ? 'All clear ✓' : 'Needs attention'} color={studentProfile.backlog_count === 0 ? 'green' : 'red'} />
          <StatCard icon={Star} label="Skills" value={studentProfile.skills?.length || 0} sub="Registered skills" color="amber" />
          <StatCard icon={ClipboardCheck} label="Attendance" value={attSummary ? `${attSummary.percentage}%` : '—'} sub={attSummary?.low_attendance ? '⚠ Low attendance' : 'On track'} color={attSummary?.low_attendance ? 'red' : 'green'} />
        </div>
      )}

      {/* Charts */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {cgpaDist.length > 0 && (
            <div className="card p-6">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4 flex items-center gap-2">
                <BookOpen size={15} className="text-blue-500" /> CGPA Distribution
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={cgpaDist} barCategoryGap="25%">
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" radius={[6,6,0,0]}>
                    {cgpaDist.map((_, i) => (
                      <rect key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {deptPerf.length > 0 && (
            <div className="card p-6">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4 flex items-center gap-2">
                <Building2 size={15} className="text-emerald-500" /> Dept Placement %
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={deptPerf} barCategoryGap="25%" layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} domain={[0,100]} />
                  <YAxis dataKey="department" type="category" tick={{ fontSize: 10 }} width={36} />
                  <Tooltip formatter={v => `${v}%`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="placement_rate" fill="#10b981" radius={[0,6,6,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {trends.length > 0 && (
            <div className="card p-6">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4 flex items-center gap-2">
                <TrendingUp size={15} className="text-purple-500" /> Placement Trend
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Bottom Row */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-2' : ''} gap-4`}>
        {/* Top Companies — admin/hod/faculty only */}
        {isAdmin && companies.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Briefcase size={15} className="text-amber-500" /> Top Hiring Companies
              </h3>
              <Link to="/placements" className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
                View all <ArrowRight size={11} />
              </Link>
            </div>
            <div className="space-y-3">
              {companies.map((c, i) => (
                <div key={c.company} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{c.company}</span>
                      <span className="text-xs text-slate-400 ml-2 flex-shrink-0">{c.count} hired</span>
                    </div>
                    <div className="mt-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${(c.count / (companies[0]?.count || 1)) * 100}%`,
                        background: COLORS[i % COLORS.length]
                      }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 flex-shrink-0">₹{c.avg_package}L</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notices */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Bell size={15} className="text-red-500" /> Latest Notices
            </h3>
            <Link to="/notices" className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="space-y-2">
            {notices.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No notices available</p>
            ) : notices.map(n => (
              <div key={n.id} className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <Bell size={13} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{n.title}</p>
                  <p className="text-xs text-slate-400 line-clamp-1">{n.content}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{format(new Date(n.created_at), 'd MMM yyyy')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
