/**
 * Alerts Panel Component
 * Displays smart alerts for student action
 */
import React, { useState } from 'react'
import { AlertCircle, AlertTriangle, Info, CheckCircle, X } from 'lucide-react'

const AlertsPanel = ({ alerts = [] }) => {
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set())

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertTriangle className="text-red-600" size={20} />
      case 'WARNING':
        return <AlertCircle className="text-amber-600" size={20} />
      case 'INFO':
        return <Info className="text-blue-600" size={20} />
      default:
        return <Info className="text-slate-600" size={20} />
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500'
      case 'WARNING':
        return 'bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500'
      case 'INFO':
        return 'bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500'
      default:
        return 'bg-slate-50 dark:bg-slate-950/20 border-l-4 border-slate-500'
    }
  }

  const getAlertTypeEmoji = (alertType) => {
    switch (alertType) {
      case 'ATTENDANCE':
        return '📚'
      case 'BACKLOG':
        return '⚠️'
      case 'PLACEMENT':
        return '💼'
      case 'SKILL':
        return '🎯'
      case 'EXAM':
        return '📝'
      case 'EVENT':
        return '📅'
      default:
        return '🔔'
    }
  }

  const toggleDismiss = (alertId) => {
    const newDismissed = new Set(dismissedAlerts)
    if (newDismissed.has(alertId)) {
      newDismissed.delete(alertId)
    } else {
      newDismissed.add(alertId)
    }
    setDismissedAlerts(newDismissed)
  }

  const activeAlerts = alerts.filter((_, idx) => !dismissedAlerts.has(idx))
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'CRITICAL')
  const warningAlerts = activeAlerts.filter(a => a.severity === 'WARNING')
  const infoAlerts = activeAlerts.filter(a => a.severity === 'INFO')

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {activeAlerts.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 border-l-4 border-red-500">
            <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Critical</div>
          </div>
          <div className="card p-4 border-l-4 border-amber-500">
            <div className="text-2xl font-bold text-amber-600">{warningAlerts.length}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Warnings</div>
          </div>
          <div className="card p-4 border-l-4 border-blue-500">
            <div className="text-2xl font-bold text-blue-600">{infoAlerts.length}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Info</div>
          </div>
        </div>
      )}

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-red-900 dark:text-red-100">🚨 Critical Issues</h3>
          <div className="space-y-3">
            {criticalAlerts.map((alert, idx) => (
              <div key={idx} className={`p-4 rounded-lg ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        {getAlertTypeEmoji(alert.alert_type)} {alert.title}
                      </h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{alert.message}</p>
                      {alert.recommendation && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">💡 {alert.recommendation}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleDismiss(idx)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0 ml-2"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning Alerts */}
      {warningAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">⚠️ Warnings</h3>
          <div className="space-y-3">
            {warningAlerts.map((alert, idx) => (
              <div key={idx} className={`p-4 rounded-lg ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        {getAlertTypeEmoji(alert.alert_type)} {alert.title}
                      </h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{alert.message}</p>
                      {alert.recommendation && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">💡 {alert.recommendation}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleDismiss(idx)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0 ml-2"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Alerts */}
      {infoAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">ℹ️ Information</h3>
          <div className="space-y-3">
            {infoAlerts.map((alert, idx) => (
              <div key={idx} className={`p-4 rounded-lg ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        {getAlertTypeEmoji(alert.alert_type)} {alert.title}
                      </h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{alert.message}</p>
                      {alert.recommendation && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">💡 {alert.recommendation}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleDismiss(idx)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0 ml-2"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Alerts */}
      {activeAlerts.length === 0 && (
        <div className="card p-8 text-center">
          <CheckCircle className="mx-auto text-emerald-500 mb-3" size={40} />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">All Clear!</h3>
          <p className="text-slate-600 dark:text-slate-400">No alerts at this time. Keep up the good work!</p>
        </div>
      )}
    </div>
  )
}

export default AlertsPanel
