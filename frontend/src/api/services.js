/**
 * All API service functions — FIXED:
 * - All endpoints match backend routes exactly
 * - exportCSV uses window.open with token in query (no broken href)
 */
import api, { getBaseURL } from './client'

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  profile: () => api.get('/auth/profile'),
  changePassword: (data) => api.post('/auth/change-password', data),
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  summary: () => api.get('/analytics/summary'),
  cgpaDistribution: () => api.get('/analytics/cgpa-distribution'),
  departmentPerformance: () => api.get('/analytics/department-performance'),
  placementTrends: () => api.get('/analytics/placement-trends'),
  topCompanies: () => api.get('/analytics/top-companies'),
  skillGap: (studentId) => api.get(`/analytics/skill-gap/${studentId}`),
}

// ── Departments ───────────────────────────────────────────────────────────────
export const departmentsAPI = {
  list: () => api.get('/departments'),
  get: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
  stats: (id) => api.get(`/departments/${id}/stats`),
}

// ── Students ──────────────────────────────────────────────────────────────────
export const studentsAPI = {
  list: (params) => api.get('/students', { params }),
  get: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  ranking: (params) => api.get('/students/ranking', { params }),
  eligibility: (id, params) => api.get(`/students/eligibility/${id}`, { params }),
  // CSV export: uses token in Authorization header via form submit trick
  exportCSV: () => {
    const token = localStorage.getItem('token')
    const url = `${getBaseURL()}/students/export/csv`
    // Create hidden form to POST with auth — simpler: use fetch + blob
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'students.csv'
        a.click()
      })
  },
  addSkill: (studentId, data) => api.post(`/students/${studentId}/skills`, data),
  removeSkill: (studentId, skillId) => api.delete(`/students/${studentId}/skills/${skillId}`),
}

// ── Faculty ───────────────────────────────────────────────────────────────────
export const facultyAPI = {
  list: (params) => api.get('/faculty', { params }),
  get: (id) => api.get(`/faculty/${id}`),
  create: (data) => api.post('/faculty', data),
  update: (id, data) => api.put(`/faculty/${id}`, data),
  delete: (id) => api.delete(`/faculty/${id}`),
}

// ── Subjects ──────────────────────────────────────────────────────────────────
export const subjectsAPI = {
  list: (params) => api.get('/subjects', { params }),
  create: (data) => api.post('/subjects', data),
  delete: (id) => api.delete(`/subjects/${id}`),
}

// ── Marks ─────────────────────────────────────────────────────────────────────
export const marksAPI = {
  list: (params) => api.get('/marks', { params }),
  add: (data) => api.post('/marks', data),
  delete: (id) => api.delete(`/marks/${id}`),
}

// ── Attendance ────────────────────────────────────────────────────────────────
export const attendanceAPI = {
  list: (params) => api.get('/attendance', { params }),
  summary: (params) => api.get('/attendance/summary', { params }),
  percentage: (studentId, params) => api.get(`/attendance/percentage/${studentId}`, { params }),
  mark: (data) => api.post('/attendance', data),
  bulk: (data) => api.post('/attendance/bulk', data),
  delete: (id) => api.delete(`/attendance/${id}`),
}

// ── Placements ────────────────────────────────────────────────────────────────
export const placementsAPI = {
  list: (params) => api.get('/placements', { params }),
  add: (data) => api.post('/placements', data),
  update: (id, data) => api.put(`/placements/${id}`, data),
  delete: (id) => api.delete(`/placements/${id}`),
  exportCSV: () => {
    const token = localStorage.getItem('token')
    fetch(`${getBaseURL()}/placements/export/csv`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'placements.csv'
        a.click()
      })
  },
}

// ── Internships ───────────────────────────────────────────────────────────────
export const internshipsAPI = {
  list: () => api.get('/internships'),
  add: (data) => api.post('/internships', data),
  delete: (id) => api.delete(`/internships/${id}`),
}

// ── Notices ───────────────────────────────────────────────────────────────────
export const noticesAPI = {
  list: (params) => api.get('/notices', { params }),
  create: (data) => api.post('/notices', data),
  update: (id, data) => api.put(`/notices/${id}`, data),
  delete: (id) => api.delete(`/notices/${id}`),
}

// ── Skills ────────────────────────────────────────────────────────────────────
export const skillsAPI = {
  list: () => api.get('/skills'),
  create: (data) => api.post('/skills', data),
  demand: () => api.get('/skills/demand'),
}

// ── Activity Logs ─────────────────────────────────────────────────────────────
export const logsAPI = {
  list: (params) => api.get('/logs', { params }),
}
