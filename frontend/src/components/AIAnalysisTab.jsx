import { useEffect, useState } from 'react'
import {
  AlertTriangle, CheckCircle, TrendingUp, BookOpen, Briefcase, Award,
  BarChart3, Target, Zap, FileText, Upload, ChevronDown, ChevronUp,
  AlertCircle
} from 'lucide-react'
import { aiAnalysisAPI } from '../api/services'
import { Spinner } from './UI'


// ── Status Badge Component ────────────────────────────────────────────────────
function StatusBadge({ status, message }) {
  const config = {
    good: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-700', icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-700', icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400' },
    critical: { bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-700', icon: AlertCircle, color: 'text-red-600 dark:text-red-400' },
    caution: { bg: 'bg-yellow-50 dark:bg-yellow-900/30', border: 'border-yellow-200 dark:border-yellow-700', icon: AlertTriangle, color: 'text-yellow-600 dark:text-yellow-400' },
    success: { bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-700', icon: CheckCircle, color: 'text-green-600 dark:text-green-400' },
    no_data: { bg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', icon: AlertTriangle, color: 'text-slate-600 dark:text-slate-400' },
  }

  const cfg = config[status] || config.no_data
  const Icon = cfg.icon

  return (
    <div className={`p-4 rounded-lg border-2 ${cfg.bg} ${cfg.border} flex items-start gap-3`}>
      <Icon size={20} className={`flex-shrink-0 mt-0.5 ${cfg.color}`} />
      <span className={`${cfg.color} font-medium`}>{message}</span>
    </div>
  )
}

// ── Summary Card Component ────────────────────────────────────────────────────
function SummaryCard({ data }) {
  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
          {data.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{data.name}</h3>
          <p className="text-sm text-slate-500">{data.usn} • {data.department}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'CGPA', value: data.cgpa?.toFixed(2), icon: TrendingUp, color: 'blue' },
          { label: 'Backlogs', value: data.backlog_count, icon: AlertTriangle, color: data.backlog_count > 0 ? 'red' : 'green' },
          { label: 'Skills', value: data.skills_count, icon: Zap, color: 'purple' },
          { label: 'Placements', value: data.placements_count, icon: Briefcase, color: 'emerald' },
        ].map((stat, i) => {
          const Icon = stat.icon
          const colorMap = {
            blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
            red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30',
            green: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30',
            purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30',
            amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30',
          }
          return (
            <div key={i} className={`p-4 rounded-xl ${colorMap[stat.color]} text-center`}>
              <Icon size={20} className="mx-auto mb-1" />
              <div className="font-bold text-lg">{stat.value}</div>
              <div className="text-xs mt-1 opacity-75">{stat.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Analysis Section Component ────────────────────────────────────────────────
function AnalysisSection({ title, icon: Icon, data, expanded, onToggle }) {
  return (
    <div className="card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon size={20} className="text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
        </div>
        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {expanded && (
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 space-y-4">
          {data}
        </div>
      )}
    </div>
  )
}

// ── Backlog Analysis Display ──────────────────────────────────────────────────
function BacklogAnalysisDisplay({ analysis }) {
  // Safe defaults to prevent NaN errors
  const backlogCount = analysis?.backlogs_count ?? analysis?.backlog_subjects?.length ?? 0
  const backlogSubjects = analysis?.backlog_subjects ?? []
  const recoveryStrategy = analysis?.recovery_strategy ?? null
  const suggestions = analysis?.suggestions ?? []
  
  return (
    <div className="space-y-4">
      <StatusBadge status={analysis?.status ?? 'no_data'} message={analysis?.message ?? 'No backlog data available'} />

      {backlogSubjects.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-900 dark:text-white">Backlog Subjects ({backlogCount})</h4>
          {backlogSubjects.map((subject, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-l-4 border-red-500">
              <div className="font-medium text-slate-900 dark:text-white">{subject?.subject_name ?? 'Subject'}</div>
              <div className="text-sm text-slate-500 mt-1">Sem {subject?.semester ?? '—'} • Grade: {subject?.grade ?? '—'}</div>
            </div>
          ))}
        </div>
      )}

      {recoveryStrategy && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/30 space-y-3">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100">🎯 Recovery Strategy</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Daily Study Hours</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{recoveryStrategy?.daily_study_hours ?? 0}h</div>
            </div>
            <div>
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Timeline</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{recoveryStrategy?.timeline_semesters ?? 1} Sem</div>
            </div>
            <div>
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Priority</div>
              <div className="text-2xl font-bold text-red-600">{recoveryStrategy?.priority ?? 'Medium'}</div>
            </div>
          </div>
          {recoveryStrategy?.focus_areas && recoveryStrategy.focus_areas.length > 0 && (
            <div className="text-sm text-blue-800 dark:text-blue-200">Focus: {recoveryStrategy.focus_areas.join(', ')}</div>
          )}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-900 dark:text-white">💡 Suggestions</h4>
          {suggestions.slice(0, 5).map((sugg, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="text-lg">•</span>
              <span>{sugg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Attendance Analysis Display ───────────────────────────────────────────────
function AttendanceAnalysisDisplay({ analysis }) {
  return (
    <div className="space-y-4">
      <StatusBadge status={analysis.status} message={analysis.message} />

      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
        <div className="flex items-baseline gap-2 mb-2">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{analysis.overall_percentage.toFixed(1)}%</div>
          <div className="text-sm text-slate-500">Overall Attendance</div>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              analysis.overall_percentage >= 85 ? 'bg-emerald-500' : analysis.overall_percentage >= 75 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(analysis.overall_percentage, 100)}%` }}
          />
        </div>
        <div className="text-xs text-slate-500 mt-2">{analysis.attended_classes} / {analysis.total_classes} classes attended</div>
      </div>

      {analysis.overall_percentage < 85 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-500">
          <div className="font-bold text-amber-900 dark:text-amber-100">
            📍 Attend next <span className="text-2xl">{analysis.required_classes_to_85}</span> classes continuously
          </div>
        </div>
      )}

      {analysis.low_attendance_subjects.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-900 dark:text-white">⚠️ Low Attendance Subjects</h4>
          {analysis.low_attendance_subjects.map((subject, i) => (
            <div key={i} className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-between">
              <div className="font-medium text-red-900 dark:text-red-100">{subject.subject_name}</div>
              <div className="text-sm font-bold text-red-600 dark:text-red-400">{subject.percentage.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h4 className="font-semibold text-slate-900 dark:text-white">💡 Suggestions</h4>
        {analysis.suggestions.slice(0, 4).map((sugg, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="text-lg">•</span>
            <span>{sugg}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Placement Readiness Display ───────────────────────────────────────────────
function PlacementReadinessDisplay({ analysis }) {
  const readyColor = {
    ready: 'emerald',
    partially_ready: 'amber',
    not_ready: 'red',
    placed: 'green'
  }[analysis.status] || 'slate'

  const colorMap = {
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700',
    red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700',
    green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700',
  }

  return (
    <div className="space-y-4">
      <StatusBadge status={analysis.status} message={analysis.message} />

      <div className={`p-4 rounded-xl border-2 ${colorMap[readyColor]}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold">Placement Readiness Score</span>
          <span className="text-2xl font-bold">{analysis.readiness_score}/{analysis.total_score}</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              analysis.readiness_score >= 75 ? 'bg-emerald-500' : analysis.readiness_score >= 50 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${(analysis.readiness_score / analysis.total_score) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'CGPA', value: analysis.cgpa?.toFixed(2), icon: TrendingUp },
          { label: 'Backlogs', value: analysis.backlogs, icon: AlertTriangle },
          { label: 'Skills', value: analysis.skills, icon: Zap },
        ].map((item, i) => (
          <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
            <item.icon size={16} className="mx-auto mb-1 opacity-50" />
            <div className="text-xl font-bold text-slate-900 dark:text-white">{item.value}</div>
            <div className="text-xs text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-slate-900 dark:text-white">📋 Analysis</h4>
        {analysis.reasons.map((reason, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="text-lg">•</span>
            <span>{reason}</span>
          </div>
        ))}
      </div>

      {analysis.action_items.length > 0 && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/30 space-y-2">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100">🎯 Action Items</h4>
          {analysis.action_items.map((item, i) => (
            <div key={i} className="text-sm text-blue-800 dark:text-blue-200">• {item}</div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Career Recommendations Display ────────────────────────────────────────────
function CareerRecommendationsDisplay({ analysis }) {
  return (
    <div className="space-y-4">
      <StatusBadge status={analysis.status} message={analysis.message} />

      <div className="space-y-3">
        {analysis.recommendations?.slice(0, 3).map((rec, i) => (
          <div key={i} className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-l-4 border-blue-500">
            <div className="flex items-start justify-between mb-2">
              <div className="font-bold text-slate-900 dark:text-white">{rec.career_path}</div>
              <div className="text-right">
                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{rec.match_score}%</div>
                <div className="text-xs text-slate-500">Match</div>
              </div>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300 mb-3">{rec.roles.slice(0, 2).join(' • ')}</div>
            <div className="flex flex-wrap gap-1">
              {rec.required_technologies.slice(0, 4).map((tech, j) => (
                <span key={j} className="badge badge-blue text-xs">{tech}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {analysis.suggestions?.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-900 dark:text-white">💡 Next Steps</h4>
          {analysis.suggestions.slice(0, 3).map((sugg, i) => (
            <div key={i} className="text-sm text-slate-600 dark:text-slate-300">• {sugg}</div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Weakness Analysis Display ─────────────────────────────────────────────────
function WeaknessAnalysisDisplay({ analysis }) {
  return (
    <div className="space-y-4">
      <StatusBadge status={analysis.status} message={analysis.message} />

      {analysis.weak_subjects?.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-900 dark:text-white">📚 Weak Subjects ({analysis.weak_subjects_count})</h4>
          {analysis.weak_subjects.map((subject, i) => (
            <div key={i} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900 dark:text-white">{subject.subject_name}</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${subject.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {subject.priority}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>Marks: <span className="font-bold">{subject.marks_obtained}</span></div>
                <div>Attendance: <span className="font-bold">{subject.attendance_percentage}%</span></div>
                <div>Grade: <span className="font-bold">{subject.grade}</span></div>
              </div>
              <div className="text-xs text-slate-500">{subject.weakness_type}</div>
            </div>
          ))}
        </div>
      )}

      {analysis.suggestions?.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-900 dark:text-white">💡 Improvement Strategy</h4>
          {analysis.suggestions.slice(0, 5).map((sugg, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="text-lg">•</span>
              <span>{sugg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Resume Analysis Display ───────────────────────────────────────────────────
function ResumeAnalysisDisplay({ analysis, onUpload }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      await onUpload(file)
    } finally {
      setUploading(false)
      setFile(null)
    }
  }

  return (
    <div className="space-y-4">
      {analysis && (
        <>
          <StatusBadge status={analysis.status} message={analysis.message} />

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
            <div className="flex items-baseline gap-2 mb-2">
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{analysis.resume_score}</div>
              <div className="text-sm text-slate-500">/ {analysis.total_score}</div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  analysis.resume_score >= 85 ? 'bg-emerald-500' : analysis.resume_score >= 70 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${(analysis.resume_score / analysis.total_score) * 100}%` }}
              />
            </div>
          </div>

          {analysis.sections_missing?.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/30 space-y-2">
              <h4 className="font-semibold text-amber-900 dark:text-amber-100">Missing Sections ({analysis.missing_count})</h4>
              {analysis.sections_missing.map((section, i) => (
                <div key={i} className="text-sm text-amber-800 dark:text-amber-200 capitalize">• {section}</div>
              ))}
            </div>
          )}

          {analysis.suggestions?.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 dark:text-white">📝 Improvements</h4>
              {analysis.suggestions.slice(0, 5).map((sugg, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="text-lg">•</span>
                  <span>{sugg}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center space-y-3">
        <Upload size={24} className="mx-auto opacity-50" />
        <div>
          <label className="btn btn-secondary cursor-pointer inline-block">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
            />
            Upload Resume
          </label>
        </div>
        {file && (
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
            <div>Selected: {file.name}</div>
            <button onClick={handleUpload} disabled={uploading} className="btn btn-primary">
              {uploading ? <Spinner /> : 'Analyze Resume'}
            </button>
          </div>
        )}
        <p className="text-xs text-slate-500">PDF, DOC, DOCX, or TXT files supported</p>
      </div>
    </div>
  )
}

// ── Main AI Analysis Component ────────────────────────────────────────────────
export default function AIAnalysisTab({ studentId }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    backlog: false,
    attendance: false,
    weakness: false,
    placement: false,
    career: false,
    resume: false,
  })

  useEffect(() => {
    loadAnalysis()
  }, [studentId])

  const loadAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await aiAnalysisAPI.getCompleteAnalysis(studentId)
      console.log('Complete analysis response:', res)
      console.log('Complete analysis data:', res.data?.data)
      setAnalysis(res.data?.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load analysis')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleResumeUpload = async (file) => {
    try {
      const res = await aiAnalysisAPI.analyzeResume(studentId, file)
      console.log('Resume upload response:', res)
      console.log('Resume data:', res.data?.data)
      setAnalysis(prev => ({
        ...prev,
        resume_analysis: res.data?.data
      }))
    } catch (err) {
      console.error('Resume upload error:', err)
      alert('Failed to analyze resume: ' + (err.response?.data?.detail || err.message))
    }
  }

  if (loading) return <div className="p-8 text-center"><Spinner /></div>
  if (error) return <div className="p-4 text-red-600 dark:text-red-400">{error}</div>
  if (!analysis) return <div className="p-4 text-slate-500">No analysis available</div>

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary Card */}
      {analysis.student_summary && (
        <SummaryCard data={analysis.student_summary} />
      )}

      {/* Analysis Sections */}
      <AnalysisSection
        title="📚 Backlog Recovery Advisor"
        icon={BookOpen}
        data={<BacklogAnalysisDisplay analysis={analysis.backlog_analysis} />}
        expanded={expandedSections.backlog}
        onToggle={() => setExpandedSections(prev => ({ ...prev, backlog: !prev.backlog }))}
      />

      <AnalysisSection
        title="📊 Attendance Intelligence"
        icon={BarChart3}
        data={<AttendanceAnalysisDisplay analysis={analysis.attendance_analysis} />}
        expanded={expandedSections.attendance}
        onToggle={() => setExpandedSections(prev => ({ ...prev, attendance: !prev.attendance }))}
      />

      <AnalysisSection
        title="⚠️ Subject Weakness Analyzer"
        icon={AlertTriangle}
        data={<WeaknessAnalysisDisplay analysis={analysis.weakness_analysis} />}
        expanded={expandedSections.weakness}
        onToggle={() => setExpandedSections(prev => ({ ...prev, weakness: !prev.weakness }))}
      />

      <AnalysisSection
        title="🎯 Placement Readiness"
        icon={Target}
        data={<PlacementReadinessDisplay analysis={analysis.placement_readiness} />}
        expanded={expandedSections.placement}
        onToggle={() => setExpandedSections(prev => ({ ...prev, placement: !prev.placement }))}
      />

      <AnalysisSection
        title="🚀 Career Recommendations"
        icon={Award}
        data={<CareerRecommendationsDisplay analysis={analysis.career_recommendations} />}
        expanded={expandedSections.career}
        onToggle={() => setExpandedSections(prev => ({ ...prev, career: !prev.career }))}
      />

      <AnalysisSection
        title="📄 Resume Analyzer"
        icon={FileText}
        data={<ResumeAnalysisDisplay analysis={analysis.resume_analysis} onUpload={handleResumeUpload} />}
        expanded={expandedSections.resume}
        onToggle={() => setExpandedSections(prev => ({ ...prev, resume: !prev.resume }))}
      />

      <div className="text-xs text-slate-500 text-center py-4">
        Analysis generated at {new Date(analysis.generated_at).toLocaleString()}
      </div>
    </div>
  )
}
