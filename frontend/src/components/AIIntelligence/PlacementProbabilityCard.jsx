/**
 * Placement Probability Card Component
 * Shows placement success prediction with detailed factors
 */
import React, { useMemo } from 'react'
import { TrendingUp, AlertTriangle, CheckCircle2, Zap } from 'lucide-react'

const PlacementProbabilityCard = ({ placement, onRefresh }) => {
  const getProbabilityColor = (prob) => {
    if (prob >= 80) return 'text-emerald-600'
    if (prob >= 60) return 'text-blue-600'
    if (prob >= 40) return 'text-amber-600'
    return 'text-red-600'
  }
  
  const getProbabilityBgColor = (prob) => {
    if (prob >= 80) return 'bg-emerald-50 dark:bg-emerald-950/20'
    if (prob >= 60) return 'bg-blue-50 dark:bg-blue-950/20'
    if (prob >= 40) return 'bg-amber-50 dark:bg-amber-950/20'
    return 'bg-red-50 dark:bg-red-950/20'
  }
  
  const getConfidenceEmoji = (confidence) => {
    switch(confidence) {
      case 'Very High': return '⭐⭐⭐⭐⭐'
      case 'High': return '⭐⭐⭐⭐'
      case 'Medium': return '⭐⭐⭐'
      case 'Low': return '⭐⭐'
      default: return '⭐'
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Main Probability Gauge */}
      <div className={`card p-8 ${getProbabilityBgColor(placement.placement_probability)} border-l-4 ${
        placement.placement_probability >= 80 ? 'border-emerald-500' :
        placement.placement_probability >= 60 ? 'border-blue-500' :
        placement.placement_probability >= 40 ? 'border-amber-500' :
        'border-red-500'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">PLACEMENT SUCCESS PROBABILITY</h2>
            <div className="flex items-baseline gap-2 mb-4">
              <span className={`text-5xl font-bold ${getProbabilityColor(placement.placement_probability)}`}>
                {Math.round(placement.placement_probability)}
              </span>
              <span className="text-2xl font-semibold text-slate-600 dark:text-slate-400">%</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-semibold">Confidence: </span>
              <span className={placement.confidence === 'Very High' || placement.confidence === 'High' ? 'text-emerald-600' : 'text-amber-600'}>
                {getConfidenceEmoji(placement.confidence)} {placement.confidence}
              </span>
            </p>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-40 h-40">
              {/* Circular Progress */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-200 dark:text-slate-700" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${(placement.placement_probability / 100) * 283} 283`}
                  className={getProbabilityColor(placement.placement_probability)}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${getProbabilityColor(placement.placement_probability)}`}>
                  {Math.round(placement.placement_probability)}%
                </span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 mt-4">
          {placement.interpretation}
        </p>
      </div>
      
      {/* Factor Breakdown */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">📊 Factor Breakdown</h3>
        <div className="space-y-4">
          {placement.factors && Object.entries(placement.factors).map(([key, factor]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 dark:text-white capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-slate-500 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                    {(factor.weight * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">{factor.value || 0}</p>
                  <p className="text-xs text-slate-500">+{(factor.contribution || 0).toFixed(1)}</p>
                </div>
              </div>
              <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  style={{ width: `${Math.min(factor.value || 0, 100)}%` }}
                ></div>
              </div>
              {factor.current && (
                <p className="text-xs text-slate-500 mt-1">
                  Current: {factor.current} | Threshold: {factor.threshold || 'N/A'}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Modifiers */}
      {placement.modifiers && placement.modifiers.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">⚡ Modifiers (Impact: {placement.modifier_impact?.toFixed(1)}%)</h3>
          <div className="space-y-3">
            {placement.modifiers.map((mod, idx) => (
              <div key={idx} className={`p-4 rounded-lg border-l-4 ${
                mod.value > 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500'
                  : 'bg-red-50 dark:bg-red-950/20 border-red-500'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{mod.factor}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{mod.reason}</p>
                  </div>
                  <span className={`text-lg font-bold whitespace-nowrap ml-4 ${
                    mod.value > 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {(mod.value > 0 ? '+' : '')}{mod.value?.toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-500">
                  💡 Suggestion: {mod.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Risk Factors */}
      {placement.risk_factors && placement.risk_factors.length > 0 && (
        <div className="card p-6 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-amber-600" size={20} />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Risk Factors</h3>
          </div>
          <ul className="space-y-2">
            {placement.risk_factors.map((risk, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                <span className="text-amber-600 font-bold">•</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Improvement Opportunities */}
      {placement.improvement_opportunities && placement.improvement_opportunities.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-emerald-600" size={20} />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">📈 How to Improve</h3>
          </div>
          <div className="space-y-3">
            {placement.improvement_opportunities.map((opp, idx) => (
              <div key={idx} className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{opp.action}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Timeline: {opp.timeline}</p>
                  </div>
                  <span className="text-emerald-600 font-bold whitespace-nowrap ml-4">
                    +{opp.estimated_increase}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">
                    {placement.placement_probability}% → {opp.new_probability}%
                  </span>
                  <span className="text-xs text-slate-500">
                    Effort: <span className="font-semibold">{opp.effort}</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-500"
                    style={{ width: `${opp.new_probability}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PlacementProbabilityCard
