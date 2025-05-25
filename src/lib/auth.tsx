'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'

interface User {
  id: string
  username: 'Dad' | 'Mom'
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const VALID_USERS = {
  Dad: 'iloveomnini',
  Mom: 'ilovemomo'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('nini-family-user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    if (username in VALID_USERS && VALID_USERS[username as keyof typeof VALID_USERS] === password) {
      const newUser = { id: username.toLowerCase(), username: username as 'Dad' | 'Mom' }
      setUser(newUser)
      localStorage.setItem('nini-family-user', JSON.stringify(newUser))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('nini-family-user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
