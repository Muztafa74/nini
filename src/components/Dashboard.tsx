'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase, type Folder } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, Plus, Calendar, User, History, LogOut, ChevronRight } from 'lucide-react'
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
      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select(`
          *,
          photos (
            url
          )
        `)
        .order('date', { ascending: false })

      if (foldersError) throw foldersError

      // Process folders to use first photo as cover
      const processedFolders = foldersData.map(folder => ({
        ...folder,
        cover_photo_url: folder.photos?.[0]?.url || null
      }))

      setFolders(processedFolders)
    } catch (error) {
      console.error('Error fetching folders:', error)
      toast.error('Unable to load folders.')
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
      <header className="bg-white/80 backdrop-blur-sm border-b border-rose-100 fixed top-0 left-0 right-0 z-50 px-4 py-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-rose-400 to-pink-400 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-current" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                  Nini Family
                </h1>
                <p className="text-xs sm:text-sm text-rose-600/70">Our Memory Collection</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-rose-100 text-rose-700 border-rose-200 text-xs">
                <User className="w-3 h-3 mr-1" />
                {user?.username}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pt-20 pb-6 sm:pt-24 sm:pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-rose-800">Our Memory Folders</h2>
            <p className="text-sm sm:text-base text-rose-600/70 mt-1">Every moment captured with love 💖</p>
          </div>
          <div className="flex space-x-2 sm:space-x-3">
            <ActivityHistory />
            <CreateFolderDialog onFolderCreated={fetchFolders} />
          </div>
        </div>

        {/* Folders Grid */}
        {loading ? (
          <div className="text-center py-12 sm:py-16">
            <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-rose-400 animate-pulse mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-rose-600">Loading memories...</p>
          </div>
        ) : folders.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-rose-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-rose-700 mb-2">No folders yet</h3>
            <p className="text-sm sm:text-base text-rose-500 mb-4 sm:mb-6">Create your first folder to start collecting memories!</p>
            <CreateFolderDialog onFolderCreated={fetchFolders} />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {folders.map((folder) => (
              <Card
                key={folder.id}
                className="group relative overflow-hidden border-rose-100 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer active:scale-[0.98] touch-manipulation"
                onClick={() => handleFolderClick(folder)}
              >
                <div className="aspect-[4/3] relative">
                  {folder.cover_photo_url ? (
                    <img
                      src={folder.cover_photo_url}
                      alt={folder.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 select-none"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
                      <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-rose-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <CardHeader className="relative p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg text-rose-800 group-hover:text-rose-900 transition-colors duration-300">
                    {folder.name}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-rose-600/70 mt-1">
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
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
