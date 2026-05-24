import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, BarChart3, BrainCircuit, CheckCircle2, ClipboardList,
  Gauge, RefreshCw, Target, TrendingDown, TrendingUp, Users
} from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts'
import toast from 'react-hot-toast'
import { studentSuccessAPI } from '../api/services'
import { EmptyState, PageLoader, StatCard } from '../components/UI'

const RISK_COLORS = {
  critical: '#ef4444',
  high: '#f59e0b',
  moderate: '#3b82f6',
  healthy: '#10b981',
}

const badgeClass = {
  critical: 'badge-red',
  high: 'badge-amber',
  moderate: 'badge-blue',
  healthy: 'badge-green',
}

const defaultScenario = {
  cgpa: '',
  attendance_percentage: '',
  skills_count: '',
  internships_count: '',
  clear_backlogs: false,
}

function RiskBadge({ level, label }) {
  return <span className={badgeClass[level] || 'badge-blue'}>{label || level}</span>
}

function SectionTitle({ icon: Icon, title, action }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
        <Icon size={16} className="text-blue-500" />
        {title}
      </h3>
      {action}
    </div>
  )
}

function MetricBar({ label, value, color = 'bg-blue-500' }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <span className="font-semibold text-slate-700 dark:text-slate-200">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  )
}

function formatSigned(value) {
  const number = Number(value || 0)
  return `${number > 0 ? '+' : ''}${number}`
}

function scoreText(value) {
  return `${Math.round(Number(value || 0))}%`
}

function deltaTone(value, lowerIsBetter = false) {
  const number = Number(value || 0)
  const improved = lowerIsBetter ? number < 0 : number > 0
  if (number === 0) return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
  return improved
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
}

export default function StudentSuccessPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [scenario, setScenario] = useState(defaultScenario)
  const [simulation, setSimulation] = useState(null)
  const [simulating, setSimulating] = useState(false)

  const fetchCommandCenter = async () => {
    setLoading(true)
    try {
      const res = await studentSuccessAPI.commandCenter({ limit: 12 })
      setData(res.data)
      const firstStudent = res.data.priority_students?.[0]
      if (firstStudent) {
        setSelectedStudentId(firstStudent.student.id)
        setSelectedProfile(firstStudent)
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to load student success data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCommandCenter()
  }, [])

  useEffect(() => {
    if (!selectedStudentId) return
    const loadProfile = async () => {
      setProfileLoading(true)
      setSimulation(null)
      try {
        const res = await studentSuccessAPI.profile(selectedStudentId)
        setSelectedProfile(res.data)
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Unable to load student profile')
      } finally {
        setProfileLoading(false)
      }
    }
    loadProfile()
  }, [selectedStudentId])

  const summary = data?.summary
  const priorityStudents = data?.priority_students || []
  const riskDistribution = data?.risk_distribution || []
  const focusAreas = data?.focus_areas || []
  const departmentMetrics = data?.department_metrics || []
  const interventionBoard = data?.intervention_board || []

  const selectedName = selectedProfile?.student?.name
  const selectedMetrics = selectedProfile?.metrics || {}

  const scenarioPayload = useMemo(() => {
    const clean = {}
    Object.entries(scenario).forEach(([key, value]) => {
      if (key === 'clear_backlogs') {
        if (value) clean[key] = true
      } else if (value !== '') {
        clean[key] = Number(value)
      }
    })
    return clean
  }, [scenario])

  const runSimulation = async () => {
    if (!selectedStudentId) return
    if (Object.keys(scenarioPayload).length === 0) {
      toast.error('Add at least one scenario value')
      return
    }
    setSimulating(true)
    try {
      const res = await studentSuccessAPI.simulate(selectedStudentId, scenarioPayload)
      setSimulation(res.data)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Simulation failed')
    } finally {
      setSimulating(false)
    }
  }

  if (loading) return <PageLoader />

  if (!summary || summary.total_students === 0) {
    return (
      <EmptyState
        title="No student success data yet"
        description="Add active students to generate risk, readiness and intervention insights."
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-6 border-0 text-white overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%)' }}>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-20 translate-x-20" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-blue-200 text-sm">AI Student Success Command Center</p>
            <h2 className="text-2xl font-bold mt-1">Risk, readiness and interventions in one place</h2>
            <p className="text-blue-100 text-sm mt-2 max-w-3xl">
              Prioritize students who need support, understand the exact causes, and simulate improvement plans before taking action.
            </p>
          </div>
          <button onClick={fetchCommandCenter} className="btn-secondary bg-white/10 hover:bg-white/20 text-white">
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Students Tracked" value={summary.total_students} sub="Active scope" color="blue" />
        <StatCard icon={AlertTriangle} label="Critical + High" value={summary.critical + summary.high_risk} sub="Need immediate review" color="red" />
        <StatCard icon={Gauge} label="Avg Success" value={`${summary.avg_success_score}%`} sub="Academic health" color="green" />
        <StatCard icon={Target} label="Placement Ready" value={`${summary.avg_placement_readiness}%`} sub="Average readiness" color="amber" />
        <StatCard icon={ClipboardList} label="Interventions" value={summary.interventions_due} sub="Open follow-ups" color="purple" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card p-6 xl:col-span-2">
          <SectionTitle icon={BarChart3} title="Risk Distribution" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={riskDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {riskDistribution.map((item) => (
                    <Cell key={item.level} fill={RISK_COLORS[item.level]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={riskDistribution.filter(item => item.count > 0)}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={3}
                >
                  {riskDistribution.map((item) => (
                    <Cell key={item.level} fill={RISK_COLORS[item.level]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <SectionTitle icon={TrendingDown} title="Top Focus Areas" />
          <div className="space-y-4">
            {focusAreas.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No active risk drivers found</p>
            ) : focusAreas.slice(0, 6).map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.category}</p>
                    <p className="text-xs text-slate-400">{item.affected_students} students affected</p>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.avg_impact}</span>
                </div>
                <MetricBar label="Average impact" value={item.avg_impact} color="bg-amber-500" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-4">
        <div className="card overflow-hidden 2xl:col-span-2">
          <div className="p-6 pb-3">
            <SectionTitle icon={AlertTriangle} title="Priority Students" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="text-left font-semibold px-6 py-3">Student</th>
                  <th className="text-left font-semibold px-6 py-3">Risk</th>
                  <th className="text-left font-semibold px-6 py-3">Success</th>
                  <th className="text-left font-semibold px-6 py-3">Placement</th>
                  <th className="text-left font-semibold px-6 py-3">Root Cause</th>
                  <th className="text-right font-semibold px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {priorityStudents.map((profile) => {
                  const primaryCause = profile.root_causes?.[0]
                  const isSelected = selectedStudentId === profile.student.id
                  return (
                    <tr key={profile.student.id} className={`table-row ${isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900 dark:text-white">{profile.student.name}</p>
                        <p className="text-xs text-slate-400">{profile.student.usn} - {profile.student.department || 'NA'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <RiskBadge level={profile.risk.level} label={profile.risk.label} />
                          <span className="text-xs text-slate-400">{profile.risk.score}% risk</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">{profile.success_score}%</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{profile.placement_readiness.score}%</p>
                        <p className="text-xs text-slate-400">{profile.placement_readiness.level}</p>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                          {primaryCause?.category || 'Growth'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {primaryCause?.message || 'No major blocker'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedStudentId(profile.student.id)}
                          className={isSelected ? 'btn-primary py-2' : 'btn-secondary py-2'}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-6">
          <SectionTitle icon={BrainCircuit} title="Student Deep Dive" />
          {profileLoading || !selectedProfile ? (
            <div className="py-16 text-center text-slate-400">Loading profile...</div>
          ) : (
            <div className="space-y-5">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{selectedProfile.student.name}</p>
                    <p className="text-xs text-slate-400">{selectedProfile.student.usn} - Semester {selectedProfile.student.semester}</p>
                  </div>
                  <RiskBadge level={selectedProfile.risk.level} label={selectedProfile.risk.label} />
                </div>
              </div>

              <div className="space-y-3">
                <MetricBar label="Success score" value={selectedProfile.success_score} color="bg-emerald-500" />
                <MetricBar label="Placement readiness" value={selectedProfile.placement_readiness.score} color="bg-blue-500" />
                <MetricBar label="Risk score" value={selectedProfile.risk.score} color="bg-red-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-700/40 p-3">
                  <p className="text-xs text-slate-400">CGPA</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedProfile.metrics.cgpa}</p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-700/40 p-3">
                  <p className="text-xs text-slate-400">Attendance</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedProfile.metrics.attendance_percentage}%</p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-700/40 p-3">
                  <p className="text-xs text-slate-400">Backlogs</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedProfile.metrics.backlogs}</p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-700/40 p-3">
                  <p className="text-xs text-slate-400">Skills</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedProfile.metrics.skills_count}</p>
                </div>
              </div>

              <div>
                <p className="label">Root causes</p>
                <div className="space-y-2">
                  {selectedProfile.root_causes.map((cause) => (
                    <div key={`${cause.category}-${cause.message}`} className="rounded-xl border border-slate-100 dark:border-slate-700 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{cause.category}</p>
                        <span className="text-xs font-semibold text-slate-400">{cause.impact} impact</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{cause.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card p-6">
          <SectionTitle
            icon={Target}
            title="Plan Simulator"
            action={selectedName && <span className="badge-blue">{selectedName}</span>}
          />

          <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 p-4 mb-4">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Try a target plan before assigning support.</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Enter the values the student should reach. Blank fields keep the current profile value.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/40 p-3">
              <p className="text-xs text-slate-400">Current CGPA</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedMetrics.cgpa ?? '-'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/40 p-3">
              <p className="text-xs text-slate-400">Attendance</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedMetrics.attendance_percentage ?? '-'}%</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/40 p-3">
              <p className="text-xs text-slate-400">Skills</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedMetrics.skills_count ?? '-'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/40 p-3">
              <p className="text-xs text-slate-400">Internships</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedMetrics.internships_count ?? '-'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/40 p-3">
              <p className="text-xs text-slate-400">Backlogs</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedMetrics.backlogs ?? '-'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <label>
              <span className="label">Target CGPA</span>
              <input
                className="input"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={scenario.cgpa}
                onChange={e => setScenario({ ...scenario, cgpa: e.target.value })}
                placeholder={String(selectedMetrics.cgpa ?? '8.2')}
              />
              <p className="text-[11px] text-slate-400 mt-1">Current: {selectedMetrics.cgpa ?? '-'}</p>
            </label>
            <label>
              <span className="label">Target Attendance</span>
              <input
                className="input"
                type="number"
                min="0"
                max="100"
                value={scenario.attendance_percentage}
                onChange={e => setScenario({ ...scenario, attendance_percentage: e.target.value })}
                placeholder={String(selectedMetrics.attendance_percentage ?? '85')}
              />
              <p className="text-[11px] text-slate-400 mt-1">Current: {selectedMetrics.attendance_percentage ?? '-'}%</p>
            </label>
            <label>
              <span className="label">Target Skills</span>
              <input
                className="input"
                type="number"
                min="0"
                max="50"
                value={scenario.skills_count}
                onChange={e => setScenario({ ...scenario, skills_count: e.target.value })}
                placeholder={String(selectedMetrics.skills_count ?? '10')}
              />
              <p className="text-[11px] text-slate-400 mt-1">Current: {selectedMetrics.skills_count ?? '-'}</p>
            </label>
            <label>
              <span className="label">Target Internships</span>
              <input
                className="input"
                type="number"
                min="0"
                max="20"
                value={scenario.internships_count}
                onChange={e => setScenario({ ...scenario, internships_count: e.target.value })}
                placeholder={String(selectedMetrics.internships_count ?? '1')}
              />
              <p className="text-[11px] text-slate-400 mt-1">Current: {selectedMetrics.internships_count ?? '-'}</p>
            </label>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3 mt-4">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={scenario.clear_backlogs}
                onChange={e => setScenario({ ...scenario, clear_backlogs: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Set active backlogs to 0
              <span className="text-xs text-slate-400">Current: {selectedMetrics.backlogs ?? 0}</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary"
                onClick={() => {
                  setScenario(defaultScenario)
                  setSimulation(null)
                }}
              >
                Reset
              </button>
              <button className="btn-primary" onClick={runSimulation} disabled={simulating || !selectedStudentId}>
                <TrendingUp size={15} />
                {simulating ? 'Simulating...' : 'Run Simulation'}
              </button>
            </div>
          </div>

          {simulation && (
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Success Score</p>
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${deltaTone(simulation.impact.health_delta)}`}>
                      {formatSigned(simulation.impact.health_delta)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-end gap-2">
                    <p className="text-xl font-bold text-slate-500 line-through decoration-slate-300">{scoreText(simulation.current.health_score)}</p>
                    <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{scoreText(simulation.simulated.health_score)}</p>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2">Higher is better.</p>
                </div>

                <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Placement Readiness</p>
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${deltaTone(simulation.impact.placement_delta)}`}>
                      {formatSigned(simulation.impact.placement_delta)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-end gap-2">
                    <p className="text-xl font-bold text-slate-500 line-through decoration-slate-300">{scoreText(simulation.current.placement_readiness)}</p>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{scoreText(simulation.simulated.placement_readiness)}</p>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">Higher is better.</p>
                </div>

                <div className="rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-200">Risk Score</p>
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${deltaTone(simulation.impact.risk_delta, true)}`}>
                      {formatSigned(simulation.impact.risk_delta)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-end gap-2">
                    <p className="text-xl font-bold text-slate-500 line-through decoration-slate-300">{scoreText(simulation.current.risk_score)}</p>
                    <p className="text-3xl font-bold text-red-700 dark:text-red-300">{scoreText(simulation.simulated.risk_score)}</p>
                  </div>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-2">Lower is better.</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 dark:border-slate-700 p-4">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Scenario applied</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(simulation.scenario || {}).map(([key, value]) => (
                    <span key={key} className="rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {key.replaceAll('_', ' ')}: {String(value)}
                    </span>
                  ))}
                </div>
              </div>

              {simulation.next_best_actions?.length > 0 && (
                <div className="rounded-xl border border-slate-100 dark:border-slate-700 p-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Recommended follow-up</p>
                  <div className="mt-3 space-y-2">
                    {simulation.next_best_actions.map((action) => (
                      <div key={`${action.priority}-${action.title}`} className="rounded-lg bg-slate-50 dark:bg-slate-700/40 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{action.title}</p>
                          <span className="text-xs text-slate-400">{action.timeline}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{action.details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card p-6">
          <SectionTitle icon={ClipboardList} title="Faculty Intervention Board" />
          <div className="space-y-3">
            {interventionBoard.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-4">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">No urgent interventions are open.</p>
              </div>
            ) : interventionBoard.map((item) => (
              <div key={item.student_id} className="rounded-xl border border-slate-100 dark:border-slate-700 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.student_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.owner} - due in {item.due_in_days} days</p>
                  </div>
                  <RiskBadge level={item.risk_level} />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">{item.next_step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {departmentMetrics.length > 0 && (
        <div className="card p-6">
          <SectionTitle icon={Users} title="Department Health Snapshot" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={departmentMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="department" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend />
              <Bar dataKey="avg_success_score" name="Success Score" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="avg_placement_readiness" name="Placement Readiness" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="critical_or_high" name="Critical/High" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
