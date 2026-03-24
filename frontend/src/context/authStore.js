/**
 * Auth store — FIXED:
 * - Stores student_id / faculty_id for dashboard personalization
 * - Clears token on logout
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../api/client'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password })
        const { access_token, role, user_id, name } = res.data
        localStorage.setItem('token', access_token)

        // Fetch extended profile to get student/faculty IDs
        let extraData = {}
        try {
          const profile = await api.get('/auth/profile', {
            headers: { Authorization: `Bearer ${access_token}` }
          })
          extraData = profile.data
        } catch {}

        set({
          token: access_token,
          user: {
            id: user_id, email, role, name,
            student_id: extraData.student_id || null,
            faculty_id: extraData.faculty_id || null,
            department_id: extraData.department_id || null,
          },
          isAuthenticated: true,
        })
        return res.data
      },

      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (updates) => set((state) => ({
        user: { ...state.user, ...updates }
      })),
    }),
    {
      name: 'campusiq-auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    }
  )
)

export default useAuthStore
