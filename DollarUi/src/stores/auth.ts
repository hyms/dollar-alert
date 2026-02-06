import { defineStore } from 'pinia'

export interface User {
  id: string
  email: string
  telegram_id?: string
  role: 'user' | 'admin'
  is_active: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    isAdmin: (state) => state.user?.role === 'admin'
  },

  actions: {
    async login(email: string, password: string) {
      this.loading = true
      this.error = null

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username: email, password })
        })

        if (!response.ok) {
          throw new Error('Credenciales inválidas')
        }

        const data = await response.json()

        this.user = {
          id: '1',
          email: email,
          role: 'admin',
          is_active: true
        }
        this.token = data.token
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Error de autenticación'
        console.error('Login error:', err)
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.user = null
      this.token = null
    },

    initAuth() {
      const storedToken = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('user')

      if (storedToken && storedUser) {
        this.token = storedToken
        this.user = JSON.parse(storedUser)
      }
    }
  },

  persist: {
    key: 'dollaralert-auth',
    paths: ['user', 'token']
  }
})
