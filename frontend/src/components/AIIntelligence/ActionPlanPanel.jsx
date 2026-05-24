/**
 * Action Plan Panel Component
 * Prioritized actionable recommendations for student improvement
 */
import React, { useState } from 'react'
import { CheckCircle, AlertCircle, Clock, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'

const ActionPlanPanel = ({ actionPlan }) => {
  const [expandedAction, setExpandedAction] = useState(0)
  
  const getPriorityColor = (priority) => {
    if (priority === 1) return 'bg-red-50 dark:bg-red-950/20 border-red-500'
    if (priority === 2) return 'bg-orange-50 dark:bg-orange-950/20 border-amber-500'
    if (priority === 3) return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500'
    if (priority === 4) return 'bg-blue-50 dark:bg-blue-950/20 border-blue-500'
    return 'bg-slate-50 dark:bg-slate-800/30 border-slate-500'
  }
  
  const getPriorityEmoji = (priority) => {
    if (priority === 1) return '🔴'
    if (priority === 2) return '🟠'
    if (priority === 3) return '🟡'
    if (priority === 4) return '🔵'
    return '⚪'
  }
  
  const getEffortBadge = (effort) => {
    switch(effort) {
      case 'Low': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'Medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'High': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      case 'Very High': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Critical Area</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{actionPlan.critical_area}</p>
        </div>
        <div className="card p-4 bg-purple-50 dark:bg-purple-950/20 border-l-4 border-purple-500">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Timeline</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{actionPlan.estimated_improvement.timeline}</p>
        </div>
        <div className="card p-4 bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Improvement</p>
          <p className="text-lg font-bold text-emerald-600">
            +{actionPlan.estimated_improvement.total_improvement.toFixed(1)} points
          </p>
        </div>
      </div>
      
      {/* Current vs Projected */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">📈 Progress Projection</h3>
        <div className="space-y-4">
          {/* Current */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-slate-900 dark:text-white">Current Health Score</span>
              <span className="text-2xl font-bold text-amber-600">{actionPlan.estimated_improvement.current_health_score}</span>
            </div>
            <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
                style={{ width: `${(actionPlan.estimated_improvement.current_health_score / 100) * 100}%` }}
              ></div>
            </div>
          </div>
          
          {/* Arrow */}
          <div className="flex justify-center">
            <TrendingUp className="text-emerald-600 transform rotate-45" size={24} />
          </div>
          
          {/* Projected */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-slate-900 dark:text-white">Projected Health Score</span>
              <span className="text-2xl font-bold text-emerald-600">{actionPlan.estimated_improvement.projected_health_score}</span>
            </div>
            <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-600"
                style={{ width: `${(actionPlan.estimated_improvement.projected_health_score / 100) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Items */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">✅ Prioritized Action Plan</h3>
        <div className="space-y-3">
          {actionPlan.action_plan.map((action, idx) => (
            <div key={idx} className={`rounded-lg border-l-4 overflow-hidden ${getPriorityColor(action.priority)}`}>
              <button
                onClick={() => setExpandedAction(expandedAction === idx ? -1 : idx)}
                className="w-full p-4 hover:opacity-90 transition-opacity text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getPriorityEmoji(action.priority)}</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        Priority {action.priority}: {action.action}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{action.why}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-3">
                      <div className="text-xs text-slate-500 mb-1">⏱️ {action.duration}</div>
                      <span className={`text-xs px-2 py-1 rounded ${getEffortBadge(action.effort)}`}>
                        {action.effort}
                      </span>
                    </div>
                    {expandedAction === idx ? (
                      <ChevronUp className="text-slate-400" size={20} />
                    ) : (
                      <ChevronDown className="text-slate-400" size={20} />
                    )}
                  </div>
                </div>
              </button>
              
              {/* Expanded Details */}
              {expandedAction === idx && (
                <div className="px-4 pb-4 border-t border-current border-opacity-20">
                  {/* Steps */}
                  <div className="mt-4 mb-4">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">📋 Specific Steps:</h4>
                    <ol className="space-y-2 ml-4">
                      {action.specific_steps.map((step, stepIdx) => (
                        <li key={stepIdx} className="text-sm text-slate-700 dark:text-slate-300">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                  
                  {/* Success Metrics */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">✅ Success Metrics:</h4>
                    <ul className="space-y-1">
                      {action.success_metrics.map((metric, metricIdx) => (
                        <li key={metricIdx} className="text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                          <CheckCircle size={16} />
                          {metric}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Impact */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-current border-opacity-20">
                    <div className="text-sm">
                      <p className="text-slate-600 dark:text-slate-400 mb-1">Health Score Impact</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {action.health_score_impact}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-600 dark:text-slate-400 mb-1">Placement Probability</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {action.placement_prob_impact}%
                      </p>
                    </div>
                  </div>
                  
                  {/* Call to Action */}
                  <button className="w-full mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors">
                    🚀 Start This Action
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Success Factors */}
      {actionPlan.success_factors && actionPlan.success_factors.length > 0 && (
        <div className="card p-6 bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">💪 Why You Can Succeed</h3>
          <ul className="space-y-2">
            {actionPlan.success_factors.map((factor, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                <CheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5" size={18} />
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Timeline Overview */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">📅 Implementation Timeline</h3>
        <div className="space-y-2 text-sm">
          {actionPlan.action_plan.slice(0, 3).map((action, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-24">
                <p className="font-medium text-slate-600 dark:text-slate-400">Week {idx + 1}</p>
              </div>
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              <span className="text-slate-600 dark:text-slate-400">{action.duration}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 text-center">
          Total timeline: {actionPlan.estimated_improvement.timeline}
        </p>
      </div>
    </div>
  )
}

export default ActionPlanPanel
