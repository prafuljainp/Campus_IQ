import { useEffect, useState } from 'react'
import api from '../api/client'
import { Briefcase, TrendingUp, MapPin, DollarSign, Search } from 'lucide-react'
import toast from 'react-hot-toast'

export default function JobPortalPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/phase3/jobs/recommendations')
      if (response.data.status === 'success') {
        setJobs(response.data.jobs || [])
      }
    } catch (error) {
      toast.error('Failed to fetch jobs')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const applyJob = async (jobId) => {
    try {
      await api.post(`/phase3/jobs/${jobId}/apply`)
      toast.success('Application submitted successfully!')
    } catch (error) {
      toast.error('Failed to apply for job')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Briefcase className="text-blue-600" />
          Job Portal
        </h1>
        <p className="text-gray-600 mt-1">Find jobs matched to your skills and profile</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by job title or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Jobs List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No jobs found matching your criteria</div>
        ) : (
          filteredJobs.map((job) => (
            <div key={job.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-blue-600 font-medium mt-1">{job.company}</p>
                  
                  <div className="flex gap-4 mt-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin size={16} />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign size={16} />
                      {job.salary}
                    </span>
                  </div>

                  {job.description && (
                    <p className="text-gray-600 mt-2">{job.description}</p>
                  )}

                  <div className="mt-3 flex gap-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {job.job_type || 'Full-time'}
                    </span>
                    {job.experience_level && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        {job.experience_level}
                      </span>
                    )}
                  </div>
                </div>

                <div className="ml-4 text-right">
                  <div className="mb-3">
                    <div className="flex items-center gap-2 justify-end">
                      <TrendingUp size={16} className="text-green-600" />
                      <span className="text-2xl font-bold text-green-600">{job.match_percentage}%</span>
                    </div>
                    <p className="text-xs text-gray-500">Match Score</p>
                  </div>
                  <button
                    onClick={() => applyJob(job.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Apply Now
                  </button>
                </div>
              </div>

              {job.required_skills && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Required Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {job.required_skills.map((skill, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> Jobs are ranked by match percentage based on your skills, CGPA, and experience. Higher match = better fit!
        </p>
      </div>
    </div>
  )
}
