import { useEffect, useState } from 'react'
import { analyticsAPI, skillsAPI } from '../api/services'
import { PageLoader } from '../components/UI'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts'

const COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#f97316','#84cc16']

const ChartCard = ({ title, children }) => (
  <div className="card p-6">
    <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4">{title}</h3>
    {children}
  </div>
)

export default function AnalyticsPage() {
  const [summary, setSummary] = useState(null)
  const [cgpaDist, setCgpaDist] = useState([])
  const [deptPerf, setDeptPerf] = useState([])
  const [trends, setTrends] = useState([])
  const [companies, setCompanies] = useState([])
  const [skillDemand, setSkillDemand] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      analyticsAPI.summary(),
      analyticsAPI.cgpaDistribution(),
      analyticsAPI.departmentPerformance(),
      analyticsAPI.placementTrends(),
      analyticsAPI.topCompanies(),
      skillsAPI.demand(),
    ]).then(([s, c, d, t, co, sk]) => {
      if (s.status === 'fulfilled') setSummary(s.value.data)
      if (c.status === 'fulfilled') setCgpaDist(c.value.data || [])
      if (d.status === 'fulfilled') setDeptPerf(d.value.data || [])
      if (t.status === 'fulfilled') setTrends(t.value.data || [])
      if (co.status === 'fulfilled') setCompanies(co.value.data || [])
      if (sk.status === 'fulfilled') setSkillDemand((sk.value.data || []).slice(0, 8))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  return (
    <div className="space-y-4 animate-fade-in">
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ['Placement Rate', `${summary.placement_rate}%`, '#3b82f6'],
            ['Avg CGPA', summary.avg_cgpa, '#10b981'],
            ['Avg Package', `₹${summary.avg_package} LPA`, '#f59e0b'],
            ['Internships', summary.total_internships, '#8b5cf6'],
          ].map(([label, val, color]) => (
            <div key={label} className="card p-5">
              <div className="text-sm text-slate-400">{label}</div>
              <div className="text-3xl font-bold mt-1" style={{ color }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {cgpaDist.length > 0 && (
          <ChartCard title="📊 CGPA Distribution">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cgpaDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" radius={[6,6,0,0]}>
                  {cgpaDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
        {trends.length > 0 && (
          <ChartCard title="📈 Placement Trends">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
        {companies.length > 0 && (
          <ChartCard title="🏢 Top Hiring Companies">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={companies.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="company" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#10b981" radius={[0,6,6,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
        {deptPerf.length > 0 && (
          <ChartCard title="🏛️ Department Performance">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptPerf}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="l" tick={{ fontSize: 11 }} domain={[0, 10]} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend />
                <Bar yAxisId="l" dataKey="avg_cgpa" fill="#3b82f6" radius={[4,4,0,0]} name="Avg CGPA" />
                <Bar yAxisId="r" dataKey="placement_rate" fill="#10b981" radius={[4,4,0,0]} name="Placement %" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
        {companies.length > 0 && (
          <ChartCard title="💼 Company Share">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={companies.slice(0,6)} dataKey="count" nameKey="company"
                  cx="50%" cy="50%" outerRadius={85} label={({ company, percent }) =>
                    `${company.slice(0,8)} ${(percent*100).toFixed(0)}%`}
                  labelLine={false} fontSize={10}>
                  {companies.slice(0,6).map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
        {skillDemand.length > 0 && (
          <ChartCard title="🛠️ Skill Demand Radar">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={skillDemand}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                <Radar dataKey="count" fill="#8b5cf6" fillOpacity={0.3} stroke="#8b5cf6" strokeWidth={2} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {(cgpaDist.length === 0 && deptPerf.length === 0 && companies.length === 0) && (
        <div className="card p-16 text-center text-slate-400">
          <p className="text-lg font-semibold">No analytics data yet</p>
          <p className="text-sm mt-1">Add students, placements and marks to see charts here</p>
        </div>
      )}
    </div>
  )
}
