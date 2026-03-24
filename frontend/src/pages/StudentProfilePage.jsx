import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Github, Linkedin, MapPin, Phone, Mail, Calendar,
  BookOpen, Briefcase, Award, TrendingUp, AlertTriangle, CheckCircle,
  Printer, Zap, Star
} from 'lucide-react'
import { studentsAPI, marksAPI, placementsAPI, internshipsAPI, analyticsAPI } from '../api/services'
import { PageLoader, GradeBadge, Spinner } from '../components/UI'
import { format } from 'date-fns'

function IDCard({ student }) {
  return (
    <div id="id-card"
      className="w-72 bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-2xl overflow-hidden border border-blue-500/30 shadow-xl mx-auto">
      <div className="bg-blue-600 px-4 py-3 flex items-center gap-2">
        <Zap size={14} />
        <span className="text-xs font-bold tracking-widest uppercase">CampusIQ</span>
        <span className="ml-auto text-xs opacity-70">Student ID</span>
      </div>
      <div className="p-5 flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-3xl font-bold border-4 border-white/10">
          {student.name.charAt(0)}
        </div>
        <div className="text-center">
          <div className="font-bold text-lg leading-tight">{student.name}</div>
          <div className="font-mono text-xs text-blue-300 mt-1">{student.usn}</div>
          <div className="text-xs text-slate-300 mt-1">{student.department_name}</div>
        </div>
        <div className="w-full border-t border-white/10 pt-3 grid grid-cols-2 gap-2 text-xs">
          <div><span className="text-slate-400">Semester</span><div className="font-semibold">{student.semester}</div></div>
          <div><span className="text-slate-400">Section</span><div className="font-semibold">{student.section || '—'}</div></div>
          <div><span className="text-slate-400">CGPA</span><div className="font-semibold text-emerald-400">{student.cgpa?.toFixed(2)}</div></div>
          <div><span className="text-slate-400">Blood Group</span><div className="font-semibold">{student.blood_group || '—'}</div></div>
        </div>
        <div className="w-full bg-white rounded-lg p-2 flex items-center justify-center">
          <div className="grid grid-cols-8 gap-px">
            {Array(40).fill(0).map((_, i) => (
              <div key={i} className={`w-2 h-4 rounded-sm ${i % 3 === 0 ? 'bg-slate-900' : i % 5 === 0 ? 'bg-slate-700' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>
        <div className="text-xs text-slate-500 font-mono">{student.usn}</div>
      </div>
    </div>
  )
}

export default function StudentProfilePage() {
  const { id } = useParams()
  const [student, setStudent] = useState(null)
  const [marks, setMarks] = useState([])
  const [placements, setPlacements] = useState([])
  const [internships, setInternships] = useState([])
  const [skillGap, setSkillGap] = useState(null)
  const [loadingGap, setLoadingGap] = useState(false)
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      studentsAPI.get(id),
      marksAPI.list({ student_id: id }),
      placementsAPI.list(),
      internshipsAPI.list(),
    ]).then(([s, m, p, i]) => {
      setStudent(s.data)
      setMarks(m.data)
      setPlacements(p.data.filter(pl => pl.student_id === parseInt(id)))
      setInternships(i.data.filter(in_ => in_.student_id === parseInt(id)))
    }).finally(() => setLoading(false))
  }, [id])

  const loadSkillGap = async () => {
    setLoadingGap(true)
    try {
      const r = await analyticsAPI.skillGap(id)
      setSkillGap(r.data)
      setTab('ai')
    } catch (e) {
      console.error(e)
    } finally { setLoadingGap(false) }
  }

  if (loading) return <PageLoader />
  if (!student) return <div className="text-center py-20 text-slate-400">Student not found</div>

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'marks', label: `Marks (${marks.length})` },
    { id: 'placements', label: `Placements (${placements.length})` },
    { id: 'internships', label: `Internships (${internships.length})` },
    { id: 'idcard', label: 'ID Card' },
    { id: 'ai', label: '🤖 AI Analysis' },
  ]

  const cgpaColor = student.cgpa >= 8.5 ? 'text-emerald-500' : student.cgpa >= 7 ? 'text-blue-500' : student.cgpa >= 5 ? 'text-amber-500' : 'text-red-500'

  return (
    <div className="space-y-4 animate-fade-in max-w-6xl">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <Link to="/students" className="btn-secondary mt-1"><ArrowLeft size={16} /> Back</Link>
        <div className="flex-1">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {student.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{student.name}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <span className="font-mono text-sm text-slate-500">{student.usn}</span>
                <span className="badge badge-blue">{student.department_name}</span>
                <span className="badge badge-amber">Sem {student.semester}</span>
                {student.backlog_count > 0
                  ? <span className="badge badge-red">{student.backlog_count} Backlogs</span>
                  : <span className="badge badge-green">No Backlogs</span>}
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className={`text-4xl font-bold ${cgpaColor}`}>{student.cgpa?.toFixed(2)}</div>
              <div className="text-xs text-slate-400">CGPA</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'ai' && !skillGap) loadSkillGap() }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Contact */}
          <div className="card p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white">Contact</h3>
            {[
              [Mail, student.email], [Phone, student.phone], [MapPin, [student.city, student.state].filter(Boolean).join(', ')]
            ].map(([Icon, val], i) => val && (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <Icon size={14} className="text-slate-400 flex-shrink-0" />
                <span className="truncate">{val}</span>
              </div>
            ))}
            {student.github && (
              <a href={student.github} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-blue-600 hover:text-blue-700">
                <Github size={14} /><span className="truncate">GitHub Profile</span>
              </a>
            )}
            {student.linkedin && (
              <a href={student.linkedin} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-blue-600 hover:text-blue-700">
                <Linkedin size={14} /><span className="truncate">LinkedIn Profile</span>
              </a>
            )}
          </div>

          {/* Personal & Family */}
          <div className="card p-6 space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white">Personal & Family</h3>
            {[
              ['Date of Birth', student.date_of_birth],
              ['Blood Group', student.blood_group],
              ['Father', student.father_name],
              ['Mother', student.mother_name],
              ['Parent Phone', student.parent_phone],
            ].map(([label, val]) => val && (
              <div key={label} className="flex items-start gap-2 text-sm">
                <span className="text-slate-400 w-28 flex-shrink-0">{label}</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">{val}</span>
              </div>
            ))}
          </div>

          {/* Skills */}
          <div className="card p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Skills ({student.skills?.length || 0})</h3>
            <div className="flex flex-wrap gap-2">
              {(student.skills || []).map(sk => (
                <div key={sk.id} className="flex flex-col items-center gap-0.5">
                  <span className="badge badge-blue">{sk.name}</span>
                  <span className="text-[10px] text-slate-400 capitalize">{sk.level}</span>
                </div>
              ))}
              {(!student.skills || student.skills.length === 0) && (
                <p className="text-sm text-slate-400">No skills added yet</p>
              )}
            </div>

            {/* Academic summary */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-3">
              {[
                ['Admission Year', student.admission_year],
                ['SGPA', student.sgpa?.toFixed(2)],
                ['Section', student.section],
                ['Admission Year', student.admission_year],
              ].filter((_, i, a) => !a.slice(0, i).find(x => x[0] === a[i][0])).map(([label, val]) => val && (
                <div key={label} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                  <div className="text-xs text-slate-400">{label}</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Marks Tab */}
      {tab === 'marks' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Subject</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Semester</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Internal</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">External</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Total</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Grade</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {marks.map(m => (
                <tr key={m.id} className="table-row">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{m.subject_name || `Subject #${m.subject_id}`}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{m.semester}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{m.internal_marks}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{m.external_marks}</td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{m.total_marks?.toFixed(1)}</td>
                  <td className="px-4 py-3"><GradeBadge grade={m.grade} /></td>
                  <td className="px-4 py-3">
                    {m.is_pass ? <span className="badge badge-green">Pass</span> : <span className="badge badge-red">Fail</span>}
                  </td>
                </tr>
              ))}
              {marks.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-slate-400">No marks recorded</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Placements Tab */}
      {tab === 'placements' && (
        <div className="space-y-3">
          {placements.map(p => (
            <div key={p.id} className="card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <Briefcase size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">{p.company}</span>
                  {p.is_confirmed && <span className="badge badge-green">Confirmed</span>}
                </div>
                <div className="text-sm text-slate-500 mt-0.5">{p.role} · {p.location}</div>
                {p.placement_date && <div className="text-xs text-slate-400 mt-1">{format(new Date(p.placement_date), 'd MMM yyyy')}</div>}
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-emerald-600">₹{p.package_lpa} LPA</div>
              </div>
            </div>
          ))}
          {placements.length === 0 && <div className="card p-12 text-center text-slate-400">No placement records</div>}
        </div>
      )}

      {/* Internships Tab */}
      {tab === 'internships' && (
        <div className="space-y-3">
          {internships.map(i => (
            <div key={i.id} className="card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={20} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 dark:text-white">{i.company}</div>
                <div className="text-sm text-slate-500">{i.role} · {i.duration_months} months</div>
                {i.start_date && <div className="text-xs text-slate-400 mt-1">
                  {format(new Date(i.start_date), 'MMM yyyy')} — {i.end_date ? format(new Date(i.end_date), 'MMM yyyy') : 'Present'}
                </div>}
              </div>
              {i.stipend && <div className="text-right">
                <div className="font-bold text-amber-600">₹{i.stipend?.toLocaleString()}/mo</div>
              </div>}
            </div>
          ))}
          {internships.length === 0 && <div className="card p-12 text-center text-slate-400">No internship records</div>}
        </div>
      )}

      {/* ID Card Tab */}
      {tab === 'idcard' && (
        <div className="space-y-4">
          <IDCard student={student} />
          <div className="flex justify-center">
            <button onClick={() => window.print()} className="btn-secondary">
              <Printer size={16} /> Print ID Card
            </button>
          </div>
        </div>
      )}

      {/* AI Analysis Tab */}
      {tab === 'ai' && (
        <div className="space-y-4">
          {loadingGap ? (
            <div className="card p-16 flex flex-col items-center gap-4">
              <Spinner size={32} />
              <p className="text-slate-400">Analyzing skill profile...</p>
            </div>
          ) : skillGap ? (
            <>
              {/* Placement readiness */}
              <div className={`card p-5 flex items-center gap-4 border-2 ${skillGap.placement_ready ? 'border-emerald-300 dark:border-emerald-700' : 'border-amber-300 dark:border-amber-700'}`}>
                {skillGap.placement_ready
                  ? <CheckCircle size={24} className="text-emerald-500 flex-shrink-0" />
                  : <AlertTriangle size={24} className="text-amber-500 flex-shrink-0" />}
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {skillGap.placement_ready ? 'Placement Ready ✓' : 'Not Yet Placement Ready'}
                  </div>
                  <div className="text-sm text-slate-500">CGPA: {skillGap.cgpa} · {skillGap.current_skills?.length} skills</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Missing Skills */}
                <div className="card p-6">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" /> Missing High-Demand Skills
                  </h3>
                  <div className="space-y-3">
                    {skillGap.missing_skills?.map((s, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xs font-bold text-amber-600">!</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{s.skill}</span>
                            <span className="badge badge-amber">{s.category}</span>
                          </div>
                          <div className="mt-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(100, s.demand_score * 20)}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                    {skillGap.missing_skills?.length === 0 && <p className="text-sm text-slate-400">No major skill gaps found!</p>}
                  </div>
                </div>

                {/* Career Paths */}
                <div className="card p-6">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Star size={16} className="text-blue-500" /> Career Recommendations
                  </h3>
                  <div className="space-y-4">
                    {skillGap.career_recommendations?.map((r, i) => (
                      <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{r.path}</span>
                          <span className={`badge ${r.match === 'High' ? 'badge-green' : r.match === 'Medium' ? 'badge-blue' : 'badge-amber'}`}>{r.match} Match</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {r.next_steps?.map((step, j) => (
                            <span key={j} className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg">→ {step}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="card p-8 text-center">
              <button onClick={loadSkillGap} className="btn-primary mx-auto">
                <Zap size={16} /> Run AI Analysis
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
