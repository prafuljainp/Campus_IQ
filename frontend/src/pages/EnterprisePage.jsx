import { useEffect, useState } from 'react'
import api from '../api/client'
import { Shield, Lock, BarChart3, Users, Database, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EnterprisePage() {
  const [enterpriseData, setEnterpriseData] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    fetchEnterpriseData()
    fetchAuditLogs()
  }, [])

  const fetchEnterpriseData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/phase5/dashboard/enterprise')
      if (response.data.status === 'success') {
        setEnterpriseData(response.data.data || response.data)
      }
    } catch (error) {
      console.error('Failed to fetch enterprise data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAuditLogs = async () => {
    try {
      const response = await api.get('/phase5/audit/trail?limit=10&days=30')
      if (response.data.status === 'success') {
        setAuditLogs(response.data.logs || [])
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    }
  }

  const getActionBadgeColor = (action) => {
    if (action.includes('delete') || action.includes('remove')) return 'bg-red-100 text-red-700'
    if (action.includes('create') || action.includes('add')) return 'bg-green-100 text-green-700'
    if (action.includes('update') || action.includes('edit')) return 'bg-blue-100 text-blue-700'
    return 'bg-gray-100 text-gray-700'
  }

  const complianceStatus = {
    overall: 'Compliant',
    lastAudit: new Date().toLocaleDateString(),
    failedAttempts: 2,
    alertsActive: 3
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="text-blue-600" />
          Enterprise Dashboard
        </h1>
        <p className="text-gray-600 mt-1">Manage security, compliance, and institutional settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        {['dashboard', 'security', 'audit', 'compliance', 'users'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-8 text-gray-500">Loading enterprise data...</div>}

      {!loading && (
        <>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center gap-3">
                    <Users className="text-blue-600" size={24} />
                    <div>
                      <p className="text-sm text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {enterpriseData?.total_users || '2,500+'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center gap-3">
                    <Database className="text-green-600" size={24} />
                    <div>
                      <p className="text-sm text-gray-600">Data Encrypted</p>
                      <p className="text-2xl font-bold text-green-600">
                        {enterpriseData?.encryption_enabled ? '✓ Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="text-yellow-600" size={24} />
                    <div>
                      <p className="text-sm text-gray-600">Active Alerts</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {complianceStatus.alertsActive}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-600" size={24} />
                    <div>
                      <p className="text-sm text-gray-600">System Status</p>
                      <p className="text-2xl font-bold text-green-600">Operational</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Institutions */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Institutions</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Institution</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Students</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Faculty</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Institute of Technology', students: 5000, faculty: 200, status: 'Active' },
                        { name: 'Engineering College', students: 3000, faculty: 150, status: 'Active' },
                      ].map((inst, idx) => (
                        <tr key={idx} className="border-b border-gray-200">
                          <td className="py-3 px-4 text-gray-900">{inst.name}</td>
                          <td className="py-3 px-4 text-gray-600">{inst.students.toLocaleString()}</td>
                          <td className="py-3 px-4 text-gray-600">{inst.faculty}</td>
                          <td className="py-3 px-4">
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                              {inst.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Lock size={20} className="text-blue-600" />
                    Data Encryption
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Field-level Encryption</span>
                      <span className="text-green-600 font-semibold">✓ Enabled</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">SSL/TLS</span>
                      <span className="text-green-600 font-semibold">✓ Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Database Encryption</span>
                      <span className="text-green-600 font-semibold">✓ Enabled</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Key Rotation</span>
                      <span className="text-green-600 font-semibold">✓ 90 Days</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield size={20} className="text-blue-600" />
                    Access Control
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Multi-Factor Auth</span>
                      <span className="text-green-600 font-semibold">✓ Optional</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">IP Whitelisting</span>
                      <span className="text-yellow-600 font-semibold">⚠ Disabled</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Session Timeout</span>
                      <span className="text-green-600 font-semibold">✓ 30 mins</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Password Policy</span>
                      <span className="text-green-600 font-semibold">✓ Strong</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                <p className="text-sm text-blue-900">
                  💡 <strong>Recommendation:</strong> Enable multi-factor authentication for all admin accounts for enhanced security.
                </p>
              </div>
            </div>
          )}

          {/* Audit Tab */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Audit Logs</h2>
              <div className="space-y-3">
                {auditLogs.length === 0 ? (
                  <div className="bg-white p-4 rounded-lg text-center text-gray-500">No audit logs found</div>
                ) : (
                  auditLogs.map((log, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getActionBadgeColor(log.action)}`}>
                              {log.action.toUpperCase()}
                            </span>
                            <span className="text-sm font-medium text-gray-900">{log.user_email || 'User'}</span>
                          </div>
                          <p className="text-sm text-gray-600">{log.resource_type || 'Unknown'}: {log.resource_id || 'N/A'}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown time'}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          log.status === 'success'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {log.status?.charAt(0).toUpperCase() + log.status?.slice(1) || 'Success'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-600">Compliance Status</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">✓ Compliant</p>
                  <p className="text-xs text-gray-500 mt-2">Last audit: {complianceStatus.lastAudit}</p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-600">Failed Login Attempts (30d)</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{complianceStatus.failedAttempts}</p>
                  <p className="text-xs text-gray-500 mt-2">Below threshold</p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-600">Data Breaches</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">0</p>
                  <p className="text-xs text-gray-500 mt-2">Since inception</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Standards</h3>
                <div className="space-y-3">
                  {[
                    { standard: 'GDPR', status: 'Compliant' },
                    { standard: 'FERPA', status: 'Compliant' },
                    { standard: 'HIPAA', status: 'Not Applicable' },
                    { standard: 'SOC 2', status: 'In Progress' },
                  ].map((comp, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-gray-700">{comp.standard}</span>
                      <span className={`font-semibold ${
                        comp.status === 'Compliant' ? 'text-green-600' :
                        comp.status === 'In Progress' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {comp.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">User Roles & Permissions</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Users</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Permissions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { role: 'Super Admin', users: 2, permissions: 'Full access' },
                        { role: 'Admin', users: 5, permissions: 'System management' },
                        { role: 'Faculty', users: 200, permissions: 'Educational content' },
                        { role: 'Student', users: 8000, permissions: 'Personal data' },
                      ].map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-200">
                          <td className="py-3 px-4 font-medium text-gray-900">{row.role}</td>
                          <td className="py-3 px-4 text-gray-600">{row.users}</td>
                          <td className="py-3 px-4 text-gray-600">{row.permissions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent User Activity</h2>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>✓ 12 users logged in today</p>
                  <p>✓ 3 new user accounts created this week</p>
                  <p>✓ 0 users with expired passwords</p>
                  <p>✓ 5 users with inactive sessions (last 30 days)</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
        <p className="text-sm text-blue-900">
          💡 <strong>Note:</strong> For production deployment, ensure all security settings are properly configured and compliance requirements are met.
        </p>
      </div>
    </div>
  )
}
