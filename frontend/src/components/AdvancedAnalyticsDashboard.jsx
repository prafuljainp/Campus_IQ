import React, { useState, useEffect } from 'react'
import { TrendingUp, AlertCircle, Zap, Target, BookOpen, Award } from 'lucide-react'
import { advancedAnalyticsAPI } from '../api/services'
import './AdvancedAnalytics.css'

// ── Graduation Prediction Card ───────────────────────────────────────────────
function GraduationPredictionCard({ data }) {
  if (!data || data.status !== 'success') {
    return (
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800">
        <p className="text-slate-600 dark:text-slate-400">No graduation data</p>
      </div>
    )
  }

  const prediction = data.probability || 0
  const riskLevel = data.risk_level || 'unknown'
  const riskColors = {
    excellent: 'bg-emerald-500',
    good: 'bg-blue-500',
    moderate: 'bg-amber-500',
    critical: 'bg-red-500'
  }

  return (
    <div className="p-6 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">🎓 Graduation Prediction</h3>
        <TrendingUp className="text-blue-600" size={24} />
      </div>

      <div className="space-y-4">
        {/* Probability Score */}
        <div className="p-4 rounded-lg bg-white dark:bg-slate-700">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Graduation Probability</span>
            <span className="text-3xl font-bold text-blue-600">{prediction}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${riskColors[riskLevel]}`}
              style={{ width: `${prediction}%` }}
            />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{data.message}</p>
        </div>

        {/* Metrics Breakdown */}
        {data.metrics && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <p className="text-xs text-blue-700 dark:text-blue-300">CGPA</p>
              <p className="text-xl font-bold text-blue-600">{data.metrics.cgpa?.toFixed(1)}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <p className="text-xs text-amber-700 dark:text-amber-300">Attendance</p>
              <p className="text-xl font-bold text-amber-600">{data.metrics.attendance_percentage?.toFixed(0)}%</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
              <p className="text-xs text-red-700 dark:text-red-300">Backlogs</p>
              <p className="text-xl font-bold text-red-600">{data.metrics.backlogs_count}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <p className="text-xs text-green-700 dark:text-green-300">Semesters</p>
              <p className="text-xl font-bold text-green-600">{data.metrics.semesters_completed}</p>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 space-y-2">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">💡 Recommendations</p>
            {data.recommendations.map((rec, i) => (
              <p key={i} className="text-xs text-green-800 dark:text-green-200">• {rec}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Career Recommendations Card ────────────────────────────────────────────
function CareerRecommendationsCard({ data }) {
  if (!data || data.status !== 'success' || !data.recommendations?.length) {
    return (
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800">
        <p className="text-slate-600 dark:text-slate-400">No career recommendations</p>
      </div>
    )
  }

  return (
    <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900 border border-purple-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">🎯 Career Recommendations</h3>
        <Zap className="text-purple-600" size={24} />
      </div>

      <div className="space-y-3">
        {data.recommendations.slice(0, 5).map((career, i) => (
          <div key={i} className="p-4 rounded-lg bg-white dark:bg-slate-700 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">{career.career_path}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">{career.description}</p>
              </div>
              <span className={`text-lg font-bold ${career.match_percentage >= 75 ? 'text-emerald-600' : career.match_percentage >= 50 ? 'text-amber-600' : 'text-slate-600'}`}>
                {career.match_percentage}%
              </span>
            </div>

            {career.missing_skills && career.missing_skills.length > 0 && (
              <div className="mt-2 text-xs">
                <p className="text-slate-600 dark:text-slate-400 mb-1">Skills to learn:</p>
                <div className="flex flex-wrap gap-1">
                  {career.missing_skills.slice(0, 3).map((skill, j) => (
                    <span key={j} className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Placement Prediction Card ──────────────────────────────────────────────
function PlacementPredictionCard({ data }) {
  if (!data || data.status !== 'success') {
    return (
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800">
        <p className="text-slate-600 dark:text-slate-400">No placement data</p>
      </div>
    )
  }

  const probability = data.probability || 0
  const likelihoodColors = {
    'High': 'text-emerald-600',
    'Moderate': 'text-amber-600',
    'Low': 'text-red-600'
  }

  return (
    <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-slate-800 dark:to-slate-900 border border-emerald-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">💼 Placement Prediction</h3>
        <Target className="text-emerald-600" size={24} />
      </div>

      <div className="space-y-4">
        {/* Probability Score */}
        <div className="p-4 rounded-lg bg-white dark:bg-slate-700">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Placement Probability</span>
            <span className={`text-3xl font-bold ${likelihoodColors[data.likelihood || 'Moderate']}`}>
              {probability}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-emerald-500 transition-all"
              style={{ width: `${probability}%` }}
            />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Likelihood: <strong>{data.likelihood || 'Unknown'}</strong>
          </p>
        </div>

        {/* Metrics */}
        {data.metrics && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <p className="text-xs text-blue-700 dark:text-blue-300">CGPA</p>
              <p className="text-lg font-bold text-blue-600">{data.metrics.cgpa?.toFixed(1)}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <p className="text-xs text-purple-700 dark:text-purple-300">Skills</p>
              <p className="text-lg font-bold text-purple-600">{data.metrics.skills_count}</p>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {data.suggestions && data.suggestions.length > 0 && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 space-y-2">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">⚡ Action Items</p>
            {data.suggestions.map((sugg, i) => (
              <p key={i} className="text-xs text-amber-800 dark:text-amber-200">• {sugg}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Advanced Analytics Component ──────────────────────────────────────
export default function AdvancedAnalyticsDashboard({ studentId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadAnalytics()
  }, [studentId])

  const loadAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await advancedAnalyticsAPI.getStudentAnalyticsDashboard(studentId)
      console.log('Advanced analytics dashboard:', res.data)
      setData(res.data?.data)
    } catch (err) {
      setError(err.message || 'Failed to load analytics')
      console.error('Analytics error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
        <p className="text-slate-600 dark:text-slate-400">Loading advanced analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-600 mt-1" size={20} />
          <div>
            <h4 className="font-semibold text-red-900 dark:text-red-100">Error Loading Analytics</h4>
            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="text-blue-600" size={28} />
          Advanced Analytics Dashboard
        </h2>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
        >
          Refresh
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraduationPredictionCard data={data?.graduation_prediction} />
        <PlacementPredictionCard data={data?.placement_prediction} />
      </div>

      {/* Career Recommendations - Full Width */}
      <CareerRecommendationsCard data={data?.career_recommendations} />

      {/* Last Updated */}
      {data?.generated_at && (
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Last updated: {new Date(data.generated_at).toLocaleString()}
        </p>
      )}
    </div>
  )
}
