import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BarChart3, BookOpen, CheckCircle2, Circle,
  Clock, ClipboardList, Edit3, Eye, EyeOff, FileQuestion, Gauge, PlayCircle,
  Plus, RefreshCw, Save, Send, Target, Trash2, Trophy, Users, XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { aptitudeAPI } from '../api/services'
import { EmptyState, PageLoader } from '../components/UI'
import useAuthStore from '../context/authStore'

const allCategory = 'All'
const defaultQuestionForm = {
  category: 'Quantitative Aptitude',
  topic: '',
  difficulty: 'medium',
  question_text: '',
  options: ['', '', '', ''],
  correct_option: 0,
  explanation: '',
}
const defaultTestForm = {
  title: '',
  description: '',
  category: 'Mixed Aptitude',
  difficulty: 'medium',
  duration_minutes: 20,
  question_ids: [],
}

function formatTime(seconds) {
  const safe = Math.max(0, seconds || 0)
  const mins = Math.floor(safe / 60)
  const secs = safe % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function formatDuration(seconds) {
  if (!seconds) return '0 min'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  return secs ? `${mins}m ${secs}s` : `${mins}m`
}

function difficultyClass(difficulty) {
  const map = {
    easy: 'badge-green',
    medium: 'badge-blue',
    hard: 'badge-red',
  }
  return map[difficulty] || 'badge-amber'
}

function scoreClass(score) {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-300'
  if (score >= 60) return 'text-blue-600 dark:text-blue-300'
  return 'text-amber-600 dark:text-amber-300'
}

function SectionTitle({ icon: Icon, title, action }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
        <Icon size={16} className="text-blue-500" />
        {title}
      </h3>
      {action}
    </div>
  )
}

function TopicBar({ topic, accuracy, total }) {
  const color = accuracy >= 75 ? 'bg-emerald-500' : accuracy >= 50 ? 'bg-blue-500' : 'bg-amber-500'
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium text-slate-600 dark:text-slate-300 truncate">{topic}</span>
        <span className="font-semibold text-slate-500">{accuracy}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(accuracy, 100)}%` }} />
      </div>
      <p className="text-[11px] text-slate-400 mt-1">{total} questions practiced</p>
    </div>
  )
}

function AptitudeStat({ icon: Icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  }

  return (
    <div className="card p-5 min-h-[148px] flex items-center gap-4 overflow-hidden">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-snug">{label}</p>
        <p
          className="mt-1 text-[clamp(1.25rem,1.7vw,1.875rem)] font-bold leading-tight text-slate-900 dark:text-white break-words hyphens-auto"
          title={String(value)}
        >
          {value}
        </p>
        {sub && <p className="text-xs text-slate-400 mt-1 leading-snug">{sub}</p>}
      </div>
    </div>
  )
}

function StaffAptitudePage() {
  const [data, setData] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [questionForm, setQuestionForm] = useState(defaultQuestionForm)
  const [testForm, setTestForm] = useState(defaultTestForm)
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [editingTestId, setEditingTestId] = useState(null)
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [savingTest, setSavingTest] = useState(false)

  const loadStaffData = async () => {
    setLoading(true)
    try {
      const [dashboardRes, questionsRes] = await Promise.all([
        aptitudeAPI.staffDashboard(),
        aptitudeAPI.questions(),
      ])
      setData(dashboardRes.data)
      setQuestions(questionsRes.data || [])
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to load aptitude management data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStaffData()
  }, [])

  const updateQuestionOption = (index, value) => {
    const nextOptions = [...questionForm.options]
    nextOptions[index] = value
    setQuestionForm({ ...questionForm, options: nextOptions })
  }

  const toggleQuestionForTest = (questionId) => {
    const exists = testForm.question_ids.includes(questionId)
    setTestForm({
      ...testForm,
      question_ids: exists
        ? testForm.question_ids.filter(id => id !== questionId)
        : [...testForm.question_ids, questionId],
    })
  }

  const resetQuestionForm = () => {
    setQuestionForm(defaultQuestionForm)
    setEditingQuestionId(null)
  }

  const resetTestForm = () => {
    setTestForm(defaultTestForm)
    setEditingTestId(null)
  }

  const startQuestionEdit = (question) => {
    setEditingQuestionId(question.id)
    setQuestionForm({
      category: question.category || 'Quantitative Aptitude',
      topic: question.topic || '',
      difficulty: question.difficulty || 'medium',
      question_text: question.question_text || '',
      options: [...(question.options || []), '', '', '', ''].slice(0, 4),
      correct_option: question.correct_option || 0,
      explanation: question.explanation || '',
    })
  }

  const startTestEdit = (test) => {
    setEditingTestId(test.id)
    setTestForm({
      title: test.title || '',
      description: test.description || '',
      category: test.category || 'Mixed Aptitude',
      difficulty: test.difficulty || 'medium',
      duration_minutes: test.duration_minutes || 20,
      is_published: test.is_published,
      question_ids: test.question_ids || [],
    })
  }

  const saveQuestion = async (event) => {
    event.preventDefault()
    const options = questionForm.options.map(option => option.trim()).filter(Boolean)
    if (!questionForm.topic.trim() || !questionForm.question_text.trim() || options.length < 2) {
      toast.error('Add a topic, question and at least two options')
      return
    }
    if (questionForm.correct_option >= options.length) {
      toast.error('Correct option must match one of the filled options')
      return
    }

    setSavingQuestion(true)
    try {
      const payload = {
        ...questionForm,
        topic: questionForm.topic.trim(),
        question_text: questionForm.question_text.trim(),
        options,
        correct_option: Number(questionForm.correct_option),
        explanation: questionForm.explanation.trim() || null,
      }
      if (editingQuestionId) {
        await aptitudeAPI.updateQuestion(editingQuestionId, payload)
        toast.success('Question updated')
      } else {
        await aptitudeAPI.createQuestion(payload)
        toast.success('Question added')
      }
      resetQuestionForm()
      await loadStaffData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to add question')
    } finally {
      setSavingQuestion(false)
    }
  }

  const archiveQuestion = async (question) => {
    if (!window.confirm('Archive this question? It will be hidden from future tests.')) return
    try {
      await aptitudeAPI.deleteQuestion(question.id)
      toast.success('Question archived')
      if (editingQuestionId === question.id) resetQuestionForm()
      await loadStaffData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to archive question')
    }
  }

  const saveTest = async (event) => {
    event.preventDefault()
    if (!testForm.title.trim()) {
      toast.error('Add a test title')
      return
    }
    if (testForm.question_ids.length === 0) {
      toast.error('Select at least one question for the test')
      return
    }

    setSavingTest(true)
    try {
      const payload = {
        ...testForm,
        title: testForm.title.trim(),
        description: testForm.description.trim() || null,
        duration_minutes: Number(testForm.duration_minutes) || 20,
      }
      if (editingTestId) {
        await aptitudeAPI.updateTest(editingTestId, payload)
        toast.success('Test updated')
      } else {
        await aptitudeAPI.createTest(payload)
        toast.success('Test created')
      }
      resetTestForm()
      await loadStaffData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to create test')
    } finally {
      setSavingTest(false)
    }
  }

  const toggleTestPublished = async (test) => {
    try {
      await aptitudeAPI.updateTest(test.id, { is_published: !test.is_published })
      toast.success(test.is_published ? 'Test unpublished' : 'Test published')
      await loadStaffData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to update test')
    }
  }

  const archiveTest = async (test) => {
    if (!window.confirm('Unpublish this test? Student history will remain available.')) return
    try {
      await aptitudeAPI.deleteTest(test.id)
      toast.success('Test unpublished')
      if (editingTestId === test.id) resetTestForm()
      await loadStaffData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to unpublish test')
    }
  }

  if (loading && !data) return <PageLoader />

  const summary = data?.summary || {}
  const recentAttempts = data?.recent_attempts || []
  const topicPerformance = data?.topic_performance || []
  const tests = data?.tests || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <ClipboardList className="text-blue-600 mt-1 flex-shrink-0" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">Aptitude Management</h1>
            <p className="text-slate-500 mt-1">Build interview practice tests and track student readiness</p>
          </div>
        </div>
        <button className="btn-secondary" onClick={loadStaffData} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <AptitudeStat icon={ClipboardList} label="Tests" value={summary.tests || 0} sub="Created" color="blue" />
        <AptitudeStat icon={FileQuestion} label="Questions" value={summary.questions || 0} sub="Active bank" color="purple" />
        <AptitudeStat icon={Trophy} label="Attempts" value={summary.submitted_attempts || 0} sub="Submitted" color="green" />
        <AptitudeStat icon={Gauge} label="Avg Score" value={`${Math.round(summary.average_score || 0)}%`} sub="Across attempts" color="amber" />
        <AptitudeStat icon={Users} label="Active Students" value={summary.active_students || 0} sub={`${summary.students_in_scope || 0} in scope`} color="red" />
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-[1.15fr_0.85fr] gap-5">
        <div className="space-y-5">
          <form onSubmit={saveQuestion} className="card p-5">
            <SectionTitle
              icon={editingQuestionId ? Edit3 : Plus}
              title={editingQuestionId ? 'Edit Question' : 'Add Question'}
              action={editingQuestionId && (
                <button type="button" className="btn-secondary py-2" onClick={resetQuestionForm}>
                  <XCircle size={15} />
                  Cancel
                </button>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <label>
                <span className="label">Category</span>
                <select
                  className="input"
                  value={questionForm.category}
                  onChange={e => setQuestionForm({ ...questionForm, category: e.target.value })}
                >
                  <option>Quantitative Aptitude</option>
                  <option>Logical Reasoning</option>
                  <option>Verbal Ability</option>
                  <option>Technical Aptitude</option>
                </select>
              </label>
              <label className="md:col-span-2">
                <span className="label">Topic</span>
                <input
                  className="input"
                  value={questionForm.topic}
                  onChange={e => setQuestionForm({ ...questionForm, topic: e.target.value })}
                  placeholder="Time and Work"
                />
              </label>
              <label>
                <span className="label">Difficulty</span>
                <select
                  className="input"
                  value={questionForm.difficulty}
                  onChange={e => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
            </div>

            <label className="block mt-3">
              <span className="label">Question</span>
              <textarea
                className="input min-h-24 resize-y"
                value={questionForm.question_text}
                onChange={e => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                placeholder="Enter the aptitude question..."
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {questionForm.options.map((option, index) => (
                <label key={index}>
                  <span className="label">Option {index + 1}</span>
                  <input
                    className="input"
                    value={option}
                    onChange={e => updateQuestionOption(index, e.target.value)}
                    placeholder={`Answer option ${index + 1}`}
                  />
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-3 mt-3">
              <label>
                <span className="label">Correct Option</span>
                <select
                  className="input"
                  value={questionForm.correct_option}
                  onChange={e => setQuestionForm({ ...questionForm, correct_option: Number(e.target.value) })}
                >
                  {questionForm.options.map((_, index) => (
                    <option key={index} value={index}>Option {index + 1}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label">Explanation</span>
                <input
                  className="input"
                  value={questionForm.explanation}
                  onChange={e => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  placeholder="Short solution shown after submission"
                />
              </label>
            </div>

            <div className="flex justify-end mt-4">
              <button className="btn-primary" disabled={savingQuestion}>
                <Save size={15} />
                {savingQuestion ? 'Saving...' : editingQuestionId ? 'Update Question' : 'Save Question'}
              </button>
            </div>
          </form>

          <form onSubmit={saveTest} className="card p-5">
            <SectionTitle
              icon={editingTestId ? Edit3 : ClipboardList}
              title={editingTestId ? 'Edit Test' : 'Create Test'}
              action={editingTestId && (
                <button type="button" className="btn-secondary py-2" onClick={resetTestForm}>
                  <XCircle size={15} />
                  Cancel
                </button>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <label className="md:col-span-2">
                <span className="label">Title</span>
                <input
                  className="input"
                  value={testForm.title}
                  onChange={e => setTestForm({ ...testForm, title: e.target.value })}
                  placeholder="Company Mock Test 1"
                />
              </label>
              <label>
                <span className="label">Category</span>
                <input
                  className="input"
                  value={testForm.category}
                  onChange={e => setTestForm({ ...testForm, category: e.target.value })}
                  placeholder="Mixed Aptitude"
                />
              </label>
              <label>
                <span className="label">Duration</span>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={testForm.duration_minutes}
                  onChange={e => setTestForm({ ...testForm, duration_minutes: e.target.value })}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3 mt-3">
              <label>
                <span className="label">Description</span>
                <input
                  className="input"
                  value={testForm.description}
                  onChange={e => setTestForm({ ...testForm, description: e.target.value })}
                  placeholder="What this test prepares students for"
                />
              </label>
              <label>
                <span className="label">Difficulty</span>
                <select
                  className="input"
                  value={testForm.difficulty}
                  onChange={e => setTestForm({ ...testForm, difficulty: e.target.value })}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="label mb-0">Questions</span>
                <span className="text-xs font-semibold text-slate-400">{testForm.question_ids.length} selected</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {questions.map(question => (
                  <label
                    key={question.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex items-start gap-3 cursor-pointer hover:border-blue-300"
                  >
                    <input
                      type="checkbox"
                      checked={testForm.question_ids.includes(question.id)}
                      onChange={() => toggleQuestionForTest(question.id)}
                      className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2">{question.question_text}</span>
                      <span className="block text-xs text-slate-400 mt-1">{question.category} - {question.topic}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button className="btn-primary" disabled={savingTest}>
                <Save size={15} />
                {savingTest ? 'Saving...' : editingTestId ? 'Update Test' : 'Create Test'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <SectionTitle icon={BarChart3} title="Topic Watchlist" />
            <div className="space-y-4">
              {topicPerformance.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">No submitted attempts yet</p>
              ) : topicPerformance.slice(0, 6).map(item => (
                <TopicBar key={item.topic} topic={item.topic} accuracy={item.accuracy} total={item.total} />
              ))}
            </div>
          </div>

          <div className="card p-5">
            <SectionTitle icon={Clock} title="Recent Attempts" />
            <div className="space-y-3">
              {recentAttempts.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">Student submissions will appear here</p>
              ) : recentAttempts.map(attempt => (
                <div key={attempt.id} className="rounded-xl border border-slate-100 dark:border-slate-700 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{attempt.student_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{attempt.test_title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{attempt.student_usn} - {attempt.department || 'Department'}</p>
                    </div>
                    <span className={`text-lg font-bold ${scoreClass(attempt.score)}`}>{Math.round(attempt.score)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <SectionTitle icon={FileQuestion} title="Question Bank" />
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {questions.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">No active questions yet</p>
              ) : questions.map(question => (
                <div key={question.id} className="rounded-xl border border-slate-100 dark:border-slate-700 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">{question.question_text}</p>
                      <p className="text-xs text-slate-400 mt-1">{question.category} - {question.topic}</p>
                    </div>
                    <span className={difficultyClass(question.difficulty)}>{question.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button type="button" className="btn-secondary py-2 px-3" onClick={() => startQuestionEdit(question)}>
                      <Edit3 size={14} />
                      Edit
                    </button>
                    <button type="button" className="btn-danger py-2 px-3" onClick={() => archiveQuestion(question)}>
                      <Trash2 size={14} />
                      Archive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <SectionTitle icon={ClipboardList} title="Tests" />
            <div className="space-y-3">
              {tests.map(test => (
                <div key={test.id} className="rounded-xl bg-slate-50 dark:bg-slate-700/40 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{test.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{test.question_count} questions - {test.duration_minutes} min</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={difficultyClass(test.difficulty)}>{test.difficulty}</span>
                      <span className={test.is_published ? 'badge-green' : 'badge-amber'}>
                        {test.is_published ? 'Published' : 'Hidden'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <button type="button" className="btn-secondary py-2 px-3" onClick={() => startTestEdit(test)}>
                      <Edit3 size={14} />
                      Edit
                    </button>
                    <button type="button" className="btn-secondary py-2 px-3" onClick={() => toggleTestPublished(test)}>
                      {test.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                      {test.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button type="button" className="btn-danger py-2 px-3" onClick={() => archiveTest(test)}>
                      <Trash2 size={14} />
                      Archive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StudentAptitudePage() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(allCategory)
  const [startingId, setStartingId] = useState(null)
  const [activeAttempt, setActiveAttempt] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const res = await aptitudeAPI.dashboard()
      setDashboard(res.data)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to load aptitude tests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  useEffect(() => {
    if (!activeAttempt || result) return
    if (timeLeft <= 0) {
      submitAttempt(true)
      return
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
    return () => clearTimeout(timer)
  }, [activeAttempt, result, timeLeft])

  const tests = dashboard?.tests || []
  const summary = dashboard?.summary || {}
  const recentAttempts = dashboard?.recent_attempts || []
  const topicPerformance = dashboard?.topic_performance || []

  const categories = useMemo(() => {
    const values = Array.from(new Set(tests.map(test => test.category))).filter(Boolean)
    return [allCategory, ...values]
  }, [tests])

  const filteredTests = useMemo(() => {
    if (selectedCategory === allCategory) return tests
    return tests.filter(test => test.category === selectedCategory)
  }, [tests, selectedCategory])

  const activeQuestions = activeAttempt?.questions || []
  const currentQuestion = activeQuestions[currentIndex]
  const answeredCount = activeQuestions.filter(question => answers[question.id] !== undefined).length

  const startTest = async (test) => {
    setStartingId(test.id)
    try {
      const res = await aptitudeAPI.startTest(test.id)
      setActiveAttempt(res.data)
      setAnswers({})
      setCurrentIndex(0)
      setResult(null)
      setTimeLeft((res.data.test.duration_minutes || 0) * 60)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to start test')
    } finally {
      setStartingId(null)
    }
  }

  const submitAttempt = async (autoSubmit = false) => {
    if (!activeAttempt || submitting) return
    setSubmitting(true)
    try {
      const payload = {
        duration_seconds: Math.max(0, (activeAttempt.test.duration_minutes * 60) - timeLeft),
        answers: activeQuestions.map(question => ({
          question_id: question.id,
          selected_option: answers[question.id] ?? null,
          time_spent_seconds: 0,
        })),
      }
      const res = await aptitudeAPI.submitAttempt(activeAttempt.attempt_id, payload)
      setResult(res.data)
      setActiveAttempt(null)
      await loadDashboard()
      toast.success(autoSubmit ? 'Time is up. Test submitted.' : 'Test submitted')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to submit test')
    } finally {
      setSubmitting(false)
    }
  }

  const resetToDashboard = () => {
    setResult(null)
    setActiveAttempt(null)
    setAnswers({})
    setCurrentIndex(0)
    setTimeLeft(0)
  }

  if (loading && !dashboard) return <PageLoader />

  if (activeAttempt && currentQuestion) {
    const progress = activeQuestions.length ? Math.round((answeredCount / activeQuestions.length) * 100) : 0
    const selected = answers[currentQuestion.id]

    return (
      <div className="space-y-5 animate-fade-in">
        <div className="card p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <button
                className="btn-secondary py-2 mb-3"
                onClick={resetToDashboard}
                disabled={submitting}
              >
                <ArrowLeft size={15} />
                Exit
              </button>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{activeAttempt.test.title}</h1>
              <p className="text-sm text-slate-500 mt-1">
                {answeredCount}/{activeQuestions.length} answered
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`rounded-xl px-4 py-3 ${timeLeft <= 120 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Time Left</p>
                <p className={`text-2xl font-bold ${timeLeft <= 120 ? 'text-red-600 dark:text-red-300' : 'text-blue-600 dark:text-blue-300'}`}>
                  {formatTime(timeLeft)}
                </p>
              </div>
              <button className="btn-primary" onClick={() => submitAttempt(false)} disabled={submitting}>
                <Send size={15} />
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
          <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5">
          <div className="card p-6">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <span className="badge-blue">Question {currentIndex + 1}</span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-3 leading-relaxed">
                  {currentQuestion.question_text}
                </h2>
              </div>
              <span className={difficultyClass(currentQuestion.difficulty)}>{currentQuestion.difficulty}</span>
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selected === index
                return (
                  <button
                    key={`${currentQuestion.id}-${index}`}
                    onClick={() => setAnswers({ ...answers, [currentQuestion.id]: index })}
                    className={`w-full min-h-14 text-left rounded-xl border px-4 py-3 flex items-center gap-3 transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                        : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {isSelected ? <CheckCircle2 size={18} className="text-blue-600 flex-shrink-0" /> : <Circle size={18} className="text-slate-400 flex-shrink-0" />}
                    <span className="text-sm font-medium">{option}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between gap-3 mt-6">
              <button
                className="btn-secondary"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
              >
                <ArrowLeft size={15} />
                Previous
              </button>
              <button
                className="btn-primary"
                onClick={() => setCurrentIndex(Math.min(activeQuestions.length - 1, currentIndex + 1))}
                disabled={currentIndex === activeQuestions.length - 1}
              >
                Next
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          <div className="card p-5">
            <SectionTitle icon={ClipboardList} title="Navigator" />
            <div className="grid grid-cols-5 gap-2">
              {activeQuestions.map((question, index) => {
                const isCurrent = index === currentIndex
                const isAnswered = answers[question.id] !== undefined
                return (
                  <button
                    key={question.id}
                    onClick={() => setCurrentIndex(index)}
                    className={`aspect-square rounded-xl text-sm font-semibold transition-colors ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : isAnswered
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                )
              })}
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Answered</span>
                <span className="font-semibold text-slate-900 dark:text-white">{answeredCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Remaining</span>
                <span className="font-semibold text-slate-900 dark:text-white">{activeQuestions.length - answeredCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Progress</span>
                <span className="font-semibold text-slate-900 dark:text-white">{progress}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (result) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <button className="btn-secondary py-2 mb-4" onClick={resetToDashboard}>
                <ArrowLeft size={15} />
                Back to Tests
              </button>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{result.test?.title}</h1>
              <p className="text-sm text-slate-500 mt-1">
                {result.correct_answers}/{result.total_questions} correct in {formatDuration(result.duration_seconds)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-500 uppercase">Score</p>
              <p className={`text-5xl font-bold ${scoreClass(result.score)}`}>{Math.round(result.score)}%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-5 lg:col-span-2">
            <SectionTitle icon={BarChart3} title="Topic Breakdown" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(result.topic_breakdown || {}).map(([topic, values]) => (
                <TopicBar
                  key={topic}
                  topic={topic}
                  accuracy={values.accuracy}
                  total={values.total}
                />
              ))}
            </div>
          </div>
          <div className="card p-5">
            <SectionTitle icon={Target} title="Focus Plan" />
            <div className="space-y-3">
              {(result.recommendations || []).map((item) => (
                <div key={item} className="rounded-xl bg-slate-50 dark:bg-slate-700/40 p-3 text-sm text-slate-600 dark:text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <SectionTitle icon={BookOpen} title="Answer Review" />
          <div className="space-y-4">
            {result.questions.map((question, index) => {
              const isCorrect = question.is_correct
              return (
                <div key={question.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex items-start gap-3">
                    {isCorrect ? <CheckCircle2 size={20} className="text-emerald-600 mt-1 flex-shrink-0" /> : <XCircle size={20} className="text-red-500 mt-1 flex-shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-400 mb-1">Question {index + 1}</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{question.question_text}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                        {question.options.map((option, optionIndex) => {
                          const isChosen = question.selected_option === optionIndex
                          const isAnswer = question.correct_option === optionIndex
                          return (
                            <div
                              key={`${question.id}-${optionIndex}`}
                              className={`rounded-lg border px-3 py-2 text-sm ${
                                isAnswer
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200'
                                  : isChosen
                                    ? 'border-red-300 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-200'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {option}
                            </div>
                          )
                        })}
                      </div>
                      {question.explanation && (
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{question.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (!tests.length) {
    return (
      <EmptyState
        title="No aptitude tests available"
        description="Published aptitude tests will appear here for students."
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <ClipboardList className="text-blue-600 mt-1 flex-shrink-0" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">Aptitude Prep</h1>
            <p className="text-slate-500 mt-1">Timed practice for campus interview rounds</p>
          </div>
        </div>
        <button className="btn-secondary" onClick={loadDashboard} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <AptitudeStat icon={ClipboardList} label="Tests" value={summary.tests_available || 0} sub="Available now" color="blue" />
        <AptitudeStat icon={Trophy} label="Best Score" value={`${Math.round(summary.best_score || 0)}%`} sub="Highest attempt" color="green" />
        <AptitudeStat icon={Gauge} label="Avg Accuracy" value={`${Math.round(summary.average_accuracy || 0)}%`} sub="Across attempts" color="amber" />
        <AptitudeStat icon={Target} label="Strongest" value={summary.strongest_topic || 'New'} sub="Top topic" color="purple" />
        <AptitudeStat icon={BookOpen} label="Focus" value={summary.focus_topic || 'Start'} sub="Next practice area" color="red" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
        <div className="space-y-4">
          <SectionTitle icon={ClipboardList} title="Available Tests" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTests.map(test => {
              const last = test.last_attempt
              return (
                <div key={test.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{test.title}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{test.description}</p>
                    </div>
                    <span className={difficultyClass(test.difficulty)}>{test.difficulty}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-5 text-sm">
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-700/40 p-3">
                      <Clock size={16} className="text-blue-500 mb-1" />
                      <p className="font-bold text-slate-900 dark:text-white">{test.duration_minutes} min</p>
                      <p className="text-xs text-slate-400">Duration</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-700/40 p-3">
                      <BookOpen size={16} className="text-emerald-500 mb-1" />
                      <p className="font-bold text-slate-900 dark:text-white">{test.question_count}</p>
                      <p className="text-xs text-slate-400">Questions</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-700/40 p-3">
                      <Trophy size={16} className="text-amber-500 mb-1" />
                      <p className="font-bold text-slate-900 dark:text-white">{last ? `${Math.round(last.score)}%` : '-'}</p>
                      <p className="text-xs text-slate-400">Last Score</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-5">
                    <span className="text-xs font-semibold text-slate-400">{test.category}</span>
                    <button className="btn-primary" onClick={() => startTest(test)} disabled={startingId === test.id}>
                      <PlayCircle size={15} />
                      {startingId === test.id ? 'Starting...' : last ? 'Retake' : 'Start'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <SectionTitle icon={BarChart3} title="Topic Performance" />
            <div className="space-y-4">
              {topicPerformance.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">No attempts yet</p>
              ) : topicPerformance.slice(0, 6).map(item => (
                <TopicBar key={item.topic} topic={item.topic} accuracy={item.accuracy} total={item.total} />
              ))}
            </div>
          </div>

          <div className="card p-5">
            <SectionTitle icon={Clock} title="Recent Attempts" />
            <div className="space-y-3">
              {recentAttempts.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">Your attempts will appear here</p>
              ) : recentAttempts.map(attempt => (
                <div key={attempt.id} className="rounded-xl border border-slate-100 dark:border-slate-700 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{attempt.test_title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{attempt.correct_answers}/{attempt.total_questions} correct</p>
                    </div>
                    <span className={`text-lg font-bold ${scoreClass(attempt.score)}`}>{Math.round(attempt.score)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AptitudePage() {
  const { user } = useAuthStore()
  if (user?.role && user.role !== 'student') return <StaffAptitudePage />
  return <StudentAptitudePage />
}
