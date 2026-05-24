/**
 * Company Matching Panel Component
 * Displays company eligibility with match scores
 */
import React, { useState } from 'react'
import { Building2, TrendingUp, MapPin, Briefcase, AlertCircle, CheckCircle, Clock } from 'lucide-react'

const CompanyMatchingPanel = ({ companies = {}, skillGaps = {} }) => {
  const [selectedTab, setSelectedTab] = useState('eligible')

  const eligible = companies.eligible || []
  const partially_eligible = companies.partially_eligible || []
  const not_eligible = companies.not_eligible || []

  const CompanyCard = ({ company, status }) => {
    const getStatusColor = () => {
      if (company.match_score >= 80) return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
      if (company.match_score >= 60) return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
      return 'border-red-500 bg-red-50 dark:bg-red-950/20'
    }

    const getStatusIcon = () => {
      if (status === 'eligible') return <CheckCircle className="text-emerald-600" size={20} />
      if (status === 'partial') return <Clock className="text-blue-600" size={20} />
      return <AlertCircle className="text-red-600" size={20} />
    }

    return (
      <div className={`card p-6 border-l-4 ${getStatusColor()}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={20} className="text-slate-600" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{company.company_name}</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">{company.roles?.join(', ') || 'Various'}</p>
          </div>
          {getStatusIcon()}
        </div>

        {/* Match Score */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Match Score</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{company.match_score?.toFixed(0)}%</span>
          </div>
          <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                company.match_score >= 80 ? 'bg-emerald-500'
                  : company.match_score >= 60 ? 'bg-blue-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(company.match_score, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Salary Range */}
        <div className="flex items-center gap-4 mb-4 p-3 bg-slate-100 dark:bg-slate-800 rounded">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Salary Range</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              ₹{company.ctc_range?.min} - ₹{company.ctc_range?.max} LPA
            </p>
          </div>
          <div className="flex-1 text-right">
            <p className="text-xs text-slate-600 dark:text-slate-400">Hiring</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{company.hiring_timeline}</p>
          </div>
        </div>

        {/* Score Breakdown */}
        {company.score_breakdown && (
          <div className="mb-4 space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Score Breakdown</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">CGPA</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {company.score_breakdown.cgpa_score?.toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Backlogs</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {company.score_breakdown.backlog_score?.toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Skills</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {company.score_breakdown.skills_score?.toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Pref Skills</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {company.score_breakdown.preferred_skills_score?.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Barriers or How to Fix */}
        {status === 'not-eligible' && company.barriers && (
          <div className="p-3 bg-red-100 dark:bg-red-950/30 rounded border border-red-300 dark:border-red-900 mb-4">
            <p className="text-xs font-semibold text-red-900 dark:text-red-100 mb-2">⚠️ Barriers:</p>
            <ul className="text-xs text-red-800 dark:text-red-200 space-y-1">
              {company.barriers.map((barrier, idx) => (
                <li key={idx}>• {barrier}</li>
              ))}
            </ul>
          </div>
        )}

        {status !== 'eligible' && company.how_to_fix && (
          <div className="p-3 bg-blue-100 dark:bg-blue-950/30 rounded border border-blue-300 dark:border-blue-900 mb-4">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 How to Improve:</p>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              {company.how_to_fix.map((fix, idx) => (
                <li key={idx}>✓ {fix}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Button */}
        <button className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors">
          📝 Apply Now
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">🏢 Company Matching</h2>
        <p className="text-slate-600 dark:text-slate-400">
          {skillGaps?.gap_analysis?.required_skills?.length || 0} skills needed | 
          {skillGaps?.gap_analysis?.missing_skills?.length || 0} skills to develop
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setSelectedTab('eligible')}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
            selectedTab === 'eligible'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          ✅ Eligible ({eligible.length})
        </button>
        <button
          onClick={() => setSelectedTab('partial')}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
            selectedTab === 'partial'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          🟡 Partially Eligible ({partially_eligible.length})
        </button>
        <button
          onClick={() => setSelectedTab('noteligible')}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
            selectedTab === 'noteligible'
              ? 'border-red-500 text-red-600 dark:text-red-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          ❌ Not Eligible ({not_eligible.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {selectedTab === 'eligible' && (
          <>
            {eligible.length > 0 ? (
              eligible.map((company, idx) => (
                <CompanyCard key={idx} company={company} status="eligible" />
              ))
            ) : (
              <div className="text-center py-8 text-slate-600 dark:text-slate-400">📭 No eligible companies yet</div>
            )}
          </>
        )}

        {selectedTab === 'partial' && (
          <>
            {partially_eligible.length > 0 ? (
              partially_eligible.map((company, idx) => (
                <CompanyCard key={idx} company={company} status="partial" />
              ))
            ) : (
              <div className="text-center py-8 text-slate-600 dark:text-slate-400">📭 No partially eligible companies</div>
            )}
          </>
        )}

        {selectedTab === 'noteligible' && (
          <>
            {not_eligible.length > 0 ? (
              not_eligible.map((company, idx) => (
                <CompanyCard key={idx} company={company} status="not-eligible" />
              ))
            ) : (
              <div className="text-center py-8 text-slate-600 dark:text-slate-400">🎉 Great! No barriers to any company</div>
            )}
          </>
        )}
      </div>

      {/* Skill Gap Summary */}
      {skillGaps?.gap_analysis && (
        <div className="card p-6 bg-slate-50 dark:bg-slate-950/20">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">📚 Skill Analysis</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded">
              <p className="text-xs text-slate-600 dark:text-slate-400">You Have</p>
              <p className="text-2xl font-bold text-emerald-600">
                {skillGaps.gap_analysis.current_skills?.length || 0}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">core skills</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded">
              <p className="text-xs text-slate-600 dark:text-slate-400">Missing</p>
              <p className="text-2xl font-bold text-amber-600">
                {skillGaps.gap_analysis.missing_skills?.length || 0}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">to develop</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompanyMatchingPanel
