/**
 * Health Score Card Component
 * Displays comprehensive student health metrics
 */
import React from 'react'
import { TrendingUp, AlertCircle, CheckCircle, ArrowUp } from 'lucide-react'

const HealthScoreCard = ({ healthScore, onRefresh }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-amber-600'
    return 'text-red-600'
  }
  
  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-emerald-50 dark:bg-emerald-950/20'
    if (score >= 60) return 'bg-blue-50 dark:bg-blue-950/20'
    if (score >= 40) return 'bg-amber-50 dark:bg-amber-950/20'
    return 'bg-red-50 dark:bg-red-950/20'
  }
  
  return (
    <div className="space-y-6">
      {/* Main Score */}
      <div className={`card p-8 ${getScoreBgColor(healthScore.total_score)} border-l-4 ${
        healthScore.total_score >= 80 ? 'border-emerald-500' :
        healthScore.total_score >= 60 ? 'border-blue-500' :
        healthScore.total_score >= 40 ? 'border-amber-500' :
        'border-red-500'
      }`}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">OVERALL HEALTH SCORE</h2>
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-bold ${getScoreColor(healthScore.total_score)}`}>
                {healthScore.total_score}
              </span>
              <span className="text-xl font-semibold text-slate-600 dark:text-slate-400">/100</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-3 font-semibold">
              Status: {healthScore.status} {healthScore.status_emoji}
            </p>
          </div>
          <TrendingUp className={`${getScoreColor(healthScore.total_score)}`} size={48} />
        </div>
      </div>
      
      {/* Component Breakdown */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">📊 Score Breakdown</h3>
        <div className="space-y-4">
          {healthScore.components.map((comp, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 dark:text-white">{comp.name}</span>
                  <span className="text-xs text-slate-500 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                    {(comp.weight * 100).toFixed(0)}%
                  </span>
                </div>
                <span className={`text-lg font-bold ${getScoreColor(comp.score)}`}>
                  {comp.score}/100
                </span>
              </div>
              <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                  style={{ width: `${comp.score}%` }}
                ></div>
              </div>
              {comp.target && (
                <p className="text-xs text-slate-500 mt-1">
                  Target: {comp.target} | Current: {comp.current_value}{comp.unit}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Component Details Table */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">📈 Component Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-4 py-2 font-semibold text-slate-600 dark:text-slate-300">Component</th>
                <th className="text-left px-4 py-2 font-semibold text-slate-600 dark:text-slate-300">Current</th>
                <th className="text-left px-4 py-2 font-semibold text-slate-600 dark:text-slate-300">Target</th>
                <th className="text-left px-4 py-2 font-semibold text-slate-600 dark:text-slate-300">Score</th>
              </tr>
            </thead>
            <tbody>
              {healthScore.components.map((comp, idx) => (
                <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{comp.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {comp.current_value}{comp.unit}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {comp.target}{comp.unit}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{ width: `${Math.min(comp.score, 100)}%` }}
                        ></div>
                      </div>
                      <span className={`font-semibold text-sm ${getScoreColor(comp.score)}`}>
                        {comp.score}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Recommendations */}
      <div className="card p-6 bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">💡 Recommendations</h3>
        <ul className="space-y-2">
          {healthScore.recommendations.map((rec, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <CheckCircle className="text-emerald-600 flex-shrink-0 mt-1" size={18} />
              <span className="text-slate-700 dark:text-slate-300">{rec}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Next Milestone */}
      {healthScore.next_milestone && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">🎯 Next Milestone</h3>
            <ArrowUp className="text-amber-500" size={24} />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Current Score</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{healthScore.total_score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Target Milestone</span>
              <span className="text-2xl font-bold text-blue-600">{healthScore.next_milestone}</span>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-500"
                style={{ width: `${(healthScore.total_score / healthScore.next_milestone) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              {healthScore.progress_to_milestone}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default HealthScoreCard
