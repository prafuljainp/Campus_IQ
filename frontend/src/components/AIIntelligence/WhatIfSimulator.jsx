/**
 * What-If Simulator Component
 * Simulate improvements and see impact on placement probability
 */
import React, { useState, useEffect } from 'react'
import { TrendingUp, RotateCcw, Zap } from 'lucide-react'
import { aiInsightsAPI } from '../../api/services'
import toast from 'react-hot-toast'

const WhatIfSimulator = ({ studentId, currentPlacement = {}, onRefresh }) => {
  const [scenario, setScenario] = useState({
    cgpa_increase: 0,
    skills_added: 0,
    clear_backlogs: false,
  })

  const [simulation, setSimulation] = useState(null)
  const [loading, setLoading] = useState(false)

  // Current values
  const currentCGPA = currentPlacement.factors?.cgpa_score || 6.5
  const currentSkills = currentPlacement.factors?.skills_score || 3
  const currentBacklogs = currentPlacement.factors?.backlogs || 0
  const currentProbability = currentPlacement.placement_probability || 0

  // Simulated values
  const newCGPA = Math.min(currentCGPA + scenario.cgpa_increase, 10)
  const newSkills = currentSkills + scenario.skills_added
  const newBacklogs = scenario.clear_backlogs ? 0 : currentBacklogs

  useEffect(() => {
    runSimulation()
  }, [scenario])

  const runSimulation = async () => {
    if (!studentId) return

    setLoading(true)
    try {
      const result = await aiInsightsAPI.simulateImprovement(studentId, {
        cgpa_increase: scenario.cgpa_increase,
        skills_added: scenario.skills_added,
        clear_backlogs: scenario.clear_backlogs,
      })
      setSimulation(result.data)
    } catch (error) {
      console.error('Simulation failed:', error)
      toast.error('Failed to run simulation')
    } finally {
      setLoading(false)
    }
  }

  const resetScenario = () => {
    setScenario({
      cgpa_increase: 0,
      skills_added: 0,
      clear_backlogs: false,
    })
  }

  const handleCGPAChange = (e) => {
    const value = Math.min(Math.max(parseFloat(e.target.value) || 0, 0), 10)
    setScenario(prev => ({ ...prev, cgpa_increase: value - currentCGPA }))
  }

  const handleSkillsChange = (e) => {
    setScenario(prev => ({
      ...prev,
      skills_added: parseInt(e.target.value) || 0,
    }))
  }

  const improvement = simulation?.new_probability - currentProbability

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">🔮 What-If Simulator</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Simulate improvements and see impact on your placement probability
        </p>
      </div>

      {/* Scenario Builder */}
      <div className="card p-6 space-y-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Let's Try Some Changes</h3>

        {/* CGPA Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            📊 Target CGPA: <span className="text-lg text-blue-600">{newCGPA.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={newCGPA}
            onChange={handleCGPAChange}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>Current: {currentCGPA.toFixed(2)}</span>
            <span>Target: {newCGPA.toFixed(2)}</span>
            <span>Change: {(newCGPA - currentCGPA).toFixed(2)}</span>
          </div>
        </div>

        {/* Skills Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            🎯 Additional Skills to Acquire: <span className="text-lg text-emerald-600">{scenario.skills_added}</span>
          </label>
          <input
            type="range"
            min="0"
            max="20"
            step="1"
            value={scenario.skills_added}
            onChange={handleSkillsChange}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>Current: {currentSkills} skills</span>
            <span>After: {newSkills} skills</span>
          </div>
        </div>

        {/* Clear Backlogs */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={scenario.clear_backlogs}
              onChange={(e) =>
                setScenario(prev => ({ ...prev, clear_backlogs: e.target.checked }))
              }
              className="w-5 h-5 text-blue-600 rounded"
            />
            <div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">⚠️ Clear All Backlogs</span>
              <p className="text-xs text-slate-500 mt-0.5">Current: {currentBacklogs} backlogs</p>
            </div>
          </label>
        </div>

        {/* Reset Button */}
        <button
          onClick={resetScenario}
          className="w-full flex items-center justify-center gap-2 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <RotateCcw size={18} />
          Reset Scenario
        </button>
      </div>

      {/* Results */}
      {simulation && (
        <div className="card p-6 space-y-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">📈 Projected Results</h3>

          {/* Current vs New Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Current */}
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-600 dark:text-slate-400">Current</p>
              <p className="text-3xl font-bold text-slate-700 dark:text-slate-300">
                {currentProbability?.toFixed(0)}%
              </p>
              <p className="text-xs text-slate-500 mt-2">
                CGPA: {currentCGPA.toFixed(2)} | Skills: {currentSkills}
              </p>
            </div>

            {/* New */}
            <div className="p-4 bg-emerald-100 dark:bg-emerald-950/30 rounded-lg border border-emerald-300 dark:border-emerald-900">
              <p className="text-xs text-emerald-700 dark:text-emerald-300">New Probability</p>
              <p className="text-3xl font-bold text-emerald-600">
                {simulation?.new_probability?.toFixed(0)}%
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-300 mt-2">
                CGPA: {newCGPA.toFixed(2)} | Skills: {newSkills}
              </p>
            </div>
          </div>

          {/* Improvement */}
          {improvement !== undefined && (
            <div className="p-4 bg-blue-100 dark:bg-blue-950/30 rounded-lg border border-blue-300 dark:border-blue-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Improvement</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {improvement > 0 ? '+' : ''}{improvement?.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="text-blue-600" size={40} />
              </div>
            </div>
          )}

          {/* Detailed Breakdown */}
          {simulation?.breakdown && (
            <div className="space-y-3 mt-4 pt-4 border-t border-slate-300 dark:border-slate-600">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Probability Breakdown:</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-white dark:bg-slate-800 rounded">
                  <p className="text-xs text-slate-600 dark:text-slate-400">CGPA Impact</p>
                  <p className="font-bold text-blue-600">
                    {simulation.breakdown.cgpa_impact ? `+${simulation.breakdown.cgpa_impact.toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded">
                  <p className="text-xs text-slate-600 dark:text-slate-400">Skills Impact</p>
                  <p className="font-bold text-emerald-600">
                    {simulation.breakdown.skills_impact ? `+${simulation.breakdown.skills_impact.toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded">
                  <p className="text-xs text-slate-600 dark:text-slate-400">Backlog Impact</p>
                  <p className="font-bold text-amber-600">
                    {simulation.breakdown.backlog_impact ? `+${simulation.breakdown.backlog_impact.toFixed(1)}%` : 'No change'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4 pt-4 border-t border-slate-300 dark:border-slate-600">
            <button
              onClick={onRefresh}
              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors"
            >
              ✅ Start Working Towards This
            </button>
            <button
              onClick={resetScenario}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="card p-8 text-center">
          <div className="inline-block animate-spin">
            <Zap className="text-blue-500" size={40} />
          </div>
          <p className="mt-3 text-slate-600 dark:text-slate-400">Calculating scenarios...</p>
        </div>
      )}
    </div>
  )
}

export default WhatIfSimulator
