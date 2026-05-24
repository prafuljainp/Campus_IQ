import { useEffect, useState } from 'react'
import api from '../api/client'
import { Bell, AlertCircle, CheckCircle, Info, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [dismissedNotifications, setDismissedNotifications] = useState(new Set())

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await api.get('/phase3/notifications/academic-alerts')
      if (response.data.status === 'success') {
        setAlerts(response.data.alerts || [])
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const dismissNotification = (id) => {
    setDismissedNotifications(new Set([...dismissedNotifications, id]))
  }

  const notificationIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="text-yellow-600" size={20} />
      case 'error':
        return <AlertCircle className="text-red-600" size={20} />
      case 'success':
        return <CheckCircle className="text-green-600" size={20} />
      default:
        return <Info className="text-blue-600" size={20} />
    }
  }

  const notificationColor = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'success':
        return 'bg-green-50 border-green-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const displayNotifications = alerts.filter(n => !dismissedNotifications.has(n.id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="text-blue-600" />
          Notifications
        </h1>
        <p className="text-gray-600 mt-1">Stay updated with academic alerts and important notifications</p>
      </div>

      {/* Notification Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Critical Alerts</p>
              <p className="text-2xl font-bold text-gray-900">
                {alerts.filter(a => a.type === 'error').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-yellow-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Warnings</p>
              <p className="text-2xl font-bold text-gray-900">
                {alerts.filter(a => a.type === 'warning').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <Info className="text-blue-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Information</p>
              <p className="text-2xl font-bold text-gray-900">
                {alerts.filter(a => a.type === 'info').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading notifications...</div>
        ) : displayNotifications.length === 0 ? (
          <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">
            <p className="text-sm text-green-900">
              ✅ <strong>Great job!</strong> You have no active alerts. Keep up the good work!
            </p>
          </div>
        ) : (
          displayNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`border rounded-lg p-4 flex gap-3 ${notificationColor(notification.type)}`}
            >
              <div className="flex-shrink-0">
                {notificationIcon(notification.type)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {notification.title || notification.alert_type}
                    </h3>
                    <p className="text-sm text-gray-700 mt-1">
                      {notification.message || notification.description}
                    </p>
                    
                    {notification.action_required && (
                      <button className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                        Take Action →
                      </button>
                    )}
                    
                    {notification.timestamp && (
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => dismissNotification(notification.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notification Settings */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive alerts via email</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="font-medium text-gray-900">SMS Notifications</p>
              <p className="text-sm text-gray-600">Receive alerts via SMS</p>
            </div>
            <input type="checkbox" className="w-4 h-4" />
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="font-medium text-gray-900">Push Notifications</p>
              <p className="text-sm text-gray-600">Receive push notifications</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>

          <div className="border-t pt-4">
            <p className="font-medium text-gray-900 mb-2">Quiet Hours</p>
            <p className="text-sm text-gray-600 mb-3">Don't send notifications between</p>
            <div className="flex gap-3">
              <input type="time" defaultValue="22:00" className="px-3 py-2 border border-gray-300 rounded" />
              <span className="text-gray-600 py-2">to</span>
              <input type="time" defaultValue="08:00" className="px-3 py-2 border border-gray-300 rounded" />
            </div>
          </div>
        </div>

        <button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          Save Preferences
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> Enable notifications to stay updated on important academic events, placement opportunities, and alerts!
        </p>
      </div>
    </div>
  )
}
