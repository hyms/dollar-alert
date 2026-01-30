import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface User {
  id: string
  email: string
  telegram_id?: string
  role: 'user' | 'admin'
  is_active: boolean
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    
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
      
      user.value = {
        id: '1',
        email: email,
        role: 'admin',
        is_active: true
      }
      token.value = data.token
      if (token.value) {
        localStorage.setItem('auth_token', token.value)
      }
      localStorage.setItem('user', JSON.stringify(user.value))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error de autenticación'
      console.error('Login error:', err)
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
  }

  function initAuth() {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = JSON.parse(storedUser)
    }
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    initAuth
  }
})