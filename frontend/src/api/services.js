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

export const studentSuccessAPI = {
  commandCenter: (params) => api.get('/student-success/command-center', { params }),
  profile: (studentId) => api.get(`/student-success/students/${studentId}`),
  simulate: (studentId, scenario) => api.post(`/student-success/students/${studentId}/what-if`, scenario),
}

export const aptitudeAPI = {
  dashboard: () => api.get('/aptitude/dashboard'),
  staffDashboard: () => api.get('/aptitude/admin/dashboard'),
  tests: (params) => api.get('/aptitude/tests', { params }),
  startTest: (testId) => api.post(`/aptitude/tests/${testId}/start`),
  submitAttempt: (attemptId, payload) => api.post(`/aptitude/attempts/${attemptId}/submit`, payload),
  getAttempt: (attemptId) => api.get(`/aptitude/attempts/${attemptId}`),
  weakTopics: () => api.get('/aptitude/practice/weak-topics'),
  startPractice: (payload) => api.post('/aptitude/practice/start', payload),
  submitPractice: (attemptId, payload) => api.post(`/aptitude/practice/${attemptId}/submit`, payload),
  getPractice: (attemptId) => api.get(`/aptitude/practice/${attemptId}`),
  questions: (params) => api.get('/aptitude/questions', { params }),
  createQuestion: (payload) => api.post('/aptitude/questions', payload),
  updateQuestion: (questionId, payload) => api.put(`/aptitude/questions/${questionId}`, payload),
  deleteQuestion: (questionId) => api.delete(`/aptitude/questions/${questionId}`),
  createTest: (payload) => api.post('/aptitude/tests', payload),
  updateTest: (testId, payload) => api.put(`/aptitude/tests/${testId}`, payload),
  deleteTest: (testId) => api.delete(`/aptitude/tests/${testId}`),
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

// ── AI Analysis ───────────────────────────────────────────────────────────────
export const aiAnalysisAPI = {
  getCompleteAnalysis: (studentId) => api.get('/ai/analysis', { params: { student_id: studentId } }),
  getSummary: (studentId) => api.get('/ai/summary', { params: { student_id: studentId } }),
  getBacklogAnalysis: (studentId) => api.get('/ai/backlog-analysis', { params: { student_id: studentId } }),
  getAttendanceAnalysis: (studentId) => api.get('/ai/attendance-analysis', { params: { student_id: studentId } }),
  getWeaknessAnalysis: (studentId) => api.get('/ai/weakness-analysis', { params: { student_id: studentId } }),
  getPlacementAnalysis: (studentId) => api.get('/ai/placement-analysis', { params: { student_id: studentId } }),
  getCareerRecommendation: (studentId) => api.get('/ai/career-recommendation', { params: { student_id: studentId } }),
  analyzeResume: (studentId, file) => {
    const formData = new FormData()
    if (file) formData.append('file', file)
    formData.append('student_id', studentId)
    return api.post('/ai/resume-analysis', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

// ── Advanced Analytics (Phase 2) ───────────────────────────────────────────────
export const advancedAnalyticsAPI = {
  getGraduationPrediction: (studentId) => api.get('/analytics/graduation-prediction', { params: { student_id: studentId } }),
  getCareerRecommendations: (studentId) => api.get('/analytics/career-recommendations', { params: { student_id: studentId } }),
  getPlacementPrediction: (studentId) => api.get('/analytics/placement-prediction', { params: { student_id: studentId } }),
  getStudentAnalyticsDashboard: (studentId) => api.get('/analytics/student-analytics-dashboard', { params: { student_id: studentId } }),
  getDataWarehouseSchema: () => api.get('/analytics/data-warehouse-schema'),
}

// ── AI Intelligence (New) ──────────────────────────────────────────────────────
export const aiInsightsAPI = {
  // Health Score
  getHealthScore: (studentId) => api.get('/ai/health-score', { params: { student_id: studentId } }),
  
  // Placement Probability
  getPlacementProbability: (studentId) => api.get('/ai/placement-probability', { params: { student_id: studentId } }),
  
  // What-If Simulation
  simulateImprovement: (studentId, scenario) => api.post('/ai/what-if-simulation', scenario, { params: { student_id: studentId } }),
  
  // Action Plan & Recommendations
  getActionPlan: (studentId) => api.get('/ai/action-plan', { params: { student_id: studentId } }),
  getAlerts: (studentId) => api.get('/ai/alerts', { params: { student_id: studentId } }),
  
  // Company Matching
  getCompanyMatches: (studentId) => api.get('/ai/company-matching', { params: { student_id: studentId } }),
  analyzeSkillGaps: (studentId) => api.get('/ai/skill-gap-analysis', { params: { student_id: studentId } }),
  
  // Summary
  getCompleteSummary: (studentId) => api.get('/ai/complete-summary', { params: { student_id: studentId } }),
  
  // Admin Analytics
  getAdminAnalytics: (departmentId) => api.get('/ai/admin/dashboard-analytics', { params: { department_id: departmentId } }),
  getDepartmentComparison: () => api.get('/ai/admin/department-comparison'),
  getPlacementTrends: () => api.get('/ai/admin/placement-trends'),
  getAdminRecommendations: (departmentId) => api.get('/ai/admin/recommendations', { params: { department_id: departmentId } }),
}
