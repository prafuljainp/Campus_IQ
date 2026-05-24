import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, GraduationCap, Building2, Briefcase,
  ClipboardCheck, BookOpen, Bell, BarChart3, Trophy, History,
  LogOut, ChevronRight, Zap, BrainCircuit, ClipboardList
} from 'lucide-react'
import useAuthStore from '../context/authStore'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['super_admin', 'hod', 'faculty', 'student'] },
  { to: '/students', icon: Users, label: 'Students', roles: ['super_admin', 'hod', 'faculty', 'student'] },
  { to: '/faculty', icon: GraduationCap, label: 'Faculty', roles: ['super_admin', 'hod'] },
  { to: '/departments', icon: Building2, label: 'Departments', roles: ['super_admin'] },
  { to: '/placements', icon: Briefcase, label: 'Placements', roles: ['super_admin', 'hod', 'faculty', 'student'] },
  { to: '/training', icon: ClipboardList, label: 'Training Tests', roles: ['super_admin', 'hod', 'faculty', 'student'] },
  { to: '/attendance', icon: ClipboardCheck, label: 'Attendance', roles: ['super_admin', 'hod', 'faculty', 'student'] },
  { to: '/marks', icon: BookOpen, label: 'Marks & Grades', roles: ['super_admin', 'hod', 'faculty', 'student'] },
  { to: '/ranking', icon: Trophy, label: 'Rankings', roles: ['super_admin', 'hod', 'faculty', 'student'] },
  { to: '/notices', icon: Bell, label: 'Notices', roles: ['super_admin', 'hod', 'faculty', 'student'] },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['super_admin', 'hod', 'faculty'] },
  { to: '/student-success', icon: BrainCircuit, label: 'Success Center', roles: ['super_admin', 'hod', 'faculty', 'student'] },
  // Phase 3 - Integration
  { to: '/job-portal', icon: Briefcase, label: '💼 Job Portal', roles: ['student'] },
  { to: '/notifications', icon: Bell, label: '🔔 Notifications', roles: ['super_admin', 'hod', 'faculty', 'student'] },
  // Phase 4 - Engagement
  { to: '/alumni', icon: Users, label: '👥 Alumni & Mentors', roles: ['super_admin', 'hod', 'faculty', 'student'] },
  // Phase 5 - Enterprise
  { to: '/enterprise', icon: Building2, label: '⚙️ Enterprise', roles: ['super_admin'] },
  { to: '/logs', icon: History, label: 'Activity Logs', roles: ['super_admin'] },
]

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const role = user?.role
  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(role))

  const roleColors = {
    super_admin: 'bg-purple-500',
    hod: 'bg-blue-500',
    faculty: 'bg-emerald-500',
    student: 'bg-amber-500',
  }

  const roleLabels = {
    super_admin: 'Super Admin',
    hod: 'HOD',
    faculty: 'Faculty',
    student: 'Student',
  }

  return (
    <aside className={`fixed top-0 left-0 h-full z-30 flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}
      style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-glow">
          <Zap size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <div className="text-white font-bold text-lg leading-none">CampusIQ</div>
            <div className="text-blue-400 text-xs mt-0.5">Smart Campus Platform</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-slate-500 hover:text-white transition-colors"
        >
          <ChevronRight size={16} className={`transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {/* User Info */}
      {!collapsed && (
        <div className="px-4 py-4 border-b border-white/10 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-semibold truncate">{user?.name}</div>
              <span className={`badge text-white text-xs px-2 py-0.5 ${roleColors[role] || 'bg-slate-600'}`}>
                {roleLabels[role] || role}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className={`sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
