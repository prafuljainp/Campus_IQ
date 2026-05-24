import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Bell, Search, Moon, Sun } from 'lucide-react'
import Sidebar from './Sidebar'
import useAuthStore from '../context/authStore'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/students': 'Students',
  '/faculty': 'Faculty',
  '/departments': 'Departments',
  '/placements': 'Placements',
  '/attendance': 'Attendance',
  '/marks': 'Marks & Grades',
  '/ranking': 'Student Rankings',
  '/notices': 'Notices',
  '/analytics': 'Analytics',
  '/student-success': 'Success Center',
  '/logs': 'Activity Logs',
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [dark, setDark] = useState(false)
  const { user } = useAuthStore()
  const location = useLocation()

  const toggleDark = () => {
    setDark(!dark)
    document.documentElement.classList.toggle('dark')
  }

  const title = PAGE_TITLES[location.pathname] ||
    (location.pathname.startsWith('/students/') ? 'Student Profile' : 'CampusIQ')

  return (
    <div className={`min-h-screen flex bg-slate-50 dark:bg-slate-950`}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Header */}
        <header className="sticky top-0 z-20 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 flex items-center px-6 gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none">{title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggleDark} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
