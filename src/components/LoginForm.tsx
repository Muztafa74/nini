'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const success = await login(username, password)

    if (success) {
      toast.success(`Welcome back, ${username}! 💖`)
    } else {
      toast.error('Invalid credentials. Please try again.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-400 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-white fill-current" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              Nini Family
            </CardTitle>
            <CardDescription className="text-rose-600/70 mt-2">
              Our precious memories, stored with love 💖
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-rose-700 font-medium">
                Who are you?
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Dad or Mom"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-rose-700 font-medium">
                Family Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 text-white font-medium py-2.5"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Enter Our Family Space 💖'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
