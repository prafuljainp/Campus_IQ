/**
 * AI Intelligence Dashboard
 * Comprehensive student intelligence insights and predictions system
 */
import React, { useState, useEffect, useCallback } from 'react'
import { AlertCircle, TrendingUp, Award, Users, Zap, ChevronDown, ChevronUp, Loader } from 'lucide-react'
import { aiInsightsAPI } from '../api/services'
import useAuthStore from '../context/authStore'
import toast from 'react-hot-toast'
import HealthScoreCard from './AIIntelligence/HealthScoreCard'
import PlacementProbabilityCard from './AIIntelligence/PlacementProbabilityCard'
import ActionPlanPanel from './AIIntelligence/ActionPlanPanel'
import AlertsPanel from './AIIntelligence/AlertsPanel'
import CompanyMatchingPanel from './AIIntelligence/CompanyMatchingPanel'
import WhatIfSimulator from './AIIntelligence/WhatIfSimulator'

const AIIntelligenceDashboard = ({ studentId = null }) => {
  const { user } = useAuthStore()
  const [data, setData] = useState({
    healthScore: null,
    placement: null,
    actionPlan: null,
    alerts: null,
    companies: null,
    skillGaps: null,
  })
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedSections, setExpandedSections] = useState({
    health: true,
    placement: true,
    actions: true,
    alerts: true,
    companies: false,
    whatif: false,
  })
  
  const targetStudentId = studentId || user?.student_id
  
  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!targetStudentId) {
      toast.error('No student profile found')
      return
    }
    
    setLoading(true)
    try {
      const [health, placement, actionPlan, alerts, companies, skillGaps] = await Promise.allSettled([
        aiInsightsAPI.getHealthScore(targetStudentId),
        aiInsightsAPI.getPlacementProbability(targetStudentId),
        aiInsightsAPI.getActionPlan(targetStudentId),
        aiInsightsAPI.getAlerts(targetStudentId),
        aiInsightsAPI.getCompanyMatches(targetStudentId),
        aiInsightsAPI.analyzeSkillGaps(targetStudentId),
      ])
      
      setData({
        healthScore: health.status === 'fulfilled' ? health.value.data : null,
        placement: placement.status === 'fulfilled' ? placement.value.data : null,
        actionPlan: actionPlan.status === 'fulfilled' ? actionPlan.value.data : null,
        alerts: alerts.status === 'fulfilled' ? alerts.value.data : null,
        companies: companies.status === 'fulfilled' ? companies.value.data : null,
        skillGaps: skillGaps.status === 'fulfilled' ? skillGaps.value.data : null,
      })
    } catch (error) {
      console.error('Failed to load AI insights:', error)
      toast.error('Failed to load insights')
    } finally {
      setLoading(false)
    }
  }, [targetStudentId])
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="animate-spin text-blue-500" size={40} />
      </div>
    )
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          🎯 AI Student Intelligence Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Personalized insights to help you succeed academically and professionally
        </p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.healthScore && (
          <div className={`card p-4 border-l-4 ${
            data.healthScore.status === 'Excellent' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' :
            data.healthScore.status === 'Good' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' :
            data.healthScore.status === 'At Risk' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20' :
            'border-red-500 bg-red-50 dark:bg-red-950/20'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Health Score</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{data.healthScore.total_score}</p>
              </div>
              <div className="text-4xl">{data.healthScore.status_emoji}</div>
            </div>
            <p className="text-xs text-slate-500 mt-2">{data.healthScore.status}</p>
          </div>
        )}
        
        {data.placement && (
          <div className={`card p-4 border-l-4 ${
            data.placement.placement_probability >= 80 ? 'border-green-500 bg-green-50 dark:bg-green-950/20' :
            data.placement.placement_probability >= 60 ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' :
            'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Placement Probability</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{data.placement.placement_probability}%</p>
              </div>
              <TrendingUp className="text-xl" size={32} />
            </div>
            <p className="text-xs text-slate-500 mt-2">{data.placement.confidence} Confidence</p>
          </div>
        )}
        
        {data.companies && (
          <div className="card p-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Eligible Companies</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{data.companies.statistics.fully_eligible}</p>
              </div>
              <Users size={32} className="text-purple-600" />
            </div>
            <p className="text-xs text-slate-500 mt-2">Out of {data.companies.statistics.total_companies_tracked}</p>
          </div>
        )}
      </div>
      
      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-700">
        {['overview', 'health', 'placement', 'actions', 'companies', 'whatif'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium text-sm capitalize whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      {/* Content Sections */}
      <div className="space-y-4">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Critical Alerts */}
            {data.alerts && data.alerts.critical_alerts > 0 && (
              <div className="card p-4 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500">
                <div className="flex gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-red-900 dark:text-red-100">
                      ⚠️ {data.alerts.critical_alerts} Critical Alert(s)
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-200">
                      Action required to improve your placement prospects
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Key Recommendation */}
            {data.actionPlan && data.actionPlan.action_plan.length > 0 && (
              <div className="card p-4 bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500">
                <div className="flex gap-3">
                  <Zap className="text-blue-600 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">🎯 Top Priority</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                      {data.actionPlan.action_plan[0].action}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                      ⏱️ Timeline: {data.actionPlan.action_plan[0].duration}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Next Milestone */}
            {data.healthScore && (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">📈 Next Milestone</h3>
                  <Award className="text-amber-500" size={20} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{data.healthScore.total_score} → {data.healthScore.next_milestone}</span>
                      <span className="text-sm text-slate-500">{data.healthScore.progress_to_milestone}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                        style={{
                          width: `${(data.healthScore.total_score / data.healthScore.next_milestone) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Health Score Tab */}
        {activeTab === 'health' && data.healthScore && (
          <HealthScoreCard healthScore={data.healthScore} onRefresh={fetchData} />
        )}
        
        {/* Placement Tab */}
        {activeTab === 'placement' && data.placement && (
          <PlacementProbabilityCard placement={data.placement} onRefresh={fetchData} />
        )}
        
        {/* Action Plan Tab */}
        {activeTab === 'actions' && data.actionPlan && (
          <ActionPlanPanel actionPlan={data.actionPlan} />
        )}
        
        {/* Companies Tab */}
        {activeTab === 'companies' && data.companies && (
          <CompanyMatchingPanel companies={data.companies} skillGaps={data.skillGaps} />
        )}
        
        {/* What-If Tab */}
        {activeTab === 'whatif' && data.placement && (
          <WhatIfSimulator studentId={targetStudentId} currentPlacement={data.placement} onRefresh={fetchData} />
        )}
      </div>
      
      {/* Alerts Panel (Always visible) */}
      {data.alerts && activeTab === 'overview' && (
        <AlertsPanel alerts={data.alerts} />
      )}
      
      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={fetchData}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
        >
          🔄 Refresh Insights
        </button>
      </div>
    </div>
  )
}

export default AIIntelligenceDashboard
