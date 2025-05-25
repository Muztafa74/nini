'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase, type Folder } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, Plus, Calendar, User, History, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import CreateFolderDialog from './CreateFolderDialog'
import FolderDetail from './FolderDetail'
import ActivityHistory from './ActivityHistory'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null)

  useEffect(() => {
    fetchFolders()
  }, [])

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setFolders(data || [])
    } catch (error) {
      console.error('Error fetching folders:', error)
      toast.error('Unable to load folders. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleFolderClick = (folder: Folder) => {
    setSelectedFolder(folder)
  }

  const handleBackToDashboard = () => {
    setSelectedFolder(null)
    fetchFolders()
  }

  // If a folder is selected, show the folder detail view
  if (selectedFolder) {
    return (
      <FolderDetail
        folder={selectedFolder}
        onBack={handleBackToDashboard}
        onFolderDeleted={handleBackToDashboard}
      />
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 text-rose-400 animate-pulse mx-auto mb-4" />
          <p className="text-rose-600">Loading our precious memories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-rose-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-400 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white fill-current" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                  Nini Family
                </h1>
                <p className="text-sm text-rose-600/70">Our Memory Collection</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-rose-100 text-rose-700 border-rose-200">
                <User className="w-3 h-3 mr-1" />
                {user?.username}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-rose-800">Our Memory Folders</h2>
            <p className="text-rose-600/70 mt-1">Every moment captured with love 💖</p>
          </div>
          <div className="flex space-x-3">
            <ActivityHistory />
            <CreateFolderDialog onFolderCreated={fetchFolders} />
          </div>
        </div>

        {/* Folders Grid */}
        {folders.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-rose-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-rose-700 mb-2">No memories yet</h3>
            <p className="text-rose-500 mb-6">Create your first folder to start collecting precious moments!</p>
            <CreateFolderDialog onFolderCreated={fetchFolders} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {folders.map((folder) => (
              <Card
                key={folder.id}
                className="hover:shadow-lg transition-shadow cursor-pointer border-rose-100 bg-white/80 backdrop-blur-sm"
                onClick={() => handleFolderClick(folder)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-rose-800 text-lg">{folder.name}</CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-rose-600/70">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(folder.date)}
                    </div>
                    <div className="flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      {folder.created_by}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gradient-to-br from-rose-100 to-pink-100 rounded-lg flex items-center justify-center">
                    <Heart className="w-8 h-8 text-rose-300" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
