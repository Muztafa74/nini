'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase, type Folder, type Photo, type Note } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Heart,
  ArrowLeft,
  Calendar,
  User,
  Trash2,
  Edit,
  Save,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import PhotoUpload from './PhotoUpload'
import PhotoLightbox from './PhotoLightbox'

interface FolderDetailProps {
  folder: Folder
  onBack: () => void
  onFolderDeleted: () => void
}

export default function FolderDetail({ folder, onBack, onFolderDeleted }: FolderDetailProps) {
  const { user } = useAuth()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [notes, setNotes] = useState<Note | null>(null)
  const [noteContent, setNoteContent] = useState('')
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)

  useEffect(() => {
    fetchFolderData()
  }, [])

  const fetchFolderData = async () => {
    try {
      // Fetch photos
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('folder_id', folder.id)
        .order('uploaded_at', { ascending: true })

      if (photosError) throw photosError
      setPhotos(photosData || [])

      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('folder_id', folder.id)
        .single()

      if (notesError && notesError.code !== 'PGRST116') throw notesError
      setNotes(notesData)
      setNoteContent(notesData?.content || '')
    } catch (error) {
      console.error('Error fetching folder data:', error)
      toast.error('Unable to load folder data.')
    } finally {
      setLoading(false)
    }
  }

  const saveNotes = async () => {
    if (!user) return

    try {
      if (notes) {
        // Update existing notes
        const { error } = await supabase
          .from('notes')
          .update({
            content: noteContent,
            updated_by: user.username,
            updated_at: new Date().toISOString()
          })
          .eq('id', notes.id)

        if (error) throw error
      } else {
        // Create new notes
        const { data, error } = await supabase
          .from('notes')
          .insert({
            folder_id: folder.id,
            content: noteContent,
            updated_by: user.username
          })
          .select()
          .single()

        if (error) throw error
        setNotes(data)
      }

      // Add activity log
      await supabase.from('activity_log').insert({
        action: 'edited notes',
        details: `Updated notes in folder "${folder.name}"`,
        user: user.username
      })

      setIsEditingNotes(false)
      toast.success('Notes saved! 📝💖')
    } catch (error) {
      console.error('Error saving notes:', error)
      toast.error('Unable to save notes.')
    }
  }

  const deleteFolder = async () => {
    if (!user) return

    const confirmed = window.confirm(
      `Are you sure you want to delete "${folder.name}" and all its contents? This cannot be undone.`
    )

    if (!confirmed) return

    try {
      // Delete photos from storage
      for (const photo of photos) {
        const fileName = photo.url.split('/').pop()
        if (fileName) {
          await supabase.storage
            .from('family-photos')
            .remove([`${folder.id}/${fileName}`])
        }
      }

      // Delete folder (cascade will handle photos and notes)
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folder.id)

      if (error) throw error

      // Add activity log
      await supabase.from('activity_log').insert({
        action: 'deleted folder',
        details: `Deleted folder "${folder.name}"`,
        user: user.username
      })

      toast.success('Folder deleted.')
      onFolderDeleted()
    } catch (error) {
      console.error('Error deleting folder:', error)
      toast.error('Unable to delete folder.')
    }
  }

  const deletePhoto = async (photo: Photo) => {
    if (!user) return

    const confirmed = window.confirm('Are you sure you want to delete this photo?')
    if (!confirmed) return

    try {
      // Delete from storage
      const fileName = photo.url.split('/').pop()
      if (fileName) {
        await supabase.storage
          .from('family-photos')
          .remove([`${folder.id}/${fileName}`])
      }

      // Delete from database
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photo.id)

      if (error) throw error

      // Add activity log
      await supabase.from('activity_log').insert({
        action: 'deleted photo',
        details: `Deleted a photo from folder "${folder.name}"`,
        user: user.username
      })

      setPhotos(photos.filter(p => p.id !== photo.id))
      toast.success('Photo deleted.')
    } catch (error) {
      console.error('Error deleting photo:', error)
      toast.error('Unable to delete photo.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const openLightbox = (index: number) => {
    setSelectedPhotoIndex(index)
    setLightboxOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 text-rose-400 animate-pulse mx-auto mb-4" />
          <p className="text-rose-600">Loading memories...</p>
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
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-rose-600 hover:bg-rose-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-rose-800">{folder.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-rose-600/70">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(folder.date)}
                  </div>
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    Created by {folder.created_by}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <PhotoUpload folderId={folder.id} onPhotoUploaded={fetchFolderData} />
              <Button
                variant="outline"
                size="sm"
                onClick={deleteFolder}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Folder
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Photos Section */}
          <div className="lg:col-span-2">
            <Card className="border-rose-100 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-rose-800 flex items-center">
                  <Heart className="w-5 h-5 mr-2" />
                  Our Photos ({photos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {photos.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-12 h-12 text-rose-300 mx-auto mb-4" />
                    <p className="text-rose-600 mb-4">No photos yet</p>
                    <PhotoUpload folderId={folder.id} onPhotoUploaded={fetchFolderData} />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photos.map((photo, index) => (
                      <div key={photo.id} className="relative group">
                        <div
                          className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                          onClick={() => openLightbox(index)}
                        >
                          <img
                            src={photo.url}
                            alt="Family memory"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deletePhoto(photo)
                            }}
                            className="w-8 h-8 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="mt-2">
                          <Badge variant="secondary" className="text-xs">
                            <User className="w-3 h-3 mr-1" />
                            {photo.uploaded_by}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes Section */}
          <div>
            <Card className="border-rose-100 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-rose-800 flex items-center">
                    <Edit className="w-5 h-5 mr-2" />
                    Our Notes
                  </CardTitle>
                  {isEditingNotes ? (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditingNotes(false)
                          setNoteContent(notes?.content || '')
                        }}
                        className="border-gray-200"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveNotes}
                        className="bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 text-white"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingNotes(true)}
                      className="border-rose-200 text-rose-600 hover:bg-rose-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditingNotes ? (
                  <Textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Write your thoughts and memories about this special moment..."
                    className="min-h-[200px] border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                  />
                ) : (
                  <div className="min-h-[200px]">
                    {noteContent ? (
                      <div className="whitespace-pre-wrap text-rose-700">{noteContent}</div>
                    ) : (
                      <div className="text-rose-400 italic">
                        Click edit to add your thoughts and memories about this special moment...
                      </div>
                    )}
                  </div>
                )}
                {notes && !isEditingNotes && (
                  <div className="mt-4 pt-4 border-t border-rose-100">
                    <p className="text-xs text-rose-500">
                      Last updated by {notes.updated_by} on{' '}
                      {new Date(notes.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Photo Lightbox */}
      {photos.length > 0 && (
        <PhotoLightbox
          photos={photos}
          initialIndex={selectedPhotoIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  )
}
