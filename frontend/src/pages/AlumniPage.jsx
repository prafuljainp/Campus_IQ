import { useEffect, useState } from 'react'
import api from '../api/client'
import { Users, MessageCircle, Star, Briefcase, MapPin, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AlumniPage() {
  const [mentors, setMentors] = useState([])
  const [networkStats, setNetworkStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchMentors()
    fetchNetworkStats()
  }, [])

  const fetchMentors = async () => {
    try {
      setLoading(true)
      const response = await api.get('/phase4/mentorship/mentors')
      if (response.data.status === 'success') {
        setMentors(response.data.mentors || [])
      }
    } catch (error) {
      console.error('Failed to fetch mentors:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNetworkStats = async () => {
    try {
      const response = await api.get('/phase4/mentorship/network')
      if (response.data.status === 'success') {
        setNetworkStats(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch network stats:', error)
    }
  }

  const requestMentorship = async (mentorId) => {
    try {
      await api.post('/phase4/mentorship/request', { mentor_id: mentorId })
      toast.success('Mentorship request sent successfully!')
    } catch (error) {
      toast.error('Failed to request mentorship')
    }
  }

  const filteredMentors = mentors.filter(mentor => {
    if (filter === 'all') return true
    return mentor.specialization?.toLowerCase().includes(filter.toLowerCase())
  })

  const specializations = [...new Set(mentors.map(m => m.specialization))]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="text-blue-600" />
          Alumni & Mentorship Network
        </h1>
        <p className="text-gray-600 mt-1">Connect with successful alumni and experienced mentors</p>
      </div>

      {/* Network Statistics */}
      {networkStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Alumni</p>
            <p className="text-3xl font-bold text-gray-900">{networkStats.total_alumni || '5000+'}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Active Mentors</p>
            <p className="text-3xl font-bold text-blue-600">{networkStats.active_mentors || '250'}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Companies</p>
            <p className="text-3xl font-bold text-green-600">{networkStats.companies || '500+'}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Successful Connections</p>
            <p className="text-3xl font-bold text-purple-600">{networkStats.successful_connections || '1000+'}</p>
          </div>
        </div>
      )}

      {/* Specialization Filter */}
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-sm font-medium text-gray-700 mb-3">Filter by Specialization</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Mentors
          </button>
          {specializations.slice(0, 5).map((spec) => (
            <button
              key={spec}
              onClick={() => setFilter(spec)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === spec
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Mentors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-500">Loading mentors...</div>
        ) : filteredMentors.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">No mentors found</div>
        ) : (
          filteredMentors.map((mentor) => (
            <div key={mentor.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
              {/* Mentor Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{mentor.name}</h3>
                    <p className="text-sm opacity-90 mt-1">{mentor.batch || 'Batch 2022'}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded">
                    <Star size={16} className="fill-yellow-300 text-yellow-300" />
                    <span className="text-sm font-medium">{mentor.rating || '4.8'}</span>
                  </div>
                </div>
              </div>

              {/* Mentor Info */}
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-600">Current Role</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2 mt-1">
                    <Briefcase size={16} className="text-blue-600" />
                    {mentor.current_role || 'Senior Engineer at Google'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-600">Specialization</p>
                  <p className="font-semibold text-gray-900">{mentor.specialization || 'Cloud & DevOps'}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600">Availability</p>
                  <p className="font-semibold text-gray-900">{mentor.availability || 'Weekends'}</p>
                </div>

                {mentor.mentoring_areas && (
                  <div>
                    <p className="text-xs text-gray-600 mb-2">Mentoring Areas</p>
                    <div className="flex flex-wrap gap-1">
                      {mentor.mentoring_areas.map((area, idx) => (
                        <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
                  <span>{mentor.students_mentored || 25} mentored</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => requestMentorship(mentor.id)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} />
                Request Mentorship
              </button>
            </div>
          ))
        )}
      </div>

      {/* Top Companies */}
      {networkStats?.top_companies && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Companies in Network</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {networkStats.top_companies.slice(0, 8).map((company, idx) => (
              <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                <Briefcase size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-700">{company}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> Get mentorship from successful alumni in your field of interest. Send a mentorship request and schedule sessions!
        </p>
      </div>
    </div>
  )
}
