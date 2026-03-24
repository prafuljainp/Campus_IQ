import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, ChevronRight, Sparkles } from 'lucide-react'
import useAuthStore from '../context/authStore'
import toast from 'react-hot-toast'

const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'admin@campusiq.edu', password: 'Admin@123', color: 'from-purple-500 to-purple-700', dot: 'bg-purple-400' },
  { label: 'HOD – CSE', email: 'hod.cse@campusiq.edu', password: 'Faculty@123', color: 'from-blue-500 to-blue-700', dot: 'bg-blue-400' },
  { label: 'Faculty', email: 'faculty.cs1@campusiq.edu', password: 'Faculty@123', color: 'from-emerald-500 to-emerald-700', dot: 'bg-emerald-400' },
  { label: 'Student', email: 'student1@campusiq.edu', password: 'Student@123', color: 'from-amber-500 to-amber-700', dot: 'bg-amber-400' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please enter credentials')
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (acc) => {
    setEmail(acc.email)
    setPassword(acc.password)
  }

  return (
    <div className="min-h-screen flex bg-slate-950 overflow-hidden">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-center items-center p-16"
        style={{ background: 'radial-gradient(ellipse at 60% 50%, #1e3a8a 0%, #0f172a 60%)' }}>
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid opacity-20" />
        {/* Glowing orbs */}
        <div className="absolute top-32 right-20 w-64 h-64 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute bottom-32 left-20 w-48 h-48 rounded-full bg-purple-600/20 blur-3xl" />

        <div className="relative z-10 max-w-sm text-center">
          <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center mx-auto mb-8 shadow-glow">
            <Zap size={36} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Campus<span className="text-blue-400">IQ</span>
          </h1>
          <p className="text-slate-400 text-lg mt-3 leading-relaxed">
            AI-Powered College ERP &<br />Placement Intelligence System
          </p>

          {/* Feature pills */}
          <div className="mt-10 flex flex-wrap gap-2 justify-center">
            {['Placement Tracker', 'AI Skill Gap', 'Smart Analytics', 'Attendance', 'Grade Manager', 'Leaderboard'].map(f => (
              <span key={f} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-medium">
                {f}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[['500+', 'Students'], ['50+', 'Faculty'], ['98%', 'Uptime']].map(([n, l]) => (
              <div key={l} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="text-2xl font-bold text-white">{n}</div>
                <div className="text-xs text-slate-400 mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-900">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-white text-xl font-bold">CampusIQ</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Sign in</h2>
          <p className="text-slate-400 mb-8">Access your campus dashboard</p>

          {/* Demo accounts */}
          <div className="mb-6">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
              <Sparkles size={12} className="text-blue-400" /> Quick Demo Login
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => fillDemo(acc)}
                  className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r ${acc.color} text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all duration-150 overflow-hidden group`}
                >
                  <div className={`w-2 h-2 rounded-full ${acc.dot} flex-shrink-0`} />
                  {acc.label}
                  <ChevronRight size={12} className="ml-auto opacity-60 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-xs text-slate-500">or enter manually</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label text-slate-400">Email Address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@campusiq.edu"
                className="input bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="label text-slate-400">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-primary justify-center py-3 text-base mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75"/>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-xs text-slate-600 text-center mt-8">
            CampusIQ © 2024 · AI Powered College ERP System
          </p>
        </div>
      </div>
    </div>
  )
}
